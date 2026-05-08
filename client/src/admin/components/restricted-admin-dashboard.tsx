import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Users,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Wedding, User } from '@shared/schema';

import { SidebarLayout } from '@/admin/components/saas/sidebar-layout';
import { PageHeader } from '@/admin/components/saas/page-header';
import { SectionNav, type SectionNavItem } from '@/admin/components/saas/section-nav';
import { SectionCard } from '@/admin/components/saas/section-card';
import { StatCard } from '@/admin/components/saas/stat-card';
import { EmptyState } from '@/admin/components/saas/empty-state';
import { WeddingCard, type WeddingCardData } from '@/admin/components/saas/wedding-card';
import { GuestManagerGuestBook } from './guest-manager-guest-book';

interface RestrictedAdminDashboardProps {
  user: User;
}

type SectionId = 'weddings' | 'guestbook';

/**
 * Guest-manager dashboard.
 *
 * Mounted at /guest-manager and shown when a user with role === 'guest_manager'
 * signs in. The product distinction vs. the regular UserDashboard is scope:
 *   - Regular users see the weddings *they own* (`/api/user/weddings`)
 *   - Guest managers see weddings *they were assigned* (`/api/guest-manager/weddings`)
 *     and can only manage guests + read the guest book — never edit details.
 *
 * UI is intentionally identical to UserDashboard so guest managers and end-users
 * share one mental model. The only differences are:
 *   - Two sections via SectionNav (Weddings / Guest book) instead of a global grid
 *   - A reduced stat row (no "Public" or "Active" since they don't manage approval)
 *   - WeddingCards link to /manage/<url> like the owner flow but the underlying
 *     Manage page already restricts guest managers to the Guests section
 */
