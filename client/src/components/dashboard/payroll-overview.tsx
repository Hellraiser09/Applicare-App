import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

// Simulated data for current period
const currentPeriod = {
  startDate: "Apr 01",
  endDate: "Apr 15, 2023",
  totalHours: "820.5 hrs",
  totalDistance: "2,156 km",
  staffCount: 22,
  estimatedAmount: "₹1,28,450",
};

interface TopPerformer {
  id: number;
  name: string;
  specialization: string;
  distance: number;
  completedJobs: number;
}

export default function PayrollOverview() {
  // Fetch technicians and helpers
  const { data: technicians = [], isLoading: techLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/technician'],
  });
  
  const { data: helpers = [], isLoading: helpersLoading } = useQuery<User[]>({
    queryKey: ['/api/users/by-role/helper'],
  });
  
  const isLoading = techLoading || helpersLoading;
  
  // Simulate top performers data
  const topPerformers: TopPerformer[] = [];
  
  if (!isLoading) {
    const fieldStaff = [...technicians, ...helpers];
    
    // Take top 3 field staff and assign simulated performance metrics
    fieldStaff.slice(0, 3).forEach((staff, index) => {
      // Generate random performance metrics based on index (higher index = better performance)
      const baseDistance = 30 + (3 - index) * 5;
      const randomDistance = baseDistance + Math.random() * 10;
      
      const baseJobs = 5 + (3 - index);
      
      topPerformers.push({
        id: staff.id,
        name: staff.name,
        specialization: staff.specialization || "General",
        distance: parseFloat(randomDistance.toFixed(1)),
        completedJobs: baseJobs,
      });
    });
    
    // Sort by distance (highest first)
    topPerformers.sort((a, b) => b.distance - a.distance);
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Payroll Overview</h2>
          <Button variant="link" className="text-primary text-sm p-0">Generate Payroll</Button>
        </div>
        
        {/* Current Period Stats */}
        <div className="p-4 bg-gray-50 rounded-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Current Period</h3>
            <span className="text-xs text-neutral-medium">
              {currentPeriod.startDate} - {currentPeriod.endDate}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-medium">Total Hours</p>
              <p className="text-lg font-semibold">{currentPeriod.totalHours}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-medium">Total Distance</p>
              <p className="text-lg font-semibold">{currentPeriod.totalDistance}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-medium">Staff Count</p>
              <p className="text-lg font-semibold">{currentPeriod.staffCount}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-medium">Estimated Amount</p>
              <p className="text-lg font-semibold">{currentPeriod.estimatedAmount}</p>
            </div>
          </div>
        </div>
        
        {/* Top Performers */}
        <h3 className="text-sm font-medium mb-3">Top Performers</h3>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <div className="text-center py-4 text-neutral-medium">
                No top performers data available
              </div>
            ) : (
              topPerformers.map((performer) => (
                <div key={performer.id} className="flex justify-between items-center text-sm border-b pb-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark mr-2">
                      <span className="material-icons text-sm">person</span>
                    </div>
                    <div>
                      <p className="font-medium">{performer.name}</p>
                      <p className="text-xs text-neutral-medium">{performer.specialization}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-dark">{performer.distance} km</p>
                    <p className="text-xs text-secondary">{performer.completedJobs} jobs completed</p>
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
