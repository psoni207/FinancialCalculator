import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import FinanceNavbar from "@/components/FinanceNavbar";
import FinanceFooter from "@/components/FinanceFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

type UserWithoutPassword = Omit<User, "password">;

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", "/api/admin/users");
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Handle premium access toggle
  const handleTogglePremiumAccess = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await apiRequest(
        "PATCH",
        `/api/admin/users/${userId}/premium`,
        { hasPremiumAccess: !currentStatus }
      );
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === userId ? updatedUser : u));
        
        toast({
          title: "Success",
          description: `Premium access ${!currentStatus ? "granted to" : "revoked from"} ${updatedUser.username}`,
        });
      } else {
        throw new Error("Failed to update premium access");
      }
    } catch (error) {
      console.error("Error updating premium access:", error);
      toast({
        title: "Error",
        description: "Failed to update premium access. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect non-admin users
  if (user && user.role !== "ADMIN") {
    return <Redirect to="/" />;
  }

  // Redirect unauthenticated users
  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <FinanceNavbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Manage premium access for users
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Premium Access</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === "ADMIN" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.hasPremiumAccess}
                            disabled={user.role === "ADMIN"} // Admins always have premium access
                            onCheckedChange={() => 
                              handleTogglePremiumAccess(user.id, user.hasPremiumAccess)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={user.role === "ADMIN"} // Cannot modify admin premium access
                            onClick={() => 
                              handleTogglePremiumAccess(user.id, user.hasPremiumAccess)
                            }
                          >
                            {user.hasPremiumAccess ? "Revoke Access" : "Grant Access"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      
      <FinanceFooter />
    </div>
  );
}