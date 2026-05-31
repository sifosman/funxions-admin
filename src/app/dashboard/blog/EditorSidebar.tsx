'use client';

import { useState } from 'react';
import { Loader2, ImageIcon, X } from 'lucide-react';

export type SidebarProps = {
  form: Record<string, any>;
  setForm: (updater: (prev: any) => any) => void;
  uploading: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  allPosts: { id: number; title: string }[];
};

const DISPLAY_OPTS = [
  { value: 'home', label: 'Home Feed' },
  { value: 'explore', label: 'Explore' },
  { value: 'vendor_detail', label: 'Vendor Detail' },
  { value: 'event_planning', label: 'Event Planning' },
  { value: 'profile', label: 'User Profile' },
  { value: 'blog_section', label: 'Blog Section' },
];

export default function EditorSidebar({ form, setForm, uploading, onUpload, allPosts }: SidebarProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !(form.tags || []).includes(tag)) setForm(p => ({ ...p, tags: [...(p.tags || []), tag] }));
      setTagInput('');
    }
  };
  const removeTag = (tag: string) => setForm(p => ({ ...p, tags: p.tags?.filter((t: string) => t !== tag) || [] }));

  const toggleRelated = (id: number) => setForm(p => {
    const cur = p.related_post_ids || [];
    return { ...p, related_post_ids: cur.includes(id) ? cur.filter((x: number) => x !== id) : [...cur, id] };
  });

  const toggleArea = (a: string) => setForm(p => {
    const cur = p.app_display_areas || [];
    return { ...p, app_display_areas: cur.includes(a) ? cur.filter((x: string) => x !== a) : [...cur, a] };
  });

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-7">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );

  return (
    <div className="space-y-6">
      <Card title="Publishing">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
            <select value={form.status || 'draft'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]">
              {['draft', 'published', 'archived'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Publish Date</label>
            <input type="datetime-local" value={form.published_at ? new Date(form.published_at).toISOString().slice(0, 16) : ''}
              onChange={e => setForm(p => ({ ...p, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Audience</label>
            <select value={form.audience || 'all'} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]">
              {['all', 'vendors', 'attendees', 'premium'].map(a => <option key={a} value={a}>{a === 'all' ? 'All Users' : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Images">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Cover Image</label>
            {form.cover_image_url ? (
              <div className="relative rounded-2xl border border-[#EDE9DD] overflow-hidden">
                <img src={form.cover_image_url} alt="Cover" className="w-full h-32 object-cover" />
                <button onClick={() => setForm(p => ({ ...p, cover_image_url: '' }))} className="absolute right-2 top-2 rounded-xl bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-rose-600"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EDE9DD] bg-[#F8F6F0] px-4 py-8 transition hover:border-[#9DCFDB]">
                {uploading === 'cover_image_url' ? <Loader2 className="h-8 w-8 animate-spin text-slate-400" /> : <ImageIcon className="h-8 w-8 text-slate-400" />}
                <p className="mt-2 text-sm text-slate-500">Upload cover image</p>
                <input type="file" accept="image/*" onChange={e => onUpload(e, 'cover_image_url')} className="hidden" />
              </label>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Featured Image</label>
            {form.featured_image_url ? (
              <div className="relative rounded-2xl border border-[#EDE9DD] overflow-hidden">
                <img src={form.featured_image_url} alt="Featured" className="w-full h-24 object-cover" />
                <button onClick={() => setForm(p => ({ ...p, featured_image_url: '' }))} className="absolute right-2 top-2 rounded-xl bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-rose-600"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#EDE9DD] bg-[#F8F6F0] px-4 py-6 transition hover:border-[#9DCFDB]">
                {uploading === 'featured_image_url' ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : <ImageIcon className="h-6 w-6 text-slate-400" />}
                <p className="mt-1 text-xs text-slate-500">Upload featured image</p>
                <input type="file" accept="image/*" onChange={e => onUpload(e, 'featured_image_url')} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </Card>

      <Card title="Taxonomy">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
            <input type="text" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Planning, Venues"
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tags</label>
            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTag} placeholder="Type tag and press Enter"
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
            <div className="mt-2 flex flex-wrap gap-2">
              {(form.tags || []).map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#D9EBE8] px-3 py-1 text-xs font-medium text-[#113f59]">
                  {tag} <button onClick={() => removeTag(tag)} className="hover:text-rose-600"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Author">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Author Name</label>
            <input type="text" value={form.author_name || ''} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))}
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Author Avatar URL</label>
            <input type="text" value={form.author_avatar_url || ''} onChange={e => setForm(p => ({ ...p, author_avatar_url: e.target.value }))} placeholder="https://..."
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
        </div>
      </Card>

      <Card title="Internal Linking">
        <p className="mb-3 text-sm text-slate-500">Select related posts:</p>
        <div className="max-h-60 overflow-y-auto rounded-2xl border border-[#EDE9DD] bg-[#F8F6F0] p-2">
          {allPosts.length === 0 ? <p className="px-3 py-4 text-sm text-slate-500">No other posts</p> :
            allPosts.map(post => {
              const checked = (form.related_post_ids || []).includes(post.id);
              return (
                <label key={post.id} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white">
                  <input type="checkbox" checked={checked} onChange={() => toggleRelated(post.id)} className="h-4 w-4 rounded border-[#EDE9DD] text-[#113f59] focus:ring-[#9DCFDB]" />
                  <span className="text-sm text-slate-700 truncate">{post.title}</span>
                </label>
              );
            })}
        </div>
      </Card>

      <Card title="SEO">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Meta Title</label>
            <input type="text" value={form.meta_title || ''} onChange={e => setForm(p => ({ ...p, meta_title: e.target.value }))} placeholder="SEO title..."
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Meta Description</label>
            <textarea value={form.meta_description || ''} onChange={e => setForm(p => ({ ...p, meta_description: e.target.value }))} placeholder="SEO description..." rows={3}
              className="w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
        </div>
      </Card>

      <Card title="Mobile App Display">
        <p className="mb-3 text-sm text-slate-500">Where this post appears in the app:</p>
        <div className="space-y-2">
          {DISPLAY_OPTS.map(opt => {
            const checked = (form.app_display_areas || []).includes(opt.value);
            return (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F8F6F0]">
                <input type="checkbox" checked={checked} onChange={() => toggleArea(opt.value)} className="h-4 w-4 rounded border-[#EDE9DD] text-[#113f59] focus:ring-[#9DCFDB]" />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
