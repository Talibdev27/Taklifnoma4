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
import { 
  Users, Calendar, Camera, MessageSquare, Settings,
  TrendingUp, Heart, MapPin, Mail, Shield, Search,
  Eye, Trash2, Edit, BarChart3, Globe, LogOut, Images, UserPlus
} from "lucide-react";
import type { Wedding, User, Guest, Photo } from "@shared/schema";
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { GuestManagerAssignment } from '@/components/guest-manager-assignment';
import { AdminGuestBookManager } from '@/components/admin-guest-book-manager';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [weddingToDelete, setWeddingToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  // Create wedding form state
  const [newWedding, setNewWedding] = useState({
    userId: '',
    bride: '',
    groom: '',
    weddingDate: '',
    weddingTime: '18:00',
    venue: '',
    venueAddress: '',
    template: 'standard',
    story: '',
    dearGuestMessage: '',
    couplePhotoUrl: '',
    backgroundMusicUrl: '',
    dressCode: '',
    defaultLanguage: 'en',
    primaryColor: '#1976d2',
    accentColor: '#1565c0'
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
          title: "Photo uploaded successfully",
          description: "Couple photo has been uploaded and will be used as the hero image."
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload couple photo. Please try again.",
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
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc.).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
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
          title: "Music uploaded successfully",
          description: "Background music has been uploaded and will play on the wedding site."
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload background music. Please try again.",
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
      if (!weddingData.userId || !weddingData.bride || !weddingData.groom || !weddingData.weddingDate) {
        throw new Error('Please fill in all required fields');
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
        throw new Error(errorData.message || 'Failed to create wedding');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Wedding Created",
        description: "Wedding has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      // Reset form
      setNewWedding({
        userId: '',
        bride: '',
        groom: '',
        weddingDate: '',
        weddingTime: '18:00',
        venue: '',
        venueAddress: '',
        template: 'standard',
        story: '',
        dearGuestMessage: '',
        couplePhotoUrl: '',
        backgroundMusicUrl: '',
        dressCode: '',
        defaultLanguage: 'uz',
        primaryColor: '#1976d2',
        accentColor: '#1565c0'
      });
    },
    onError: (error: any) => {
      console.error("Wedding creation error:", error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create wedding.",
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
        title: "Wedding Deleted",
        description: "Wedding has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setWeddingToDelete(null);
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete wedding.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteWedding = (weddingId: number) => {
    if (confirm("Are you sure you want to delete this wedding? This action cannot be undone.")) {
      deleteWeddingMutation.mutate(weddingId);
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
        title: "User Updated",
        description: "User privileges updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user privileges.",
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
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete user.",
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
        title: "Photo Deleted",
        description: "Photo has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete photo.",
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
        title: "Photo Added",
        description: "Photo has been successfully added.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/photos'] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to add photo.",
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
    if (!newWedding.userId) errors.push("User ID");
    if (!newWedding.bride?.trim()) errors.push("Bride's Name");
    if (!newWedding.groom?.trim()) errors.push("Groom's Name");
    if (!newWedding.weddingDate) errors.push("Wedding Date");

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in the following required fields: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate date format
    const dateObj = new Date(newWedding.weddingDate);
    if (isNaN(dateObj.getTime())) {
      toast({
        title: "Invalid Date",
        description: "Please enter a valid wedding date.",
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
      bride: '',
      groom: '',
      weddingDate: '',
      weddingTime: '18:00',
      venue: '',
      venueAddress: '',
      dressCode: '',
      template: 'standard',
      story: '',
      dearGuestMessage: '',
      couplePhotoUrl: '',
      backgroundMusicUrl: '',
      defaultLanguage: 'en',
      primaryColor: '#1976d2',
      accentColor: '#1565c0'
    });
  };

  const handleToggleAdmin = (userId: number, isAdmin: boolean) => {
    if (confirm(`Are you sure you want to ${isAdmin ? 'grant admin privileges to' : 'remove admin privileges from'} this user?`)) {
      updateUserMutation.mutate({ userId, updates: { isAdmin } });
    }
  };

  const handleRestrictUser = (userId: number, restricted: boolean) => {
    const action = restricted ? 'restrict to guest management only' : 'remove restrictions from';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
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
    if (confirm("Are you sure you want to delete this user? This will also delete all their weddings and cannot be undone.")) {
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
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-[#2C3338]/70 hidden sm:block">Wedding Platform Management</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-[#2C3338] border-[#2C3338] hover:bg-[#2C3338] hover:text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 min-h-[44px] sm:min-h-[36px]"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* Mobile-Optimized System Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4B08C] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats.totalWeddings || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Total Weddings</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#89916B] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.totalUsers || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Real Users</p>
              <p className="text-xs text-[#2C3338]/50 hidden sm:block">({stats?.guestUsers || 0} guest accounts)</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4B08C] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.publicWeddings || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Public Weddings</p>
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
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Upcoming Weddings</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Management Tabs */}
        <Tabs defaultValue="weddings" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger value="weddings" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Wedding Management</span>
              <span className="sm:hidden">Weddings</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">User Management</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">RSVP Management</span>
              <span className="sm:hidden">RSVP</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Create Wedding</span>
              <span className="sm:hidden">Create</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="guestbook" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Guest Book</span>
              <span className="sm:hidden">Book</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-Optimized Weddings Management */}
          <TabsContent value="weddings" className="space-y-4 sm:space-y-6">
            <Card className="wedding-card">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4B08C]" />
                    All Weddings
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search weddings..."
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
                                {wedding.bride} & {wedding.groom}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#2C3338]/70 truncate">
                                📍 {wedding.venue} • 📅 {new Date(wedding.weddingDate).toLocaleDateString()}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                <Badge variant={wedding.isPublic ? "default" : "secondary"} className="text-xs">
                                  {wedding.isPublic ? 'Public' : 'Private'}
                                </Badge>
                                <span className="text-xs text-[#2C3338]/50 truncate max-w-[100px] sm:max-w-none">
                                  /{wedding.uniqueUrl}
                                </span>
                                {weddingOwner && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-none">
                                    Owner: {weddingOwner.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
                              className="min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">View</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/weddings/${wedding.uniqueUrl}/edit`)}
                              className="min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWedding(wedding.id)}
                              disabled={deleteWeddingMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">Del</span>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[36px] p-2">
                                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">Assign Guest Manager</span>
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
                        {searchTerm ? 'No weddings found matching your search.' : 'No weddings created yet.'}
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
                    All Users
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search users..."
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
                            <h3 className="font-semibold text-[#2C3338]">{user.name || 'Unknown User'}</h3>
                            <p className="text-sm text-[#2C3338]/70">{user.email || 'No email'}</p>
                            <p className="text-xs text-[#2C3338]/50">
                              Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {weddings?.filter((w: Wedding) => w.userId === user.id).length || 0} weddings
                          </Badge>
                          <Badge variant={
                            user.isAdmin ? "default" : 
                            user.role === 'guest_manager' ? "destructive" : "secondary"
                          }>
                            {user.isAdmin ? "Admin" : 
                             user.role === 'guest_manager' ? "Guest Manager" : "User"}
                          </Badge>
                          {user.role === 'guest_manager' && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              Restricted Access
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id, !user.isAdmin)}
                            disabled={updateUserMutation.isPending || user.role === 'guest_manager'}
                            className="text-xs"
                          >
                            {user.isAdmin ? "Remove Admin" : "Make Admin"}
                          </Button>
                          <Button
                            variant={user.role === 'guest_manager' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRestrictUser(user.id, user.role !== 'guest_manager')}
                            disabled={updateUserMutation.isPending || user.isAdmin}
                            className="text-xs"
                          >
                            {user.role === 'guest_manager' ? "Remove Restrictions" : "Restrict Access"}
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
                        {searchTerm ? 'No users found matching your search.' : 'No users registered yet.'}
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
                    RSVP Management by Wedding
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
                        <span className="text-sm font-medium text-green-700">Confirmed</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-1">{rsvpStats?.confirmedRSVPs || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-700">Pending</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{rsvpStats?.pendingRSVPs || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">Declined</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600 mt-1">{rsvpStats?.declinedRSVPs || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700">Maybe</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{rsvpStats?.maybeRSVPs || 0}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <h3 className="font-semibold text-[#2C3338] mb-4">RSVPs Organized by Wedding</h3>
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
                                    <div className="text-xs text-green-600 font-medium">Confirmed</div>
                                    <div className="text-lg font-bold text-green-600">{confirmedGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-yellow-600 font-medium">Pending</div>
                                    <div className="text-lg font-bold text-yellow-600">{pendingGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-red-600 font-medium">Declined</div>
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
                                    Manage
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
                                          <h5 className="font-medium text-[#2C3338]">{guest.name || 'Guest'}</h5>
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
                                          {guest.rsvpStatus?.charAt(0).toUpperCase() + guest.rsvpStatus?.slice(1) || 'Unknown'}
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
                                  No RSVP responses for this wedding yet.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      No weddings found.
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
                    Wedding Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">This Month</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {weddings?.filter((w: Wedding) => {
                        const weddingMonth = new Date(w.createdAt).getMonth();
                        const currentMonth = new Date().getMonth();
                        return weddingMonth === currentMonth;
                      }).length || 0} new
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">Public Weddings</span>
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round(((weddings?.filter((w: Wedding) => w.isPublic).length || 0) / (weddings?.length || 1)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">Average per User</span>
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
                    Upcoming Events
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
                          {Math.ceil((new Date(wedding.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </div>
                    )) || (
                    <div className="text-center py-4 text-[#2C3338]/70 text-sm">
                      No upcoming weddings
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
                  Create New Wedding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Select User
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.userId}
                        onChange={(e) => handleFormChange('userId', e.target.value)}
                      >
                        <option value="">Choose a user...</option>
                        {users?.filter((u: User) => !u.email.includes('guest_')).map((user: User) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Bride's Name
                      </label>
                      <Input 
                        placeholder="Enter bride's name" 
                        className="wedding-input"
                        value={newWedding.bride}
                        onChange={(e) => handleFormChange('bride', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Groom's Name
                      </label>
                      <Input 
                        placeholder="Enter groom's name" 
                        className="wedding-input"
                        value={newWedding.groom}
                        onChange={(e) => handleFormChange('groom', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Wedding Date
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
                        Ceremony Time
                      </label>
                      <Input 
                        placeholder="e.g., 18:00, 6:00 PM" 
                        className="wedding-input"
                        value={newWedding.weddingTime}
                        onChange={(e) => handleFormChange('weddingTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Venue
                      </label>
                      <Input 
                        placeholder="Wedding venue" 
                        className="wedding-input"
                        value={newWedding.venue}
                        onChange={(e) => handleFormChange('venue', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Venue Address
                      </label>
                      <Input 
                        placeholder="Full venue address" 
                        className="wedding-input"
                        value={newWedding.venueAddress}
                        onChange={(e) => handleFormChange('venueAddress', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Dress Code (Optional)
                      </label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                        rows={3}
                        placeholder="e.g., Formal attire, Cocktail dress, Beach casual..."
                        value={newWedding.dressCode || ''}
                        onChange={(e) => handleFormChange('dressCode', e.target.value)}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        Specify attire expectations for guests. Only shows if filled.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Template
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.template}
                        onChange={(e) => handleFormChange('template', e.target.value)}
                      >
                        <option value="standard">Standard</option>
                        <option value="epic">Epic</option>
                        <option value="gardenRomance">Garden Romance</option>
                        <option value="modernElegance">Modern Elegance</option>
                        <option value="rusticCharm">Rustic Charm</option>
                        <option value="beachBliss">Beach Bliss</option>
                        <option value="classicTradition">Classic Tradition</option>
                        <option value="bohoChic">Boho Chic</option>
                      </select>
                    </div>

                    {/* Epic Template Color Customization */}
                    {newWedding.template === 'epic' && (
                      <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-blue-700">Epic Template Colors</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[#2C3338] mb-2">
                              Primary Color
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
                            <p className="text-xs text-gray-500 mt-1">Used for main elements and countdown</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#2C3338] mb-2">
                              Accent Color
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
                            <p className="text-xs text-gray-500 mt-1">Used for buttons and highlights</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                          <div className="text-sm">
                            <span className="font-medium text-blue-700">Preview:</span>
                            <span className="ml-2 text-gray-600">Colors will be applied to your Epic template</span>
                          </div>
                          <div className="flex space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: newWedding.primaryColor }}
                            ></div>
                            <div 
                              className="w-6 h-6 rounded-full border border-white shadow-sm"
                              style={{ backgroundColor: newWedding.accentColor }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Default Language
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
                        This will be the default language for the wedding website
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Dear Guest Message
                      </label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                        rows={4}
                        placeholder="Write a welcome message for guests..."
                        value={newWedding.dearGuestMessage}
                        onChange={(e) => handleFormChange('dearGuestMessage', e.target.value)}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        This message will appear in the "Dear Guests" section of the wedding website
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Couple Photo (Optional)
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleCouplePhotoUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a couple photo to use as the hero image instead of template background
                      </p>
                      {newWedding.couplePhotoUrl && (
                        <div className="mt-2">
                          <img 
                            src={newWedding.couplePhotoUrl} 
                            alt="Preview" 
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <button 
                            type="button"
                            onClick={() => setNewWedding({...newWedding, couplePhotoUrl: ''})}
                            className="text-red-500 text-sm mt-1 hover:underline block"
                          >
                            Remove photo
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Background Music (Optional)
                      </label>
                      <Input
                        type="file"
                        accept="audio/*"
                        onChange={handleBackgroundMusicUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload background music (MP3, WAV) that will play on the wedding site. Max 10MB.
                      </p>
                      {newWedding.backgroundMusicUrl && (
                        <div className="mt-2">
                          <audio 
                            controls 
                            className="w-full"
                            src={newWedding.backgroundMusicUrl}
                          >
                            Your browser does not support the audio element.
                          </audio>
                          <button 
                            type="button"
                            onClick={() => setNewWedding({...newWedding, backgroundMusicUrl: ''})}
                            className="text-red-500 text-sm mt-1 hover:underline block"
                          >
                            Remove music
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Love Story (Optional)
                      </label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                        rows={3}
                        placeholder="Tell their love story..."
                        value={newWedding.story}
                        onChange={(e) => handleFormChange('story', e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button 
                    className="wedding-button"
                    onClick={handleCreateWedding}
                    disabled={createWeddingMutation.isPending}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {createWeddingMutation.isPending ? 'Creating...' : 'Create Wedding'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-200"
                    onClick={handleResetForm}
                  >
                    Reset Form
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
                  Guest Book Management
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
                          View Wedding
                        </Button>
                      </div>
                      <AdminGuestBookManager weddingId={wedding.id} />
                    </div>
                  ))}
                  {weddings.length === 0 && (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      No weddings found. Create a wedding first to manage guest book entries.
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