import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "@/hooks/use-location";
import LocationTracker from "@/components/tracking/location-tracker";
import { User, Location as LocationData } from "@shared/schema";

export default function Tracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    currentLocation, 
    isTracking, 
    startTracking, 
    stopTracking,
    updateLocation,
    distance,
    isUpdating
  } = useLocation({ trackingInterval: 30000 }); // Update every 30 seconds
  
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch technicians and helpers for admin/management
  const { data: technicians = [], isLoading: techLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/technician'],
    enabled: !!user && (user.role === 'admin' || user.role === 'management'),
  });
  
  const { data: helpers = [], isLoading: helpersLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/helper'],
    enabled: !!user && (user.role === 'admin' || user.role === 'management'),
  });
  
  // Auto-start tracking for field staff
  useEffect(() => {
    if (user && (user.role === 'technician' || user.role === 'helper')) {
      // Auto-start tracking for field staff
      startTracking();
      
      toast({
        title: "Location tracking enabled",
        description: "Your location is now being tracked for distance calculation.",
      });
    }
    
    // Cleanup when component unmounts
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [user, startTracking, stopTracking, toast]);
  
  // Combine and filter field staff
  const fieldStaff = [...technicians, ...helpers].filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Location Tracking</h1>
        <p className="text-neutral-dark">Track field staff locations and calculate distances</p>
      </div>
      
      {/* If user is field staff, show their tracking status */}
      {user && (user.role === 'technician' || user.role === 'helper') && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">My Tracking Status</h2>
                <p className="text-neutral-medium">
                  {isTracking ? "Your location is being tracked" : "Tracking is currently paused"}
                </p>
              </div>
              
              <div className="flex gap-3">
                {!isTracking ? (
                  <Button 
                    onClick={startTracking}
                    className="flex items-center"
                  >
                    <span className="material-icons mr-2">play_arrow</span>
                    Start Tracking
                  </Button>
                ) : (
                  <Button 
                    onClick={stopTracking}
                    variant="destructive"
                    className="flex items-center"
                  >
                    <span className="material-icons mr-2">stop</span>
                    Stop Tracking
                  </Button>
                )}
                
                <Button 
                  onClick={updateLocation}
                  variant="outline"
                  disabled={isUpdating}
                  className="flex items-center"
                >
                  <span className="material-icons mr-2">refresh</span>
                  {isUpdating ? "Updating..." : "Update Now"}
                </Button>
              </div>
            </div>
            
            {/* Current location and distance info */}
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Today's Tracking Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-medium">Status</p>
                  <p className="font-medium flex items-center">
                    <span className={`h-2 w-2 rounded-full mr-2 ${isTracking ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {isTracking ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-medium">Today's Distance</p>
                  <p className="font-medium">{distance.toFixed(2)} km</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-medium">Current Location</p>
                  <p className="font-medium">
                    {currentLocation ? 
                      `${currentLocation.coords.latitude.toFixed(6)}, ${currentLocation.coords.longitude.toFixed(6)}` : 
                      "Unknown"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main content depends on user role */}
      {user && (user.role === 'admin' || user.role === 'management') ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-xl font-semibold">Live Location Tracking</h2>
            <div className="mt-2 md:mt-0 flex items-center space-x-2">
              <button className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm">
                <span className="material-icons text-sm mr-1">refresh</span>
                Refresh
              </button>
              <button className="flex items-center px-3 py-1.5 bg-primary text-white rounded-md text-sm">
                <span className="material-icons text-sm mr-1">filter_list</span>
                Filter
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Map Area */}
            <div className="lg:col-span-2">
              <LocationTracker fieldStaff={fieldStaff} />
            </div>
            
            {/* Active Technicians List */}
            <div className="lg:col-span-1 flex flex-col">
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Active Field Staff</h3>
                    <div className="text-sm text-neutral-medium">
                      Showing {fieldStaff.length} of {technicians.length + helpers.length}
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-medium">
                      <span className="material-icons text-sm">search</span>
                    </span>
                    <Input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                      placeholder="Search technicians..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Technicians List */}
                  {techLoading || helpersLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "400px" }}>
                      {fieldStaff.length === 0 ? (
                        <div className="text-center py-8 text-neutral-medium">
                          No field staff found
                        </div>
                      ) : (
                        fieldStaff.map((staff) => {
                          // Simulate random status, hours, and distance for demo
                          const statusOptions = ["online", "busy", "offline"];
                          const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
                          
                          const hours = Math.floor(5 + Math.random() * 4);
                          const minutes = Math.floor(Math.random() * 60);
                          const workingHours = `${hours}h ${minutes}m`;
                          
                          const staffDistance = Math.floor(20 + Math.random() * 30) + Math.random().toFixed(1);
                          
                          return (
                            <div key={staff.id} className="border-b last:border-b-0 py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="relative">
                                  <div className="h-10 w-10 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                                    <span className="material-icons">person</span>
                                  </div>
                                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full 
                                    ${status === 'online' ? 'bg-green-500' : 
                                      status === 'busy' ? 'bg-accent' : 'bg-red-500'} 
                                    border-2 border-white`}></span>
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium text-sm">{staff.name}</p>
                                  <p className="text-xs text-neutral-medium capitalize">
                                    {staff.role} • {staff.specialization || "General"}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs flex items-center justify-end text-neutral-dark">
                                  <span className="material-icons text-xs mr-1">schedule</span>
                                  {workingHours}
                                </p>
                                <p className="text-xs text-secondary flex items-center justify-end">
                                  <span className="material-icons text-xs mr-1">directions_car</span>
                                  {staffDistance} km
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        /* Individual staff view */
        <LocationTracker 
          personalMode={true}
          currentLocation={currentLocation}
          distance={distance}
        />
      )}
    </main>
  );
}
