'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin, SubscriberApplication } from '@/lib/supabase';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileClock,
  Globe,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalVendors: 0,
    totalAttendees: 0,
    applicationsThisWeek: 0,
  });
  const [recentApplications, setRecentApplications] = useState<SubscriberApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get pending applications count
      const { count: pendingCount } = await supabaseAdmin
        .from('subscriber_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total vendors
      const { count: vendorsCount } = await supabaseAdmin
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get total attendees (users with role 'user')
      const { count: attendeesCount } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // Get applications this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weeklyCount } = await supabaseAdmin
        .from('subscriber_applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get recent applications
      const { data: recent } = await supabaseAdmin
        .from('subscriber_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        pendingApplications: pendingCount || 0,
        totalVendors: vendorsCount || 0,
        totalAttendees: attendeesCount || 0,
        applicationsThisWeek: weeklyCount || 0,
      });

      setRecentApplications(recent || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Pending Applications',
      value: stats.pendingApplications,
      change: '+14.2%',
      note: 'Awaiting review',
      icon: FileClock,
      accent: 'from-amber-400 to-orange-400',
      tint: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Total Vendors',
      value: stats.totalVendors,
      change: '+8.4%',
      note: 'Active storefronts',
      icon: Store,
      accent: 'from-blue-600 to-sky-400',
      tint: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Total Attendees',
      value: stats.totalAttendees,
      change: '+18.7%',
      note: 'Registered accounts',
      icon: Users,
      accent: 'from-emerald-500 to-teal-400',
      tint: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Applications This Week',
      value: stats.applicationsThisWeek,
      change: '+6.1%',
      note: 'New submissions',
      icon: Sparkles,
      accent: 'from-violet-500 to-indigo-400',
      tint: 'bg-violet-50 text-violet-700',
    },
  ];

  const totalPortfolio = stats.totalVendors + stats.totalAttendees;
  const approvalRate = totalPortfolio > 0 ? Math.round((stats.totalVendors / totalPortfolio) * 100) : 0;
  const statusTone = (status: SubscriberApplication['status']) => {
    if (status === 'pending') return 'bg-amber-50 text-amber-700 ring-amber-100';
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    if (status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-100';
    if (status === 'under_review') return 'bg-blue-50 text-blue-700 ring-blue-100';
    return 'bg-slate-100 text-slate-700 ring-slate-200';
  };

  const activityItems = recentApplications.slice(0, 5).map((app, index) => ({
    id: app.id,
    title: app.company_details?.tradingName || 'New business submission',
    description: `${app.portfolio_type === 'vendor' ? 'Vendor' : 'Venue'} portfolio submitted for review`,
    time: new Date(app.created_at).toLocaleDateString(),
    icon: index % 2 === 0 ? BriefcaseBusiness : UserRound,
  }));

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-[#EDE9DD] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(71,115,114,0.05)] lg:px-8 lg:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#9DCFDB] bg-[#D9EBE8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#113f59]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Light admin overview
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Dashboard</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 lg:text-base">
              Welcome back. Here's a live snapshot of submissions, attendees, vendors, and platform momentum for the current week.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[430px]">
            <div className="rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Conversion</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{approvalRate}%</p>
              <p className="mt-1 text-xs text-slate-500">Vendor share of active base</p>
            </div>
            <div className="rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">This week</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{stats.applicationsThisWeek}</p>
              <p className="mt-1 text-xs text-slate-500">New applications created</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-[#113f59] via-[#9DCFDB] to-[#D9EBE8] px-4 py-4 text-white shadow-[0_18px_36px_rgba(17,63,89,0.28)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D9EBE8]">Growth</p>
              <p className="mt-3 flex items-center gap-2 text-2xl font-semibold">
                12.8%
                <ArrowUpRight className="h-5 w-5" />
              </p>
              <p className="mt-1 text-xs text-[#F8F6F0]/90">Platform activity month over month</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="overflow-hidden rounded-[28px] border border-[#EDE9DD] bg-white p-5 shadow-[0_10px_30px_rgba(71,115,114,0.04)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                  <p className="mt-1.5 text-sm text-slate-500">{stat.note}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-[0_12px_24px_rgba(26,188,156,0.18)]`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#F5F1E8]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${stat.accent}`}
                  style={{ width: `${Math.max(18, Math.min(100, stat.value === 0 ? 18 : stat.value))}%` }}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <article className="overflow-hidden rounded-[28px] border border-[#EDE9DD] bg-white shadow-[0_10px_30px_rgba(71,115,114,0.04)]">
          <div className="flex flex-col gap-4 border-b border-[#EDE9DD] px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-7">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
              <p className="mt-1 text-sm text-slate-500">Latest submissions from businesses joining the platform.</p>
            </div>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-[#113f59] transition hover:text-[#9DCFDB]">
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {recentApplications.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-slate-500 lg:px-7">
              No applications yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 lg:px-7">Business</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Portfolio</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Submitted</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {recentApplications.map((app) => (
                    <tr key={app.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4 lg:px-7">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D9EBE8] font-semibold text-[#113f59]">
                            {(app.company_details?.tradingName || app.company_details?.registeredBusinessName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{app.company_details?.tradingName || app.company_details?.registeredBusinessName || 'Unnamed Business'}</p>
                            <p className="text-xs text-slate-500">{app.company_details?.email || 'No email'}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${
                                app.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-100' :
                                app.status === 'under_review' ? 'bg-blue-50 text-blue-700 ring-blue-100' :
                                app.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
                                app.status === 'rejected' ? 'bg-rose-50 text-rose-700 ring-rose-100' :
                                'bg-slate-50 text-slate-700 ring-slate-200'
                              }`}>
                                {app.status.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">{app.portfolio_type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${statusTone(app.status)}`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">Recent Activity</p>
              <p className="mt-1 text-sm text-slate-500">Latest actions and updates across the platform.</p>
            </div>
            <div className="rounded-2xl bg-[#D9EBE8] p-3 text-[#113f59]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {activityItems.length === 0 ? (
              <div className="rounded-3xl bg-[#F5F1E8] px-4 py-6 text-sm text-slate-500">No recent activity yet.</div>
            ) : (
              activityItems.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div key={item.id} className="flex gap-4 rounded-3xl border border-[#EDE9DD] bg-[#F5F1E8]/70 p-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${index % 2 === 0 ? 'bg-[#D9EBE8] text-[#113f59]' : 'bg-[#9DCFDB] text-[#113f59]'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-400">
                        <Clock3 className="h-3.5 w-3.5" />
                        {item.time}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
