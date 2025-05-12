import { storage } from "./storage";
import { UserRole } from "@shared/schema";

// Function to add sample users
async function addSampleUsers() {
  try {
    console.log("Adding sample users for testing...");
    
    // Check if we already have more than just the admin user
    const users = await storage.getUsers();
    if (users.length > 1) {
      console.log("Sample users already exist, skipping creation");
      return;
    }
    
    // Add management team member
    await storage.createUser({
      username: "manager",
      password: "manager123",
      name: "Alex Manager",
      role: UserRole.MANAGEMENT,
      active: true,
      basePayRate: 1500,
    });
    console.log("Created management user");
    
    // Add calling staff (office-based)
    await storage.createUser({
      username: "caller1",
      password: "caller123",
      name: "Sarah Caller",
      role: UserRole.CALLING_STAFF,
      active: true,
      basePayRate: 800,
    });
    
    await storage.createUser({
      username: "caller2",
      password: "caller123",
      name: "James Caller",
      role: UserRole.CALLING_STAFF,
      active: true,
      basePayRate: 800,
    });
    console.log("Created calling staff users");
    
    // Add field technicians
    await storage.createUser({
      username: "tech1",
      password: "tech123",
      name: "Mike Technician",
      role: UserRole.TECHNICIAN,
      specialization: "AC_REPAIR",
      active: true,
      basePayRate: 1200,
      distancePayRate: 10,
    });
    
    await storage.createUser({
      username: "tech2",
      password: "tech123",
      name: "Jane Technician",
      role: UserRole.TECHNICIAN,
      specialization: "REFRIGERATOR",
      active: true,
      basePayRate: 1200,
      distancePayRate: 10,
    });
    console.log("Created technician users");
    
    // Add helper staff
    await storage.createUser({
      username: "helper1",
      password: "helper123",
      name: "Tom Helper",
      role: UserRole.HELPER,
      active: true,
      basePayRate: 600,
      distancePayRate: 5,
    });
    
    await storage.createUser({
      username: "helper2",
      password: "helper123",
      name: "Lisa Helper",
      role: UserRole.HELPER,
      active: true,
      basePayRate: 600,
      distancePayRate: 5,
    });
    console.log("Created helper users");
    
    console.log("Successfully added all sample users");
  } catch (error) {
    console.error("Error adding sample users:", error);
  }
}

// Export the function to be called from index.ts
export { addSampleUsers };