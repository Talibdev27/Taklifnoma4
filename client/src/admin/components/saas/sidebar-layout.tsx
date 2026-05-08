import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Plus,
  Menu,
  X,
  Heart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LanguageToggle } from '@/website/components/language-toggle';
import { Button } from '@/components/ui/button';

export interface SidebarUser {
  name?: string | null;
  email?: string | null;
}

export interface SidebarNavItem {
  /** URL path */
  href: string;
  /** Visible label (already translated by caller) */
  label: string;
  /** Lucide icon */
  icon: React.ComponentType<{ className?: string }>;
  /** Optional small badge text (e.g., "12") */
  badge?: string | number;
  /** Match prefix instead of exact path (used for /manage/:id) */
  matchPrefix?: boolean;
}

export interface SidebarLayoutProps {
  /** Authenticated user — drives the user menu in topbar */
  user: SidebarUser | null;
  /** Top-level nav items in the sidebar */
  navItems: SidebarNavItem[];
  /** Brand label shown next to the logo */
  brand?: string;
  /** Logo image URL */
  logoUrl?: string;
  /** Page content rendered to the right of the sidebar */
  children: React.ReactNode;
  /** Sign-out handler — caller decides what "logout" means */
  onSignOut?: () => void;
  /** Translate function for chrome strings (logout, etc.) */
  t?: (key: string, fallback?: string) => string;
  /** Optional primary CTA shown at the bottom of the sidebar */
  primaryCta?: { label: string; href: string };
}

/**
 * App shell used for authenticated SaaS pages (Dashboard, Manage, Settings).
 *
 * Desktop layout (≥lg): persistent left sidebar + main content scrolls
 * independently. Topbar shows page title placeholder (rendered by page),
 * language toggle, and user menu.
 *
 * Mobile/tablet: sidebar collapses into a slide-over drawer triggered by
 * a hamburger button in the topbar. Body scroll is locked while drawer
 * is open. The main content takes full width.
 *
 * Active nav item is detected via wouter's useLocation. matchPrefix lets
 * deep routes like /manage/:uniqueUrl highlight the "Manage" entry.
 */
export function SidebarLayout({
  user,
  navItems,
  brand = 'Taklif Link',
  logoUrl = '/takliflinklogo.jpg',
  children,
  onSignOut,
  t = (_, fb) => fb ?? '',
  primaryCta,
}: SidebarLayoutProps) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [drawerOpen]);

  // Close drawer on route change so navigating from inside it works
  useEffect(() => {
    setDrawerOpen(false);
  }, [location]);

  const isActive = (item: SidebarNavItem) =>
    item.matchPrefix ? location.startsWith(item.href) : location === item.href;

  const userInitial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();
  const userLabel = user?.name || user?.email || t('common.guest', 'Guest');

  /* ── Reusable sidebar inner content (used by both desktop + drawer) ── */
  const sidebarBody = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-200 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <img
            src={logoUrl}
            alt={brand}
            className="w-8 h-8 rounded-md object-cover ring-1 ring-slate-200"
          />
          <span className="text-[15px] font-semibold text-slate-900 tracking-tight">
            {brand}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {t('nav.workspace', 'Workspace')}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {primaryCta && (
          <div className="mt-6 px-3">
            <Link href={primaryCta.href}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-1.5" />
                {primaryCta.label}
              </Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Bottom helper / version */}
      <div className="px-5 py-4 border-t border-slate-200 shrink-0">
        <a
          href="https://t.me/takliflink"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          {t('nav.support', 'Help & support')}
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif' }}>
      {/* ════════════ Desktop sidebar ════════════ */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        {sidebarBody}
      </aside>

      {/* ════════════ Mobile drawer ════════════ */}
      {drawerOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarBody}
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-3 w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </aside>
        </>
      )}

      {/* ════════════ Main column ════════════ */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden w-9 h-9 rounded-md flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Mobile-only brand (sidebar handles desktop) */}
            <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
              <img src={logoUrl} alt={brand} className="w-7 h-7 rounded-md object-cover" />
              <span className="text-sm font-semibold text-slate-900">{brand}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-slate-100 transition-colors group">
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm">
                    {userInitial}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[160px] truncate">
                    {userLabel}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {user?.name || t('common.guest', 'Guest')}
                    </span>
                    {user?.email && (
                      <span className="text-xs text-slate-500 truncate">{user.email}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {t('nav.dashboard', 'Dashboard')}
                  </Link>
                </DropdownMenuItem>
                {onSignOut && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onSignOut}
                      className="text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.signOut', 'Sign out')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
