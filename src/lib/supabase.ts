import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

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

// Storage bucket helper functions
export const STORAGE_BUCKETS = {
  BUSINESS_DOCUMENTS: 'business-documents',
  PORTFOLIO_IMAGES: 'portfolio-images',
  PORTFOLIO_VIDEOS: 'portfolio-videos',
} as const;

/**
 * Get public URL for a file stored in Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns Public URL for the file
 */
export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Convert a file path or URL to a proper public URL
 * If already a full URL, returns as-is
 * If a path, generates public URL from the appropriate bucket
 * @param filePathOrUrl - File path or URL
 * @param bucket - The storage bucket name (optional, will try to detect)
 * @returns Public URL
 */
export function normalizeStorageUrl(filePathOrUrl: string, bucket?: string): string {
  // If already a full URL, return as-is
  if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
    return filePathOrUrl;
  }
  
  // If bucket is provided, use it
  if (bucket) {
    return getStoragePublicUrl(bucket, filePathOrUrl);
  }
  
  // Try to detect bucket from path
  if (filePathOrUrl.includes('business-documents') || filePathOrUrl.includes('documents')) {
    return getStoragePublicUrl(STORAGE_BUCKETS.BUSINESS_DOCUMENTS, filePathOrUrl);
  } else if (filePathOrUrl.includes('portfolio-images') || filePathOrUrl.includes('photos')) {
    return getStoragePublicUrl(STORAGE_BUCKETS.PORTFOLIO_IMAGES, filePathOrUrl);
  } else if (filePathOrUrl.includes('portfolio-videos') || filePathOrUrl.includes('videos')) {
    return getStoragePublicUrl(STORAGE_BUCKETS.PORTFOLIO_VIDEOS, filePathOrUrl);
  }

  // Default: assume it's already a valid URL or return as-is
  return filePathOrUrl;
}

/**
 * Get signed URL for private files (with expiration)
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL for the file
 */
export async function getStorageSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data?.signedUrl || null;
}
