import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, Link } from 'wouter';
import { differenceInCalendarDays, format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Heart,
  Calendar,
  MapPin,
  Users,
  Camera,
  MessageSquare,
  Settings as SettingsIcon,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Sparkles,
  LayoutDashboard,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { SidebarLayout } from '@/admin/components/saas/sidebar-layout';
import { PageHeader } from '@/admin/components/saas/page-header';
import { SectionNav, type SectionNavItem } from '@/admin/components/saas/section-nav';
import { SectionCard } from '@/admin/components/saas/section-card';
import { StatCard } from '@/admin/components/saas/stat-card';

import { PersonalizedGuestDashboard } from '@/admin/components/personalized-guest-dashboard';
import { MobileGuestManager } from '@/admin/components/mobile-guest-manager';
import { GuestBookManager } from '@/website/components/guest-book-manager';
import { CouplePhotoUpload } from '@/admin/components/couple-photo-upload';
import { MemoryPhotosManager } from '@/admin/components/saas/memory-photos-manager';

import type { Wedding, Photo, Guest } from '@shared/schema';

/* ── Section ids ─────────────────────────────────────────────────────── */
type SectionId =
  | 'overview'
  | 'details'
  | 'settings'
  | 'guests'
  | 'rsvps'
  | 'guestbook'
  | 'photos';

/* ── Loading shell ───────────────────────────────────────────────────── */
function FullPageLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        <p className="mt-4 text-sm text-slate-600">{label}</p>
      </div>
    </div>
  );
}

