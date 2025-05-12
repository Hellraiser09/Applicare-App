import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  // If no user, don't render navigation
  if (!user) return null;

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="md:hidden bg-white shadow-lg fixed bottom-0 left-0 right-0 z-20">
      <div className="flex justify-around">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/") ? "text-primary" : "text-neutral-medium"
          )}>
            <span className="material-icons">dashboard</span>
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>

        {/* Only show employees to admin and management */}
        {(user.role === "admin" || user.role === "management") ? (
          <Link href="/employees">
            <a className={cn(
              "flex flex-col items-center py-2 px-3",
              isActive("/employees") ? "text-primary" : "text-neutral-medium"
            )}>
              <span className="material-icons">people</span>
              <span className="text-xs mt-1">Employees</span>
            </a>
          </Link>
        ) : (
          <Link href="/attendance">
            <a className={cn(
              "flex flex-col items-center py-2 px-3",
              isActive("/attendance") ? "text-primary" : "text-neutral-medium"
            )}>
              <span className="material-icons">work_history</span>
              <span className="text-xs mt-1">Attendance</span>
            </a>
          </Link>
        )}

        <Link href="/tracking">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/tracking") ? "text-primary" : "text-neutral-medium"
          )}>
            <span className="material-icons">location_on</span>
            <span className="text-xs mt-1">Tracking</span>
          </a>
        </Link>

        <Link href="/payroll">
          <a className={cn(
            "flex flex-col items-center py-2 px-3",
            isActive("/payroll") ? "text-primary" : "text-neutral-medium"
          )}>
            <span className="material-icons">payments</span>
            <span className="text-xs mt-1">Payroll</span>
          </a>
        </Link>

        {/* Mobile Menu Button (More) */}
        <button className="flex flex-col items-center py-2 px-3 text-neutral-medium">
          <span className="material-icons">menu</span>
          <span className="text-xs mt-1">More</span>
        </button>
      </div>
    </nav>
  );
}
