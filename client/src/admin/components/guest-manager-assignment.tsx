import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Trash2, Settings } from "lucide-react";
import type { User as UserType, Wedding, WeddingAccess } from "@shared/schema";

interface GuestManagerAssignmentProps {
  wedding: Wedding;
  className?: string;
}

export function GuestManagerAssignment({ wedding, className = '' }: GuestManagerAssignmentProps) {
  const { toast } = useToast();
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [newManagerName, setNewManagerName] = useState("");

  // Fetch all users
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch wedding access permissions
  const { data: weddingAccess = [] } = useQuery<WeddingAccess[]>({
    queryKey: [`/api/admin/wedding-access/${wedding.id}`],
  });

  // Create guest manager user
  const createGuestManagerMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; weddingId: number }) => {
      return apiRequest(`/api/admin/create-guest-manager`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Guest Manager Created",
        description: "New guest manager account has been created with restricted access.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
      setNewManagerEmail("");
      setNewManagerName("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create guest manager account",
        variant: "destructive",
      });
    },
  });

  // Assign existing user as guest manager
  const assignGuestManagerMutation = useMutation({
    mutationFn: async (data: { userId: number; weddingId: number }) => {
      return apiRequest(`/api/admin/assign-guest-manager`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Guest Manager Assigned",
        description: "User has been assigned as guest manager for this wedding.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign guest manager",
        variant: "destructive",
      });
    },
  });

  // Remove guest manager access
  const removeAccessMutation = useMutation({
    mutationFn: async (accessId: number) => {
      return apiRequest(`/api/admin/wedding-access/${accessId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Access Removed",
        description: "Guest manager access has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove access",
        variant: "destructive",
      });
    },
  });

  const handleCreateGuestManager = () => {
    if (!newManagerEmail || !newManagerName) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and name for the guest manager.",
        variant: "destructive",
      });
      return;
    }

    createGuestManagerMutation.mutate({
      email: newManagerEmail,
      name: newManagerName,
      weddingId: wedding.id,
    });
  };

  const guestManagerUsers = users.filter(user => user.role === 'guest_manager');
  const assignedManagers = weddingAccess.filter(access => access.accessLevel === 'guest_manager');

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Guest Manager Access Control
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage restricted access for wedding guest management. Guest managers can only view and manage guests.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New Guest Manager */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create New Guest Manager
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manager-name">Full Name</Label>
                <Input
                  id="manager-name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="Guest manager's full name"
                />
              </div>
              <div>
                <Label htmlFor="manager-email">Email Address</Label>
                <Input
                  id="manager-email"
                  type="email"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                  placeholder="guest.manager@example.com"
                />
              </div>
            </div>
            <Button 
              onClick={handleCreateGuestManager}
              disabled={createGuestManagerMutation.isPending}
              className="w-full md:w-auto"
            >
              {createGuestManagerMutation.isPending ? "Creating..." : "Create Guest Manager Account"}
            </Button>
          </div>

          {/* Assign Existing Guest Manager */}
          {guestManagerUsers.length > 0 && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Assign Existing Guest Manager
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {guestManagerUsers.map((user) => {
                  const isAssigned = assignedManagers.some(access => access.userId === user.id);
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      {isAssigned ? (
                        <Badge variant="secondary">Assigned</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => assignGuestManagerMutation.mutate({
                            userId: user.id,
                            weddingId: wedding.id,
                          })}
                          disabled={assignGuestManagerMutation.isPending}
                        >
                          Assign
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Guest Managers */}
          {assignedManagers.length > 0 && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Current Guest Managers</h3>
              <div className="space-y-2">
                {assignedManagers.map((access) => {
                  const user = users.find(u => u.id === access.userId);
                  if (!user) return null;
                  
                  return (
                    <div key={access.id} className="flex items-center justify-between p-3 bg-green-50 rounded border">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Guest Management Only</Badge>
                          <Badge variant="outline" className="text-xs">Read-Only Wedding Details</Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeAccessMutation.mutate(access.id)}
                        disabled={removeAccessMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {assignedManagers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No guest managers assigned to this wedding.</p>
              <p className="text-sm">Create or assign a guest manager to provide restricted access.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}