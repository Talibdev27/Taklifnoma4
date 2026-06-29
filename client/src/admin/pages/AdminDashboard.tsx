import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Users, Calendar, Camera, MessageSquare, Settings,
  TrendingUp, Heart, MapPin, Mail, Shield, Search,
  Eye, Trash2, Edit, BarChart3, Globe, LogOut, Images, UserPlus, Clock
} from "lucide-react";
import type { Wedding, User, Guest, Photo } from "@shared/schema";
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { GuestManagerAssignment } from '@/admin/components/guest-manager-assignment';
import { AdminGuestBookManager } from '@/admin/components/admin-guest-book-manager';
import { TEMPLATE_REGISTRY, EVENT_TYPES, getTemplatesForEvent } from '@/lib/templates';
import { getTemplateSections, DEFAULT_SECTIONS } from '@/lib/template-sections';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [weddingToDelete, setWeddingToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  // Create wedding form state
  const [newWedding, setNewWedding] = useState({
    userId: '',
    eventType: 'wedding', // NEW FIELD
    rsvpMode: 'both', // NEW FIELD
    bride: '', // Will be used as "Birthday Person's Name" for birthday template
    groom: '', // Will be hidden for birthday template
    weddingDate: '', // Will be used as "Birthday Date" for birthday template
    weddingTime: '18:00', // Will be used as "Party Time" for birthday template
    venue: '', // Will be used as "Party Venue" for birthday template
    venueAddress: '', // Will be used as "Party Location Address" for birthday template
    template: 'modern',
    sections: { ...DEFAULT_SECTIONS } as Record<string, boolean>,
    story: '', // Will be used as "About [Name]" for birthday template
    dearGuestMessage: '', // Will be used as "Party Details" for birthday template
    couplePhotoUrl: '',
    backgroundMusicUrl: '',
    dressCode: '',
    defaultLanguage: 'en',
    primaryColor: '#1976d2',
    accentColor: '#1565c0',
    // Birthday-specific fields
    age: '',
    partyTheme: '',
    rsvpDeadline: '',
    giftRegistryInfo: '',
    contactPerson: '',
    specialInstructions: ''
  });

  const handleCouplePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('/api/upload/couple-photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setNewWedding(prev => ({...prev, couplePhotoUrl: result.url}));
        toast({
          title: t('adminDashboard.photoUploadedTitle'),
          description: t('adminDashboard.photoUploadedDesc')
        });
      } else {
        throw new Error(t('adminDashboard.uploadFailedError'));
      }
    } catch (error) {
      toast({
        title: t('adminDashboard.uploadErrorTitle'),
        description: t('adminDashboard.photoUploadErrorDesc'),
        variant: "destructive"
      });
    }
  };

  const handleBackgroundMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: t('adminDashboard.invalidFileTypeTitle'),
        description: t('adminDashboard.invalidAudioFileDesc'),
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('adminDashboard.fileTooLargeTitle'),
        description: t('adminDashboard.fileTooLargeDesc'),
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append('music', file);

    try {
      const response = await fetch('/api/upload/background-music', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setNewWedding(prev => ({...prev, backgroundMusicUrl: result.url}));
        toast({
          title: t('adminDashboard.musicUploadedTitle'),
          description: t('adminDashboard.musicUploadedDesc')
        });
      } else {
        throw new Error(t('adminDashboard.uploadFailedError'));
      }
    } catch (error) {
      toast({
        title: t('adminDashboard.uploadErrorTitle'),
        description: t('adminDashboard.musicUploadErrorDesc'),
        variant: "destructive"
      });
    }
  };

  // Check admin authentication
  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    const adminToken = localStorage.getItem('adminToken');
    if (!adminStatus || adminStatus !== 'true' || !adminToken) {
      setLocation('/admin/login');
      return;
    }
    setIsAdmin(true);
  }, [setLocation]);

  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ['/api/admin/weddings'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/weddings', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch weddings');
        }
        return res.json();
      }).then(data => Array.isArray(data) ? data : []);
    },
    enabled: isAdmin && !!localStorage.getItem('adminToken'),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch users');
        }
        return res.json();
      }).then(data => Array.isArray(data) ? data : []);
    },
    enabled: isAdmin && !!localStorage.getItem('adminToken'),
  });



  const { data: stats = {
    totalUsers: 0,
    guestUsers: 0,
    totalWeddings: 0,
    publicWeddings: 0,
    privateWeddings: 0
  }, isLoading: statsLoading } = useQuery<{
    totalUsers: number;
    guestUsers: number;
    totalWeddings: number;
    publicWeddings: number;
    privateWeddings: number;
  }>({
    queryKey: ['/api/admin/stats'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch stats');
        }
        return res.json();
      });
    },
    enabled: isAdmin,
  });

  const { data: rsvpStats = {
    totalRSVPs: 0,
    confirmedRSVPs: 0,
    pendingRSVPs: 0,
    declinedRSVPs: 0,
    maybeRSVPs: 0
  }, isLoading: rsvpStatsLoading } = useQuery<{
    totalRSVPs: number;
    confirmedRSVPs: number;
    pendingRSVPs: number;
    declinedRSVPs: number;
    maybeRSVPs: number;
  }>({
    queryKey: ['/api/admin/rsvp-stats'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/rsvp-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch RSVP stats');
        }
        return res.json();
      });
    },
    enabled: isAdmin,
  });

  const { data: allRSVPs = [], isLoading: rsvpLoading } = useQuery<Guest[]>({
    queryKey: ['/api/admin/rsvp'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/rsvp', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch RSVPs');
        }
        return res.json();
      }).then(data => Array.isArray(data) ? data : []);
    },
    enabled: isAdmin,
  });

  const { data: allPhotos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ['/api/admin/photos'],
    queryFn: () => {
      const token = localStorage.getItem('adminToken');
      return fetch('/api/admin/photos', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch photos');
        }
        return res.json();
      }).then(data => Array.isArray(data) ? data : []);
    },
    enabled: isAdmin,
  });

  // Create wedding mutation
  const createWeddingMutation = useMutation({
    mutationFn: async (weddingData: any) => {
      console.log("Sending wedding data:", weddingData);
      
      // Validate required fields
      if (!weddingData.userId || !weddingData.bride || !weddingData.weddingDate) {
        throw new Error(t('adminDashboard.fillRequiredFieldsError'));
      }
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/weddings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(weddingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Wedding creation error:", errorData);
        throw new Error(errorData.message || t('adminDashboard.createWeddingFailedError'));
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.eventCreatedTitle'),
        description: t('adminDashboard.eventCreatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      // Reset form
      setNewWedding({
        userId: '',
        eventType: 'wedding',
        rsvpMode: 'both',
        bride: '',
        groom: '',
        weddingDate: '',
        weddingTime: '18:00',
        venue: '',
        venueAddress: '',
        dressCode: '',
        template: 'modern',
        sections: { ...DEFAULT_SECTIONS } as Record<string, boolean>,
        story: '',
        dearGuestMessage: '',
        couplePhotoUrl: '',
        backgroundMusicUrl: '',
        defaultLanguage: 'en',
        primaryColor: '#1976d2',
        accentColor: '#1565c0',
        // Birthday-specific fields
        age: '',
        partyTheme: '',
        rsvpDeadline: '',
        giftRegistryInfo: '',
        contactPerson: '',
        specialInstructions: ''
      });
    },
    onError: (error: any) => {
      console.error("Wedding creation error:", error);
      toast({
        title: t('adminDashboard.createErrorTitle'),
        description: error.message || t('adminDashboard.createWeddingFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Delete wedding mutation
  const deleteWeddingMutation = useMutation({
    mutationFn: async (weddingId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/weddings/${weddingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to delete wedding');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.eventDeletedTitle'),
        description: t('adminDashboard.eventDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setWeddingToDelete(null);
    },
    onError: () => {
      toast({
        title: t('adminDashboard.deleteErrorTitle'),
        description: t('adminDashboard.deleteWeddingFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleDeleteWedding = (weddingId: number) => {
    if (confirm(t('adminDashboard.confirmDeleteWedding'))) {
      deleteWeddingMutation.mutate(weddingId);
    }
  };

  // Approve/unapprove wedding mutation
  const approveWeddingMutation = useMutation({
    mutationFn: async ({ weddingId, isApproved }: { weddingId: number, isApproved: boolean }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isApproved }),
      });
      if (!response.ok) {
        throw new Error('Failed to update wedding approval status');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isApproved ? t('adminDashboard.eventApprovedTitle') : t('adminDashboard.approvalRevokedTitle'),
        description: variables.isApproved
          ? t('adminDashboard.eventApprovedDesc')
          : t('adminDashboard.approvalRevokedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: t('adminDashboard.approvalErrorTitle'),
        description: t('adminDashboard.approvalFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleToggleApproval = (weddingId: number, currentStatus: boolean) => {
    const action = currentStatus ? t('adminDashboard.actionRevokeApproval') : t('adminDashboard.actionApprove');
    if (confirm(t('adminDashboard.confirmToggleApproval', { action }))) {
      approveWeddingMutation.mutate({ weddingId, isApproved: !currentStatus });
    }
  };



  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.userUpdatedTitle'),
        description: t('adminDashboard.userUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({
        title: t('adminDashboard.updateErrorTitle'),
        description: t('adminDashboard.userUpdateFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.userDeletedTitle'),
        description: t('adminDashboard.userDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: t('adminDashboard.deleteErrorTitle'),
        description: t('adminDashboard.userDeleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  // Photo management mutations
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.photoDeletedTitle'),
        description: t('adminDashboard.photoDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
    },
    onError: () => {
      toast({
        title: t('adminDashboard.photoDeleteFailedTitle'),
        description: t('adminDashboard.photoDeleteFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (photoData: any) => {
      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('adminDashboard.photoAddedTitle'),
        description: t('adminDashboard.photoAddedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
    },
    onError: () => {
      toast({
        title: t('adminDashboard.uploadFailedTitle'),
        description: t('adminDashboard.addPhotoFailedDesc'),
        variant: "destructive",
      });
    },
  });

  const handleFormChange = (field: string, value: string) => {
    setNewWedding(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateWedding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate required fields
    const errors = [];
    if (!newWedding.userId) errors.push(t('adminDashboard.fieldUserId'));
    if (!newWedding.bride?.trim()) {
      errors.push(newWedding.template === 'birthday' ? t('adminDashboard.fieldBirthdayPersonName') : t('adminDashboard.fieldBrideName'));
    }
    if (!newWedding.weddingDate) {
      errors.push(newWedding.template === 'birthday' ? t('adminDashboard.fieldBirthdayDate') : t('adminDashboard.fieldWeddingDate'));
    }

    if (errors.length > 0) {
      toast({
        title: t('adminDashboard.missingFieldsTitle'),
        description: t('adminDashboard.missingFieldsDesc', { fields: errors.join(", ") }),
        variant: "destructive",
      });
      return;
    }

    // Validate date format
    const dateObj = new Date(newWedding.weddingDate);
    if (isNaN(dateObj.getTime())) {
      toast({
        title: t('adminDashboard.invalidDateTitle'),
        description: newWedding.template === 'birthday' ? t('adminDashboard.invalidBirthdayDateDesc') : t('adminDashboard.invalidWeddingDateDesc'),
        variant: "destructive",
      });
      return;
    }

    console.log("Submitting wedding data:", newWedding);
    createWeddingMutation.mutate(newWedding);
  };

  const handleResetForm = () => {
    setNewWedding({
      userId: '',
      eventType: 'wedding',
      rsvpMode: 'both',
      bride: '',
      groom: '',
      weddingDate: '',
      weddingTime: '18:00',
      venue: '',
      venueAddress: '',
      dressCode: '',
      template: 'modern',
      story: '',
      dearGuestMessage: '',
      couplePhotoUrl: '',
      backgroundMusicUrl: '',
      defaultLanguage: 'en',
      primaryColor: '#1976d2',
      accentColor: '#1565c0',
      // Birthday-specific fields
      age: '',
      partyTheme: '',
      rsvpDeadline: '',
      giftRegistryInfo: '',
      contactPerson: '',
      specialInstructions: ''
    });
  };

  const handleToggleAdmin = (userId: number, isAdmin: boolean) => {
    const action = isAdmin ? t('adminDashboard.actionGrantAdmin') : t('adminDashboard.actionRemoveAdmin');
    if (confirm(t('adminDashboard.confirmUserAction', { action }))) {
      updateUserMutation.mutate({ userId, updates: { isAdmin } });
    }
  };

  const handleRestrictUser = (userId: number, restricted: boolean) => {
    const action = restricted ? t('adminDashboard.actionRestrictGuest') : t('adminDashboard.actionRemoveRestrictions');
    if (confirm(t('adminDashboard.confirmUserAction', { action }))) {
      updateUserMutation.mutate({ 
        userId, 
        updates: { 
          role: restricted ? 'guest_manager' : 'user',
          isAdmin: false 
        } 
      });
    }
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm(t('adminDashboard.confirmDeleteUser'))) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    setLocation('/admin/login');
  };

  if (!isAdmin) {
    return null; // Redirecting to login
  }

  const filteredWeddings = Array.isArray(weddings) ? weddings.filter((wedding: Wedding) => 
    wedding.bride.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.groom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wedding.venue.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const filteredUsers = Array.isArray(users) ? users.filter((user: User) => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  console.log("Users data:", users);
  console.log("Filtered users:", filteredUsers);
  console.log("Users loading:", usersLoading);



  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F1F1] to-white">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b border-[#D4B08C]/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#D4B08C] rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-playfair font-bold text-[#2C3338] truncate">
                  {t('adminDashboard.adminPanel')}
                </h1>
                <p className="text-xs sm:text-sm text-[#2C3338]/70 hidden sm:block">{t('adminDashboard.platformManagement')}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-[#2C3338] border-[#2C3338] hover:bg-[#2C3338] hover:text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 min-h-[44px] sm:min-h-[36px]"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('adminDashboard.logout')}</span>
              <span className="sm:hidden">{t('adminDashboard.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Mobile-Optimized System Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4B08C] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats.totalWeddings || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">{t('adminDashboard.totalEvents')}</p>
            </CardContent>
          </Card>

          <Card className="wedding-card border-amber-200 bg-amber-50">
            <CardContent className="p-3 sm:p-6 text-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-amber-900">
                {weddings?.filter((w: Wedding) => !w.isApproved).length || 0}
              </p>
              <p className="text-amber-900/70 text-xs sm:text-sm">{t('adminDashboard.pending')}</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#89916B] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.totalUsers || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">{t('adminDashboard.users')}</p>
              <p className="text-xs text-[#2C3338]/50 hidden sm:block">{t('adminDashboard.guestAccounts', { count: stats?.guestUsers || 0 })}</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4B08C] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.publicWeddings || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">{t('adminDashboard.publicEvents')}</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-[#89916B] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">
                {weddings?.filter((w: Wedding) => 
                  new Date(w.weddingDate) > new Date()
                ).length || 0}
              </p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">{t('adminDashboard.upcomingEvents')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Management Tabs */}
        <Tabs defaultValue="weddings" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
                          <TabsTrigger value="weddings" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">{t('adminDashboard.tabEvents')}</span>
                <span className="sm:hidden">{t('adminDashboard.tabEvents')}</span>
              </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">{t('adminDashboard.tabUsers')}</span>
              <span className="sm:hidden">{t('adminDashboard.tabUsersShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">{t('adminDashboard.tabRsvpManagement')}</span>
              <span className="sm:hidden">{t('adminDashboard.tabRsvpShort')}</span>
            </TabsTrigger>
                          <TabsTrigger value="create" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">{t('adminDashboard.tabCreateEvent')}</span>
                <span className="sm:hidden">{t('adminDashboard.tabCreateShort')}</span>
              </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">{t('adminDashboard.tabAnalytics')}</span>
              <span className="sm:hidden">{t('adminDashboard.tabAnalyticsShort')}</span>
            </TabsTrigger>
            <TabsTrigger value="guestbook" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">{t('adminDashboard.tabGuestBook')}</span>
              <span className="sm:hidden">{t('adminDashboard.tabGuestBookShort')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-Optimized Weddings Management */}
          <TabsContent value="weddings" className="space-y-4 sm:space-y-6">
            <Card className="wedding-card">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4B08C]" />
                    {t('adminDashboard.allEvents')}
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder={t('adminDashboard.searchEventsPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 sm:pl-10 w-full sm:w-64 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weddingsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredWeddings.map((wedding: Wedding) => {
                      const weddingOwner = users.find(user => user.id === wedding.userId);
                      return (
                        <div key={wedding.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 gap-3">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#D4B08C] rounded-full flex items-center justify-center flex-shrink-0">
                              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-sm sm:text-base text-[#2C3338] truncate">
                                {wedding.template === 'birthday' ? wedding.bride : `${wedding.bride} & ${wedding.groom}`}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#2C3338]/70 truncate">
                                📍 {wedding.venue} • 📅 {new Date(wedding.weddingDate).toLocaleDateString()}
                                {wedding.template === 'birthday' && ' 🎂'}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                <Badge variant={wedding.isPublic ? "default" : "secondary"} className="text-xs">
                                  {wedding.isPublic ? t('adminDashboard.public') : t('adminDashboard.private')}
                                </Badge>
                                <Badge
                                  variant={wedding.isApproved ? "default" : "destructive"}
                                  className={`text-xs ${wedding.isApproved ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                                >
                                  {wedding.isApproved ? t('adminDashboard.approvedBadge') : t('adminDashboard.pendingBadge')}
                                </Badge>
                                <span className="text-xs text-[#2C3338]/50 truncate max-w-[100px] sm:max-w-none">
                                  /{wedding.uniqueUrl}
                                </span>
                                {weddingOwner && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-none">
                                    {t('adminDashboard.owner', { email: weddingOwner.email })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                            <Button
                              variant={wedding.isApproved ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleApproval(wedding.id, wedding.isApproved)}
                              disabled={approveWeddingMutation.isPending}
                              className={`min-h-[44px] sm:min-h-[36px] p-2 ${
                                wedding.isApproved 
                                  ? '' 
                                  : 'bg-taklif-gold hover:bg-taklif-gold/90 text-gray-900'
                              }`}
                              title={wedding.isApproved ? t('adminDashboard.revokeApprovalTitle') : t('adminDashboard.approveTitle')}
                            >
                              {wedding.isApproved ? (
                                <>
                                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.approved')}</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.approve')}</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
                              className="min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.view')}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/weddings/${wedding.uniqueUrl}/edit`)}
                              className="min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.edit')}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWedding(wedding.id)}
                              disabled={deleteWeddingMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.delete')}</span>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[36px] p-2">
                                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">{t('adminDashboard.assignGuestManager')}</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <GuestManagerAssignment wedding={wedding} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      );
                    })}
                    {filteredWeddings.length === 0 && (
                      <div className="text-center py-8 text-[#2C3338]/70">
                        {searchTerm ? t('adminDashboard.noEventsFound') : t('adminDashboard.noEventsYet')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Users className="h-5 w-5 text-[#89916B]" />
                    {t('adminDashboard.allUsers')}
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder={t('adminDashboard.searchUsersPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredUsers.map((user: User) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-[#89916B] rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#2C3338]">{user.name || t('adminDashboard.unknownUser')}</h3>
                            <p className="text-sm text-[#2C3338]/70">{user.email || t('adminDashboard.noEmail')}</p>
                            <p className="text-xs text-[#2C3338]/50">
                              {t('adminDashboard.joinedLabel', { date: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : t('adminDashboard.unknown') })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {t('adminDashboard.eventCountBadge', { count: weddings?.filter((w: Wedding) => w.userId === user.id).length || 0 })}
                          </Badge>
                          <Badge variant={
                            user.isAdmin ? "default" :
                            user.role === 'guest_manager' ? "destructive" : "secondary"
                          }>
                            {user.isAdmin ? t('adminDashboard.roleAdmin') :
                             user.role === 'guest_manager' ? t('adminDashboard.roleGuestManager') : t('adminDashboard.roleUser')}
                          </Badge>
                          {user.role === 'guest_manager' && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              {t('adminDashboard.restrictedAccess')}
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id, !user.isAdmin)}
                            disabled={updateUserMutation.isPending || user.role === 'guest_manager'}
                            className="text-xs"
                          >
                            {user.isAdmin ? t('adminDashboard.removeAdmin') : t('adminDashboard.makeAdmin')}
                          </Button>
                          <Button
                            variant={user.role === 'guest_manager' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRestrictUser(user.id, user.role !== 'guest_manager')}
                            disabled={updateUserMutation.isPending || user.isAdmin}
                            className="text-xs"
                          >
                            {user.role === 'guest_manager' ? t('adminDashboard.removeRestriction') : t('adminDashboard.restrictAccess')}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-[#2C3338]/70">
                        {searchTerm ? t('adminDashboard.noUsersFound') : t('adminDashboard.noUsersYet')}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RSVP Management */}
          <TabsContent value="rsvp" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Calendar className="h-5 w-5 text-[#89916B]" />
                    {t('adminDashboard.rsvpManagementByWedding')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {rsvpStatsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 p-4 rounded-lg h-20"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">{t('adminDashboard.confirmed')}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-1">{rsvpStats?.confirmedRSVPs || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-700">{t('adminDashboard.pending')}</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{rsvpStats?.pendingRSVPs || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">{t('adminDashboard.declined')}</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600 mt-1">{rsvpStats?.declinedRSVPs || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700">{t('adminDashboard.maybe')}</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{rsvpStats?.maybeRSVPs || 0}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <h3 className="font-semibold text-[#2C3338] mb-4">{t('adminDashboard.rsvpResponsesByWedding')}</h3>
                  {weddingsLoading || rsvpLoading ? (
                    <div className="space-y-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 border rounded-lg">
                          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                          <div className="space-y-3">
                            {[...Array(3)].map((_, j) => (
                              <div key={j} className="flex space-x-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : weddings && weddings.length > 0 ? (
                    <div className="space-y-6">
                      {weddings.map((wedding: Wedding) => {
                        const weddingGuests = allRSVPs?.filter((rsvp: any) => rsvp.weddingId === wedding.id) || [];
                        const confirmedGuests = weddingGuests.filter((g: any) => g.rsvpStatus === 'confirmed');
                        const pendingGuests = weddingGuests.filter((g: any) => g.rsvpStatus === 'pending');
                        const declinedGuests = weddingGuests.filter((g: any) => g.rsvpStatus === 'declined');
                        
                        return (
                          <Card key={wedding.id} className="border-l-4 border-l-[#D4B08C]">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-[#2C3338] text-lg">
                                    {wedding.bride} & {wedding.groom}
                                  </h4>
                                  <p className="text-sm text-[#2C3338]/70">
                                    {wedding.venue} • {new Date(wedding.weddingDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-center">
                                    <div className="text-xs text-green-600 font-medium">{t('adminDashboard.confirmed')}</div>
                                    <div className="text-lg font-bold text-green-600">{confirmedGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-yellow-600 font-medium">{t('adminDashboard.pending')}</div>
                                    <div className="text-lg font-bold text-yellow-600">{pendingGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-red-600 font-medium">{t('adminDashboard.declined')}</div>
                                    <div className="text-lg font-bold text-red-600">{declinedGuests.length}</div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      sessionStorage.setItem('fromAdminDashboard', 'true');
                                      setLocation(`/manage/${wedding.uniqueUrl}`);
                                    }}
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    {t('adminDashboard.manage')}
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {weddingGuests.length > 0 ? (
                                <div className="space-y-3">
                                  {weddingGuests.map((guest: any) => (
                                    <div key={guest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-[#89916B] rounded-full flex items-center justify-center">
                                          <span className="text-white font-semibold text-sm">
                                            {guest.name ? guest.name.charAt(0).toUpperCase() : 'G'}
                                          </span>
                                        </div>
                                        <div>
                                          <h5 className="font-medium text-[#2C3338]">{guest.name || t('adminDashboard.guestFallback')}</h5>
                                          <p className="text-sm text-[#2C3338]/70">{guest.email}</p>
                                          {guest.message && (
                                            <p className="text-xs text-[#2C3338]/60 mt-1 italic">"{guest.message}"</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className={
                                            guest.rsvpStatus === 'confirmed' 
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : guest.rsvpStatus === 'pending'
                                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                              : guest.rsvpStatus === 'declined'
                                              ? "bg-red-50 text-red-700 border-red-200"
                                              : "bg-blue-50 text-blue-700 border-blue-200"
                                          }
                                        >
                                          {guest.rsvpStatus?.charAt(0).toUpperCase() + guest.rsvpStatus?.slice(1) || t('adminDashboard.unknownStatus')}
                                        </Badge>
                                        <span className="text-xs text-[#2C3338]/50">
                                          {guest.createdAt ? new Date(guest.createdAt).toLocaleDateString() : ''}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6 text-[#2C3338]/70">
                                  {t('adminDashboard.noRsvpForWedding')}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      {t('adminDashboard.noEventsFoundSimple')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="wedding-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <BarChart3 className="h-5 w-5 text-[#D4B08C]" />
                    {t('adminDashboard.weddingStatistics')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">{t('adminDashboard.thisMonth')}</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {t('adminDashboard.newCount', { count: weddings?.filter((w: Wedding) => {
                        const weddingMonth = new Date(w.createdAt).getMonth();
                        const currentMonth = new Date().getMonth();
                        return weddingMonth === currentMonth;
                      }).length || 0 })}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">{t('adminDashboard.publicEvents')}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round(((weddings?.filter((w: Wedding) => w.isPublic).length || 0) / (weddings?.length || 1)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">{t('adminDashboard.averagePerUser')}</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {((weddings?.length || 0) / (users?.length || 1)).toFixed(1)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="wedding-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Calendar className="h-5 w-5 text-[#89916B]" />
                    {t('adminDashboard.upcomingEvents')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weddings?.filter((w: Wedding) => new Date(w.weddingDate) > new Date())
                    .sort((a: Wedding, b: Wedding) => new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime())
                    .slice(0, 3)
                    .map((wedding: Wedding) => (
                      <div key={wedding.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#2C3338] text-sm">
                            {wedding.bride} & {wedding.groom}
                          </p>
                          <p className="text-xs text-[#2C3338]/70">
                            {new Date(wedding.weddingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {t('adminDashboard.daysCount', { count: Math.ceil((new Date(wedding.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) })}
                        </Badge>
                      </div>
                    )) || (
                    <div className="text-center py-4 text-[#2C3338]/70 text-sm">
                      {t('adminDashboard.noUpcomingEvents')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Create Wedding Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#D4B08C]" />
                  {newWedding.template === 'birthday' ? t('adminDashboard.createNewBirthdayEvent') : t('adminDashboard.createNewEvent')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.selectUser')}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.userId}
                        onChange={(e) => handleFormChange('userId', e.target.value)}
                      >
                        <option value="">{t('adminDashboard.selectUserPlaceholder')}</option>
                        {users?.filter((u: User) => !u.email.includes('guest_')).map((user: User) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? t('adminDashboard.birthdayPersonNameLabel') : t('adminDashboard.brideNameLabel')}
                      </label>
                      <Input
                        placeholder={newWedding.template === 'birthday' ? t('adminDashboard.birthdayPersonNamePlaceholder') : t('adminDashboard.brideNamePlaceholder')}
                        className="wedding-input"
                        value={newWedding.bride}
                        onChange={(e) => handleFormChange('bride', e.target.value)}
                      />
                    </div>

                    {/* Only show groom field for non-birthday templates */}
                    {newWedding.template !== 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.groomNameLabel')}
                        </label>
                        <Input
                          placeholder={t('adminDashboard.groomNamePlaceholder')}
                          className="wedding-input"
                          value={newWedding.groom}
                          onChange={(e) => handleFormChange('groom', e.target.value)}
                        />
                      </div>
                    )}

                    {/* Birthday-specific fields */}
                    {newWedding.template === 'birthday' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('adminDashboard.ageLabel')}
                          </label>
                          <Input
                            placeholder={t('adminDashboard.agePlaceholder')}
                            className="wedding-input"
                            value={newWedding.age}
                            onChange={(e) => handleFormChange('age', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            {t('adminDashboard.partyThemeLabel')}
                          </label>
                          <Input
                            placeholder={t('adminDashboard.partyThemePlaceholder')}
                            className="wedding-input"
                            value={newWedding.partyTheme}
                            onChange={(e) => handleFormChange('partyTheme', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? t('adminDashboard.birthdayDateLabel') : t('adminDashboard.eventDateLabel')}
                      </label>
                      <Input
                        type="date"
                        className="wedding-input"
                        value={newWedding.weddingDate}
                        onChange={(e) => handleFormChange('weddingDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? t('adminDashboard.partyTimeLabel') : t('adminDashboard.eventTimeLabel')}
                      </label>
                      <Input
                        placeholder={t('adminDashboard.eventTimePlaceholder')}
                        className="wedding-input"
                        value={newWedding.weddingTime}
                        onChange={(e) => handleFormChange('weddingTime', e.target.value)}
                      />
                    </div>

                    {/* Birthday-specific deadline */}
                    {newWedding.template === 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.rsvpDeadlineLabel')}
                        </label>
                        <Input
                          type="date"
                          className="wedding-input"
                          value={newWedding.rsvpDeadline}
                          onChange={(e) => handleFormChange('rsvpDeadline', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? t('adminDashboard.partyVenueLabel') : t('adminDashboard.eventVenueLabel')}
                      </label>
                      <Input
                        placeholder={newWedding.template === 'birthday' ? t('adminDashboard.partyVenuePlaceholder') : t('adminDashboard.eventVenuePlaceholder')}
                        className="wedding-input"
                        value={newWedding.venue}
                        onChange={(e) => handleFormChange('venue', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? t('adminDashboard.partyAddressLabel') : t('adminDashboard.eventAddressLabel')}
                      </label>
                      <Input
                        placeholder={newWedding.template === 'birthday' ? t('adminDashboard.partyAddressPlaceholder') : t('adminDashboard.eventAddressPlaceholder')}
                        className="wedding-input"
                        value={newWedding.venueAddress}
                        onChange={(e) => handleFormChange('venueAddress', e.target.value)}
                      />
                    </div>

                    {/* Birthday-specific contact person */}
                    {newWedding.template === 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.contactForQuestionsLabel')}
                        </label>
                        <Input
                          placeholder={t('adminDashboard.contactPersonPlaceholder')}
                          className="wedding-input"
                          value={newWedding.contactPerson}
                          onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.dressCodeLabel')}
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none"
                        rows={3}
                        placeholder={newWedding.template === 'birthday' ? t('adminDashboard.dressCodeBirthdayPlaceholder') : t('adminDashboard.dressCodePlaceholder')}
                        value={newWedding.dressCode || ''}
                        onChange={(e) => handleFormChange('dressCode', e.target.value)}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('adminDashboard.dressCodeHint')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.eventTypeLabel')}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.eventType}
                        onChange={(e) => {
                          handleFormChange('eventType', e.target.value);
                          // Reset template to first available for new event type
                          const firstTemplate = getTemplatesForEvent(e.target.value)[0].value;
                          handleFormChange('template', firstTemplate);
                        }}
                      >
                        {EVENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.templateLabel')}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.template}
                        onChange={(e) => handleFormChange('template', e.target.value)}
                      >
                        {getTemplatesForEvent(newWedding.eventType).map(template => (
                          <option key={template.value} value={template.value}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Show/hide individual sections (templates that support it) */}
                    {getTemplateSections(newWedding.template).length > 0 && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-[#2C3338]">
                            {t('createWedding.sections.title')}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {t('createWedding.sections.description')}
                          </p>
                        </div>
                        {getTemplateSections(newWedding.template).map(({ key, labelKey }) => {
                          const current = (newWedding.sections as Record<string, boolean>) || DEFAULT_SECTIONS;
                          return (
                            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                              <span className="text-sm text-[#2C3338]">{t(labelKey)}</span>
                              <Switch
                                checked={current[key] !== false}
                                onCheckedChange={(v) =>
                                  setNewWedding((prev) => ({
                                    ...prev,
                                    sections: {
                                      ...((prev.sections as Record<string, boolean>) || DEFAULT_SECTIONS),
                                      [key]: v,
                                    },
                                  }))
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.rsvpModeLabel')}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.rsvpMode}
                        onChange={(e) => handleFormChange('rsvpMode', e.target.value)}
                      >
                        <option value="both">{t('adminDashboard.rsvpModeBoth')}</option>
                        <option value="manual">{t('adminDashboard.rsvpModeManual')}</option>
                        <option value="preregistered">{t('adminDashboard.rsvpModePreregistered')}</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {newWedding.rsvpMode === 'both' && t('adminDashboard.rsvpModeBothHint')}
                        {newWedding.rsvpMode === 'manual' && t('adminDashboard.rsvpModeManualHint')}
                        {newWedding.rsvpMode === 'preregistered' && t('adminDashboard.rsvpModePreregisteredHint')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {t('adminDashboard.defaultLanguageLabel')}
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.defaultLanguage}
                        onChange={(e) => handleFormChange('defaultLanguage', e.target.value)}
                      >
                        <option value="uz">O'zbekcha</option>
                        <option value="en">English</option>
                        <option value="ru">Русский</option>
                        <option value="kk">Қазақша</option>
                        <option value="kaa">Қарақалпақша</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {newWedding.template === 'birthday' ? t('adminDashboard.defaultLanguageHintBirthday') : t('adminDashboard.defaultLanguageHintEvent')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Birthday-specific additional fields */}
                {newWedding.template === 'birthday' && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-[#2C3338] border-b border-gray-200 pb-2">
                      {t('adminDashboard.birthdayPartyDetails')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.giftRegistryLabel')}
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none"
                          rows={3}
                          placeholder={t('adminDashboard.giftRegistryPlaceholder')}
                          value={newWedding.giftRegistryInfo}
                          onChange={(e) => handleFormChange('giftRegistryInfo', e.target.value)}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.specialInstructionsLabel')}
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none"
                          rows={3}
                          placeholder={t('adminDashboard.specialInstructionsPlaceholder')}
                          value={newWedding.specialInstructions}
                          onChange={(e) => handleFormChange('specialInstructions', e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template Previews */}
                {newWedding.template === 'birthday' && (
                  <div className="space-y-4 p-4 border border-pink-200 rounded-lg bg-pink-50/30 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <h4 className="text-sm font-semibold text-pink-700">{t('adminDashboard.birthdayTemplateFeatures')}</h4>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureBirthdayDesign')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureAnimatedElements')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureCountdownTimer')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureBackgroundMusic')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureGuestBook')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">{t('adminDashboard.featureMultiLanguage')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {newWedding.template === 'epic' && (
                  <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-sm font-semibold text-blue-700">{t('adminDashboard.epicTemplateColors')}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.primaryColorLabel')}
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={newWedding.primaryColor}
                            onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={newWedding.primaryColor}
                            onChange={(e) => handleFormChange('primaryColor', e.target.value)}
                            placeholder="#1976d2"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t('adminDashboard.primaryColorHint')}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          {t('adminDashboard.accentColorLabel')}
                        </label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={newWedding.accentColor}
                            onChange={(e) => handleFormChange('accentColor', e.target.value)}
                            className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
                          />
                          <Input
                            value={newWedding.accentColor}
                            onChange={(e) => handleFormChange('accentColor', e.target.value)}
                            placeholder="#1565c0"
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t('adminDashboard.accentColorHint')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Story and Messages */}
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? t('adminDashboard.aboutBirthdayPersonLabel') : t('adminDashboard.eventStoryLabel')}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none"
                      rows={4}
                                              placeholder={newWedding.template === 'birthday' ? t('adminDashboard.aboutBirthdayPersonPlaceholder') : t('adminDashboard.eventStoryPlaceholder')}
                      value={newWedding.story}
                      onChange={(e) => handleFormChange('story', e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? t('adminDashboard.partyDetailsLabel') : t('adminDashboard.eventDetailsLabel')}
                    </label>
                    <textarea
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none"
                      rows={4}
                                              placeholder={newWedding.template === 'birthday' ? t('adminDashboard.partyDetailsPlaceholder') : t('adminDashboard.eventDetailsPlaceholder')}
                      value={newWedding.dearGuestMessage}
                      onChange={(e) => handleFormChange('dearGuestMessage', e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      {newWedding.template === 'birthday' ? t('adminDashboard.partyDetailsHint') : t('adminDashboard.dearGuestsHint')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? t('adminDashboard.birthdayPersonPhotoLabel') : t('adminDashboard.eventPhotoLabel')}
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCouplePhotoUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newWedding.template === 'birthday' ? t('adminDashboard.birthdayPersonPhotoHint') : t('adminDashboard.eventPhotoHint')}
                    </p>
                    {newWedding.couplePhotoUrl && (
                      <div className="mt-2">
                        <img
                          src={newWedding.couplePhotoUrl}
                          alt={t('adminDashboard.previewAlt')}
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setNewWedding({...newWedding, couplePhotoUrl: ''})}
                          className="text-red-500 text-sm mt-1 hover:underline block"
                        >
                          {t('adminDashboard.removePhoto')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {t('adminDashboard.backgroundMusicLabel')}
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      {newWedding.template === 'birthday' ? t('adminDashboard.backgroundMusicHintBirthday') : t('adminDashboard.backgroundMusicHintWedding')}
                    </p>
                    {newWedding.backgroundMusicUrl && (
                      <div className="mb-2">
                        <audio
                          controls
                          className="w-full"
                          src={newWedding.backgroundMusicUrl}
                        >
                          {t('adminDashboard.audioNotSupported')}
                        </audio>
                          <button
                            type="button"
                            onClick={() => setNewWedding({...newWedding, backgroundMusicUrl: ''})}
                            className="text-red-500 text-sm hover:underline block mb-2"
                          >
                            {t('adminDashboard.removeMusic')}
                        </button>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleBackgroundMusicUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button 
                    className="wedding-button"
                    onClick={handleCreateWedding}
                    disabled={createWeddingMutation.isPending}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {createWeddingMutation.isPending ? t('adminDashboard.creating') : (newWedding.template === 'birthday' ? t('adminDashboard.createBirthdayEvent') : t('adminDashboard.createEvent'))}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-200"
                    onClick={handleResetForm}
                  >
                    {t('adminDashboard.clearForm')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guest Book Management */}
          <TabsContent value="guestbook" className="space-y-6">
            <Card className="wedding-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                  <MessageSquare className="h-5 w-5 text-[#D4B08C]" />
                  {t('adminDashboard.guestBookManagement')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weddings.map((wedding) => (
                    <div key={wedding.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-[#2C3338]">
                            {wedding.bride} & {wedding.groom}
                          </h3>
                          <p className="text-sm text-[#2C3338]/70">
                            /{wedding.uniqueUrl}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('adminDashboard.viewEvent')}
                        </Button>
                      </div>
                      <AdminGuestBookManager weddingId={wedding.id} />
                    </div>
                  ))}
                  {weddings.length === 0 && (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      {t('adminDashboard.noEventsCreateFirst')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}