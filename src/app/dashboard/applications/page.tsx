'use client';

import { useEffect, useState } from 'react';
import { supabase, SubscriberApplication } from '@/lib/supabase';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<SubscriberApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<SubscriberApplication | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('subscriber_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('subscriber_applications')
        .update({ 
          status, 
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // If approved, create vendor record
      if (status === 'approved') {
        await createVendorFromApplication(id);
      }

      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const createVendorFromApplication = async (applicationId: string) => {
    try {
      const { data: app } = await supabase
        .from('subscriber_applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (!app) return;

      // Create vendor record
      const { error } = await supabase
        .from('vendors')
        .insert({
          name: app.company_details?.tradingName || app.company_details?.registeredBusinessName,
          description: app.business_description,
          email: app.company_details?.email,
          location: app.company_details?.businessPhysicalAddress,
          subscription_tier: app.subscription_tier,
          user_id: app.user_id,
          additional_photos: app.portfolio_images,
          subscription_status: 'active',
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating vendor:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_changes': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Applications</h1>
        
        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Applications</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_changes">Needs Changes</option>
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.company_details?.tradingName || app.company_details?.registeredBusinessName || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.company_details?.email || 'No email'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {app.portfolio_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {app.subscription_tier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setAdminNotes(app.admin_notes || '');
                      }}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedApp.company_details?.tradingName || selectedApp.company_details?.registeredBusinessName}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {selectedApp.company_details?.email} • {selectedApp.company_details?.contactPhoneNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Details</h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Registered Name</p>
                    <p className="font-medium">{selectedApp.company_details?.registeredBusinessName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner</p>
                    <p className="font-medium">{selectedApp.company_details?.ownersName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Registration Number</p>
                    <p className="font-medium">{selectedApp.company_details?.companyRegNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">VAT Number</p>
                    <p className="font-medium">{selectedApp.company_details?.vatNumber || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Business Address</p>
                    <p className="font-medium">{selectedApp.company_details?.businessPhysicalAddress || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Service Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Portfolio Type</p>
                    <p className="font-medium capitalize">{selectedApp.portfolio_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Coverage Areas</p>
                    <p className="font-medium">{selectedApp.coverage_provinces?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cities</p>
                    <p className="font-medium">{selectedApp.coverage_cities?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Description</p>
                    <p className="font-medium">{selectedApp.business_description}</p>
                  </div>
                </div>
              </section>

              {/* Media Files */}
              {(selectedApp.portfolio_images?.length > 0 || selectedApp.business_documents?.length > 0) && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Files</h3>
                  
                  {selectedApp.portfolio_images?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Portfolio Images ({selectedApp.portfolio_images.length})</p>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedApp.portfolio_images.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square bg-gray-100 rounded overflow-hidden">
                            <img src={url} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApp.business_documents?.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Documents ({selectedApp.business_documents.length})</p>
                      <div className="space-y-2">
                        {selectedApp.business_documents.map((url, idx) => (
                          <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-gray-50 rounded hover:bg-gray-100">
                            <span className="text-2xl mr-3">📄</span>
                            <span className="text-blue-600 hover:underline">Document {idx + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Subscription */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium capitalize">{selectedApp.subscription_tier} Plan</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>✓ Terms Accepted: {selectedApp.terms_accepted ? 'Yes' : 'No'}</p>
                    <p>✓ Privacy Accepted: {selectedApp.privacy_accepted ? 'Yes' : 'No'}</p>
                    <p>✓ Marketing Consent: {selectedApp.marketing_consent ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </section>

              {/* Admin Notes */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </section>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => updateStatus(selectedApp.id, 'needs_changes')}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium"
              >
                Request Changes
              </button>
              <button
                onClick={() => updateStatus(selectedApp.id, 'rejected')}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
              >
                Reject
              </button>
              <button
                onClick={() => updateStatus(selectedApp.id, 'approved')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Approve & Create Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