export function RestrictedAdminDashboard({ user }: RestrictedAdminDashboardProps) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId>('weddings');
  const [search, setSearch] = useState('');

  const { data: weddings = [], isLoading } = useQuery<Wedding[]>({
    queryKey: ['/api/guest-manager/weddings'],
  });

  /* ── Derived stats ───────────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = weddings.length;
    const upcoming = weddings.filter(
      (w) => new Date(w.weddingDate) >= new Date(),
    ).length;
    const past = total - upcoming;
    return { total, upcoming, past };
  }, [weddings]);

  /* ── Filtered list for search ────────────────────────────────── */
  const filteredWeddings = useMemo(() => {
    if (!search.trim()) return weddings;
    const q = search.trim().toLowerCase();
    return weddings.filter((w: any) =>
      `${w.bride} ${w.groom} ${w.venue || ''}`.toLowerCase().includes(q),
    );
  }, [weddings, search]);

  /* ── Sidebar nav ─────────────────────────────────────────────── */
  const sidebarNavItems = [
    {
      href: '/guest-manager',
      label: t('guestManager.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
    },
  ];

  /* ── Section nav ─────────────────────────────────────────────── */
  const sections: SectionNavItem[] = [
    {
      id: 'weddings',
      label: t('guestManager.weddingManagement', 'Wedding management'),
      description: t('guestManager.manageAssignedWeddings', 'Manage assigned guest lists'),
      icon: Calendar,
      badge: weddings.length || undefined,
    },
    {
      id: 'guestbook',
      label: t('guestManager.guestBookManagement', 'Guest book'),
      description: t('guestManager.manageGuestBook', 'Read messages from guests'),
      icon: MessageSquare,
    },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  /* ── Greeting based on local time ────────────────────────────── */
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning', 'Good morning');
    if (h < 18) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  })();
  const firstName = (user.name || '').split(' ')[0];

  return (
    <SidebarLayout
      user={user}
      navItems={sidebarNavItems}
      onSignOut={handleSignOut}
      t={t as any}
    >
      {/* ── Page header ───────────────────────────────────────── */}
      <PageHeader
        eyebrow={greeting}
        title={
          firstName
            ? `${t('guestManager.welcomeBack', 'Welcome back')}, ${firstName}`
            : t('guestManager.welcomeBack', 'Welcome back')
        }
        description={t(
          'guestManager.welcomeSubtitle',
          'Track your assigned weddings and respond to guest book messages.',
        )}
      />

      {/* ── Stats ────────────────────────────────────────────── */}
      <section className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label={t('guestManager.assignedWeddings', 'Assigned')}
          value={stats.total}
          icon={Calendar}
          accent="indigo"
          loading={isLoading}
          hint={t('guestManager.assignedHint', 'Weddings you can manage')}
        />
        <StatCard
          label={t('guestManager.upcoming', 'Upcoming')}
          value={stats.upcoming}
          icon={Users}
          accent="emerald"
          loading={isLoading}
          hint={t('guestManager.upcomingHint', 'Coming up — keep guests on track')}
        />
        <StatCard
          label={t('guestManager.past', 'Past events')}
          value={stats.past}
          icon={MessageSquare}
          accent="slate"
          loading={isLoading}
          hint={t('guestManager.pastHint', 'Already celebrated')}
        />
      </section>

      {/* ── Two-column body: section nav + active section ─────── */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="md:sticky md:top-24">
            <SectionNav
              items={sections}
              value={activeSection}
              onChange={(id) => setActiveSection(id as SectionId)}
            />
          </div>
        </aside>

        <div className="md:col-span-9 lg:col-span-9 min-w-0 space-y-6">
          {/* ── WEDDINGS ─────────────────────────────────── */}
          {activeSection === 'weddings' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
                    {t('guestManager.assignedWeddings', 'Assigned weddings')}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {weddings.length === 0
                      ? t('guestManager.noAssignedWeddings', 'No assigned weddings')
                      : `${weddings.length} ${
                          weddings.length === 1
                            ? t('dashboard.siteSingular', 'wedding')
                            : t('guestManager.weddingsPlural', 'weddings')
                        }`}
                  </p>
                </div>
                {weddings.length > 0 && (
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder={t('dashboard.searchPlaceholder', 'Search by names or venue…')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white"
                    />
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
                      <div className="h-3 w-24 bg-slate-100 rounded" />
                      <div className="mt-4 h-5 w-2/3 bg-slate-100 rounded" />
                      <div className="mt-2 h-3 w-1/2 bg-slate-100 rounded" />
                      <div className="mt-6 space-y-2">
                        <div className="h-3 w-3/4 bg-slate-100 rounded" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded" />
                      </div>
                      <div className="mt-6 flex gap-2">
                        <div className="h-8 flex-1 bg-slate-100 rounded" />
                        <div className="h-8 flex-1 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : weddings.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title={t('guestManager.noAssignedWeddings', 'No assigned weddings')}
                  description={t(
                    'guestManager.noAssignedWeddingsDesc',
                    "An admin needs to assign weddings to your account before they appear here.",
                  )}
                />
              ) : filteredWeddings.length === 0 ? (
                <EmptyState
                  compact
                  icon={Search}
                  title={t('dashboard.noSearchResults', 'No matches')}
                  description={t(
                    'dashboard.noSearchResultsHint',
                    'Try a different name, venue, or template.',
                  )}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredWeddings.map((w: any) => (
                    <WeddingCard
                      key={w.id}
                      wedding={w as WeddingCardData}
                      variant="guest-manager"
                      t={t as any}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── GUEST BOOK ───────────────────────────────── */}
          {activeSection === 'guestbook' && (
            <div className="space-y-6">
              {weddings.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title={t('guestManager.noAssignedWeddings', 'No assigned weddings')}
                  description={t(
                    'guestManager.guestBookEmpty',
                    'Once a wedding is assigned to you, its guest book messages appear here.',
                  )}
                />
              ) : (
                weddings.map((w: any) => (
                  <SectionCard
                    key={w.id}
                    title={`${w.bride} & ${w.groom}`}
                    description={
                      <span className="inline-flex items-center gap-3">
                        <span>{new Date(w.weddingDate).toLocaleDateString()}</span>
                        {w.venue && <span>· {w.venue}</span>}
                      </span>
                    }
                  >
                    <GuestManagerGuestBook weddingId={w.id} />
                  </SectionCard>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
