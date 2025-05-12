import { useState } from "react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/attendance": "Attendance",
  "/tracking": "Location Tracking",
  "/payroll": "Payroll",
};

interface HeaderProps {
  userName: string;
  userRole: string;
}

export default function Header({ userName, userRole }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      
      // Redirect to login page
      setLocation("/login");
      
      // Force a refresh
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };
  
  const pageName = pageNames[location] || "Not Found";

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex justify-between items-center p-4">
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-neutral-dark"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-icons">menu</span>
        </button>
        
        {/* Page Title */}
        <h1 className="text-xl font-semibold hidden md:block">{pageName}</h1>
        
        {/* Mobile Logo (Only visible on mobile) */}
        <div className="flex items-center md:hidden">
          <span className="material-icons text-primary mr-1">home_repair_service</span>
          <h1 className="text-lg font-bold text-primary">APPLICARE</h1>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <span className="material-icons text-neutral-dark">notifications</span>
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <span className="material-icons text-neutral-dark">help</span>
          </button>
          
          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto">
                <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                  <span className="material-icons text-sm">person</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{userName}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-neutral-medium capitalize">
                {userRole}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <span className="material-icons mr-2 text-sm">logout</span>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Mobile drawer menu (only visible when opened) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Sidebar Content - simplified version of Sidebar.tsx */}
            <div className="p-4 border-b">
              <div className="flex items-center">
                <span className="material-icons text-primary mr-2">home_repair_service</span>
                <h1 className="text-xl font-bold text-primary">APPLICARE</h1>
              </div>
              <p className="text-xs text-neutral-medium mt-1">Home Appliance Repair & Service</p>
            </div>
            <div className="p-4 border-b flex items-center">
              <div className="h-10 w-10 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                <span className="material-icons">person</span>
              </div>
              <div className="ml-3">
                <p className="font-medium text-sm">{userName}</p>
                <p className="text-xs text-neutral-medium capitalize">{userRole}</p>
              </div>
            </div>
            <nav className="flex-1">
              <ul className="p-2">
                {/* Add mobile navigation items here */}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center p-2 text-neutral-dark hover:bg-gray-100 rounded-md"
                onClick={handleLogout}
              >
                <span className="material-icons mr-2">logout</span>
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}