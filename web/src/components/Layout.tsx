'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import BrandMark from '@/components/BrandMark';
import BrandLogoLink from '@/components/BrandLogoLink';
import TrialBanner from '@/components/TrialBanner';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isBusinessUser = user?.role === 'staff';
  const homeHref = isBusinessUser ? '/dashboard' : '/command-center';
  const primaryShowroomId = user?.showroomIds?.[0];

  const navSections: NavSection[] = isBusinessUser
    ? [
        {
          title: 'Overview',
          items: [
            {
              label: 'Dashboard',
              href: '/dashboard',
              icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
            },
            {
              label: 'Connect CA',
              href: '/connect',
              icon: 'M17 20h5v-2a3 3 0 00-4-2.83M9 20H4v-2a3 3 0 014-2.83m10-4.34a3 3 0 11-6 0 3 3 0 016 0zm-10 0a3 3 0 11-6 0 3 3 0 016 0z',
            },
            {
              label: 'Reports',
              href: '/reports',
              icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
            },
            {
              label: 'Subscription',
              href: '/subscribe',
              icon: 'M12 6v12m6-6H6',
            },
          ],
        },
        {
          title: 'Operations',
          items: [
            ...(primaryShowroomId
              ? [{ label: 'Showroom', href: `/showrooms/${primaryShowroomId}`, icon: 'M3 21h18M4.5 21V5.25L12 3l7.5 2.25V21M9 21v-8.25h6V21', badge: user?.showroomIds?.length }]
              : []),
            { label: 'Queues', href: '/queues', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
            { label: 'Transactions', href: primaryShowroomId ? `/showrooms/${primaryShowroomId}/transactions` : '/dashboard', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          ],
        },
      ]
    : [
        {
          title: 'Intelligence',
          items: [
            {
              label: 'Command Center',
              href: '/command-center',
              icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
            },
          ],
        },
        {
          title: 'Management',
          items: [
            {
              label: 'Clients',
              href: '/clients',
              icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
            },
            {
              label: 'Services',
              href: '/services',
              icon: 'M11.42 15.17l-5.67-5.67a2 2 0 010-2.83l.94-.94a2 2 0 012.83 0L15.17 11.42a2 2 0 010 2.83l-.94.94a2 2 0 01-2.83 0zM20.71 7.04l-3.75-3.75a1 1 0 00-1.41 0l-1.42 1.42 5.17 5.17 1.42-1.42a1 1 0 000-1.41z',
            },
            {
              label: 'Payments',
              href: '/payments',
              icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z',
            },
            {
              label: 'Documents',
              href: '/documents',
              icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
            },
          ],
        },
        {
          title: 'Workflow',
          items: [
            {
              label: 'Tasks',
              href: '/tasks',
              icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              label: 'Knowledge',
              href: '/knowledge',
              icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
            },
            {
              label: 'Reports',
              href: '/reports',
              icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
            },
          ],
        },
      ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/business-dashboard';
    }
    if (href === '/command-center') {
      return pathname === '/command-center';
    }

    return (pathname ?? '').startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface)' }}>
      {/* Sidebar */}
      <aside
        className={`flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
        style={{ background: 'var(--surface-container)', borderRight: '1px solid rgba(214,228,255,0.95)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-1.5 px-4 h-16 shrink-0"
          style={{ borderBottom: '1px solid rgba(214,228,255,0.95)' }}>
          {collapsed ? (
            <Link href={homeHref} aria-label="Go to home" className="inline-flex items-center">
              <BrandMark className="w-10 h-10 shrink-0" />
            </Link>
          ) : (
            <BrandLogoLink logoClassName="h-10 w-auto" href={homeHref} />
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-lg transition-colors hover:bg-[#eef4ff]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <Icon d={collapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'} className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-5">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && <p className="nav-section-label mb-2">{section.title}</p>}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={isActive(item.href) ? 'nav-item-active' : 'nav-item'}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">
                      <Icon d={item.icon} />
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge ? (
                      <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,180,171,0.15)', color: 'var(--error)' }}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User panel */}
        <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(214,228,255,0.95)' }}>
          <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: 'var(--primary-container)' }}>
              {user?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                  {user?.username}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--on-surface-variant)' }}>
                  {isBusinessUser ? 'business' : user?.role}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="p-1.5 rounded-lg transition-colors hover:bg-[#eef4ff]"
                style={{ color: 'var(--on-surface-variant)' }}
                title="Logout"
              >
                <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Trial Banner */}
        <TrialBanner />

        {/* Top bar */}
        <header className="h-14 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-10"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(214,228,255,0.95)' }}>
          <div className="flex-1">
            <div className="relative max-w-xs">
              <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Search clients, tasks..."
                className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg"
                style={{
                  background: '#fff',
                  border: '1px solid rgba(214,228,255,0.95)',
                  color: 'var(--on-surface)',
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg transition-colors hover:bg-[#eef4ff]"
              style={{ color: 'var(--on-surface-variant)' }}>
              <Icon d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--error)' }} />
            </button>
            <div className="h-6 w-px" style={{ background: 'rgba(214,228,255,0.95)' }} />
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--primary-container)' }}>
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
                {user?.username}
              </span>
              {user?.role === 'ca' ? <span className="badge-indigo">CA</span> : <span className="badge-blue">Business</span>}
            </div>
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
