'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin, BlogPost } from '@/lib/supabase';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Newspaper,
  PenLine,
  Search,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';

export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabaseAdmin
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: number) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('blog_posts')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Failed to delete post. You may not have permission.');
        return;
      }

      setPosts((prev) => prev.filter((p) => p.id !== id));
      setSelectedPost(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(q) ||
      post.slug.toLowerCase().includes(q) ||
      (post.category || '').toLowerCase().includes(q) ||
      (post.author_name || '').toLowerCase().includes(q)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'draft':
        return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'archived':
        return 'bg-slate-100 text-slate-700 ring-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  };

  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <section className="rounded-[28px] border border-[#EDE9DD] bg-white px-6 py-6 shadow-[0_12px_32px_rgba(71,115,114,0.05)] lg:px-8 lg:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">Blog Posts</h1>
            <p className="mt-2 text-sm text-slate-500">
              Create, edit, and manage content for the platform blog and mobile app.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/blog/new')}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB]"
          >
            <PenLine className="h-4 w-4" />
            New Post
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Total Posts',
              value: posts.length,
              icon: FileText,
              color: 'from-[#113f59] to-[#9DCFDB]',
            },
            {
              label: 'Published',
              value: posts.filter((p) => p.status === 'published').length,
              icon: CheckCircle2,
              color: 'from-emerald-500 to-teal-400',
            },
            {
              label: 'Drafts',
              value: posts.filter((p) => p.status === 'draft').length,
              icon: Clock3,
              color: 'from-amber-500 to-orange-400',
            },
            {
              label: 'Total Views',
              value: totalViews,
              icon: TrendingUp,
              color: 'from-violet-500 to-indigo-400',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article
                key={stat.label}
                className="rounded-3xl border border-[#EDE9DD] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-[0_12px_24px_rgba(17,63,89,0.18)]`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Filters & Search */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, slug, category..."
            className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#F5F1E8] p-1">
          {['all', 'published', 'draft', 'archived'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filter === f
                  ? 'bg-white font-semibold text-[#113f59] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Posts Table */}
      <section className="overflow-hidden rounded-[28px] border border-[#EDE9DD] bg-white shadow-[0_10px_30px_rgba(71,115,114,0.04)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#EDE9DD]">
            <thead className="bg-[#F8F6F0]/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 lg:px-7">
                  Post
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Views
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Published
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9DD] bg-white">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-500">
                    {searchQuery ? 'No posts match your search.' : 'No blog posts yet. Create your first post!'}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="transition hover:bg-[#F8F6F0]/50">
                    <td className="px-6 py-4 lg:px-7">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D9EBE8] font-semibold text-[#113f59]">
                          {(post.title || 'B').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{post.title}</p>
                          <p className="truncate text-xs text-slate-500">{post.slug}</p>
                          {post.author_name && (
                            <p className="mt-0.5 text-xs text-slate-400">by {post.author_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{post.category || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${getStatusColor(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{post.view_count || 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowPreview(true);
                          }}
                          className="rounded-xl border border-[#EDE9DD] bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-[#9DCFDB] hover:text-[#113f59]"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/blog/${post.id}/edit`)}
                          className="rounded-xl border border-[#EDE9DD] bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-[#9DCFDB] hover:text-[#113f59]"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setShowDeleteConfirm(true);
                          }}
                          className="rounded-xl border border-[#EDE9DD] bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-rose-200 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Preview Modal */}
      {showPreview && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]" onClick={() => setShowPreview(false)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] border border-[#EDE9DD] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EDE9DD] bg-white px-6 py-5 lg:px-7">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#D9EBE8] p-2.5 text-[#113f59]">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Post Preview</h2>
                  <p className="text-xs text-slate-500">{selectedPost.slug}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-2xl border border-[#EDE9DD] bg-white p-2.5 text-slate-400 shadow-sm transition hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6 lg:px-7 lg:py-8 space-y-6">
              {selectedPost.cover_image_url && (
                <img
                  src={selectedPost.cover_image_url}
                  alt={selectedPost.title}
                  className="w-full h-56 object-cover rounded-2xl"
                />
              )}

              <div>
                <h1 className="text-2xl font-semibold text-slate-950">{selectedPost.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  {selectedPost.author_name && <span>By {selectedPost.author_name}</span>}
                  {selectedPost.category && (
                    <span className="rounded-full bg-[#D9EBE8] px-3 py-1 text-xs font-medium text-[#113f59]">
                      {selectedPost.category}
                    </span>
                  )}
                  <span>{selectedPost.read_time_minutes} min read</span>
                </div>
              </div>

              {selectedPost.excerpt && (
                <p className="text-base italic text-slate-600 border-l-4 border-[#9DCFDB] pl-4">
                  {selectedPost.excerpt}
                </p>
              )}

              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {selectedPost.content}
                </div>
              </div>

              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-[#EDE9DD]">
                  {selectedPost.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-[#F5F1E8] px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {selectedPost.video_url && (
                <div className="pt-4 border-t border-[#EDE9DD]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 mb-2">Video</p>
                  <a
                    href={selectedPost.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9DCFDB]"
                  >
                    Watch Video
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              )}

              {selectedPost.media_gallery && selectedPost.media_gallery.length > 0 && (
                <div className="pt-4 border-t border-[#EDE9DD]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 mb-3">Media Gallery</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedPost.media_gallery.map((item, i) => (
                      <div key={i} className="rounded-2xl border border-[#EDE9DD] overflow-hidden bg-[#F8F6F0]">
                        {item.type === 'image' ? (
                          <img src={item.url} alt={item.caption || ''} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-slate-900 text-white text-sm">
                            Video
                          </div>
                        )}
                        {item.caption && (
                          <p className="px-3 py-2 text-xs text-slate-500 truncate">{item.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[#EDE9DD] bg-white px-6 py-5 lg:px-7">
              <button
                onClick={() => {
                  setShowPreview(false);
                  router.push(`/dashboard/blog/${selectedPost.id}/edit`);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB]"
              >
                <Edit3 className="h-4 w-4" />
                Edit Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedPost && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-md rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Delete Post?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <span className="font-semibold">{selectedPost.title}</span>? This action
              cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-2xl border border-[#EDE9DD] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-[#F8F6F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(selectedPost.id)}
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
