'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseAdmin, BlogPost } from '@/lib/supabase';
import BlogEditor from '../../BlogEditor';

export default function EditBlogPostPage() {
  const params = useParams();
  const id = Number(params.id);
  const [post, setPost] = useState<BlogPost | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabaseAdmin.from('blog_posts').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (!error && data) setPost(data as BlogPost);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#113f59]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Post not found
      </div>
    );
  }

  return <BlogEditor mode="edit" initialPost={post} />;
}
