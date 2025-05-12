import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const UserRole = {
  ADMIN: "admin",
  MANAGEMENT: "management",
  CALLING_STAFF: "calling_staff",
  TECHNICIAN: "technician",
  HELPER: "helper",
} as const;

// Service specialization enum
export const ServiceType = {
  AC_REPAIR: "ac_repair",
  REFRIGERATOR: "refrigerator",
  WASHING_MACHINE: "washing_machine",
  MICROWAVE: "microwave",
  DISHWASHER: "dishwasher",
  OTHER: "other",
} as const;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // One of UserRole
  specialization: text("specialization"), // One of ServiceType, applicable for technicians
  active: boolean("active").notNull().default(true),
  basePayRate: integer("base_pay_rate").notNull(), // Base pay rate in currency units per day
  distancePayRate: integer("distance_pay_rate"), // Pay per kilometer (if applicable)
  profileImage: text("profile_image"),
});

// Attendance records
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  status: text("status").notNull(), // 'present', 'absent', 'late'
  notes: text("notes"),
});

// Location tracking records
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy"),
});

// Daily distance records
export const distances = pgTable("distances", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  distanceKm: doublePrecision("distance_km").notNull(), // in kilometers
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll records
export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  hoursWorked: doublePrecision("hours_worked").notNull(),
  distanceTraveled: doublePrecision("distance_traveled").notNull(),
  basePay: doublePrecision("base_pay").notNull(),
  distancePay: doublePrecision("distance_pay").notNull(), 
  totalPay: doublePrecision("total_pay").notNull(),
  status: text("status").notNull(), // 'calculated', 'approved', 'paid'
  createdAt: timestamp("created_at").defaultNow(),
});

// Services offered by the company
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  serviceType: text("service_type").notNull(), // One of ServiceType
  imageUrl: text("image_url"),
  techniciansCount: integer("technicians_count").notNull().default(0),
  popularity: text("popularity").notNull().default("regular"), // 'most_requested', 'popular', 'regular'
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertLocationSchema = createInsertSchema(locations).omit({ id: true });
export const insertDistanceSchema = createInsertSchema(distances).omit({ id: true });
export const insertPayrollSchema = createInsertSchema(payroll).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Distance = typeof distances.$inferSelect;
export type InsertDistance = z.infer<typeof insertDistanceSchema>;

export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Location update schema for tracking
export const locationUpdateSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

export type LocationUpdate = z.infer<typeof locationUpdateSchema>;
