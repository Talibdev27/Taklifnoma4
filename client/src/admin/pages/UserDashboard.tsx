import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';
import { differenceInCalendarDays, isFuture } from 'date-fns';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Globe,
  Plus,
  Sparkles,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import type { User } from '@shared/schema';

import { SidebarLayout } from '@/admin/components/saas/sidebar-layout';
import { PageHeader } from '@/admin/components/saas/page-header';
import { StatCard } from '@/admin/components/saas/stat-card';
import { EmptyState } from '@/admin/components/saas/empty-state';
import { WeddingCard, type WeddingCardData } from '@/admin/components/saas/wedding-card';

interface Wedding extends WeddingCardData {}

/**
 * The user-facing dashboard.
 *
 * Anatomy:
 *   ┌─────────────────────────────────────────────────────┐
 *   │ Sidebar │ Topbar (lang, user menu)                  │
 *   │         ├───────────────────────────────────────────┤
 *   │  Nav    │ Greeting + primary CTA                    │
 *   │         │ Stat row (4 cards)                        │
 *   │         │ Section header + search                   │
 *   │         │ Wedding grid (or empty state)             │
 *   │         │ Quick links footer                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * Stats are derived purely from the existing weddings list — no new API
 * calls are needed. If the product later exposes RSVP totals or guest
 * counts at the user level, they slot directly into the StatCard row.
 */
