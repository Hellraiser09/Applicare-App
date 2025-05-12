import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { User, Payroll } from "@shared/schema";

export default function PayrollPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Fetch user's payroll records
  const { data: payrollRecords = [], isLoading: loadingPayroll } = useQuery<Payroll[]>({
    queryKey: [`/api/payroll/user/${user?.id}`],
    enabled: !!user,
  });
  
  // Fetch all users for admin/management
  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user && (user.role === 'admin' || user.role === 'management'),
  });
  
  // Generate payroll mutation
  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: selectedUserId ? parseInt(selectedUserId) : undefined
      };
      
      const res = await apiRequest("POST", "/api/payroll/generate", payload);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payroll generated successfully",
        description: `Generated payroll for ${data.length} employee(s).`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/payroll/user/${user?.id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate payroll",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Filter field staff users for payroll generation
  const fieldStaffUsers = users.filter(u => 
    u.role === 'technician' || u.role === 'helper'
  );
  
  // Format currency 
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };
  
  // Handle generate payroll
  const handleGeneratePayroll = () => {
    if (startDate > endDate) {
      toast({
        title: "Invalid date range",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }
    
    generatePayrollMutation.mutate();
  };
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Payroll Management</h1>
        <p className="text-neutral-dark">Calculate and manage employee compensation</p>
      </div>
      
      {/* Main Content Tabs */}
      {user && (user.role === 'admin' || user.role === 'management') ? (
        <Tabs defaultValue="overview" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Payroll Overview</TabsTrigger>
            <TabsTrigger value="generate">Generate Payroll</TabsTrigger>
            <TabsTrigger value="history">Payroll History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <PayrollOverview users={users} isLoading={loadingUsers} />
          </TabsContent>
          
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Generate Payroll</CardTitle>
                <CardDescription>
                  Create payroll records for a specific period
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Period Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span className="material-icons mr-2">calendar_today</span>
                          {format(startDate, "MMMM d, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={date => date && setStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Period End Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Period End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <span className="material-icons mr-2">calendar_today</span>
                          {format(endDate, "MMMM d, yyyy")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={date => date && setEndDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Employee Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Employee (Optional)</label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Employees</SelectItem>
                      {fieldStaffUsers.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-medium">
                    Leave empty to generate payroll for all employees
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGeneratePayroll}
                  disabled={generatePayrollMutation.isPending}
                  className="flex items-center"
                >
                  <span className="material-icons mr-2">payments</span>
                  {generatePayrollMutation.isPending ? "Generating..." : "Generate Payroll"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <PayrollHistory payrollRecords={payrollRecords} users={users} isLoading={loadingPayroll} />
          </TabsContent>
        </Tabs>
      ) : (
        <PayrollHistory payrollRecords={payrollRecords} users={users} isLoading={loadingPayroll} />
      )}
    </main>
  );
}

interface PayrollOverviewProps {
  users: User[];
  isLoading: boolean;
}

function PayrollOverview({ users, isLoading }: PayrollOverviewProps) {
  // Group employees by role for summary
  const roleCount = {
    admin: users.filter(u => u.role === 'admin').length,
    management: users.filter(u => u.role === 'management').length,
    calling_staff: users.filter(u => u.role === 'calling_staff').length,
    technician: users.filter(u => u.role === 'technician').length,
    helper: users.filter(u => u.role === 'helper').length,
  };
  
  // Simulated current period data
  const currentPeriod = {
    startDate: "Apr 01",
    endDate: "Apr 15, 2023",
    totalHours: "820.5 hrs",
    totalDistance: "2,156 km",
    staffCount: users.length,
    estimatedAmount: "₹1,28,450",
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Current Period Stats */}
            <div className="p-4 bg-gray-50 rounded-md mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium">Current Period</h3>
                <span className="text-xs text-neutral-medium">
                  {currentPeriod.startDate} - {currentPeriod.endDate}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            
            {/* Staff Distribution */}
            <h3 className="text-lg font-medium mb-4">Staff Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-md text-center">
                <p className="text-sm text-neutral-medium">Admin</p>
                <p className="text-xl font-semibold text-blue-700">{roleCount.admin}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-md text-center">
                <p className="text-sm text-neutral-medium">Management</p>
                <p className="text-xl font-semibold text-green-700">{roleCount.management}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-md text-center">
                <p className="text-sm text-neutral-medium">Calling Staff</p>
                <p className="text-xl font-semibold text-purple-700">{roleCount.calling_staff}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-md text-center">
                <p className="text-sm text-neutral-medium">Technicians</p>
                <p className="text-xl font-semibold text-orange-700">{roleCount.technician}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-md text-center">
                <p className="text-sm text-neutral-medium">Helpers</p>
                <p className="text-xl font-semibold text-red-700">{roleCount.helper}</p>
              </div>
            </div>
            
            {/* Top Earners */}
            <h3 className="text-lg font-medium mb-4">Top Earners This Month</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Base Pay</TableHead>
                    <TableHead>Distance Pay</TableHead>
                    <TableHead>Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24 text-neutral-medium">
                        No employee data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Show field staff with highest pay rates
                    users
                      .filter(u => u.role === 'technician' || u.role === 'helper')
                      .sort((a, b) => (b.basePayRate + (b.distancePayRate || 0)) - (a.basePayRate + (a.distancePayRate || 0)))
                      .slice(0, 5)
                      .map(user => {
                        // Simulate earnings
                        const workDays = Math.floor(15 * 0.8); // 80% attendance in a 15-day period
                        const basePay = user.basePayRate * workDays;
                        const distancePay = user.distancePayRate ? user.distancePayRate * Math.floor(100 + Math.random() * 200) : 0;
                        const totalPay = basePay + distancePay;
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                                  <span className="material-icons text-sm">person</span>
                                </div>
                                <span>{user.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{user.role}</TableCell>
                            <TableCell>{formatCurrency(basePay)}</TableCell>
                            <TableCell>{formatCurrency(distancePay)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(totalPay)}</TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface PayrollHistoryProps {
  payrollRecords: Payroll[];
  users: User[];
  isLoading: boolean;
}

function PayrollHistory({ payrollRecords, users, isLoading }: PayrollHistoryProps) {
  // Sort records by date (most recent first)
  const sortedRecords = [...payrollRecords].sort(
    (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime()
  );
  
  // Get user name by ID
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : `User #${userId}`;
  };
  
  // Format date range
  const formatDateRange = (start: string, end: string) => {
    return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d, yyyy')}`;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll History</CardTitle>
        <CardDescription>
          View your historical payroll records
        </CardDescription>
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
                  <TableHead>Period</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Base Amount</TableHead>
                  <TableHead>Distance Amount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Generated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-neutral-medium">
                      No payroll records found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDateRange(record.periodStart, record.periodEnd)}</TableCell>
                      <TableCell>{getUserName(record.userId)}</TableCell>
                      <TableCell>{formatCurrency(record.baseAmount)}</TableCell>
                      <TableCell>{formatCurrency(record.distanceAmount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.totalAmount)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          record.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : record.status === 'approved' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(record.generatedAt), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
