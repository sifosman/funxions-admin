 'use client';

 import { useEffect, useMemo, useState } from 'react';
 import { supabase, User } from '@/lib/supabase';

 export default function UsersPage() {
   const [users, setUsers] = useState<User[]>([]);
   const [loading, setLoading] = useState(true);
   const [query, setQuery] = useState('');
   const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

   useEffect(() => {
     fetchUsers();
   }, []);

   const fetchUsers = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('users')
         .select('id, email, full_name, role, created_at')
         .order('created_at', { ascending: false });

       if (error) throw error;
       setUsers((data as User[]) || []);
     } catch (error) {
       console.error('Error fetching users:', error);
     } finally {
       setLoading(false);
     }
   };

   const filteredUsers = useMemo(() => {
     const q = query.trim().toLowerCase();
     if (!q) return users;
     return users.filter((u) => {
       const email = (u.email || '').toLowerCase();
       const name = (u.full_name || '').toLowerCase();
       return email.includes(q) || name.includes(q);
     });
   }, [users, query]);

   const updateRole = async (userId: string, role: User['role']) => {
     setUpdatingUserId(userId);
     try {
       const { error } = await supabase.from('users').update({ role }).eq('id', userId);
       if (error) throw error;
       setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
     } catch (error) {
       console.error('Error updating user role:', error);
       alert('Failed to update user role');
     } finally {
       setUpdatingUserId(null);
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
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
         <h1 className="text-3xl font-bold text-gray-900">Users</h1>

         <input
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="Search by name or email..."
           className="w-full sm:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
         />
       </div>

       <div className="bg-white rounded-lg shadow overflow-hidden">
         <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-gray-50">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
             </tr>
           </thead>
           <tbody className="bg-white divide-y divide-gray-200">
             {filteredUsers.length === 0 ? (
               <tr>
                 <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                   No users found
                 </td>
               </tr>
             ) : (
               filteredUsers.map((u) => (
                 <tr key={u.id} className="hover:bg-gray-50">
                   <td className="px-6 py-4">
                     <div>
                       <p className="font-medium text-gray-900">{u.full_name || 'Unnamed'}</p>
                       <p className="text-sm text-gray-500">{u.email}</p>
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <span
                       className={`px-2 py-1 text-xs font-medium rounded-full ${
                         u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                       }`}
                     >
                       {u.role}
                     </span>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <select
                       value={u.role}
                       disabled={updatingUserId === u.id}
                       onChange={(e) => updateRole(u.id, e.target.value as User['role'])}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                     >
                       <option value="user">user</option>
                       <option value="admin">admin</option>
                     </select>
                   </td>
                 </tr>
               ))
             )}
           </tbody>
         </table>
       </div>
     </div>
   );
 }
