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
  Eye, Trash2, Edit, BarChart3, Globe, LogOut, Images, UserPlus, Clock
} from "lucide-react";
import type { Wedding, User, Guest, Photo } from "@shared/schema";
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { GuestManagerAssignment } from '@/admin/components/guest-manager-assignment';
import { AdminGuestBookManager } from '@/admin/components/admin-guest-book-manager';
import { TEMPLATE_REGISTRY, EVENT_TYPES } from '@/lib/templates';

export default function AdminDashboard() {
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
    template: 'standard',
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
          title: "Rasm muvaffaqiyatli yuklandi",
          description: "Juftlik rasmi yuklandi va asosiy sifatida ishlatiladi."
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Yuklash xatosi",
        description: "Rasmni yuklab bo'lmadi. Qaytadan urinib ko'ring.",
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
        title: "Fayl turi noto'g'ri",
        description: "Iltimos, audio faylini yuklang (MP3, WAV va h.k.).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fayl juda katta",
        description: "Iltimos, 10MB dan kichik fayl yuklang.",
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
          title: "Musiqa muvaffaqiyatli yuklandi",
          description: "Fon musiqasi yuklandi va to'y saytida ijro etiladi."
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Yuklash xatosi",
        description: "Fon musiqasini yuklab bo'lmadi. Qaytadan urinib ko'ring.",
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
        title: "Tadbir yaratildi",
        description: "Tadbir muvaffaqiyatli yaratildi.",
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
        template: 'standard',
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
        title: "Yaratish xatosi",
        description: error.message || "Tadbir yaratib bo'lmadi.",
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
        title: "Tadbir o'chirildi",
        description: "Tadbir muvaffaqiyatli o'chirildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      setWeddingToDelete(null);
    },
    onError: () => {
      toast({
        title: "O'chirish xatosi",
        description: "Tadbirni o'chirib bo'lmadi.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteWedding = (weddingId: number) => {
    if (confirm("Ushbu tadbirni o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.")) {
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
        title: variables.isApproved ? "Tadbir tasdiqlandi" : "Tasdiqlash bekor qilindi",
        description: variables.isApproved 
          ? "Tadbir veb-sayti endi barcha uchun ko'rinadi." 
          : "Tadbir veb-sayti endi ko'rinmaydi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/weddings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: "Tasdiqlash xatosi",
        description: "Tasdiqlash holatini o'zgartirib bo'lmadi.",
        variant: "destructive",
      });
    },
  });

  const handleToggleApproval = (weddingId: number, currentStatus: boolean) => {
    const action = currentStatus ? "tasdiqlanganligini bekor qilish" : "tasdiqlash";
    if (confirm(`Ushbu tadbirni ${action}ni xohlaysizmi?`)) {
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
        title: "Foydalanuvchi yangilandi",
        description: "Foydalanuvchi huquqlari muvaffaqiyatli yangilandi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: () => {
      toast({
        title: "Yangilash xatosi",
        description: "Foydalanuvchi huquqlarini yangilab bo'lmadi.",
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
        title: "Foydalanuvchi o'chirildi",
        description: "Foydalanuvchi muvaffaqiyatli o'chirildi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: () => {
      toast({
        title: "O'chirish xatosi",
        description: "Foydalanuvchini o'chirib bo'lmadi.",
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
    if (!newWedding.userId) errors.push("Foydalanuvchi ID");
    if (!newWedding.bride?.trim()) {
      errors.push(newWedding.template === 'birthday' ? "Tug'ilgan kun egasining ismi" : "Kelinning ismi");
    }
    if (!newWedding.weddingDate) {
      errors.push(newWedding.template === 'birthday' ? "Tug'ilgan kun sanasi" : "To'y sanasi");
    }

    if (errors.length > 0) {
      toast({
        title: "Maydonlar to'ldirilmagan",
        description: `Quyidagi majburiy maydonlarni to'ldiring: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Validate date format
    const dateObj = new Date(newWedding.weddingDate);
    if (isNaN(dateObj.getTime())) {
      toast({
        title: "Sana noto'g'ri",
        description: newWedding.template === 'birthday' ? "Iltimos, to'g'ri tug'ilgan kun sanasini kiriting." : "Iltimos, to'g'ri to'y sanasini kiriting.",
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
      template: 'standard',
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
    if (confirm("Ushbu foydalanuvchini o'chirishni xohlaysizmi? Uning barcha tadbirlari ham o'chiriladi va bu amalni qaytarib bo'lmaydi.")) {
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
                  Admin Panel
                </h1>
                <p className="text-xs sm:text-sm text-[#2C3338]/70 hidden sm:block">Taklifnoma platformasi boshqaruvi</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-[#2C3338] border-[#2C3338] hover:bg-[#2C3338] hover:text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 min-h-[44px] sm:min-h-[36px]"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Chiqish</span>
              <span className="sm:hidden">Chiqish</span>
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
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Jami tadbirlar</p>
            </CardContent>
          </Card>

          <Card className="wedding-card border-amber-200 bg-amber-50">
            <CardContent className="p-3 sm:p-6 text-center">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-amber-900">
                {weddings?.filter((w: Wedding) => !w.isApproved).length || 0}
              </p>
              <p className="text-amber-900/70 text-xs sm:text-sm">Kutilmoqda</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-[#89916B] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.totalUsers || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Foydalanuvchilar</p>
              <p className="text-xs text-[#2C3338]/50 hidden sm:block">({stats?.guestUsers || 0} mehmon akkaunt)</p>
            </CardContent>
          </Card>

          <Card className="wedding-card">
            <CardContent className="p-3 sm:p-6 text-center">
              <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-[#D4B08C] mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-[#2C3338]">{stats?.publicWeddings || 0}</p>
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Ochiq tadbirlar</p>
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
              <p className="text-[#2C3338]/70 text-xs sm:text-sm">Kelgusi tadbirlar</p>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-Optimized Management Tabs */}
        <Tabs defaultValue="weddings" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto p-1">
                          <TabsTrigger value="weddings" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Tadbirlar</span>
                <span className="sm:hidden">Tadbirlar</span>
              </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Foydalanuvchilar</span>
              <span className="sm:hidden">Foydalanuvchi</span>
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">RSVP boshqaruvi</span>
              <span className="sm:hidden">RSVP</span>
            </TabsTrigger>
                          <TabsTrigger value="create" className="text-xs sm:text-sm p-2 sm:p-3">
                <span className="hidden sm:inline">Tadbir yaratish</span>
                <span className="sm:hidden">Yaratish</span>
              </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Statistika</span>
              <span className="sm:hidden">Stat</span>
            </TabsTrigger>
            <TabsTrigger value="guestbook" className="text-xs sm:text-sm p-2 sm:p-3">
              <span className="hidden sm:inline">Mehmon kitobi</span>
              <span className="sm:hidden">Kitob</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile-Optimized Weddings Management */}
          <TabsContent value="weddings" className="space-y-4 sm:space-y-6">
            <Card className="wedding-card">
              <CardHeader className="pb-3 sm:pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-[#2C3338]">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-[#D4B08C]" />
                    Barcha tadbirlar
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Tadbirlarni qidirish..."
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
                                  {wedding.isPublic ? 'Ochiq' : 'Yopiq'}
                                </Badge>
                                <Badge 
                                  variant={wedding.isApproved ? "default" : "destructive"} 
                                  className={`text-xs ${wedding.isApproved ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                                >
                                  {wedding.isApproved ? '✓ Tasdiqlangan' : '⏳ Kutilmoqda'}
                                </Badge>
                                <span className="text-xs text-[#2C3338]/50 truncate max-w-[100px] sm:max-w-none">
                                  /{wedding.uniqueUrl}
                                </span>
                                {weddingOwner && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate max-w-[120px] sm:max-w-none">
                                    Egasi: {weddingOwner.email}
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
                              title={wedding.isApproved ? "Tasdiqni bekor qilish" : "Tasdiqlash"}
                            >
                              {wedding.isApproved ? (
                                <>
                                  <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">Tasdiqlangan</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">Tasdiqlash</span>
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
                              <span className="ml-1 text-xs sm:hidden">Ko'rish</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/admin/weddings/${wedding.uniqueUrl}/edit`)}
                              className="min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">Tahrirlash</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWedding(wedding.id)}
                              disabled={deleteWeddingMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 min-h-[44px] sm:min-h-[36px] p-2"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 text-xs sm:hidden">O'chirish</span>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="min-h-[44px] sm:min-h-[36px] p-2">
                                  <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="ml-1 text-xs sm:hidden">Mehmon menejer belgilash</span>
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
                        {searchTerm ? 'Qidiruv bo\'yicha tadbir topilmadi.' : 'Hali hech qanday tadbir yaratilmagan.'}
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
                    Barcha foydalanuvchilar
                  </CardTitle>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Foydalanuvchilarni qidirish..."
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
                            <h3 className="font-semibold text-[#2C3338]">{user.name || 'Noma\'lum foydalanuvchi'}</h3>
                            <p className="text-sm text-[#2C3338]/70">{user.email || 'Email yo\'q'}</p>
                            <p className="text-xs text-[#2C3338]/50">
                              Qo'shilgan: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Noma\'lum'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {weddings?.filter((w: Wedding) => w.userId === user.id).length || 0} tadbir
                          </Badge>
                          <Badge variant={
                            user.isAdmin ? "default" : 
                            user.role === 'guest_manager' ? "destructive" : "secondary"
                          }>
                            {user.isAdmin ? "Admin" : 
                             user.role === 'guest_manager' ? "Mehmon menejer" : "Foydalanuvchi"}
                          </Badge>
                          {user.role === 'guest_manager' && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              Cheklangan kirish
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id, !user.isAdmin)}
                            disabled={updateUserMutation.isPending || user.role === 'guest_manager'}
                            className="text-xs"
                          >
                            {user.isAdmin ? "Adminni olib tashlash" : "Admin qilish"}
                          </Button>
                          <Button
                            variant={user.role === 'guest_manager' ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRestrictUser(user.id, user.role !== 'guest_manager')}
                            disabled={updateUserMutation.isPending || user.isAdmin}
                            className="text-xs"
                          >
                            {user.role === 'guest_manager' ? "Cheklovni olib tashlash" : "Kirishni cheklash"}
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
                        {searchTerm ? 'Qidiruv bo\'yicha foydalanuvchi topilmadi.' : 'Hali hech qanday foydalanuvchi ro\'yxatdan o\'tmagan.'}
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
                    To'y bo'yicha RSVP boshqaruvi
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
                        <span className="text-sm font-medium text-green-700">Tasdiqlangan</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 mt-1">{rsvpStats?.confirmedRSVPs || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-700">Kutilmoqda</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">{rsvpStats?.pendingRSVPs || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-red-700">Rad etilgan</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600 mt-1">{rsvpStats?.declinedRSVPs || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-700">Ehtimol</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{rsvpStats?.maybeRSVPs || 0}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <h3 className="font-semibold text-[#2C3338] mb-4">To'y bo'yicha RSVP javoblari</h3>
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
                                    <div className="text-xs text-green-600 font-medium">Tasdiqlangan</div>
                                    <div className="text-lg font-bold text-green-600">{confirmedGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-yellow-600 font-medium">Kutilmoqda</div>
                                    <div className="text-lg font-bold text-yellow-600">{pendingGuests.length}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-red-600 font-medium">Rad etilgan</div>
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
                                    Boshqarish
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
                                          <h5 className="font-medium text-[#2C3338]">{guest.name || 'Mehmon'}</h5>
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
                                  Bu to'y uchun hali RSVP javoblari yo'q.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      Tadbirlar topilmadi.
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
                    To'y statistikasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">Bu oy</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {weddings?.filter((w: Wedding) => {
                        const weddingMonth = new Date(w.createdAt).getMonth();
                        const currentMonth = new Date().getMonth();
                        return weddingMonth === currentMonth;
                      }).length || 0} yangi
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">Ochiq tadbirlar</span>
                    <Badge className="bg-green-100 text-green-800">
                      {Math.round(((weddings?.filter((w: Wedding) => w.isPublic).length || 0) / (weddings?.length || 1)) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#2C3338]/70">Foydalanuvchi boshiga o'rtacha</span>
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
                    Kelgusi tadbirlar
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
                          {Math.ceil((new Date(wedding.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} kun
                        </Badge>
                      </div>
                    )) || (
                    <div className="text-center py-4 text-[#2C3338]/70 text-sm">
                      Kelgusi tadbirlar yo'q
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
                  {newWedding.template === 'birthday' ? 'Yangi tug\'ilgan kun tadbirini yaratish' : 'Yangi tadbir yaratish'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Foydalanuvchini tanlang
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.userId}
                        onChange={(e) => handleFormChange('userId', e.target.value)}
                      >
                        <option value="">Foydalanuvchini tanlang...</option>
                        {users?.filter((u: User) => !u.email.includes('guest_')).map((user: User) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? "Tug'ilgan kun egasining ismi" : "Kelin ismi"}
                      </label>
                      <Input 
                        placeholder={newWedding.template === 'birthday' ? "Tug'ilgan kun egasining ismini kiriting" : "Kelin ismini kiriting"} 
                        className="wedding-input"
                        value={newWedding.bride}
                        onChange={(e) => handleFormChange('bride', e.target.value)}
                      />
                    </div>

                    {/* Only show groom field for non-birthday templates */}
                    {newWedding.template !== 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Kuyovning ismi
                        </label>
                        <Input 
                          placeholder="Kuyovning ismini kiriting" 
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
                            Necha yosh to'lishi
                          </label>
                          <Input 
                            placeholder="Masalan: 25, 30, 16" 
                            className="wedding-input"
                            value={newWedding.age}
                            onChange={(e) => handleFormChange('age', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#2C3338] mb-2">
                            Bayram mavzusi (Ixtiyoriy)
                          </label>
                          <Input 
                            placeholder="Masalan: Tropik, Superpahlavon, Vintage..." 
                            className="wedding-input"
                            value={newWedding.partyTheme}
                            onChange={(e) => handleFormChange('partyTheme', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? "Tug'ilgan kun sanasi" : "Tadbir sanasi"}
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
                        {newWedding.template === 'birthday' ? "Bayram vaqti" : "Tadbir vaqti"}
                      </label>
                      <Input 
                        placeholder="Mas: 18:00, 6:00 PM" 
                        className="wedding-input"
                        value={newWedding.weddingTime}
                        onChange={(e) => handleFormChange('weddingTime', e.target.value)}
                      />
                    </div>

                    {/* Birthday-specific deadline */}
                    {newWedding.template === 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          RSVP muddati (Ixtiyoriy)
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
                        {newWedding.template === 'birthday' ? "Bayram joyi" : "Tadbir joyi"}
                      </label>
                      <Input 
                        placeholder={newWedding.template === 'birthday' ? "Tug'ilgan kun bayram joyi" : "Tadbir joyi"} 
                        className="wedding-input"
                        value={newWedding.venue}
                        onChange={(e) => handleFormChange('venue', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        {newWedding.template === 'birthday' ? "Bayram manzili" : "Tadbir manzili"}
                      </label>
                      <Input 
                        placeholder={newWedding.template === 'birthday' ? "To'liq bayram manzili" : "To'liq tadbir manzili"} 
                        className="wedding-input"
                        value={newWedding.venueAddress}
                        onChange={(e) => handleFormChange('venueAddress', e.target.value)}
                      />
                    </div>

                    {/* Birthday-specific contact person */}
                    {newWedding.template === 'birthday' && (
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Savollar uchun bog'lanish
                        </label>
                        <Input 
                          placeholder="Mas: Ali Valiyev - 99-123-45-67" 
                          className="wedding-input"
                          value={newWedding.contactPerson}
                          onChange={(e) => handleFormChange('contactPerson', e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Kiyinish tartibi (Ixtiyoriy)
                      </label>
                      <textarea 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                        rows={3}
                        placeholder={newWedding.template === 'birthday' ? "Mas: Erkin kiyim, Bayram kiyimi, Rang mavzusi..." : "Mas: Rasmiy kiyim, Cocktail, Yengil kiyim..."}
                        value={newWedding.dressCode || ''}
                        onChange={(e) => handleFormChange('dressCode', e.target.value)}
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        {newWedding.template === 'birthday' ? "Mehmonlar uchun kiyinish talablari. Faqat to'ldirilsa ko'rsatiladi." : "Mehmonlar uchun kiyinish talablari. Faqat to'ldirilsa ko'rsatiladi."}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Tadbir turi
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.eventType}
                        onChange={(e) => {
                          handleFormChange('eventType', e.target.value);
                          // Reset template to first available for new event type
                          const firstTemplate = TEMPLATE_REGISTRY[e.target.value as keyof typeof TEMPLATE_REGISTRY][0].value;
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
                        Shablon
                      </label>
                      <select 
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.template}
                        onChange={(e) => handleFormChange('template', e.target.value)}
                      >
                        {TEMPLATE_REGISTRY[newWedding.eventType as keyof typeof TEMPLATE_REGISTRY].map(template => (
                          <option key={template.value} value={template.value}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        RSVP rejimi
                      </label>
                      <select
                        className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                        value={newWedding.rsvpMode}
                        onChange={(e) => handleFormChange('rsvpMode', e.target.value)}
                      >
                        <option value="both">Ikkalasi ham (Qo'lda kiritish + Oldindan ro'yxat)</option>
                        <option value="manual">Faqat qo'lda kiritish (Mehmon kitobi)</option>
                        <option value="preregistered">Faqat oldindan ro'yxatdan o'tganlar</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {newWedding.rsvpMode === 'both' && 'Mehmonlar ismini qo\'lda kiritishi yoki oldindan ro\'yxatdan qidirishi mumkin'}
                        {newWedding.rsvpMode === 'manual' && 'Mehmonlar ismini qo\'lda kiritadi. Oldindan ro\'yxat kerak emas.'}
                        {newWedding.rsvpMode === 'preregistered' && 'Mehmonlar faqat oldindan ro\'yxatda bo\'lsa RSVP qila oladi.'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#2C3338] mb-2">
                        Standart til
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
                        Bu {newWedding.template === 'birthday' ? 'tug\'ilgan kun' : 'tadbir'} sayti uchun standart til bo'ladi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Birthday-specific additional fields */}
                {newWedding.template === 'birthday' && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold text-[#2C3338] border-b border-gray-200 pb-2">
                      Tug'ilgan kun bayram tafsilotlari
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Sovg'a ro'yxati (Ixtiyoriy)
                        </label>
                        <textarea 
                          className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                          rows={3}
                          placeholder="Mas: Amazon wishlist havolasi, afzal sovg'alar, sovg'a kerak emas..."
                          value={newWedding.giftRegistryInfo}
                          onChange={(e) => handleFormChange('giftRegistryInfo', e.target.value)}
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Maxsus ko'rsatmalar (Ixtiyoriy)
                        </label>
                        <textarea 
                          className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                          rows={3}
                          placeholder="Mas: Nima olib kelish, to'xtash joyi, allergiyalar..."
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
                      <h4 className="text-sm font-semibold text-pink-700">Tug'ilgan kun shablon xususiyatlari</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">🎂 Tug'ilgan kun dizayni — pushti/binafsha gradientlar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">🎉 Animatsiyali tug'ilgan kun elementlari</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">📅 Tug'ilgan kungacha sanash taymer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">🎵 Fon musiqasi avtomatik ijro bilan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">💌 Tabriklar uchun mehmon kitobi</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                        <span className="text-sm text-gray-700">🌍 Ko'p tillilik (5 ta til)</span>
                      </div>
                    </div>
                  </div>
                )}

                {newWedding.template === 'epic' && (
                  <div className="space-y-4 p-4 border border-blue-200 rounded-lg bg-blue-50/30 mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="text-sm font-semibold text-blue-700">Epic shablon ranglari</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Asosiy rang
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
                        <p className="text-xs text-gray-500 mt-1">Asosiy elementlar va taymer uchun ishlatiladi</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#2C3338] mb-2">
                          Qo'shimcha rang
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
                        <p className="text-xs text-gray-500 mt-1">Tugmalar va ajratishlar uchun ishlatiladi</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Story and Messages */}
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? "Tug'ilgan kun egasi haqida" : "Tadbir tarixi (Ixtiyoriy)"}
                    </label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                      rows={4}
                                              placeholder={newWedding.template === 'birthday' ? "Tug'ilgan kun egasi haqida yozing..." : "Tadbir tarixi haqida yozing..."}
                      value={newWedding.story}
                      onChange={(e) => handleFormChange('story', e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? "Bayram tafsilotlari" : "Tadbir tafsilotlari"}
                    </label>
                    <textarea 
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white resize-none" 
                      rows={4}
                                              placeholder={newWedding.template === 'birthday' ? "Bayram tafsilotlarini yozing..." : "Tadbir tafsilotlari yoki xush kelibsiz xabarini yozing..."}
                      value={newWedding.dearGuestMessage}
                      onChange={(e) => handleFormChange('dearGuestMessage', e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                      {newWedding.template === 'birthday' ? "Bu xabar tug'ilgan kun bayram bo'limida ko'rsatiladi" : '"Aziz mehmonlar" bo\'limida ko\'rsatiladigan xabar'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      {newWedding.template === 'birthday' ? "Tug'ilgan kun egasi rasmi (Ixtiyoriy)" : "Tadbir rasmi (Ixtiyoriy)"}
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleCouplePhotoUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newWedding.template === 'birthday' ? "Shablon fonini almashtirish uchun tug'ilgan kun egasi rasmini yuklang" : "Shablon fonini almashtirish uchun tadbir rasmini yuklang"}
                    </p>
                    {newWedding.couplePhotoUrl && (
                      <div className="mt-2">
                        <img 
                          src={newWedding.couplePhotoUrl} 
                          alt="Ko'rinish" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button 
                          type="button"
                          onClick={() => setNewWedding({...newWedding, couplePhotoUrl: ''})}
                          className="text-red-500 text-sm mt-1 hover:underline block"
                        >
                          Rasmni olib tashlash
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#2C3338] mb-2">
                      Fon musiqasi (Ixtiyoriy)
                    </label>
                    <p className="text-xs text-gray-500 mb-1">
                      {newWedding.template === 'birthday' ? "Bayram saytida ijro bo'ladigan fon musiqasini yuklang (MP3, WAV). Max 10MB." : "To'y saytida ijro bo'ladigan fon musiqasini yuklang (MP3, WAV). Max 10MB."}
                    </p>
                    {newWedding.backgroundMusicUrl && (
                      <div className="mb-2">
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
                            className="text-red-500 text-sm hover:underline block mb-2"
                          >
                            Musiqani olib tashlash
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
                    {createWeddingMutation.isPending ? 'Yaratilmoqda...' : (newWedding.template === 'birthday' ? 'Tug\'ilgan kun tadbirini yaratish' : 'Tadbir yaratish')}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-gray-200"
                    onClick={handleResetForm}
                  >
                    Formni tozalash
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
                  Guest Book boshqaruvi
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
                          Tadbirni ko'rish
                        </Button>
                      </div>
                      <AdminGuestBookManager weddingId={wedding.id} />
                    </div>
                  ))}
                  {weddings.length === 0 && (
                    <div className="text-center py-8 text-[#2C3338]/70">
                      Tadbirlar topilmadi. Mehmon kitobi yozuvlarini boshqarish uchun avval tadbir yarating.
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