 'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';

 type RangeKey = '7d' | '30d' | '90d';

 export default function AnalyticsPage() {
   const [range, setRange] = useState<RangeKey>('7d');
   const [loading, setLoading] = useState(true);
   const [stats, setStats] = useState({
     totalUsers: 0,
     totalVendors: 0,
     totalApplications: 0,
     pendingApplications: 0,
     approvedApplications: 0,
     rejectedApplications: 0,
     newUsersInRange: 0,
     newVendorsInRange: 0,
     newApplicationsInRange: 0,
   });

   useEffect(() => {
     fetchAnalytics();
   }, [range]);

   const rangeStartIso = useMemo(() => {
     const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
     const d = new Date();
     d.setDate(d.getDate() - days);
     return d.toISOString();
   }, [range]);

   const fetchAnalytics = async () => {
     setLoading(true);
     try {
       const [
         totalUsersRes,
         totalVendorsRes,
         totalAppsRes,
         pendingAppsRes,
         approvedAppsRes,
         rejectedAppsRes,
         newUsersRes,
         newVendorsRes,
         newAppsRes,
       ] = await Promise.all([
         supabase.from('users').select('*', { count: 'exact', head: true }),
         supabase.from('vendors').select('*', { count: 'exact', head: true }),
         supabase.from('subscriber_applications').select('*', { count: 'exact', head: true }),
         supabase
           .from('subscriber_applications')
           .select('*', { count: 'exact', head: true })
           .eq('status', 'pending'),
         supabase
           .from('subscriber_applications')
           .select('*', { count: 'exact', head: true })
           .eq('status', 'approved'),
         supabase
           .from('subscriber_applications')
           .select('*', { count: 'exact', head: true })
           .eq('status', 'rejected'),
         supabase
           .from('users')
           .select('*', { count: 'exact', head: true })
           .gte('created_at', rangeStartIso),
         supabase
           .from('vendors')
           .select('*', { count: 'exact', head: true })
           .gte('created_at', rangeStartIso),
         supabase
           .from('subscriber_applications')
           .select('*', { count: 'exact', head: true })
           .gte('created_at', rangeStartIso),
       ]);

       const anyError =
         totalUsersRes.error ||
         totalVendorsRes.error ||
         totalAppsRes.error ||
         pendingAppsRes.error ||
         approvedAppsRes.error ||
         rejectedAppsRes.error ||
         newUsersRes.error ||
         newVendorsRes.error ||
         newAppsRes.error;

       if (anyError) throw anyError;

       setStats({
         totalUsers: totalUsersRes.count || 0,
         totalVendors: totalVendorsRes.count || 0,
         totalApplications: totalAppsRes.count || 0,
         pendingApplications: pendingAppsRes.count || 0,
         approvedApplications: approvedAppsRes.count || 0,
         rejectedApplications: rejectedAppsRes.count || 0,
         newUsersInRange: newUsersRes.count || 0,
         newVendorsInRange: newVendorsRes.count || 0,
         newApplicationsInRange: newAppsRes.count || 0,
       });
     } catch (error) {
       console.error('Error fetching analytics:', error);
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

  const rangeLabel = range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days';

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-600 to-sky-400' },
    { label: 'Total Vendors', value: stats.totalVendors, icon: BarChart3, color: 'from-emerald-500 to-teal-400' },
    { label: 'Total Applications', value: stats.totalApplications, icon: TrendingUp, color: 'from-violet-500 to-indigo-400' },
    { label: 'Pending Applications', value: stats.pendingApplications, icon: Calendar, color: 'from-amber-500 to-orange-400' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Analytics</h1>
            <p className="mt-2 text-sm text-slate-500">Track platform growth and engagement metrics over time.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
              <button className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600">Period</button>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value as RangeKey)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <button
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-[0_12px_24px_rgba(37,99,235,0.18)]`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Application Status</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Approved', value: stats.approvedApplications, color: 'from-emerald-500 to-teal-400' },
              { label: 'Rejected', value: stats.rejectedApplications, color: 'from-rose-500 to-red-400' },
              { label: 'Pending', value: stats.pendingApplications, color: 'from-amber-500 to-orange-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${item.color}`} />
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="text-2xl font-semibold tracking-tight text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">Growth ({rangeLabel})</h2>
          <div className="mt-6 space-y-4">
            {[
              { label: 'New Users', value: stats.newUsersInRange, color: 'from-blue-500 to-sky-400' },
              { label: 'New Vendors', value: stats.newVendorsInRange, color: 'from-emerald-500 to-teal-400' },
              { label: 'New Applications', value: stats.newApplicationsInRange, color: 'from-violet-500 to-indigo-400' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${item.color}`} />
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="text-2xl font-semibold tracking-tight text-slate-950">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
