import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestrictedAdminDashboard } from "@/admin/components/restricted-admin-dashboard";
import type { User } from "@shared/schema";

/**
 * Route guard for /guest-manager.
 *
 * Verifies the authenticated user has role === 'guest_manager' and routes
 * everyone else away (admins shouldn't land here, regular users go to their
 * dashboard, unauthenticated users go to login).
 *
 * Visual chrome (loader, access-denied) matches the SaaS design system used
 * in UserDashboard and WeddingManage so the experience feels cohesive across
 * all three pages.
 */
export default function RestrictedGuestManagerDashboard() {
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  const { t } = useTranslation();

  const { data: currentUser, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    if (error || !currentUser) {
      setHasRedirected(true);
      setLocation('/login');
      return;
    }

    if (currentUser.role !== 'guest_manager') {
      setHasRedirected(true);
      // Guest managers never go to admin areas; everyone else to user dashboard
      // or landing page depending on role.
      if (currentUser.role === 'user') {
        setLocation('/dashboard');
      } else {
        setLocation('/');
      }
    }
  }, [currentUser, isLoading, error, setLocation, hasRedirected]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center"
        style={{
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="mt-4 text-sm text-slate-600">
            {t('manage.verifyingAccess', 'Verifying access permissions…')}
          </p>
        </div>
      </div>
    );
  }

  if (error || !currentUser || currentUser.role !== 'guest_manager') {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center px-4"
        style={{
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-rose-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
            {t('manage.accessDenied', 'Access denied')}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {t('guestManager.noPermission', "You don't have permission to access this page.")}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => setLocation('/login')}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t('auth.goToLogin', 'Go to login')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <RestrictedAdminDashboard user={currentUser} />;
}