/* ── Access-denied / not-found shells ────────────────────────────────── */
function CenteredMessage({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-rose-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="mt-6">{action}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * MANAGE PAGE
 * ════════════════════════════════════════════════════════════════════════ */
export default function WeddingManage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const weddingUrl = params.uniqueUrl as string;

  /* ── Section state ─────────────────────────────────────────────── */
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  /* ── Wedding form state — only modified fields are tracked ─────── */
  const [formData, setFormData] = useState<Partial<Wedding>>({});
  const [linkCopied, setLinkCopied] = useState(false);

  /* ── Auth + data queries (preserved from original logic) ──────── */
  const { data: currentUser, isLoading: authLoading } = useQuery<any>({
    queryKey: ['/api/user/current'],
    queryFn: () => fetch('/api/user/current').then((res) => res.json()),
  });

  const { data: wedding, isLoading: weddingLoading } = useQuery<Wedding>({
    queryKey: [`/api/weddings/url/${weddingUrl}`],
    enabled: !!weddingUrl,
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: [`/api/photos/wedding/${wedding?.id}`],
    enabled: !!wedding?.id,
  });

  const { data: guests = [] } = useQuery<Guest[]>({
    queryKey: wedding?.id ? [`/api/guests/wedding/${wedding.id}`] : [],
    enabled: !!wedding?.id,
  });

  /* ── Guest-manager localStorage cleanup (preserved) ─────────────── */
  useEffect(() => {
    if (currentUser?.role === 'guest_manager') {
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
    }
  }, [currentUser?.role]);

  /* ── Force language to wedding default (preserved) ──────────────── */
  useEffect(() => {
    if (wedding?.defaultLanguage) {
      i18n.changeLanguage(wedding.defaultLanguage);
    } else if (currentUser?.role === 'guest_manager') {
      i18n.changeLanguage('uz');
    }
  }, [wedding?.defaultLanguage, currentUser?.role, i18n]);

  /* ── Permission gate (preserved logic) ──────────────────────────── */
  const isOwner = !!(currentUser && wedding && wedding.userId === currentUser.id);
  const isAdmin = !!(
    currentUser &&
    (currentUser.isAdmin === true || currentUser.role === 'admin')
  );

  const { data: userWeddingAccess, isLoading: weddingAccessLoading, error: weddingAccessError } = useQuery({
    queryKey: ['/api/user/wedding-access', currentUser?.id, wedding?.id],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/user/wedding-access/${currentUser?.id}/${wedding?.id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Access check failed: ${response.status}`);
      return response.json();
    },
    enabled: !!currentUser && !!wedding && currentUser.role === 'guest_manager' && !isAdmin,
    retry: false,
  });

  const hasGuestManagerAccess =
    currentUser?.role === 'guest_manager' && (userWeddingAccess || true);
  const hasAccess =
    isAdmin ||
    (currentUser?.role !== 'guest_manager' && isOwner) ||
    hasGuestManagerAccess;

  const isLoadingAccessData =
    weddingLoading ||
    (currentUser?.role === 'guest_manager' && weddingAccessLoading && !weddingAccessError);

  /* ── Update mutation (preserved + extended for settings) ────────── */
  const updateWeddingMutation = useMutation({
    mutationFn: async (updatedData: Partial<Wedding>) => {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (currentUser && (currentUser.isAdmin === true || currentUser.role === 'admin')) {
        headers['x-admin'] = 'true';
      }
      const response = await fetch(`/api/weddings/${wedding!.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error('Failed to update wedding');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/weddings/url/${weddingUrl}`] });
      setFormData({});
      toast({
        title: t('manage.savedTitle', 'Changes saved'),
        description: t('manage.savedDescription', 'Your wedding details are up to date.'),
      });
    },
    onError: () => {
      toast({
        title: t('manage.saveFailedTitle', 'Save failed'),
        description: t('manage.saveFailedDescription', "We couldn't save your changes. Try again."),
        variant: 'destructive',
      });
    },
  });

  /* ── Sidebar navigation (matches dashboard) ─────────────────────── */
  // Sidebar nav — keep minimal; the back-link in the page header
  // already provides the route back to the dashboard.
  const sidebarNavItems = [
    { href: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setLocation('/');
  };

  /* ── Helpers ────────────────────────────────────────────────────── */
  const setField = <K extends keyof Wedding>(key: K, value: Wedding[K] | string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const dirtyFields = Object.keys(formData);
  const isDirty = dirtyFields.length > 0;

  /** Resolves the displayed value for a field — prefers in-flight edits. */
  function value<K extends keyof Wedding>(key: K, fallback: any = ''): any {
    if (formData[key] !== undefined) return formData[key] as any;
    return (wedding?.[key] ?? fallback) as any;
  }

  const handleSave = () => {
    if (!isDirty) return;
    updateWeddingMutation.mutate(formData);
  };

  const handleDiscard = () => setFormData({});

  const handleCopyLink = async () => {
    if (!wedding) return;
    if (!wedding.isApproved) {
      toast({
        title: t('dashboard.approvalRequiredTitle', 'Site not yet approved'),
        description: t(
          'dashboard.approvalRequiredHint',
          'Available once your site is approved.',
        ),
      });
      return;
    }
    const url = `${window.location.origin}/wedding/${wedding.uniqueUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({
        title: t('dashboard.linkCopied', 'Link copied!'),
        description: url,
      });
    } catch {
      /* clipboard blocked — silently no-op */
    }
  };

  /* ── Aggregated guest stats for Overview + Guests cards ─────────── */
  const guestStats = useMemo(() => {
    if (!guests) return { total: 0, attending: 0, declined: 0, pending: 0 };
    const total = guests.length;
    const attending = guests.filter((g: any) => g.rsvpStatus === 'confirmed' || g.rsvpStatus === 'attending').length;
    const declined = guests.filter((g: any) => g.rsvpStatus === 'declined' || g.rsvpStatus === 'not_attending').length;
    const pending = total - attending - declined;
    return { total, attending, declined, pending };
  }, [guests]);

  const galleryPhotoCount = useMemo(
    () => photos.filter((p: any) => p.photoType === 'memory' || (!p.photoType && !p.isHero)).length,
    [photos],
  );

  /* ════════════════════════════════════════════════════════════════ */
  /* Early returns                                                    */
  /* ════════════════════════════════════════════════════════════════ */
  if (authLoading) {
    return <FullPageLoader label={t('manage.loadingAuth', 'Loading authentication…')} />;
  }
  if (isLoadingAccessData) {
    return (
      <FullPageLoader
        label={
          currentUser?.role === 'guest_manager'
            ? t('manage.verifyingAccess', 'Verifying access permissions…')
            : t('manage.loadingDetails', 'Loading wedding details…')
        }
      />
    );
  }
  if (!wedding) {
    return (
      <CenteredMessage
        icon={AlertCircle}
        title={t('manage.notFound', 'Wedding not found')}
        description={t(
          'manage.notFoundDescription',
          "The wedding you're looking for doesn't exist or has been removed.",
        )}
        action={
          <Button onClick={() => setLocation('/dashboard')} className="bg-slate-900 hover:bg-slate-800 text-white">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('manage.backToDashboard', 'Back to dashboard')}
          </Button>
        }
      />
    );
  }
  if (!currentUser) {
    return (
      <CenteredMessage
        icon={Lock}
        title={t('auth.loginRequired', 'Login required')}
        description={t('auth.pleaseLogin', 'Please sign in to access this page.')}
        action={
          <Button onClick={() => setLocation('/login')} className="bg-slate-900 hover:bg-slate-800 text-white">
            {t('auth.goToLogin', 'Go to login')}
          </Button>
        }
      />
    );
  }
  if (!hasAccess) {
    return (
      <CenteredMessage
        icon={Lock}
        title={t('manage.accessDenied', 'Access denied')}
        description={t('manage.noPermission', "You don't have permission to manage this wedding.")}
        action={
          <Button
            onClick={() => {
              if (currentUser.role === 'guest_manager') setLocation('/guest-manager');
              else if (currentUser.role === 'user') setLocation('/dashboard');
              else setLocation('/');
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {t('manage.backToDashboard', 'Back to dashboard')}
          </Button>
        }
      />
    );
  }

  /* ── Section catalogue ─────────────────────────────────────────── */
  const allSections: SectionNavItem[] = [
    {
      id: 'overview',
      label: t('manage.overview', 'Overview'),
      description: t('manage.overviewDesc', 'Site at a glance'),
      icon: LayoutDashboard,
    },
    {
      id: 'details',
      label: t('manage.details', 'Details'),
      description: t('manage.detailsDesc', 'Couple, date, venue, story'),
      icon: Heart,
    },
    {
      id: 'settings',
      label: t('manage.settings', 'Site settings'),
      description: t('manage.settingsDesc', 'Template, language, visibility'),
      icon: SettingsIcon,
    },
    {
      id: 'guests',
      label: t('manage.guestManagement', 'Guests'),
      description: t('manage.guestsDesc', 'Invite list & RSVPs'),
      icon: Users,
      badge: guestStats.total || undefined,
    },
    {
      id: 'rsvps',
      label: t('manage.rsvpAnalytics', 'RSVP analytics'),
      description: t('manage.rsvpDesc', 'Confirmation insights'),
      icon: BarChart3,
    },
    {
      id: 'guestbook',
      label: t('manage.guestBook', 'Guest book'),
      description: t('manage.guestbookDesc', 'Messages from guests'),
      icon: MessageSquare,
    },
    {
      id: 'photos',
      label: t('manage.photoManagement', 'Photos'),
      description: t('manage.photosDesc', 'Hero & gallery uploads'),
      icon: Camera,
      badge: galleryPhotoCount || undefined,
    },
  ];

  // Guest managers only see Guests
  const sections =
    currentUser?.role === 'guest_manager'
      ? allSections.filter((s) => s.id === 'guests')
      : allSections;

  /* When a guest manager loads the page, force the Guests section. */
  if (currentUser?.role === 'guest_manager' && activeSection !== 'guests') {
    setActiveSection('guests');
  }

  /* ── Wedding date countdown (used in Overview) ──────────────────── */
  const daysToWedding = wedding.weddingDate
    ? differenceInCalendarDays(new Date(wedding.weddingDate), new Date())
    : null;

  /* ════════════════════════════════════════════════════════════════ */
  /* RENDER                                                           */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <SidebarLayout
      user={currentUser}
      navItems={sidebarNavItems}
      onSignOut={handleSignOut}
      t={t as any}
      primaryCta={{
        label: t('dashboard.createNewWebsite', 'New site'),
        href: '/get-started',
      }}
    >
      {/* ── Page header ────────────────────────────────────────── */}
      <PageHeader
        eyebrow={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 hover:text-indigo-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            {t('manage.allSites', 'All sites')}
          </Link>
        }
        title={
          <span className="flex items-center gap-3 flex-wrap">
            <span>
              {wedding.bride} <span className="text-slate-400 font-normal">&amp;</span> {wedding.groom}
            </span>
            {wedding.isApproved ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3" />
                {t('dashboard.statusActive', 'Active')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                <Clock className="w-3 h-3" />
                {t('dashboard.statusPending', 'Pending review')}
              </span>
            )}
          </span>
        }
        description={
          <span className="inline-flex items-center gap-3 flex-wrap text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {wedding.weddingDate ? format(new Date(wedding.weddingDate), 'PPP') : t('details.dateTBD', 'Date TBD')}
            </span>
            {wedding.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {wedding.venue}
              </span>
            )}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!wedding.isApproved}
              title={
                !wedding.isApproved
                  ? t('dashboard.approvalRequiredHint', 'Available once your site is approved.')
                  : undefined
              }
              className="bg-white"
            >
              {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {linkCopied ? t('dashboard.linkCopied', 'Copied!') : t('dashboard.copyLink', 'Copy link')}
            </Button>
            <Button
              size="sm"
              onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
              disabled={!wedding.isApproved}
              title={
                !wedding.isApproved
                  ? t('dashboard.approvalRequiredHint', 'Available once your site is approved.')
                  : undefined
              }
              className="bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              {t('manage.viewSite', 'View site')}
            </Button>
          </>
        }
      />

      {/* ── 2-column layout: section nav + active section body ───── */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        {/* Sidebar nav (md+: 3 cols sticky / mobile: scroll-snap pills) */}
        <aside className="md:col-span-3 lg:col-span-3">
          <div className="md:sticky md:top-24">
            <SectionNav
              items={sections}
              value={activeSection}
              onChange={(id) => setActiveSection(id as SectionId)}
            />
          </div>
        </aside>

        {/* Active section body */}
        <div className="md:col-span-9 lg:col-span-9 min-w-0 space-y-6">
          {/* ──────────── OVERVIEW ──────────── */}
          {activeSection === 'overview' && (
            <>
              {!wedding.isApproved && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">
                      {t('manage.pendingApprovalTitle', 'Site pending review')}
                    </p>
                    <p className="text-amber-800 mt-0.5 leading-relaxed">
                      {t(
                        'dashboard.pendingApprovalMessage',
                        'Your site is awaiting admin approval. Usually takes up to 24 hours.',
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                  label={t('manage.guestsTotal', 'Total guests')}
                  value={guestStats.total}
                  icon={Users}
                  accent="indigo"
                />
                <StatCard
                  label={t('manage.attending', 'Attending')}
                  value={guestStats.attending}
                  icon={CheckCircle2}
                  accent="emerald"
                  hint={
                    guestStats.total > 0
                      ? `${Math.round((guestStats.attending / guestStats.total) * 100)}% ${t('manage.responseRate', 'of guests')}`
                      : undefined
                  }
                />
                <StatCard
                  label={t('manage.pendingRsvps', 'Pending')}
                  value={guestStats.pending}
                  icon={Clock}
                  accent="amber"
                  hint={t('manage.awaitingResponse', 'Awaiting response')}
                />
                <StatCard
                  label={t('manage.daysToGo', 'Days to go')}
                  value={daysToWedding !== null && daysToWedding >= 0 ? daysToWedding : '—'}
                  icon={Sparkles}
                  accent="rose"
                  hint={
                    daysToWedding === null
                      ? t('manage.noDateSet', 'No date set')
                      : daysToWedding < 0
                      ? t('dashboard.eventPassed', 'Event passed')
                      : daysToWedding === 0
                      ? t('manage.todayCelebrate', 'Today!')
                      : t('manage.untilWedding', 'Until your wedding')
                  }
                />
              </div>

              <SectionCard
                title={t('manage.shareYourSite', 'Share your site')}
                description={
                  wedding.isApproved
                    ? t(
                        'manage.shareSiteDesc',
                        'Send this link to your guests so they can RSVP and see the details.',
                      )
                    : t(
                        'manage.shareSiteDescPending',
                        'Sharing is locked while your site is awaiting admin approval.',
                      )
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className={`flex-1 min-w-0 px-3 py-2.5 rounded-md bg-slate-50 border border-slate-200 text-sm truncate ${wedding.isApproved ? 'text-slate-700 font-mono' : 'text-slate-400 italic'}`}>
                    {wedding.isApproved
                      ? `${window.location.origin}/wedding/${wedding.uniqueUrl}`
                      : t('manage.linkHiddenUntilApproved', 'Your site link will appear here once an admin approves it.')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      disabled={!wedding.isApproved}
                      className="shrink-0 bg-white"
                    >
                      {linkCopied ? (
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 mr-1.5" />
                      )}
                      {linkCopied ? t('dashboard.linkCopied', 'Copied!') : t('dashboard.copyLink', 'Copy')}
                    </Button>
                    <Button
                      onClick={() => window.open(`/wedding/${wedding.uniqueUrl}`, '_blank')}
                      disabled={!wedding.isApproved}
                      className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-1.5" />
                      {t('manage.openSite', 'Open')}
                    </Button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.quickActions', 'Quick actions')}
                description={t(
                  'manage.quickActionsDesc',
                  'Jump straight to the section you need.',
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'details', icon: Heart, label: t('manage.editDetails', 'Edit details') },
                    { id: 'guests', icon: Users, label: t('manage.manageGuests', 'Manage guests') },
                    { id: 'photos', icon: Camera, label: t('manage.uploadPhotos', 'Upload photos') },
                    { id: 'settings', icon: SettingsIcon, label: t('manage.changeTemplate', 'Change template') },
                  ].map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id as SectionId)}
                      className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium text-slate-900">{label}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* ──────────── DETAILS ──────────── */}
          {activeSection === 'details' && (
            <div className="space-y-6 pb-24">
              <SectionCard
                title={t('manage.coupleAndDate', 'Couple & date')}
                description={t('manage.coupleAndDateDesc', 'How your names and date appear across the site.')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="bride" className="text-sm font-medium text-slate-700">
                      {t('manage.brideName', "Bride's name")}
                    </Label>
                    <Input
                      id="bride"
                      value={value('bride')}
                      onChange={(e) => setField('bride', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="groom" className="text-sm font-medium text-slate-700">
                      {t('manage.groomName', "Groom's name")}
                    </Label>
                    <Input
                      id="groom"
                      value={value('groom')}
                      onChange={(e) => setField('groom', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weddingDate" className="text-sm font-medium text-slate-700">
                      {t('manage.weddingDate', 'Wedding date')}
                    </Label>
                    <Input
                      id="weddingDate"
                      type="date"
                      value={
                        value('weddingDate')
                          ? new Date(value('weddingDate')).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => setField('weddingDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weddingTime" className="text-sm font-medium text-slate-700">
                      {t('manage.weddingTime', 'Time')}
                    </Label>
                    <Input
                      id="weddingTime"
                      placeholder={t('manage.weddingTimePlaceholder', '3:00 PM')}
                      value={value('weddingTime')}
                      onChange={(e) => setField('weddingTime', e.target.value)}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.venueInformation', 'Venue')}
                description={t('manage.venueDesc', "Where you'll celebrate.")}
              >
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="venue" className="text-sm font-medium text-slate-700">
                      {t('manage.venue', 'Venue name')}
                    </Label>
                    <Input
                      id="venue"
                      value={value('venue')}
                      onChange={(e) => setField('venue', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="venueAddress" className="text-sm font-medium text-slate-700">
                      {t('manage.venueAddress', 'Address')}
                    </Label>
                    <Input
                      id="venueAddress"
                      value={value('venueAddress')}
                      onChange={(e) => setField('venueAddress', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      {t(
                        'manage.venueAddressHint',
                        'A clear address helps guests find the place — Google Maps link works too.',
                      )}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.storyAndMessage', 'Your story & message')}
                description={t(
                  'manage.storyDesc',
                  'These appear on your site to welcome guests and tell your story.',
                )}
              >
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="dearGuestMessage" className="text-sm font-medium text-slate-700">
                      {t('manage.dearGuestMessage', 'Dear-guest message')}
                    </Label>
                    <Textarea
                      id="dearGuestMessage"
                      rows={3}
                      placeholder={t('manage.dearGuestPlaceholder', 'A warm welcome line for guests…')}
                      value={value('dearGuestMessage')}
                      onChange={(e) => setField('dearGuestMessage', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="story" className="text-sm font-medium text-slate-700">
                      {t('manage.ourStory', 'Our story')}
                    </Label>
                    <Textarea
                      id="story"
                      rows={5}
                      placeholder={t('manage.storyPlaceholder', 'Tell your guests how you met…')}
                      value={value('story')}
                      onChange={(e) => setField('story', e.target.value)}
                    />
                    <p className="text-xs text-slate-500">
                      {t('manage.storyHint', 'Used in the Our Journey section. Plain text — line breaks are kept.')}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.couplePhoto', 'Couple photo')}
                description={t(
                  'manage.couplePhotoDesc',
                  "Upload a hero photo — it's the first thing guests see.",
                )}
                actions={
                  <button
                    type="button"
                    onClick={() => setActiveSection('photos')}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    {t('manage.manageGallery', 'Manage gallery')}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                }
              >
                <CouplePhotoUpload
                  weddingId={wedding.id}
                  currentPhotoUrl={wedding.couplePhotoUrl || undefined}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: [`/api/weddings/url/${weddingUrl}`],
                    });
                  }}
                />
              </SectionCard>

              {/* ── Sticky save bar — appears only when there are unsaved changes ─ */}
              {isDirty && (
                <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-8 lg:bottom-6 z-40 lg:max-w-lg lg:ml-auto animate-in slide-in-from-bottom-4 duration-200">
                  <div className="bg-slate-900 text-white rounded-xl shadow-2xl ring-1 ring-black/5 px-4 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <p className="text-sm flex-1">
                      {dirtyFields.length === 1
                        ? t('manage.unsavedSingle', '1 unsaved change')
                        : `${dirtyFields.length} ${t('manage.unsavedPlural', 'unsaved changes')}`}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDiscard}
                      disabled={updateWeddingMutation.isPending}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {t('manage.discard', 'Discard')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateWeddingMutation.isPending}
                      className="bg-white text-slate-900 hover:bg-slate-100"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {updateWeddingMutation.isPending
                        ? t('manage.saving', 'Saving…')
                        : t('manage.saveChanges', 'Save changes')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────── SETTINGS ──────────── */}
          {activeSection === 'settings' && (
            <div className="space-y-6 pb-24">
              <SectionCard
                title={t('manage.template', 'Template')}
                description={t(
                  'manage.templateDesc',
                  'Switch between visual styles. The change is live the moment you save.',
                )}
              >
                <div className="space-y-1.5 max-w-md">
                  <Label htmlFor="template" className="text-sm font-medium text-slate-700">
                    {t('manage.activeTemplate', 'Active template')}
                  </Label>
                  <Select
                    value={value('template') as string}
                    onValueChange={(v) => setField('template', v)}
                  >
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">{t('manage.templateModernLabel', 'Azamat (Modern) ⭐')}</SelectItem>
                      <SelectItem value="velvet">{t('templates.velvet', 'Velvet')}</SelectItem>
                      <SelectItem value="pearl">{t('templates.pearl', 'Pearl')}</SelectItem>
                      <SelectItem value="aurora">{t('templates.aurora', 'Aurora')}</SelectItem>
                      {/* Legacy templates — kept selectable only when the wedding
                         is currently using one, so the Select trigger doesn't
                         render an empty value. New users can't switch *into*
                         these from this dropdown; we want them to migrate to
                         one of the four supported templates above. */}
                      {value('template') === 'epic' && (
                        <SelectItem value="epic">{t('manage.templateEpicLegacy', 'Epic (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'flower' && (
                        <SelectItem value="flower">{t('manage.templateFlowerLegacy', 'Gul (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'gardenRomance' && (
                        <SelectItem value="gardenRomance">{t('manage.templateGardenRomanceLegacy', 'Garden Romance (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'modernElegance' && (
                        <SelectItem value="modernElegance">{t('manage.templateModernEleganceLegacy', 'Modern Elegance (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'rusticCharm' && (
                        <SelectItem value="rusticCharm">{t('manage.templateRusticCharmLegacy', 'Rustic Charm (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'beachBliss' && (
                        <SelectItem value="beachBliss">{t('manage.templateBeachBlissLegacy', 'Beach Bliss (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'classicTradition' && (
                        <SelectItem value="classicTradition">{t('manage.templateClassicTraditionLegacy', 'Classic Tradition (legacy)')}</SelectItem>
                      )}
                      {value('template') === 'bohoChic' && (
                        <SelectItem value="bohoChic">{t('manage.templateBohoChicLegacy', 'Boho Chic (legacy)')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.languageSettings', 'Language')}
                description={t(
                  'manage.languageDesc',
                  'The default language guests see on your site.',
                )}
              >
                <div className="space-y-1.5 max-w-md">
                  <Label htmlFor="defaultLanguage" className="text-sm font-medium text-slate-700">
                    {t('manage.defaultLanguage', 'Default language')}
                  </Label>
                  <Select
                    value={value('defaultLanguage') as string}
                    onValueChange={(v) => setField('defaultLanguage', v)}
                  >
                    <SelectTrigger id="defaultLanguage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uz">O'zbek</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="kk">Қазақша</SelectItem>
                      <SelectItem value="kaa">Qaraqalpaqsha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.visibility', 'Visibility')}
                description={t(
                  'manage.visibilityDesc',
                  'Public sites appear in search and accept RSVPs from anyone with the link.',
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      {value('isPublic') ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {value('isPublic')
                          ? t('manage.publicLabel', 'Public')
                          : t('manage.privateLabel', 'Private')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {value('isPublic')
                          ? t('manage.publicHint', 'Anyone with the link can view and RSVP.')
                          : t('manage.privateHint', 'Only invited guests can access it.')}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={!!value('isPublic')}
                    onCheckedChange={(checked) => setField('isPublic', checked)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title={t('manage.musicAndExtras', 'Music & extras')}
                description={t(
                  'manage.musicDesc',
                  'Optional URL to a song that plays in the background. Dress code is shown to guests.',
                )}
              >
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="backgroundMusicUrl" className="text-sm font-medium text-slate-700">
                      {t('manage.backgroundMusic', 'Background music URL')}
                    </Label>
                    <Input
                      id="backgroundMusicUrl"
                      type="url"
                      placeholder="https://example.com/song.mp3"
                      value={value('backgroundMusicUrl')}
                      onChange={(e) => setField('backgroundMusicUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dressCode" className="text-sm font-medium text-slate-700">
                      {t('manage.dressCode', 'Dress code')}
                    </Label>
                    <Input
                      id="dressCode"
                      placeholder={t('manage.dressCodePlaceholder', 'e.g., Black tie, garden formal')}
                      value={value('dressCode')}
                      onChange={(e) => setField('dressCode', e.target.value)}
                    />
                  </div>
                </div>
              </SectionCard>

              {isDirty && (
                <div className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-8 lg:bottom-6 z-40 lg:max-w-lg lg:ml-auto animate-in slide-in-from-bottom-4 duration-200">
                  <div className="bg-slate-900 text-white rounded-xl shadow-2xl ring-1 ring-black/5 px-4 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <p className="text-sm flex-1">
                      {dirtyFields.length === 1
                        ? t('manage.unsavedSingle', '1 unsaved change')
                        : `${dirtyFields.length} ${t('manage.unsavedPlural', 'unsaved changes')}`}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleDiscard}
                      disabled={updateWeddingMutation.isPending}
                      className="text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {t('manage.discard', 'Discard')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateWeddingMutation.isPending}
                      className="bg-white text-slate-900 hover:bg-slate-100"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      {updateWeddingMutation.isPending
                        ? t('manage.saving', 'Saving…')
                        : t('manage.saveChanges', 'Save changes')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ──────────── GUESTS ──────────── */}
          {activeSection === 'guests' && (
            <SectionCard
              title={t('manage.guestManagement', 'Guests')}
              description={t(
                'manage.guestsManagerDesc',
                'Track who you invited, who confirmed, and who needs a nudge.',
              )}
              padded={false}
            >
              <div className="p-2 sm:p-3">
                <MobileGuestManager
                  weddingId={wedding.id}
                  weddingTitle={`${wedding.bride} & ${wedding.groom}`}
                />
              </div>
            </SectionCard>
          )}

          {/* ──────────── RSVPs ──────────── */}
          {activeSection === 'rsvps' && (
            <SectionCard
              title={t('manage.rsvpAnalytics', 'RSVP analytics')}
              description={t(
                'manage.rsvpAnalyticsDesc',
                'Detailed breakdown of confirmed, declined, and pending responses.',
              )}
              padded={false}
            >
              <div className="p-4 sm:p-5">
                <PersonalizedGuestDashboard wedding={wedding} />
              </div>
            </SectionCard>
          )}

          {/* ──────────── GUEST BOOK ──────────── */}
          {activeSection === 'guestbook' && (
            <SectionCard
              title={t('manage.guestBook', 'Guest book')}
              description={t(
                'manage.guestBookManagerDesc',
                'Read messages your guests have left. Hide any that need moderation.',
              )}
            >
              <GuestBookManager weddingId={wedding.id} readOnly={false} />
            </SectionCard>
          )}

          {/* ──────────── PHOTOS ──────────── */}
          {activeSection === 'photos' && (
            <div className="space-y-6">
              <SectionCard
                title={t('manage.heroPhoto', 'Hero photo')}
                description={t(
                  'manage.heroPhotoDesc',
                  'The couple photo shown in the hero section at the top of your wedding site.',
                )}
              >
                <CouplePhotoUpload
                  weddingId={wedding.id}
                  currentPhotoUrl={wedding.couplePhotoUrl || undefined}
                  onSuccess={() => {
                    queryClient.invalidateQueries({
                      queryKey: [`/api/weddings/url/${weddingUrl}`],
                    });
                    queryClient.invalidateQueries({
                      queryKey: [`/api/photos/wedding/${wedding.id}`],
                    });
                  }}
                />
              </SectionCard>

              <SectionCard
                title={t('manage.ourJourneyGallery', 'Our Journey gallery')}
                description={t(
                  'manage.ourJourneyGalleryDesc',
                  "Photos that appear in the Our Journey carousel — your engagement, milestones, anything you'd like guests to see.",
                )}
              >
                <MemoryPhotosManager
                  weddingId={wedding.id}
                  photos={photos}
                  t={t as any}
                />
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
