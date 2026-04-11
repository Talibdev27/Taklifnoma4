import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'admin' | 'guest_manager')[];
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['user', 'admin'], 
  redirectTo = '/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to login if authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      setLocation(redirectTo);
      return;
    }

    // Check role-based access if user is authenticated
    if (isAuthenticated && user && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        // SECURITY FIX: Safe redirect based on user role without admin escalation
        if (user.role === 'guest_manager') {
          setLocation('/guest-manager');
        } else if (user.role === 'user') {
          setLocation('/dashboard');
        } else {
          // For any unknown roles, send to landing page
          setLocation('/');
        }
        return;
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, requireAuth, setLocation, user?.role, allowedRoles.join(',')]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-romantic-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  // Don't render content if user doesn't have access
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (isAuthenticated && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// SECURITY: Admin-only protection component with server-side verification
interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        // Check if we have admin token
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          setLocation('/admin/login');
          return;
        }

        // Verify admin token with server
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        if (response.ok) {
          setIsAdminVerified(true);
        } else {
          // Invalid admin token, clear localStorage and redirect
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          setLocation('/admin/login');
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setLocation('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdminAccess();
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
        <p className="ml-4 text-gray-600">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdminVerified) {
    return null;
  }

  return <>{children}</>;
}