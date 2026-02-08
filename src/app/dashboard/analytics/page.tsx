 'use client';

 import { useEffect, useMemo, useState } from 'react';
 import { supabase } from '@/lib/supabase';

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
       <div className="flex items-center justify-center h-64">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
       </div>
     );
   }

   const cards = [
     { label: 'Total Users', value: stats.totalUsers, color: 'bg-blue-500' },
     { label: 'Total Vendors', value: stats.totalVendors, color: 'bg-green-500' },
     { label: 'Total Applications', value: stats.totalApplications, color: 'bg-purple-500' },
     { label: 'Pending Applications', value: stats.pendingApplications, color: 'bg-yellow-500' },
   ];

   const rangeLabel = range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days';

   return (
     <div>
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
         <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

         <div className="flex gap-3 items-center">
           <select
             value={range}
             onChange={(e) => setRange(e.target.value as RangeKey)}
             className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
             <option value="7d">Last 7 days</option>
             <option value="30d">Last 30 days</option>
             <option value="90d">Last 90 days</option>
           </select>
           <button
             onClick={fetchAnalytics}
             className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
           >
             Refresh
           </button>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {cards.map((c) => (
           <div key={c.label} className="bg-white rounded-lg shadow p-6">
             <div className="flex items-center">
               <div className={`${c.color} rounded-full p-3 mr-4`}>
                 <div className="w-6 h-6 text-white font-bold text-center">{c.value}</div>
               </div>
               <div>
                 <p className="text-sm font-medium text-gray-600">{c.label}</p>
                 <p className="text-2xl font-bold text-gray-900">{c.value}</p>
               </div>
             </div>
           </div>
         ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white rounded-lg shadow p-6">
           <h2 className="text-xl font-semibold text-gray-900 mb-4">Application Status</h2>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-gray-700">Approved</span>
               <span className="font-semibold text-gray-900">{stats.approvedApplications}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-700">Rejected</span>
               <span className="font-semibold text-gray-900">{stats.rejectedApplications}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-700">Pending</span>
               <span className="font-semibold text-gray-900">{stats.pendingApplications}</span>
             </div>
           </div>
         </div>

         <div className="bg-white rounded-lg shadow p-6">
           <h2 className="text-xl font-semibold text-gray-900 mb-4">Growth ({rangeLabel})</h2>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-gray-700">New Users</span>
               <span className="font-semibold text-gray-900">{stats.newUsersInRange}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-700">New Vendors</span>
               <span className="font-semibold text-gray-900">{stats.newVendorsInRange}</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-700">New Applications</span>
               <span className="font-semibold text-gray-900">{stats.newApplicationsInRange}</span>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 }
