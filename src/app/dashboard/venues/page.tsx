'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, Venue } from '@/lib/supabase';
import {
  ArrowRight,
  MapPin,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [updatingVenueId, setUpdatingVenueId] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_listings')
        .select('id, user_id, name, contact_email, location, subscription_plan, subscription_status, venue_type, venue_capacity, city, province, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVenues((data as Venue[]) || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues;
    return venues.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const email = (v.contact_email || '').toLowerCase();
      const location = (v.location || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const province = (v.province || '').toLowerCase();
      const venueType = (v.venue_type || '').toLowerCase();
      return name.includes(q) || email.includes(q) || location.includes(q) || city.includes(q) || province.includes(q) || venueType.includes(q);
    });
  }, [venues, query]);

  const updateSubscriptionStatus = async (venueId: string, subscription_status: Venue['subscription_status']) => {
    setUpdatingVenueId(venueId);
    try {
      const { error } = await supabase
        .from('venue_listings')
        .update({ subscription_status })
        .eq('id', venueId);

      if (error) throw error;

      setVenues((prev) =>
        prev.map((v) => (v.id === venueId ? { ...v, subscription_status } : v))
      );
    } catch (error) {
      console.error('Error updating venue subscription status:', error);
      alert('Failed to update subscription status');
    } finally {
      setUpdatingVenueId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="rounded-[28px] border border-[#EDE9DD] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(71,115,114,0.05)] lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Venues</h1>
            <p className="mt-2 text-sm text-slate-500">Manage approved venues and their subscription details.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search venues..."
                className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
              />
            </div>
            <button
              onClick={fetchVenues}
              className="inline-flex items-center gap-2 rounded-2xl border border-[#EDE9DD] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#9DCFDB] hover:bg-[#D9EBE8]/70"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Venues', value: venues.length, icon: MapPin, color: 'from-[#113f59] to-[#9DCFDB]' },
            { label: 'Active', value: venues.filter(v => v.subscription_status === 'active').length, icon: TrendingUp, color: 'from-emerald-500 to-teal-400' },
            { label: 'Inactive', value: venues.filter(v => v.subscription_status !== 'active').length, icon: Users, color: 'from-slate-500 to-slate-400' },
            { label: 'This Week', value: venues.filter(v => v.created_at && new Date(v.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: ArrowRight, color: 'from-violet-500 to-indigo-400' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="rounded-3xl border border-[#EDE9DD] bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-[0_12px_24px_rgba(17,63,89,0.18)]`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#EDE9DD] bg-white shadow-[0_10px_30px_rgba(71,115,114,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EDE9DD]">
            <thead className="bg-[#F8F6F0]/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Venue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9DD] bg-white">
              {filteredVenues.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">No venues found</td>
                </tr>
              ) : (
                filteredVenues.map((v) => (
                  <tr key={v.id} className="transition hover:bg-[#F8F6F0]/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D9EBE8] font-semibold text-[#113f59]">
                          {(v.name || 'V').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{v.name || 'Unnamed venue'}</p>
                          <p className="text-xs text-slate-500">
                            {v.contact_email || 'No email'}
                            {v.location ? ` • ${v.location}` : ''}
                            {v.city ? `, ${v.city}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">
                      {v.venue_type ? v.venue_type.replace(/_/g, ' ') : '—'}
                      {v.venue_capacity ? ` (${v.venue_capacity})` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">{v.subscription_plan || '—'}</td>
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
                        disabled={updatingVenueId === v.id}
                        onChange={(e) => updateSubscriptionStatus(v.id, e.target.value)}
                        className="rounded-2xl border border-[#EDE9DD] bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition disabled:opacity-50 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
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
