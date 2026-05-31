 'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase, User } from '@/lib/supabase';
import {
  ArrowRight,
  Crown,
  Search,
  Shield,
  Users,
  X,
} from 'lucide-react';

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
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Users</h1>
            <p className="mt-2 text-sm text-slate-500">Manage user roles and permissions across the platform.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'from-blue-600 to-sky-400' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Crown, color: 'from-violet-500 to-indigo-400' },
            { label: 'Regular Users', value: users.filter(u => u.role === 'user').length, icon: Shield, color: 'from-emerald-500 to-teal-400' },
            { label: 'This Week', value: users.filter(u => u.created_at && new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length, icon: ArrowRight, color: 'from-amber-500 to-orange-400' },
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
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Created</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-14 text-center text-sm text-slate-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-700">
                          {(u.full_name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{u.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${
                          u.role === 'admin'
                            ? 'bg-violet-50 text-violet-700 ring-violet-100'
                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role}
                        disabled={updatingUserId === u.id}
                        onChange={(e) => updateRole(u.id, e.target.value as User['role'])}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm outline-none transition disabled:opacity-50 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
      </section>
    </div>
  );
 }
