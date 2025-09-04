import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute, AdminProtectedRoute } from '@/components/protected-route';
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import CreateWedding from "@/pages/create-wedding";
import GetStarted from "@/pages/get-started";
import { ProgressiveOnboarding } from "@/components/progressive-onboarding";
// import GuestWeddingView from "@/pages/guest-wedding-view";
import UserDashboard from "@/pages/user-dashboard";
import WeddingSite from "@/pages/wedding-site";
import AdminDashboard from "@/pages/admin-dashboard-new";
import AdminLogin from "@/pages/admin-login";
import AdminWeddingEdit from "@/pages/admin-wedding-edit";
import WeddingManage from "@/pages/wedding-manage";
import UserLogin from "@/pages/user-login";
import DemoWedding from "@/pages/demo-wedding";
import Payment from "@/pages/payment";
import PaymentSuccess from "@/pages/payment-success";
import RestrictedGuestManagerDashboard from "@/pages/restricted-guest-manager-dashboard";

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
      <Route path="/guest-manager" component={RestrictedGuestManagerDashboard} />



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