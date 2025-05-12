import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // If no user, don't render sidebar
  if (!user) return null;

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white shadow-md z-10">
      {/* Logo Section */}
      <div className="p-4 border-b">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2">home_repair_service</span>
          <h1 className="text-xl font-bold text-primary">APPLICARE</h1>
        </div>
        <p className="text-xs text-neutral-medium mt-1">Home Appliance Repair & Service</p>
      </div>

      {/* User Profile Preview */}
      <div className="p-4 border-b flex items-center">
        <div className="h-10 w-10 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
          <span className="material-icons">person</span>
        </div>
        <div className="ml-3">
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-neutral-medium capitalize">{user.role}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="p-2">
          <li className="my-1">
            <Link href="/">
              <a className={cn(
                "flex items-center p-2 rounded-md font-medium",
                isActive("/") 
                  ? "bg-primary-light text-primary" 
                  : "hover:bg-gray-100 text-neutral-dark"
              )}>
                <span className="material-icons mr-3">dashboard</span>
                Dashboard
              </a>
            </Link>
          </li>

          {/* Only show employees to admin and management */}
          {(user.role === "admin" || user.role === "management") && (
            <li className="my-1">
              <Link href="/employees">
                <a className={cn(
                  "flex items-center p-2 rounded-md font-medium",
                  isActive("/employees") 
                    ? "bg-primary-light text-primary" 
                    : "hover:bg-gray-100 text-neutral-dark"
                )}>
                  <span className="material-icons mr-3">people</span>
                  Employees
                </a>
              </Link>
            </li>
          )}

          <li className="my-1">
            <Link href="/attendance">
              <a className={cn(
                "flex items-center p-2 rounded-md font-medium",
                isActive("/attendance") 
                  ? "bg-primary-light text-primary" 
                  : "hover:bg-gray-100 text-neutral-dark"
              )}>
                <span className="material-icons mr-3">work_history</span>
                Attendance
              </a>
            </Link>
          </li>

          <li className="my-1">
            <Link href="/tracking">
              <a className={cn(
                "flex items-center p-2 rounded-md font-medium",
                isActive("/tracking") 
                  ? "bg-primary-light text-primary" 
                  : "hover:bg-gray-100 text-neutral-dark"
              )}>
                <span className="material-icons mr-3">location_on</span>
                Location Tracking
              </a>
            </Link>
          </li>

          <li className="my-1">
            <Link href="/payroll">
              <a className={cn(
                "flex items-center p-2 rounded-md font-medium",
                isActive("/payroll") 
                  ? "bg-primary-light text-primary" 
                  : "hover:bg-gray-100 text-neutral-dark"
              )}>
                <span className="material-icons mr-3">payments</span>
                Payroll
              </a>
            </Link>
          </li>

          {/* Only show these options to admin and management */}
          {(user.role === "admin" || user.role === "management") && (
            <>
              <li className="my-1">
                <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100 text-neutral-dark">
                  <span className="material-icons mr-3">build</span>
                  Service Jobs
                </a>
              </li>

              <li className="my-1">
                <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100 text-neutral-dark">
                  <span className="material-icons mr-3">assessment</span>
                  Reports
                </a>
              </li>

              <li className="my-1">
                <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-100 text-neutral-dark">
                  <span className="material-icons mr-3">settings</span>
                  Settings
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Logout Button */}
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
    </aside>
  );
}