export default function UserDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/current'],
  });

  const { data: weddings = [], isLoading } = useQuery<Wedding[]>({
    queryKey: ['/api/user/weddings'],
  });

  // Guest managers go to a different home
  useEffect(() => {
    if (currentUser && (currentUser as any).role === 'guest_manager') {
      navigate('/guest-manager');
    }
  }, [currentUser, navigate]);

  /* ── Derived stats — pure functions of the wedding list ─────── */
  const stats = useMemo(() => {
    const total = weddings.length;
    const active = weddings.filter((w) => w.isApproved).length;
    const upcoming = weddings.filter(
      (w) => isFuture(new Date(w.weddingDate)),
    ).length;
    const publicCount = weddings.filter((w) => w.isPublic).length;

    /** Soonest upcoming wedding — surfaced prominently when present. */
    const nextUp = [...weddings]
      .filter((w) => isFuture(new Date(w.weddingDate)))
      .sort(
        (a, b) =>
          new Date(a.weddingDate).getTime() - new Date(b.weddingDate).getTime(),
      )[0];
    const daysToNext = nextUp
      ? differenceInCalendarDays(new Date(nextUp.weddingDate), new Date())
      : null;

    return { total, active, upcoming, publicCount, nextUp, daysToNext };
  }, [weddings]);

  /* ── Search filter ──────────────────────────────────────────── */
  const filteredWeddings = useMemo(() => {
    if (!search.trim()) return weddings;
    const q = search.trim().toLowerCase();
    return weddings.filter((w) =>
      `${w.bride} ${w.groom} ${w.venue}`.toLowerCase().includes(q),
    );
  }, [weddings, search]);

  /* ── Sidebar nav ────────────────────────────────────────────── */
  // Sidebar nav — kept minimal. The wedding list is the dashboard's
  // main content, so a separate "Wedding sites" entry would just point
  // back at the same screen.
  const navItems = [
    {
      href: '/dashboard',
      label: t('nav.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
    },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  /* Best-effort greeting based on local time. */
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning', 'Good morning');
    if (h < 18) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  })();
  const firstName = (currentUser?.name || '').split(' ')[0];

  return (
    <SidebarLayout
      user={currentUser ?? null}
      navItems={navItems}
      onSignOut={handleSignOut}
      t={t as any}
      primaryCta={{
        label: t('dashboard.createNewWebsite', 'New wedding site'),
        href: '/get-started',
      }}
    >
      {/* ── Page header ───────────────────────────────────────── */}
      <PageHeader
        eyebrow={greeting}
        title={
          firstName
            ? `${t('dashboard.welcome', 'Welcome back')}, ${firstName}`
            : t('dashboard.welcome', 'Welcome back')
        }
        description={t(
          'dashboard.welcomeSubtitle',
          'Track your wedding sites, manage RSVPs, and keep your guests in the loop.',
        )}
        actions={
          <Link href="/get-started">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('dashboard.createNewWebsite', 'New site')}
            </Button>
          </Link>
        }
      />

      {/* ── Stat row ──────────────────────────────────────────── */}
      <section className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t('dashboard.totalSites', 'Total sites')}
          value={stats.total}
          icon={Calendar}
          accent="indigo"
          loading={isLoading}
          hint={
            stats.total === 0
              ? t('dashboard.noSitesHint', 'Create your first one below')
              : t('dashboard.allYourSites', 'All your wedding pages')
          }
        />
        <StatCard
          label={t('dashboard.activeSites', 'Active')}
          value={stats.active}
          icon={Sparkles}
          accent="emerald"
          loading={isLoading}
          hint={
            stats.total - stats.active > 0
              ? `${stats.total - stats.active} ${t('dashboard.pending', 'pending review')}`
              : t('dashboard.allLive', 'All sites are live')
          }
        />
        <StatCard
          label={t('dashboard.upcoming', 'Upcoming events')}
          value={stats.upcoming}
          icon={Calendar}
          accent="amber"
          loading={isLoading}
          hint={
            stats.daysToNext !== null
              ? stats.daysToNext === 0
                ? t('dashboard.today', 'Today!')
                : `${t('dashboard.nextIn', 'Next in')} ${stats.daysToNext} ${t('dashboard.daysShort', 'days')}`
              : t('dashboard.noUpcoming', 'No upcoming events')
          }
        />
        <StatCard
          label={t('dashboard.publicCount', 'Public')}
          value={stats.publicCount}
          icon={Globe}
          accent="slate"
          loading={isLoading}
          hint={t('dashboard.visibleToGuests', 'Visible to guests')}
        />
      </section>

      {/* ── Spotlight: next upcoming wedding ──────────────────── */}
      {stats.nextUp && (
        <section className="mt-6 sm:mt-8 rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/60 via-white to-violet-50/40 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600">
                {t('dashboard.nextEvent', 'Up next')}
              </p>
              <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight truncate">
                {stats.nextUp.bride} &amp; {stats.nextUp.groom}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {stats.daysToNext === 0
                  ? t('dashboard.todayCelebrate', 'Today is the day! 🎉')
                  : stats.daysToNext === 1
                  ? t('dashboard.tomorrowCelebrate', 'Tomorrow — make sure everything is set')
                  : `${stats.daysToNext} ${t('dashboard.daysToGoOptimistic', 'days to go')}`}
                {stats.nextUp.venue ? ` · ${stats.nextUp.venue}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href={`/manage/${stats.nextUp.uniqueUrl}`}>
                <Button variant="outline" className="bg-white">
                  {t('dashboard.manage', 'Manage')}
                </Button>
              </Link>
              <Link href={`/wedding/${stats.nextUp.uniqueUrl}`}>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  {t('dashboard.view', 'View site')}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Wedding grid ──────────────────────────────────────── */}
      <section className="mt-8 sm:mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              {t('dashboard.yourSites', 'Your wedding sites')}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {weddings.length === 0
                ? t('dashboard.noSitesYet', "You don't have any sites yet")
                : `${weddings.length} ${
                    weddings.length === 1
                      ? t('dashboard.siteSingular', 'site')
                      : t('dashboard.sitePlural', 'sites')
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
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
              >
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
            title={t('dashboard.noWeddingsYet', "You haven't created a site yet")}
            description={t(
              'dashboard.createFirstWebsite',
              "Spin up a beautiful wedding page in minutes — pick a template, add your details, and you're ready to invite guests.",
            )}
            action={
              <Link href="/get-started">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-1.5" />
                  {t('dashboard.createYourFirst', 'Create your first site')}
                </Button>
              </Link>
            }
            secondaryAction={
              <a
                href="https://t.me/takliflink"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">
                  {t('dashboard.contactSupport', 'Talk to us')}
                </Button>
              </a>
            }
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
            action={
              <Button variant="outline" onClick={() => setSearch('')}>
                {t('dashboard.clearSearch', 'Clear search')}
              </Button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredWeddings.map((w) => (
              <WeddingCard key={w.id} wedding={w} t={t as any} />
            ))}
          </div>
        )}
      </section>
    </SidebarLayout>
  );
}
