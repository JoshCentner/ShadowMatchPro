import { createClient } from '@supabase/supabase-js';

// For Vite, we need to use import.meta.env instead of process.env
// Note: Environment variables in Vite must be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');