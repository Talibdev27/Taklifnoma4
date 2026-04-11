import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute, AdminProtectedRoute } from '@/shared/components/protected-route';

// Website (Public) Pages
import NotFound from "@/website/pages/NotFound";
import Landing from "@/website/pages/Landing";
import WeddingSite from "@/website/pages/WeddingSite";
import DemoWedding from "@/website/pages/DemoWedding";

// Admin Pages
import AdminDashboard from "@/admin/pages/AdminDashboard";
import AdminLogin from "@/admin/pages/AdminLogin";
import AdminWeddingEdit from "@/admin/pages/WeddingEdit";
import WeddingManage from "@/admin/pages/WeddingManage";
import UserDashboard from "@/admin/pages/UserDashboard";
import CreateWedding from "@/admin/pages/CreateWedding";
import GuestManagerDashboard from "@/admin/pages/GuestManagerDashboard";

// Admin Components
import { ProgressiveOnboarding } from "@/admin/components/progressive-onboarding";

// Shared Pages
import UserLogin from "@/shared/pages/UserLogin";
import GetStarted from "@/shared/pages/GetStarted";
import Payment from "@/shared/pages/Payment";
import PaymentSuccess from "@/shared/pages/PaymentSuccess";

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Landing} />

      {/* User authentication */}
      <Route path="/login" component={UserLogin} />
      <Route path="/register" component={UserLogin} />

      {/* User Dashboard - restricted to users and admins only */}
      <Route path="/dashboard">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <UserDashboard />
        </ProtectedRoute>
      </Route>

      {/* Enhanced Progressive Onboarding - restricted to users and admins */}
      <Route path="/get-started">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <ProgressiveOnboarding />
        </ProtectedRoute>
      </Route>

      {/* Legacy registration (backup) - restricted to users and admins */}
      <Route path="/get-started-legacy">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <GetStarted />
        </ProtectedRoute>
      </Route>

      {/* Payment flow - restricted to users and admins */}
      <Route path="/payment">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <Payment />
        </ProtectedRoute>
      </Route>
      <Route path="/payment-success">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <PaymentSuccess />
        </ProtectedRoute>
      </Route>

      {/* Wedding creation flow - restricted to users and admins only */}
      <Route path="/create-wedding">
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <CreateWedding />
        </ProtectedRoute>
      </Route>

      {/* Demo wedding site */}
      <Route path="/demo" component={DemoWedding} />

      {/* Individual wedding sites */}
      <Route path="/wedding/:uniqueUrl" component={WeddingSite} />

      {/* User dashboard */}
      <Route path="/dashboard" component={UserDashboard} />
      
              {/* Event management for owners - guest_managers can view/manage guests only */}
      <Route path="/manage/:uniqueUrl" component={WeddingManage} />

      {/* SECURITY: Admin routes now properly protected */}
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/wedding/:weddingUrl">
        <AdminProtectedRoute>
          <AdminWeddingEdit />
        </AdminProtectedRoute>
      </Route>
      <Route path="/admin/weddings/:weddingUrl/edit">
        <AdminProtectedRoute>
          <AdminWeddingEdit />
        </AdminProtectedRoute>
      </Route>

      {/* Legacy admin routes - also protected */}
      <Route path="/system/auth" component={AdminLogin} />
      <Route path="/system/dashboard">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>

      {/* Restricted Guest Manager Dashboard */}
      <Route path="/guest-manager" component={GuestManagerDashboard} />



      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
          <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </I18nextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;