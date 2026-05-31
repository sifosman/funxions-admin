'use client';

import { useRef } from 'react';
import { Bold, Italic, Link as LinkIcon, Image as ImageIcon, List, ListOrdered, Loader2, Upload, Video, X } from 'lucide-react';

export type ContentProps = {
  form: Record<string, any>;
  setForm: (updater: (prev: any) => any) => void;
  uploading: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
};

export default function EditorContent({ form, setForm, uploading, onUpload }: ContentProps) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const genSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  const readTime = (c: string) => Math.max(1, Math.ceil(c.trim().split(/\s+/).length / 200));

  const insert = (fmt: string) => {
    const ta = contentRef.current; if (!ta) return;
    const s = ta.selectionStart, e2 = ta.selectionEnd, v = ta.value, sel = v.substring(s, e2);
    const reps: Record<string, string> = {
      bold: `**${sel || 'bold'}**`, italic: `*${sel || 'italic'}*`, link: `[${sel || 'text'}](https://)`,
      image: `\n![${sel || 'alt'}](https://)\n`, ul: `\n- ${sel || 'item'}\n- item\n`, ol: `\n1. ${sel || 'item'}\n2. item\n`,
    };
    const rep = reps[fmt] || sel;
    setForm(p => ({ ...p, content: v.substring(0, s) + rep + v.substring(e2) }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(s + rep.length, s + rep.length); }, 0);
  };

  const Btn = ({ icon: I, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} title={label} className="rounded-lg p-2 text-slate-500 transition hover:bg-[#D9EBE8] hover:text-[#113f59]">
      <I className="h-4 w-4" />
    </button>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-7">
        <h2 className="text-lg font-semibold text-slate-900">Post Details</h2>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
            <input type="text" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value, slug: (!p.slug || !p.id) ? genSlug(e.target.value) : p.slug }))} placeholder="Enter an engaging title..."
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Slug *</label>
            <input type="text" value={form.slug || ''} onChange={e => setForm(p => ({ ...p, slug: genSlug(e.target.value) }))} placeholder="post-url-slug"
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
            <p className="mt-1 text-xs text-slate-400">URL: /blog/{form.slug}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Excerpt</label>
            <textarea value={form.excerpt || ''} onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))} placeholder="Short summary for previews and SEO..." rows={3}
              className="w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-7">
        <h2 className="text-lg font-semibold text-slate-900">Content</h2>
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-[#EDE9DD] bg-[#F8F6F0] p-1.5">
            <Btn icon={Bold} label="Bold" onClick={() => insert('bold')} />
            <Btn icon={Italic} label="Italic" onClick={() => insert('italic')} />
            <div className="mx-1 h-5 w-px bg-[#EDE9DD]" />
            <Btn icon={LinkIcon} label="Link" onClick={() => insert('link')} />
            <Btn icon={ImageIcon} label="Image" onClick={() => insert('image')} />
            <div className="mx-1 h-5 w-px bg-[#EDE9DD]" />
            <Btn icon={List} label="Bullet" onClick={() => insert('ul')} />
            <Btn icon={ListOrdered} label="Numbered" onClick={() => insert('ol')} />
          </div>
          <textarea ref={contentRef} value={form.content || ''} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Write your blog post content here..." rows={16}
            className="w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 py-3 font-mono text-sm leading-7 text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          <p className="text-xs text-slate-400">Markdown supported. Read time: {readTime(form.content || '')} min</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#EDE9DD] bg-white p-6 shadow-[0_10px_30px_rgba(71,115,114,0.04)] lg:p-7">
        <h2 className="text-lg font-semibold text-slate-900">Media</h2>
        <div className="mt-5 space-y-6">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><Video className="h-4 w-4 text-slate-400" /> Video URL</label>
            <input type="text" value={form.video_url || ''} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="YouTube, Vimeo, or direct video link"
              className="h-12 w-full rounded-2xl border border-[#EDE9DD] bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#9DCFDB] focus:ring-4 focus:ring-[#D9EBE8]" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><ImageIcon className="h-4 w-4 text-slate-400" /> Media Gallery</label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-[#EDE9DD] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-[#F8F6F0]">
              {uploading === 'media_gallery' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload Image
              <input type="file" accept="image/*" onChange={e => onUpload(e, 'media_gallery')} className="hidden" />
            </label>
            {form.media_gallery && form.media_gallery.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {form.media_gallery.map((item: any, i: number) => (
                  <div key={i} className="group relative rounded-2xl border border-[#EDE9DD] overflow-hidden bg-[#F8F6F0]">
                    <img src={item.url} alt="" className="w-full h-28 object-cover" />
                    <button onClick={() => setForm(p => ({ ...p, media_gallery: p.media_gallery?.filter((_: any, idx: number) => idx !== i) || [] }))} className="absolute right-2 top-2 rounded-xl bg-white/90 p-1.5 text-slate-500 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                    {item.caption && <p className="px-3 py-2 text-xs text-slate-500 truncate">{item.caption}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
