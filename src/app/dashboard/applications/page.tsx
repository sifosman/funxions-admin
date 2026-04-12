'use client';

import { useEffect, useState } from 'react';
import { supabase, SubscriberApplication, normalizeStorageUrl, STORAGE_BUCKETS } from '@/lib/supabase';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Play,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<SubscriberApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<SubscriberApplication | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const deleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscriber_applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSelectedApp(null);
      setShowDeleteConfirm(false);
      await fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'under_review': return 'bg-blue-50 text-blue-700 ring-blue-100';
      case 'approved': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 ring-rose-100';
      case 'needs_changes': return 'bg-orange-50 text-orange-700 ring-orange-100';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'document';
      return decodeURIComponent(fileName);
    } catch {
      return 'document';
    }
  };

  const downloadAllDocuments = async (app: SubscriberApplication) => {
    const allFiles = [
      ...(app.business_documents || []).map(url => normalizeStorageUrl(url, STORAGE_BUCKETS.BUSINESS_DOCUMENTS)),
      ...(app.portfolio_images || []).map(url => normalizeStorageUrl(url, STORAGE_BUCKETS.PORTFOLIO_IMAGES)),
      ...(app.portfolio_videos || []).map(url => normalizeStorageUrl(url, STORAGE_BUCKETS.PORTFOLIO_VIDEOS))
    ];

    for (const url of allFiles) {
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = getFileNameFromUrl(url);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error downloading file:', error);
      }
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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Applications</h1>
            <p className="mt-2 text-sm text-slate-500">Review and manage vendor and venue portfolio submissions.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search applications..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-1">
              <button className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600">Filter</button>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_changes">Needs Changes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total', value: applications.length, icon: FileText, color: 'from-blue-600 to-sky-400' },
            { label: 'Pending', value: applications.filter(a => a.status === 'pending').length, icon: Clock3, color: 'from-amber-500 to-orange-400' },
            { label: 'Approved', value: applications.filter(a => a.status === 'approved').length, icon: CheckCircle2, color: 'from-emerald-500 to-teal-400' },
            { label: 'This Week', value: applications.filter(a => new Date(a.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: TrendingUp, color: 'from-violet-500 to-indigo-400' },
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Business</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">No applications found</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-700">
                          {(app.company_details?.tradingName || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {app.company_details?.tradingName || app.company_details?.registeredBusinessName || 'Unnamed Business'}
                          </p>
                          <p className="text-xs text-slate-500">{app.company_details?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium capitalize text-slate-600">{app.portfolio_type}</td>
                    <td className="px-6 py-4 text-sm capitalize text-slate-600">{app.subscription_tier || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusColor(app.status)}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes(app.admin_notes || '');
                          console.log('Application data:', app);
                          console.log('Documents:', app.business_documents);
                          console.log('Images:', app.portfolio_images);
                          console.log('Videos:', app.portfolio_videos);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] transition hover:bg-blue-700"
                      >
                        Review
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]" onClick={() => setSelectedApp(null)} />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 lg:px-7">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  {selectedApp.company_details?.tradingName || selectedApp.company_details?.registeredBusinessName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedApp.company_details?.email} • {selectedApp.company_details?.contactPhoneNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {((selectedApp.business_documents?.length || 0) + (selectedApp.portfolio_images?.length || 0) + (selectedApp.portfolio_videos?.length || 0)) > 0 && (
                  <button
                    onClick={() => downloadAllDocuments(selectedApp)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Download All
                  </button>
                )}
                <button
                  onClick={() => setSelectedApp(null)}
                  className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-400 shadow-sm transition hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-6 lg:px-7 lg:py-8 space-y-8">
              {/* Company Details */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Company Details</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 rounded-3xl bg-slate-50 p-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Registered Name</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.registeredBusinessName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Trading Name</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.tradingName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Owner Name</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.ownersName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Email Address</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Contact Phone</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.contactPhoneNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Registration Number</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.companyRegNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">VAT Number</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.vatNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Website</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.website || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Business Physical Address</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.company_details?.businessPhysicalAddress || '—'}</p>
                  </div>
                </div>
              </section>

              {/* Service Details */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Service Details</h3>
                <div className="mt-4 rounded-3xl bg-slate-50 p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Portfolio Type</p>
                    <p className="mt-1 font-medium capitalize text-slate-900">{selectedApp.portfolio_type}</p>
                  </div>
                  {selectedApp.service_categories && Object.keys(selectedApp.service_categories).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Service Categories</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(selectedApp.service_categories).map(([key, value]) => {
                          if (!value) return null;
                          const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .trim();
                          return (
                            <span key={key} className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Coverage Provinces</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.coverage_provinces?.join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Coverage Cities</p>
                    <p className="mt-1 font-medium text-slate-900">{selectedApp.coverage_cities?.join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Business Description</p>
                    <p className="mt-1 font-medium text-slate-900 whitespace-pre-wrap">{selectedApp.business_description}</p>
                  </div>
                </div>
              </section>

              {/* Media Files */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Uploaded Files</h3>
                
                {/* Portfolio Images */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Portfolio Images ({selectedApp.portfolio_images?.length || 0})</p>
                  </div>
                  {selectedApp.portfolio_images?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {selectedApp.portfolio_images.map((url, idx) => {
                          const publicUrl = normalizeStorageUrl(url, STORAGE_BUCKETS.PORTFOLIO_IMAGES);
                          return (
                          <a key={idx} href={publicUrl} target="_blank" rel="noopener noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-blue-200">
                            <img src={publicUrl} alt={`Portfolio ${idx + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 transition group-hover:opacity-100">
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-xs font-medium text-white truncate">{getFileNameFromUrl(publicUrl)}</p>
                              </div>
                              <div className="absolute top-2 right-2">
                                <ExternalLink className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          </a>
                        );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">No portfolio images uploaded</p>
                    </div>
                  )}
                </div>

                {/* Portfolio Videos */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Portfolio Videos ({selectedApp.portfolio_videos?.length || 0})</p>
                  </div>
                  {selectedApp.portfolio_videos?.length > 0 ? (
                    <div className="space-y-2.5">
                        {selectedApp.portfolio_videos.map((url, idx) => {
                          const publicUrl = normalizeStorageUrl(url, STORAGE_BUCKETS.PORTFOLIO_VIDEOS);
                          return (
                          <a key={idx} href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                              <Play className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{getFileNameFromUrl(publicUrl)}</p>
                              <p className="text-xs text-slate-500">Video file</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </a>
                        );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <Play className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">No portfolio videos uploaded</p>
                    </div>
                  )}
                </div>

                {/* Business Documents */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-600">Business Documents ({selectedApp.business_documents?.length || 0})</p>
                  </div>
                  {selectedApp.business_documents?.length > 0 ? (
                    <div className="space-y-2.5">
                        {selectedApp.business_documents.map((url, idx) => {
                          const publicUrl = normalizeStorageUrl(url, STORAGE_BUCKETS.BUSINESS_DOCUMENTS);
                          return (
                          <a key={idx} href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                              <FileText className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{getFileNameFromUrl(publicUrl)}</p>
                              <p className="text-xs text-slate-500">Document file</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-slate-400" />
                          </a>
                        );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                      <FileText className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-2 text-sm text-slate-500">No business documents uploaded</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Subscription */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Subscription</h3>
                <div className="mt-4 rounded-3xl bg-slate-50 p-5">
                  <p className="font-semibold capitalize text-slate-900">{selectedApp.subscription_tier} Plan</p>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-600">Terms Accepted: {selectedApp.terms_accepted ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-600">Privacy Accepted: {selectedApp.privacy_accepted ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-slate-600">Marketing Consent: {selectedApp.marketing_consent ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Admin Notes */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  rows={4}
                />
              </section>
            </div>

            {/* Actions */}
            <div className="sticky bottom-0 flex justify-between gap-3 border-t border-slate-200 bg-white px-6 py-5 lg:px-7">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Application
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(selectedApp.id, 'needs_changes')}
                  className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => updateStatus(selectedApp.id, 'rejected')}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedApp.id, 'approved')}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(16,185,129,0.28)] transition hover:bg-emerald-700"
                >
                  Approve & Create Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Delete Application?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete the application from <span className="font-semibold">{selectedApp.company_details?.tradingName || selectedApp.company_details?.registeredBusinessName}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteApplication(selectedApp.id)}
                className="flex-1 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(225,29,72,0.28)] transition hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
