import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Attendance, User } from "@shared/schema";

interface StaffAttendance {
  id: number;
  name: string;
  role: string;
  checkInTime: string;
  status: string;
}

export default function AttendanceOverview() {
  // Fetch today's attendance
  const { data: attendanceData = [], isLoading: attendanceLoading } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/today'],
  });
  
  // Fetch all users to get their names
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  const isLoading = attendanceLoading || usersLoading;
  
  // Process attendance data
  const totalStaff = users.length;
  const presentStaff = attendanceData.filter(a => a.status === 'present').length;
  const absentStaff = totalStaff - presentStaff;
  const lateStaff = attendanceData.filter(a => a.status === 'late').length;
  
  // Prepare data for recent check-ins
  const recentCheckIns: StaffAttendance[] = [];
  
  if (!isLoading && users.length > 0 && attendanceData.length > 0) {
    // Sort attendance by check-in time (most recent first)
    const sortedAttendance = [...attendanceData].sort(
      (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
    );
    
    // Take the 3 most recent check-ins
    const recentAttendance = sortedAttendance.slice(0, 3);
    
    // Map to staff attendance with user information
    recentAttendance.forEach(attendance => {
      const user = users.find(u => u.id === attendance.userId);
      if (user) {
        recentCheckIns.push({
          id: attendance.id,
          name: user.name,
          role: user.role,
          checkInTime: new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: attendance.status,
        });
      }
    });
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Today's Attendance</h2>
          <Button variant="link" className="text-primary text-sm p-0">View All</Button>
        </div>
        
        {/* Attendance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-2xl font-semibold text-primary">{totalStaff}</div>
            <div className="text-xs text-neutral-medium">Total Staff</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md">
            <div className="text-2xl font-semibold text-green-600">{presentStaff}</div>
            <div className="text-xs text-neutral-medium">Present</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-md">
            <div className="text-2xl font-semibold text-red-600">{absentStaff}</div>
            <div className="text-xs text-neutral-medium">Absent</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-md">
            <div className="text-2xl font-semibold text-orange-600">{lateStaff}</div>
            <div className="text-xs text-neutral-medium">Late</div>
          </div>
        </div>
        
        {/* Recent Check-ins */}
        <h3 className="text-sm font-medium mb-3">Recent Check-ins</h3>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCheckIns.length === 0 ? (
              <div className="text-center py-4 text-neutral-medium">
                No recent check-ins
              </div>
            ) : (
              recentCheckIns.map((checkin) => (
                <div key={checkin.id} className="flex justify-between items-center text-sm border-b pb-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark mr-2">
                      <span className="material-icons text-sm">person</span>
                    </div>
                    <div>
                      <p className="font-medium">{checkin.name}</p>
                      <p className="text-xs text-neutral-medium capitalize">{checkin.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-neutral-dark">{checkin.checkInTime}</p>
                    <p className={`text-xs ${
                      checkin.status === 'present' 
                        ? 'text-green-600' 
                        : checkin.status === 'late' 
                          ? 'text-orange-600' 
                          : 'text-red-600'
                    }`}>
                      {checkin.status === 'present' ? 'On Time' : 
                       checkin.status === 'late' ? 'Late' : 'Absent'}
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
