'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  badge?: number;
}

function Icon({ d, className = 'w-4 h-4' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isCA = user?.role === 'ca';
  const isAdmin = user?.role === 'admin';

  // CA-specific nav items
  const caNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
  ];

  // Showroom/Staff-specific nav items
  const storeNavItems: NavItem[] = [
    {
      label: 'Connect CA',
      href: '/connect',
      icon: <Icon d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
    },
    {
      label: 'Queues',
      href: '/queues',
      icon: <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
  ];

  // Admin sees everything
  const adminNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    {
      label: 'Queues',
      href: '/queues',
      icon: <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
    },
    {
      label: 'Alerts',
      href: '/alerts',
      icon: <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
    },
  ];

  const navItems = isAdmin ? adminNavItems : isCA ? caNavItems : storeNavItems;
  const sectionLabel = isAdmin ? 'Admin' : isCA ? 'CA Workspace' : 'Store';

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : (pathname ?? '').startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-sidebar border-r border-white/5 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-base tracking-tight">Rekono</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition"
          >
            <Icon d={collapsed ? 'M13 5l7 7-7 7M5 5l7 7-7 7' : 'M11 19l-7-7 7-7m8 14l-7-7 7-7'} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && <p className="nav-section-label mb-2">{sectionLabel}</p>}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'nav-item-active' : 'nav-item'}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge ? (
                <span className="ml-auto bg-danger text-white text-2xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-2 py-3 border-t border-white/5">
          <div className={`flex items-center gap-2.5 px-2 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.username}</p>
                <p className="text-slate-500 text-2xs capitalize">{user?.role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="text-slate-500 hover:text-slate-300 transition"
                title="Logout"
              >
                <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 flex items-center px-6 gap-4 shrink-0 shadow-sm z-10 sticky top-0">
          <div className="flex-1">
            <div className="relative max-w-xs">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder={isCA ? 'Search clients, reports...' : 'Search transactions...'}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-surface-100 rounded-lg transition">
              <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-danger rounded-full" />
            </button>
            <div className="h-8 w-px bg-slate-200" />
            <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-surface-50 transition group focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1">
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:bg-brand-600 transition">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="flex items-center gap-1.5 pr-2">
                <span className="text-sm font-semibold text-slate-700">{user?.username}</span>
                {isCA && <span className="badge-purple">CA</span>}
              </div>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
