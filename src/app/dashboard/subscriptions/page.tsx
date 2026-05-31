'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, VendorSubscription, SubscriptionInvoice } from '@/lib/supabase';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Users,
  X,
} from 'lucide-react';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<VendorSubscription[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorSubscription | null>(null);
  const [vendorInvoices, setVendorInvoices] = useState<SubscriptionInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);

  // Form states
  const [updateForm, setUpdateForm] = useState({
    subscription_tier: '',
    subscription_status: '',
    subscription_expires_at: '',
    billing_period: 'monthly' as 'monthly' | 'yearly',
    billing_email: '',
    billing_name: '',
    billing_phone: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'manual',
    billing_email: '',
    billing_name: '',
    billing_phone: ''
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('admin_vendor_subscriptions');

      if (error) throw error;
      setSubscriptions((data as VendorSubscription[]) || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      // Fallback to basic vendor query if RPC fails
      try {
        const { data, error } = await supabase
          .from('vendors')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubscriptions((data as VendorSubscription[]) || []);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorInvoices = async (vendorId: string) => {
    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendorInvoices((data as SubscriptionInvoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const filteredSubscriptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter((v) => {
      const name = (v.name || '').toLowerCase();
      const email = (v.email || '').toLowerCase();
      const location = (v.location || '').toLowerCase();
      const tier = (v.subscription_tier || '').toLowerCase();
      return name.includes(q) || email.includes(q) || location.includes(q) || tier.includes(q);
    });
  }, [subscriptions, query]);

  const openVendorDetails = (vendor: VendorSubscription) => {
    setSelectedVendor(vendor);
    setUpdateForm({
      subscription_tier: vendor.subscription_tier || '',
      subscription_status: vendor.subscription_status || '',
      subscription_expires_at: vendor.subscription_expires_at || '',
      billing_period: vendor.billing_period || 'monthly',
      billing_email: vendor.billing_email || '',
      billing_name: vendor.billing_name || '',
      billing_phone: vendor.billing_phone || ''
    });
    setPaymentForm({
      amount: '',
      payment_method: 'manual',
      billing_email: vendor.billing_email || '',
      billing_name: vendor.billing_name || '',
      billing_phone: vendor.billing_phone || ''
    });
    fetchVendorInvoices(vendor.id);
  };

  const updateVendorSubscription = async () => {
    if (!selectedVendor) return;
    
    setUpdatingVendorId(selectedVendor.id);
    try {
      const { error } = await supabase
        .rpc('admin_update_vendor_subscription', {
          p_vendor_id: selectedVendor.id,
          p_subscription_tier: updateForm.subscription_tier,
          p_subscription_status: updateForm.subscription_status,
          p_subscription_expires_at: updateForm.subscription_expires_at || null,
          p_billing_period: updateForm.billing_period,
          p_billing_email: updateForm.billing_email || null,
          p_billing_name: updateForm.billing_name || null,
          p_billing_phone: updateForm.billing_phone || null
        });

      if (error) throw error;

      await fetchSubscriptions();
      setShowUpdateModal(false);
      alert('Subscription updated successfully!');
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const recordPayment = async () => {
    if (!selectedVendor) return;
    
    setUpdatingVendorId(selectedVendor.id);
    try {
      const { error } = await supabase
        .rpc('admin_record_payment', {
          p_vendor_id: selectedVendor.id,
          p_amount: parseFloat(paymentForm.amount),
          p_payment_method: paymentForm.payment_method,
          p_billing_email: paymentForm.billing_email || null,
          p_billing_name: paymentForm.billing_name || null,
          p_billing_phone: paymentForm.billing_phone || null
        });

      if (error) throw error;

      await fetchSubscriptions();
      await fetchVendorInvoices(selectedVendor.id);
      setShowPaymentModal(false);
      setPaymentForm({ ...paymentForm, amount: '' });
      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    } finally {
      setUpdatingVendorId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'inactive': return 'bg-slate-50 text-slate-700 ring-slate-200';
      case 'cancelled': return 'bg-rose-50 text-rose-700 ring-rose-100';
      case 'expired': return 'bg-orange-50 text-orange-700 ring-orange-100';
      default: return 'bg-slate-50 text-slate-700 ring-slate-200';
    }
  };

  const getExpiryStatus = (daysUntilExpiry?: number) => {
    if (!daysUntilExpiry) return null;
    if (daysUntilExpiry < 0) return { color: 'text-red-600', icon: Clock, text: 'Expired' };
    if (daysUntilExpiry <= 1) return { color: 'text-orange-600', icon: Clock, text: 'Expires today' };
    if (daysUntilExpiry <= 5) return { color: 'text-yellow-600', icon: Clock, text: `${daysUntilExpiry} days` };
    return { color: 'text-green-600', icon: CheckCircle2, text: `${daysUntilExpiry} days` };
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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Subscription Management</h1>
            <p className="mt-2 text-sm text-slate-500">Monitor vendor subscriptions, payments, and revenue metrics.</p>
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
              onClick={fetchSubscriptions}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Vendors', value: subscriptions.length, icon: Users, color: 'from-blue-600 to-sky-400' },
            { label: 'Active', value: subscriptions.filter(s => s.subscription_status === 'active').length, icon: TrendingUp, color: 'from-emerald-500 to-teal-400' },
            { label: 'Expiring Soon', value: subscriptions.filter(s => s.days_until_expiry !== undefined && s.days_until_expiry <= 5 && s.days_until_expiry >= 0).length, icon: Clock, color: 'from-amber-500 to-orange-400' },
            { label: 'Total Revenue', value: `$${subscriptions.reduce((sum, s) => sum + (s.total_paid || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'from-violet-500 to-indigo-400' },
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Expiry</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">No subscriptions found</td>
                </tr>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const expiryStatus = getExpiryStatus(subscription.days_until_expiry);
                  const ExpiryIcon = expiryStatus?.icon;
                  
                  return (
                    <tr key={subscription.id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-700">
                            {(subscription.name || 'V').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{subscription.name || 'Unnamed vendor'}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              {subscription.email && <Mail className="h-3 w-3" />}
                              {subscription.email}
                              {subscription.location && <><MapPin className="h-3 w-3 ml-2" />{subscription.location}</>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900 capitalize">{subscription.subscription_tier || '—'}</p>
                          <p className="text-slate-500">{subscription.billing_period || 'monthly'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusColor(subscription.subscription_status || '')}`}>
                          {subscription.subscription_status || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expiryStatus ? (
                          <div className={`flex items-center gap-1 ${expiryStatus.color}`}>
                            {expiryStatus.icon && <expiryStatus.icon className="h-4 w-4" />}
                            <span className="text-sm">{expiryStatus.text}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900">
                        <div>
                          <p className="font-medium">${(subscription.total_paid || 0).toFixed(2)}</p>
                          <p className="text-slate-500">{subscription.total_invoices || 0} invoices</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openVendorDetails(subscription)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
                        >
                          Manage
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]" onClick={() => setSelectedVendor(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-7">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{selectedVendor.name}</h2>
              <button
                onClick={() => setSelectedVendor(null)}
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 lg:px-7 lg:py-8">
              {/* Vendor Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{selectedVendor.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{selectedVendor.billing_phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{selectedVendor.location || 'No location'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Subscription Details</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Plan:</span>
                      <span className="text-sm font-medium capitalize text-slate-900">{selectedVendor.subscription_tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Status:</span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusColor(selectedVendor.subscription_status || '')}`}>
                        {selectedVendor.subscription_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Billing Period:</span>
                      <span className="text-sm font-medium capitalize text-slate-900">{selectedVendor.billing_period}</span>
                    </div>
                    {selectedVendor.subscription_expires_at && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Expires:</span>
                        <span className="text-sm font-medium text-slate-900">
                          {new Date(selectedVendor.subscription_expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
                >
                  Update Subscription
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.28)] transition hover:bg-emerald-700"
                >
                  Record Payment
                </button>
              </div>

              {/* Invoices */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                {invoicesLoading ? (
                  <div className="mt-4 flex items-center justify-center h-32">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Invoice</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {vendorInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">No invoices found</td>
                          </tr>
                        ) : (
                          vendorInvoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">{invoice.invoice_number}</td>
                              <td className="px-4 py-3 text-sm text-slate-900">${invoice.amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                                  invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
                                  invoice.status === 'pending' ? 'bg-amber-50 text-amber-700 ring-amber-100' :
                                  'bg-rose-50 text-rose-700 ring-rose-100'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {new Date(invoice.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Subscription Modal */}
      {showUpdateModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]" onClick={() => setShowUpdateModal(false)} />
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Update Subscription</h2>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subscription Tier</label>
                <select
                  value={updateForm.subscription_tier}
                  onChange={(e) => setUpdateForm({ ...updateForm, subscription_tier: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select tier</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={updateForm.subscription_status}
                  onChange={(e) => setUpdateForm({ ...updateForm, subscription_status: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Period</label>
                <select
                  value={updateForm.billing_period}
                  onChange={(e) => setUpdateForm({ ...updateForm, billing_period: e.target.value as 'monthly' | 'yearly' })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  value={updateForm.subscription_expires_at}
                  onChange={(e) => setUpdateForm({ ...updateForm, subscription_expires_at: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Email</label>
                <input
                  type="email"
                  value={updateForm.billing_email}
                  onChange={(e) => setUpdateForm({ ...updateForm, billing_email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Name</label>
                <input
                  type="text"
                  value={updateForm.billing_name}
                  onChange={(e) => setUpdateForm({ ...updateForm, billing_name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Phone</label>
                <input
                  type="tel"
                  value={updateForm.billing_phone}
                  onChange={(e) => setUpdateForm({ ...updateForm, billing_phone: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-slate-200">
              <button
                onClick={updateVendorSubscription}
                disabled={updatingVendorId === selectedVendor.id}
                className="flex-1 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] transition hover:bg-blue-700 disabled:opacity-50"
              >
                {updatingVendorId === selectedVendor.id ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]" onClick={() => setShowPaymentModal(false)} />
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Record Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method</label>
                <select
                  value={paymentForm.payment_method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="manual">Manual</option>
                  <option value="payfast">PayFast</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Email</label>
                <input
                  type="email"
                  value={paymentForm.billing_email}
                  onChange={(e) => setPaymentForm({ ...paymentForm, billing_email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Name</label>
                <input
                  type="text"
                  value={paymentForm.billing_name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, billing_name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billing Phone</label>
                <input
                  type="tel"
                  value={paymentForm.billing_phone}
                  onChange={(e) => setPaymentForm({ ...paymentForm, billing_phone: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-5 border-t border-slate-200">
              <button
                onClick={recordPayment}
                disabled={updatingVendorId === selectedVendor.id || !paymentForm.amount}
                className="flex-1 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.28)] transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {updatingVendorId === selectedVendor.id ? 'Recording...' : 'Record Payment'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
