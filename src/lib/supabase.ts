import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase; // Fallback to regular client if service key not available

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

export type Vendor = {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  email?: string;
  location?: string;
  subscription_tier?: string;
  subscription_status?: 'active' | 'inactive' | 'cancelled' | string;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  billing_period?: 'monthly' | 'yearly';
  billing_email?: string;
  billing_name?: string;
  billing_phone?: string;
  next_payment_due?: string;
  last_payment_at?: string;
  reminder_5day_sent?: boolean;
  reminder_1day_sent?: boolean;
  created_at?: string;
};

export type VendorSubscription = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  location?: string;
  subscription_tier: string;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'expired';
  subscription_started_at?: string;
  subscription_expires_at?: string;
  billing_period?: 'monthly' | 'yearly';
  billing_email?: string;
  billing_name?: string;
  billing_phone?: string;
  next_payment_due?: string;
  last_payment_at?: string;
  reminder_5day_sent?: boolean;
  reminder_1day_sent?: boolean;
  days_until_expiry?: number;
  photo_usage_count?: number;
  total_invoices?: number;
  total_paid?: number;
  needs_5day_reminder?: boolean;
  needs_1day_reminder?: boolean;
  created_at?: string;
};

export type SubscriptionInvoice = {
  id: string;
  vendor_id: string;
  invoice_number: string;
  amount: number;
  tier: string;
  billing_period: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_method?: string;
  payfast_payment_id?: string;
  billing_email?: string;
  billing_name?: string;
  billing_phone?: string;
  created_at: string;
  paid_at?: string;
  due_date?: string;
};
