import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        title: t('guestManager.guestManagerCreated'),
        description: t('guestManager.guestManagerCreatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
      setNewManagerEmail("");
      setNewManagerName("");
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('guestManager.failedToCreate'),
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
        title: t('guestManager.guestManagerAssigned'),
        description: t('guestManager.guestManagerAssignedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('guestManager.failedToAssign'),
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
        title: t('guestManager.accessRemoved'),
        description: t('guestManager.accessRemovedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/wedding-access/${wedding.id}`] });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('guestManager.failedToRemove'),
        variant: "destructive",
      });
    },
  });

  const handleCreateGuestManager = () => {
    if (!newManagerEmail || !newManagerName) {
      toast({
        title: t('guestManager.missingInformation'),
        description: t('guestManager.missingInformationDesc'),
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
            {t('guestManager.accessControl')}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {t('guestManager.accessControlDesc')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New Guest Manager */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {t('guestManager.createNew')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manager-name">{t('guestManager.fullName')}</Label>
                <Input
                  id="manager-name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder={t('guestManager.fullNamePlaceholder')}
                />
              </div>
              <div>
                <Label htmlFor="manager-email">{t('guestManager.emailAddress')}</Label>
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
              {createGuestManagerMutation.isPending ? t('guestManager.creating') : t('guestManager.createAccount')}
            </Button>
          </div>

          {/* Assign Existing Guest Manager */}
          {guestManagerUsers.length > 0 && (
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('guestManager.assignExisting')}
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
                        <Badge variant="secondary">{t('guestManager.assigned')}</Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => assignGuestManagerMutation.mutate({
                            userId: user.id,
                            weddingId: wedding.id,
                          })}
                          disabled={assignGuestManagerMutation.isPending}
                        >
                          {t('guestManager.assign')}
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
              <h3 className="font-semibold">{t('guestManager.currentManagers')}</h3>
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
                          <Badge variant="outline" className="text-xs">{t('guestManager.guestManagementOnly')}</Badge>
                          <Badge variant="outline" className="text-xs">{t('guestManager.readOnlyDetails')}</Badge>
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
              <p>{t('guestManager.noneAssigned')}</p>
              <p className="text-sm">{t('guestManager.noneAssignedDesc')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}