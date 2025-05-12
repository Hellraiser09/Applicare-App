import StatsCard from "@/components/dashboard/stats-card";
import MapView from "@/components/dashboard/map-view";
import ActiveStaff from "@/components/dashboard/active-staff";
import AttendanceOverview from "@/components/dashboard/attendance-overview";
import PayrollOverview from "@/components/dashboard/payroll-overview";
import ServicesOverview from "@/components/dashboard/services-overview";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Get the first name for the welcome message
  const firstName = user?.name.split(' ')[0] || '';
  
  // Get services data
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
  });
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
      {/* Dashboard Header with Welcome Message */}
      <div className="mb-6">
        {/* Welcome & Quick Stats */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Welcome back, {firstName}!</h2>
            <p className="text-neutral-dark">Here's what's happening today</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm">
              <button className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-l-md hover:bg-gray-50">
                Daily
              </button>
              <button className="px-4 py-2 text-sm font-medium bg-primary text-white border border-primary rounded-r-md">
                Weekly
              </button>
            </div>
          </div>
        </div>
        
        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Active Technicians"
            value="18/22"
            icon="engineering"
            iconBgColor="bg-primary-light"
            iconColor="text-primary"
            change={5}
            changeText="from last week"
          />
          
          <StatsCard 
            title="Jobs Completed"
            value="24"
            icon="check_circle"
            iconBgColor="bg-secondary-light"
            iconColor="text-secondary"
            change={12}
            changeText="from yesterday"
          />
          
          <StatsCard 
            title="Pending Jobs"
            value="8"
            icon="pending"
            iconBgColor="bg-accent-light"
            iconColor="text-accent"
            change={-3}
            changeDirection="down"
            changeText="from yesterday"
          />
          
          <StatsCard 
            title="Total Distance"
            value="342 km"
            icon="directions_car"
            iconBgColor="bg-blue-100"
            iconColor="text-blue-500"
            change={8}
            changeText="from yesterday"
          />
        </div>
      </div>
      
      {/* Live Location Tracking */}
      <div className="mb-6">
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View Component */}
          <div className="lg:col-span-2">
            <MapView />
          </div>
          
          {/* Active Staff List Component */}
          <div className="lg:col-span-1 flex flex-col">
            <ActiveStaff />
          </div>
        </div>
      </div>
      
      {/* Attendance and Payroll Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AttendanceOverview />
        <PayrollOverview />
      </div>
      
      {/* Services Overview Section */}
      <ServicesOverview services={services} />
    </main>
  );
}
