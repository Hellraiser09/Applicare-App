import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { z } from "zod";
import { 
  loginSchema, 
  locationUpdateSchema, 
  insertAttendanceSchema, 
  insertDistanceSchema
} from "@shared/schema";

// Calculate distance between two coordinates in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

// Calculate total distance from an array of locations
function calculateTotalDistance(locations: { latitude: number; longitude: number }[]): number {
  if (locations.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 1; i < locations.length; i++) {
    const prevLocation = locations[i - 1];
    const currLocation = locations[i];
    
    totalDistance += calculateDistance(
      prevLocation.latitude,
      prevLocation.longitude,
      currLocation.latitude,
      currLocation.longitude
    );
  }
  
  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: 'applicare-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session && req.session.user) {
      return next();
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  };
  
  // Role-based authorization middleware
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.session.user;
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }
      
      return next();
    };
  };
  
  // ===== Authentication Routes =====
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Simple password check (in a real app, you'd use bcrypt or similar)
      if (user.password !== validatedData.password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Set user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        profileImage: user.profileImage,
      };
      
      // Return user data (excluding password)
      const { password, ...userData } = user;
      return res.status(200).json(userData);
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      
      return res.status(500).json({ message: "An error occurred during login" });
    }
  });
  
  // Get current user
  app.get('/api/auth/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }
      
      // Return user data (excluding password)
      const { password, ...userData } = user;
      return res.status(200).json(userData);
      
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({ message: "An error occurred while retrieving user data" });
    }
  });
  
  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  // ===== User Routes =====
  
  // Get all users
  app.get('/api/users', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "An error occurred while retrieving users" });
    }
  });
  
  // Get users by role
  app.get('/api/users/role/:role', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      
      // Remove passwords from response
      const sanitizedUsers = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Get users by role error:', error);
      res.status(500).json({ message: "An error occurred while retrieving users by role" });
    }
  });
  
  // ===== Attendance Routes =====
  
  // Clock in/out
  app.post('/api/attendance', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Validate request body
      const validatedData = insertAttendanceSchema.parse({
        ...req.body,
        userId,
      });
      
      // Check if there's an existing attendance record for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingAttendance = await storage.getAttendanceByUserIdAndDate(userId, today);
      
      if (existingAttendance) {
        // If already clocked in, update clock out time
        if (!existingAttendance.checkOutTime) {
          const updatedAttendance = await storage.updateAttendance(existingAttendance.id, {
            checkOutTime: new Date(),
            status: "completed"
          });
          
          return res.status(200).json(updatedAttendance);
        } else {
          return res.status(400).json({ message: "Already clocked out for today" });
        }
      } else {
        // Create new attendance record
        const newAttendance = await storage.createAttendance({
          userId,
          checkInTime: new Date(),
          status: "active"
        });
        
        return res.status(201).json(newAttendance);
      }
    } catch (error) {
      console.error('Attendance error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid attendance data", errors: error.errors });
      }
      
      return res.status(500).json({ message: "An error occurred while recording attendance" });
    }
  });
  
  // Get attendance history for current user
  app.get('/api/attendance/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const attendanceRecords = await storage.getAttendanceByUserId(userId);
      
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({ message: "An error occurred while retrieving attendance records" });
    }
  });
  
  // Get today's attendance for all users (managers & admins only)
  app.get('/api/attendance/today', isAuthenticated, hasRole(['admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const attendanceRecords = await storage.getTodayAttendance();
      
      res.json(attendanceRecords);
    } catch (error) {
      console.error('Get today attendance error:', error);
      res.status(500).json({ message: "An error occurred while retrieving today's attendance" });
    }
  });
  
  // ===== Location Tracking Routes =====
  
  // Update location
  app.post('/api/location', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      
      // Validate request body
      const validatedData = locationUpdateSchema.parse(req.body);
      
      // Save location
      const location = await storage.saveLocation({
        userId,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        accuracy: validatedData.accuracy,
        timestamp: new Date()
      });
      
      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all locations for user today
      const userLocations = await storage.getLocationsByUserIdAndDateRange(
        userId,
        today,
        new Date(today.getTime() + 24 * 60 * 60 * 1000)
      );
      
      // Calculate total distance traveled
      if (userLocations.length >= 2) {
        const locationsArray = userLocations.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude
        }));
        
        const totalDistance = calculateTotalDistance(locationsArray);
        
        // Check if there's an existing distance record for today
        const existingDistance = await storage.getDistanceByUserIdAndDate(userId, today);
        
        if (existingDistance) {
          // Update existing distance record
          await storage.updateDistance(existingDistance.id, {
            distanceKm: totalDistance,
            updatedAt: new Date()
          });
        } else {
          // Create new distance record
          await storage.saveDistance({
            userId,
            date: today,
            distanceKm: totalDistance,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
      
      res.status(201).json(location);
    } catch (error) {
      console.error('Location update error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.errors });
      }
      
      return res.status(500).json({ message: "An error occurred while updating location" });
    }
  });
  
  // Get locations for a user by date range
  app.get('/api/location/:userId', isAuthenticated, hasRole(['admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const locations = await storage.getLocationsByUserIdAndDateRange(
        parseInt(userId),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(locations);
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ message: "An error occurred while retrieving locations" });
    }
  });
  
  // ===== Distance Tracking Routes =====
  
  // Get distances for current user by date range
  app.get('/api/distance/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const distances = await storage.getDistancesByUserIdAndDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(distances);
    } catch (error) {
      console.error('Get distances error:', error);
      res.status(500).json({ message: "An error occurred while retrieving distances" });
    }
  });
  
  // ===== Payroll Routes =====
  
  // Calculate and get payroll for a period
  app.get('/api/payroll/:userId', isAuthenticated, hasRole(['admin', 'manager']), async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all distances for the period
      const distances = await storage.getDistancesByUserIdAndDateRange(
        parseInt(userId),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      // Calculate total distance
      const totalDistance = distances.reduce((sum, distance) => sum + distance.distanceKm, 0);
      
      // Calculate distance pay if applicable
      let distancePay = 0;
      if (user.distancePayRate && totalDistance > 0) {
        distancePay = totalDistance * user.distancePayRate;
      }
      
      // Get all attendance records for the period
      const attendanceRecords = await storage.getAttendanceByUserIdAndDateRange(
        parseInt(userId),
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      // Calculate total hours worked
      let totalHours = 0;
      for (const record of attendanceRecords) {
        if (record.checkInTime && record.checkOutTime) {
          const hoursWorked = (record.checkOutTime.getTime() - record.checkInTime.getTime()) / (1000 * 60 * 60);
          totalHours += hoursWorked;
        }
      }
      
      // Calculate base pay
      const basePay = totalHours * user.basePayRate;
      
      // Calculate total pay
      const totalPay = basePay + distancePay;
      
      // Create payroll record
      const payroll = await storage.createPayroll({
        userId: parseInt(userId),
        periodStart: new Date(startDate as string),
        periodEnd: new Date(endDate as string),
        hoursWorked: Math.round(totalHours * 100) / 100,
        distanceTraveled: Math.round(totalDistance * 100) / 100,
        basePay: Math.round(basePay * 100) / 100,
        distancePay: Math.round(distancePay * 100) / 100,
        totalPay: Math.round(totalPay * 100) / 100,
        status: "calculated",
        createdAt: new Date()
      });
      
      res.status(201).json(payroll);
    } catch (error) {
      console.error('Payroll calculation error:', error);
      res.status(500).json({ message: "An error occurred while calculating payroll" });
    }
  });
  
  // Get payroll history for current user
  app.get('/api/payroll/me', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.user!.id;
      const payrollRecords = await storage.getPayrollByUserId(userId);
      
      res.json(payrollRecords);
    } catch (error) {
      console.error('Get payroll error:', error);
      res.status(500).json({ message: "An error occurred while retrieving payroll records" });
    }
  });
  
  // ===== Services Routes =====
  
  // Get all services
  app.get('/api/services', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      
      res.json(services);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ message: "An error occurred while retrieving services" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}