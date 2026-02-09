'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, VendorSubscription, SubscriptionInvoice } from '@/lib/supabase';
import { Calendar, DollarSign, AlertCircle, CheckCircle, Clock, CreditCard, User, Mail, Phone, MapPin, TrendingUp, Activity } from 'lucide-react';

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
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatus = (daysUntilExpiry?: number) => {
    if (!daysUntilExpiry) return null;
    if (daysUntilExpiry < 0) return { color: 'text-red-600', icon: AlertCircle, text: 'Expired' };
    if (daysUntilExpiry <= 1) return { color: 'text-orange-600', icon: AlertCircle, text: 'Expires today' };
    if (daysUntilExpiry <= 5) return { color: 'text-yellow-600', icon: Clock, text: `${daysUntilExpiry} days` };
    return { color: 'text-green-600', icon: CheckCircle, text: `${daysUntilExpiry} days` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors..."
            className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchSubscriptions}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {subscriptions.filter(s => s.subscription_status === 'active').length}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-orange-600">
                {subscriptions.filter(s => s.days_until_expiry !== undefined && s.days_until_expiry <= 5 && s.days_until_expiry >= 0).length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-600">
                ${subscriptions.reduce((sum, s) => sum + (s.total_paid || 0), 0).toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((subscription) => {
                const expiryStatus = getExpiryStatus(subscription.days_until_expiry);
                const ExpiryIcon = expiryStatus?.icon;
                
                return (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{subscription.name || 'Unnamed vendor'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {subscription.email && <Mail className="h-3 w-3" />}
                          {subscription.email}
                          {subscription.location && <><MapPin className="h-3 w-3 ml-2" />{subscription.location}</>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 capitalize">{subscription.subscription_tier || '—'}</p>
                        <p className="text-gray-500">{subscription.billing_period || 'monthly'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.subscription_status || '')}`}>
                        {subscription.subscription_status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {expiryStatus ? (
                        <div className={`flex items-center gap-1 ${expiryStatus.color}`}>
                          {expiryStatus.icon && <expiryStatus.icon className="h-4 w-4" />}
                          <span className="text-sm">{expiryStatus.text}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <p className="font-medium">${(subscription.total_paid || 0).toFixed(2)}</p>
                        <p className="text-gray-500">{subscription.total_invoices || 0} invoices</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openVendorDetails(subscription)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.name}</h2>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Vendor Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{selectedVendor.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedVendor.billing_phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{selectedVendor.location || 'No location'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Subscription Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium capitalize">{selectedVendor.subscription_tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVendor.subscription_status || '')}`}>
                        {selectedVendor.subscription_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Billing Period:</span>
                      <span className="font-medium capitalize">{selectedVendor.billing_period}</span>
                    </div>
                    {selectedVendor.subscription_expires_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="font-medium">
                          {new Date(selectedVendor.subscription_expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Update Subscription
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Record Payment
                </button>
              </div>

              {/* Invoices */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment History</h3>
                {invoicesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vendorInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                              No invoices found
                            </td>
                          </tr>
                        ) : (
                          vendorInvoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td className="px-4 py-2 text-sm font-medium">{invoice.invoice_number}</td>
                              <td className="px-4 py-2 text-sm">${invoice.amount.toFixed(2)}</td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Update Subscription</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Tier</label>
                  <select
                    value={updateForm.subscription_tier}
                    onChange={(e) => setUpdateForm({ ...updateForm, subscription_tier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select tier</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={updateForm.subscription_status}
                    onChange={(e) => setUpdateForm({ ...updateForm, subscription_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period</label>
                  <select
                    value={updateForm.billing_period}
                    onChange={(e) => setUpdateForm({ ...updateForm, billing_period: e.target.value as 'monthly' | 'yearly' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={updateForm.subscription_expires_at}
                    onChange={(e) => setUpdateForm({ ...updateForm, subscription_expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={updateForm.billing_email}
                    onChange={(e) => setUpdateForm({ ...updateForm, billing_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Name</label>
                  <input
                    type="text"
                    value={updateForm.billing_name}
                    onChange={(e) => setUpdateForm({ ...updateForm, billing_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Phone</label>
                  <input
                    type="tel"
                    value={updateForm.billing_phone}
                    onChange={(e) => setUpdateForm({ ...updateForm, billing_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateVendorSubscription}
                  disabled={updatingVendorId === selectedVendor.id}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {updatingVendorId === selectedVendor.id ? 'Updating...' : 'Update'}
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="payfast">PayFast</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={paymentForm.billing_email}
                    onChange={(e) => setPaymentForm({ ...paymentForm, billing_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Name</label>
                  <input
                    type="text"
                    value={paymentForm.billing_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, billing_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Phone</label>
                  <input
                    type="tel"
                    value={paymentForm.billing_phone}
                    onChange={(e) => setPaymentForm({ ...paymentForm, billing_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={recordPayment}
                  disabled={updatingVendorId === selectedVendor.id || !paymentForm.amount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                >
                  {updatingVendorId === selectedVendor.id ? 'Recording...' : 'Record Payment'}
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
