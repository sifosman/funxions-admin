'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin, BlogPost, STORAGE_BUCKETS } from '@/lib/supabase';
import { ArrowLeft, Check, Loader2, Save } from 'lucide-react';
import EditorContent from './EditorContent';
import EditorSidebar from './EditorSidebar';

type Props = { initialPost?: BlogPost; mode: 'create' | 'edit'; };

export default function BlogEditor({ initialPost, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<{ id: number; title: string }[]>([]);

  const [form, setForm] = useState<Record<string, any>>({
    title: '', slug: '', content: '', excerpt: '', category: '', tags: [],
    cover_image_url: '', featured_image_url: '', video_url: '', media_gallery: [],
    related_post_ids: [], meta_title: '', meta_description: '',
    app_display_areas: ['home', 'blog_section'],
    author_name: 'Funxons Team', author_avatar_url: '', status: 'draft',
    is_published: false, read_time_minutes: 5, audience: 'all', published_at: '',
  });

  useEffect(() => {
    if (initialPost) {
      setForm({
        ...initialPost,
        tags: initialPost.tags || [],
        media_gallery: initialPost.media_gallery || [],
        related_post_ids: initialPost.related_post_ids || [],
        app_display_areas: initialPost.app_display_areas || ['home', 'blog_section'],
      });
    }
  }, [initialPost]);

  useEffect(() => {
    supabaseAdmin.from('blog_posts').select('id, title, slug')
      .neq('id', initialPost?.id || 0).order('title', { ascending: true })
      .then(({ data }) => setAllPosts(data || []));
  }, [initialPost?.id]);

  const setFormWrapper = (updater: (prev: any) => any) => setForm(prev => updater(prev));

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const ext = file.name.split('.').pop();
      const folder = field === 'media_gallery' ? 'gallery' : field.replace('_url', '');
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error } = await supabaseAdmin.storage.from(STORAGE_BUCKETS.BLOG_IMAGES).upload(path, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data } = supabaseAdmin.storage.from(STORAGE_BUCKETS.BLOG_IMAGES).getPublicUrl(path);
      if (field === 'media_gallery') {
        setForm(p => ({ ...p, media_gallery: [...(p.media_gallery || []), { url: data.publicUrl, type: 'image', caption: '' }] }));
      } else {
        setForm(p => ({ ...p, [field]: data.publicUrl }));
      }
    } catch (err) { console.error(err); alert('Upload failed'); }
    setUploading(null);
  };

  const readTime = (c: string) => Math.max(1, Math.ceil(c.trim().split(/\s+/).length / 200));

  const save = async (publish = false) => {
    if (!form.title || !form.slug || !form.content) { alert('Title, slug, and content required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form, read_time_minutes: readTime(form.content || ''),
        status: publish ? 'published' : form.status,
        is_published: publish ? true : form.is_published,
        published_at: publish && !form.published_at ? new Date().toISOString() : form.published_at,
        updated_at: new Date().toISOString(),
      };
      if (mode === 'create') {
        const { error } = await supabaseAdmin.from('blog_posts').insert({ ...payload, created_at: new Date().toISOString(), view_count: 0, comment_count: 0 } as any);
        if (error) throw error;
      } else {
        const { error } = await supabaseAdmin.from('blog_posts').update(payload as any).eq('id', initialPost!.id);
        if (error) throw error;
      }
      router.push('/dashboard/blog');
    } catch (err) { console.error(err); alert('Save failed'); setSaving(false); }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/blog')} className="rounded-2xl border border-[#EDE9DD] bg-white p-2.5 text-slate-500 shadow-sm transition hover:border-[#9DCFDB] hover:text-[#113f59]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">{mode === 'create' ? 'New Blog Post' : 'Edit Blog Post'}</h1>
            <p className="mt-1 text-sm text-slate-500">{mode === 'create' ? 'Create engaging content for your audience.' : `Editing: ${form.title}`}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => save(false)} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl border border-[#EDE9DD] bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#F8F6F0] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
          </button>
          <button onClick={() => save(true)} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-[#113f59] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(17,63,89,0.28)] transition hover:bg-[#9DCFDB] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Publish
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.7fr)]">
        <EditorContent form={form} setForm={setFormWrapper} uploading={uploading} onUpload={uploadFile} />
        <EditorSidebar form={form} setForm={setFormWrapper} uploading={uploading} onUpload={uploadFile} allPosts={allPosts} />
      </div>
    </div>
  );
}
