'use client';

import { useEffect, useState } from 'react';
import { supabase, SubscriberApplication } from '@/lib/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingApplications: 0,
    totalVendors: 0,
    totalUsers: 0,
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
      const { count: pendingCount } = await supabase
        .from('subscriber_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total vendors
      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get total users
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get applications this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: weeklyCount } = await supabase
        .from('subscriber_applications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get recent applications
      const { data: recent } = await supabase
        .from('subscriber_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        pendingApplications: pendingCount || 0,
        totalVendors: vendorsCount || 0,
        totalUsers: usersCount || 0,
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
    { label: 'Total Users', value: stats.totalUsers, color: 'bg-green-500' },
    { label: 'Applications This Week', value: stats.applicationsThisWeek, color: 'bg-purple-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`${stat.color} rounded-full p-3 mr-4`}>
                <div className="w-6 h-6 text-white font-bold text-center">
                  {stat.value}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentApplications.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No applications yet
            </div>
          ) : (
            recentApplications.map((app) => (
              <div key={app.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {app.company_details?.tradingName || 'Unknown Business'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {app.portfolio_type} • {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
