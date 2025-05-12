import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

export default function Employees() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  
  // Fetch all users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    
    return matchesSearch && matchesRole;
  });
  
  // Get unique roles for filter buttons
  const roles = Array.from(new Set(users.map(user => user.role)));
  
  return (
    <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Employees</h1>
        <p className="text-neutral-dark">Manage your staff members</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            {/* Search Input */}
            <div className="relative w-full md:w-1/3">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-medium">
                <span className="material-icons text-sm">search</span>
              </span>
              <Input
                type="text"
                className="pl-10 pr-4 py-2"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Role Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={roleFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(null)}
              >
                All
              </Button>
              
              {roles.map(role => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Employees Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Base Pay Rate</TableHead>
                    <TableHead>Distance Pay Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24 text-neutral-medium">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-neutral-light flex items-center justify-center text-neutral-dark">
                              <span className="material-icons text-sm">person</span>
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell className="capitalize">{user.role}</TableCell>
                        <TableCell>{user.specialization || "-"}</TableCell>
                        <TableCell>₹{user.basePayRate}/day</TableCell>
                        <TableCell>{user.distancePayRate ? `₹${user.distancePayRate}/km` : "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="material-icons text-sm">more_vert</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
