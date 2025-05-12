import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Attendance, User } from "@shared/schema";
import AttendanceForm from "@/components/attendance/attendance-form";

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("personal");
  
  // Fetch user's attendance records
  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery<Attendance[]>({
    queryKey: [`/api/attendance/${user?.id}`],
    enabled: !!user,
  });
  
  // Fetch today's attendance records for managers/admins
  const { data: todayAttendance = [], isLoading: loadingTodayAttendance } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance/today'],
    enabled: !!user && (user.role === 'admin' || user.role === 'management'),
  });
  
  // Fetch all users for reference
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'management'),
  });
  
  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance/check-in", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked in successfully",
        description: `You've been checked in at ${format(new Date(), 'h:mm a')}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
    },
    onError: (error) => {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "You may have already checked in.",
        variant: "destructive",
      });
    },
  });
  
  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance/check-out", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked out successfully",
        description: `You've been checked out at ${format(new Date(), 'h:mm a')}.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/attendance/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/today'] });
    },
    onError: (error) => {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "You may not have checked in yet today.",
        variant: "destructive",
      });
    },
  });
  
  // Format attendance status with appropriate styling
  const formatAttendanceStatus = (status: string) => {
    const statusColors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-orange-100 text-orange-800",
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status as keyof typeof statusColors] || "bg-gray-100"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Find today's attendance for the current user
  const todayUserAttendance = attendanceRecords.find(record => {
    const recordDate = new Date(record.checkInTime);
    const today = new Date();
    return recordDate.setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
  });
  
  // Determine if the user can check in/out today
  const canCheckIn = !todayUserAttendance;
  const canCheckOut = todayUserAttendance && !todayUserAttendance.checkOutTime;
  
  // Find user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Unknown User";
  };
  
  // Handle check-in button click
  const handleCheckIn = () => {
    checkInMutation.mutate();
  };
  
  // Handle check-out button click
  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Attendance Management</h1>
        <p className="text-neutral-dark">Track attendance and working hours</p>
      </div>
      
      {/* Quick Actions */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Today's Status</h2>
              <p className="text-neutral-medium">
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleCheckIn} 
                disabled={!canCheckIn || checkInMutation.isPending}
                className="flex items-center"
              >
                <span className="material-icons mr-2">login</span>
                {checkInMutation.isPending ? "Checking in..." : "Check In"}
              </Button>
              
              <Button 
                onClick={handleCheckOut} 
                disabled={!canCheckOut || checkOutMutation.isPending}
                variant="outline"
                className="flex items-center"
              >
                <span className="material-icons mr-2">logout</span>
                {checkOutMutation.isPending ? "Checking out..." : "Check Out"}
              </Button>
            </div>
          </div>
          
          {todayUserAttendance && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Today's Attendance Record</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-neutral-medium">Status</p>
                  <p className="font-medium">{formatAttendanceStatus(todayUserAttendance.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-medium">Check-in Time</p>
                  <p className="font-medium">{format(new Date(todayUserAttendance.checkInTime), 'h:mm a')}</p>
                </div>
                {todayUserAttendance.checkOutTime && (
                  <div>
                    <p className="text-sm text-neutral-medium">Check-out Time</p>
                    <p className="font-medium">{format(new Date(todayUserAttendance.checkOutTime), 'h:mm a')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Main Content Tabs */}
      {user && (user.role === 'admin' || user.role === 'management') ? (
        <Tabs defaultValue="personal" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="personal">Your Attendance</TabsTrigger>
            <TabsTrigger value="team">Team Attendance</TabsTrigger>
            <TabsTrigger value="manage">Manage Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal">
            <AttendanceHistory 
              attendanceRecords={attendanceRecords} 
              isLoading={loadingAttendance} 
            />
          </TabsContent>
          
          <TabsContent value="team">
            <TeamAttendance 
              attendanceRecords={todayAttendance} 
              users={users} 
              isLoading={loadingTodayAttendance || loadingUsers} 
            />
          </TabsContent>
          
          <TabsContent value="manage">
            <AttendanceForm />
          </TabsContent>
        </Tabs>
      ) : (
        <AttendanceHistory 
          attendanceRecords={attendanceRecords} 
          isLoading={loadingAttendance} 
        />
      )}
    </main>
  );
}

interface AttendanceHistoryProps {
  attendanceRecords: Attendance[];
  isLoading: boolean;
}

function AttendanceHistory({ attendanceRecords, isLoading }: AttendanceHistoryProps) {
  // Sort records by date (most recent first)
  const sortedRecords = [...attendanceRecords].sort(
    (a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Attendance History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-neutral-medium">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRecords.map((record) => {
                    // Calculate total hours if checked out
                    let totalHours = "-";
                    if (record.checkOutTime) {
                      const checkIn = new Date(record.checkInTime);
                      const checkOut = new Date(record.checkOutTime);
                      const diffHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
                      totalHours = diffHours.toFixed(2) + " hrs";
                    }
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.checkInTime), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          {record.status === 'present' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Present</span>
                          ) : record.status === 'late' ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Late</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Absent</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(record.checkInTime), 'h:mm a')}</TableCell>
                        <TableCell>
                          {record.checkOutTime 
                            ? format(new Date(record.checkOutTime), 'h:mm a') 
                            : "-"}
                        </TableCell>
                        <TableCell>{totalHours}</TableCell>
                        <TableCell>{record.notes || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TeamAttendanceProps {
  attendanceRecords: Attendance[];
  users: User[];
  isLoading: boolean;
}

function TeamAttendance({ attendanceRecords, users, isLoading }: TeamAttendanceProps) {
  // Group attendance by status
  const present = attendanceRecords.filter(record => record.status === 'present');
  const late = attendanceRecords.filter(record => record.status === 'late');
  const absent = users.length - (present.length + late.length);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Team Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Attendance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-md">
            <div className="text-2xl font-semibold text-primary">{users.length}</div>
            <div className="text-xs text-neutral-medium">Total Staff</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-md">
            <div className="text-2xl font-semibold text-green-600">{present.length}</div>
            <div className="text-xs text-neutral-medium">Present</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-md">
            <div className="text-2xl font-semibold text-red-600">{absent}</div>
            <div className="text-xs text-neutral-medium">Absent</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-md">
            <div className="text-2xl font-semibold text-orange-600">{late.length}</div>
            <div className="text-xs text-neutral-medium">Late</div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-neutral-medium">
                      No attendance records for today
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceRecords.map((record) => {
                    const employee = users.find(u => u.id === record.userId);
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                              <span className="material-icons text-sm">person</span>
                            </div>
                            <span>{employee?.name || `User #${record.userId}`}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{employee?.role || "-"}</TableCell>
                        <TableCell>
                          {record.status === 'present' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Present</span>
                          ) : record.status === 'late' ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Late</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Absent</span>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(record.checkInTime), 'h:mm a')}</TableCell>
                        <TableCell>
                          {record.checkOutTime 
                            ? format(new Date(record.checkOutTime), 'h:mm a') 
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
