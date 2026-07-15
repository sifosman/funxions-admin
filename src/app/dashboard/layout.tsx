'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import {
  Bell,
  ChevronDown,
  FileText,
  LayoutGrid,
  LineChart,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  WalletCards,
  Store,
  X,
  LogOut,
} from 'lucide-react';

const navItems = [
  {
    group: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
      { href: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
    ],
  },
  {
    group: 'Management',
    items: [
      { href: '/dashboard/applications', label: 'Applications', icon: FileText },
      { href: '/dashboard/users', label: 'Attendees', icon: Users },
      { href: '/dashboard/vendors', label: 'Vendors', icon: Store },
      { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: WalletCards },
    ],
  },
  {
    group: 'System',
    items: [
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

type AdminUser = {
  email?: string;
  full_name?: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      // Verify admin role
      const { data: userData } = await supabase
        .from('users')
        .select('role, full_name')
        .eq('auth_user_id', session.user.id)
        .single();

      if (userData?.role !== 'admin') {
        await supabase.auth.signOut();
        router.push('/');
        return;
      }

      setUser({ ...session.user, ...userData });
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0]">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
    </div>
    );
  }

  const userInitials = (user?.full_name || user?.email || 'A')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-slate-900 lg:flex">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[292px] flex-col border-r border-[#EDE9DD]/80 bg-white/95 shadow-[0_10px_40px_rgba(71,115,114,0.08)] backdrop-blur transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between border-b border-[#EDE9DD] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113f59] via-[#9DCFDB] to-[#D9EBE8] p-1 shadow-[0_10px_24px_rgba(17,63,89,0.35)]">
              <Image src="/icon.png" alt="Funcxon" width={36} height={36} className="rounded-lg" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#113f59]">Admin panel</p>
              <h1 className="text-lg font-semibold text-slate-900">Funcxon</h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-[#F5F1E8] hover:text-slate-600 lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {navItems.map((section) => (
            <div key={section.group} className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {section.group}
                </p>
                <ChevronDown className="h-4 w-4 text-slate-300" />
              </div>

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#113f59] to-[#9DCFDB] text-white shadow-[0_16px_30px_rgba(17,63,89,0.22)]'
                          : 'text-slate-600 hover:bg-[#D9EBE8]/70 hover:text-[#113f59]'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                          isActive
                            ? 'border-white/20 bg-white/15 text-white'
                            : 'border-[#EDE9DD] bg-white text-slate-500 group-hover:border-[#9DCFDB] group-hover:bg-[#D9EBE8] group-hover:text-[#113f59]'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#EDE9DD] p-4">
          <div className="rounded-3xl border border-[#9DCFDB] bg-gradient-to-br from-[#D9EBE8] via-white to-[#F5F1E8] p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#113f59] text-sm font-bold text-white shadow-[0_10px_20px_rgba(17,63,89,0.28)]">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user?.full_name || 'Admin User'}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
              <div className="rounded-xl bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#113f59] shadow-sm">
                Admin
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EDE9DD] bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-[#EDE9DD]/80 bg-[#F8F6F0]/85 backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#113f59] text-white shadow-[0_10px_24px_rgba(17,63,89,0.25)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#113f59]">Dashboard</p>
                  <p className="text-sm font-semibold text-slate-900">Funcxon Admin</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-2xl border border-[#EDE9DD] bg-white p-2.5 text-slate-500 shadow-sm transition hover:text-slate-700"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative max-w-xl flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applications, users, subscriptions..."
                  className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
                />
              </div>

              <div className="flex items-center gap-2 self-end xl:self-auto">
                <button className="hidden h-12 items-center gap-2 rounded-2xl bg-[#113f59] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] sm:flex">
                  <Sparkles className="h-4 w-4" />
                  New report
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EDE9DD] bg-white text-slate-500 shadow-sm transition hover:border-[#9DCFDB] hover:text-[#113f59]">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-[#EDE9DD] bg-white px-3 py-2 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#113f59] text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">{user?.full_name || 'Admin User'}</p>
                    <p className="text-xs text-slate-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 bg-[#F8F6F0] sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
