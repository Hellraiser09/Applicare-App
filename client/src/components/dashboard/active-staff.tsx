import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User } from "@shared/schema";

interface StaffMember extends User {
  status: "online" | "busy" | "offline";
  workingHours: string;
  distance: number;
}

export default function ActiveStaff() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch technicians and helpers
  const { data: technicians = [], isLoading: techLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/technician'],
  });
  
  const { data: helpers = [], isLoading: helpersLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/helper'],
  });
  
  const isLoading = techLoading || helpersLoading;
  
  // Combine and format the data
  const fieldStaff = [...technicians, ...helpers].map(user => {
    // In a real app, we would fetch real status, hours and distance
    // For demo purposes, we'll simulate this data
    const statusOptions: StaffMember["status"][] = ["online", "busy", "offline"];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    
    const randomHours = Math.floor(5 + Math.random() * 4);
    const randomMinutes = Math.floor(Math.random() * 60);
    const formattedTime = `${randomHours}h ${randomMinutes}m`;
    
    const randomDistance = Math.floor(20 + Math.random() * 30) + Math.random().toFixed(1);
    
    return {
      ...user,
      status: randomStatus,
      workingHours: formattedTime,
      distance: parseFloat(randomDistance.toString()),
    };
  });
  
  // Filter by search query
  const filteredStaff = fieldStaff.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort by online status first
  const sortedStaff = [...filteredStaff].sort((a, b) => {
    if (a.status === "online" && b.status !== "online") return -1;
    if (a.status !== "online" && b.status === "online") return 1;
    return 0;
  });
  
  // Get status color
  const getStatusColor = (status: StaffMember["status"]) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-accent";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };
  
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Active Field Staff</h3>
          <div className="text-sm text-neutral-medium">
            Showing {sortedStaff.length} of {fieldStaff.length}
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
        
        {/* Staff List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "400px" }}>
            {sortedStaff.length === 0 ? (
              <div className="text-center py-8 text-neutral-medium">
                No field staff found
              </div>
            ) : (
              sortedStaff.map((staff) => (
                <div key={staff.id} className="border-b last:border-b-0 py-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                        <span className="material-icons">person</span>
                      </div>
                      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${getStatusColor(staff.status)} border-2 border-white`}></span>
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
                      {staff.workingHours}
                    </p>
                    <p className="text-xs text-secondary flex items-center justify-end">
                      <span className="material-icons text-xs mr-1">directions_car</span>
                      {staff.distance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
