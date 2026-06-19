import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-please-set-env-variables.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Warning: Supabase environment variables are missing! Using placeholder values for build compilation.');
}

// Standard client (using anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (using service role key, server-side only)
export const supabaseAdmin = supabaseServiceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;
