import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types from your database
export type SubscriberApplication = {
  id: string;
  user_id: string;
  portfolio_type: 'venue' | 'vendor';
  company_details: Record<string, any>;
  service_categories: Record<string, any>;
  coverage_provinces: string[];
  coverage_cities: string[];
  business_description: string;
  portfolio_images: string[];
  portfolio_videos: string[];
  business_documents: string[];
  subscription_tier: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  marketing_consent: boolean;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'needs_changes';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'user';
  created_at: string;
};
