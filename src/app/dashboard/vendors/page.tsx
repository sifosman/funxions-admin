'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, Vendor } from '@/lib/supabase';
import {
  ArrowRight,
  RefreshCw,
  Search,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, user_id, name, email, location, subscription_tier, subscription_status')
        .order('id', { ascending: false });

      if (error) throw error;
      setVendors((data as Vendor[]) || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const email = (v.email || '').toLowerCase();
      const location = (v.location || '').toLowerCase();
      return name.includes(q) || email.includes(q) || location.includes(q);
    });
  }, [vendors, query]);

  const updateSubscriptionStatus = async (vendorId: string, subscription_status: Vendor['subscription_status']) => {
    setUpdatingVendorId(vendorId);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ subscription_status })
        .eq('id', vendorId);

      if (error) throw error;

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, subscription_status } : v))
      );
    } catch (error) {
      console.error('Error updating vendor subscription status:', error);
      alert('Failed to update subscription status');
    } finally {
      setUpdatingVendorId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)] lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Vendors</h1>
            <p className="mt-2 text-sm text-slate-500">Manage approved vendors and their subscription details.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendors..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={fetchVendors}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Vendors', value: vendors.length, icon: Store, color: 'from-blue-600 to-sky-400' },
            { label: 'Active', value: vendors.filter(v => v.subscription_status === 'active').length, icon: TrendingUp, color: 'from-emerald-500 to-teal-400' },
            { label: 'Inactive', value: vendors.filter(v => v.subscription_status !== 'active').length, icon: Users, color: 'from-slate-500 to-slate-400' },
            { label: 'This Week', value: vendors.filter(v => v.created_at && new Date(v.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: ArrowRight, color: 'from-violet-500 to-indigo-400' },
          ].map((stat) => {
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

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Vendor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-sm text-slate-500">No vendors found</td>
                </tr>
              ) : (
                filteredVendors.map((v) => (
                  <tr key={v.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-700">
                          {(v.name || 'V').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{v.name || 'Unnamed vendor'}</p>
                          <p className="text-xs text-slate-500">{v.email || 'No email'}{v.location ? ` • ${v.location}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">{v.subscription_tier || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                          (v.subscription_status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                        }`}
                      >
                        {v.subscription_status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">#{v.id}</td>
                    <td className="px-6 py-4">
                      <select
                        value={(v.subscription_status as string) || 'inactive'}
                        disabled={updatingVendorId === v.id}
                        onChange={(e) => updateSubscriptionStatus(v.id, e.target.value)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition disabled:opacity-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
