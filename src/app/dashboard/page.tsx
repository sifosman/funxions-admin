'use client';

import { useEffect, useState } from 'react';
import { supabaseAdmin, SubscriberApplication } from '@/lib/supabase';

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { label: 'Pending Applications', value: stats.pendingApplications, color: 'bg-yellow-500' },
    { label: 'Total Vendors', value: stats.totalVendors, color: 'bg-blue-500' },
    { label: 'Total Attendees', value: stats.totalAttendees, color: 'bg-green-500' },
    { label: 'Applications This Week', value: stats.applicationsThisWeek, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 lg:mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 lg:p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-full p-2 lg:p-3 mr-3 lg:mr-4`}>
                <div className="w-5 h-5 lg:w-6 lg:h-6 text-white font-bold text-center">
                  {stat.value}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs lg:text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900">Recent Applications</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentApplications.length === 0 ? (
            <div className="px-4 lg:px-6 py-6 lg:py-8 text-center text-gray-500">
              No applications yet
            </div>
          ) : (
            recentApplications.map((app) => (
              <div key={app.id} className="px-4 lg:px-6 py-3 lg:py-4 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">
                      {app.company_details?.tradingName || 'Unknown Business'}
                    </p>
                    <p className="text-xs lg:text-sm text-gray-500">
                      {app.portfolio_type} • {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium self-start lg:self-auto ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
