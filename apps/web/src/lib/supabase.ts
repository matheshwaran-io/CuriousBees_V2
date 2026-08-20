import { supabase } from './supabase/client';

export { supabase };

/**
 * Helper to get user profile image from Supabase Storage bucket
 */
export const getStoragePublicUrl = (bucket: string, path: string): string => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

