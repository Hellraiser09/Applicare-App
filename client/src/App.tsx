import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@radix-ui/react-tooltip";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Employees from "@/pages/employees";
import Attendance from "@/pages/attendance";
import Tracking from "@/pages/tracking";
import Payroll from "@/pages/payroll";
import NotFound from "@/pages/not-found";

// Layout Components
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";

// Interface for User data
interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  specialization: string | null;
  active: boolean;
  basePayRate: number;
  distancePayRate: number | null;
  profileImage: string | null;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location] = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
          // If not on login page and unauthorized, redirect to login
          if (location !== "/login") {
            window.location.href = "/login";
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
  }, [location]);

  // Don't render anything while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="animate-spin text-primary text-4xl">◌</div>
      </div>
    );
  }

  // If there's no user and we're not on the login page, don't render anything
  // (the useEffect will redirect to login)
  if (!user && location !== "/login") {
    return null;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          {user ? (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar for desktop */}
              <div className="hidden md:flex">
                <Sidebar />
              </div>
              
              {/* Main content */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <Header userName={user.name} userRole={user.role} />
                
                <main className="flex-1 overflow-y-auto p-4">
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/employees" component={Employees} />
                    <Route path="/attendance" component={Attendance} />
                    <Route path="/tracking" component={Tracking} />
                    <Route path="/payroll" component={Payroll} />
                    <Route component={NotFound} />
                  </Switch>
                </main>
                
                {/* Mobile navigation */}
                <div className="md:hidden">
                  <MobileNav />
                </div>
              </div>
            </div>
          ) : (
            <Switch>
              <Route path="/login" component={Login} />
              <Route>
                <Login />
              </Route>
            </Switch>
          )}
          
          <Toaster />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;