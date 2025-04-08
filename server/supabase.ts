import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.', 'error');
}

// Create a Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Test the connection and log the result
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('organisations').select('*').limit(1);
    
    if (error) {
      log(`Supabase connection test failed: ${error.message}`, 'error');
      return false;
    }
    
    log('Successfully connected to Supabase', 'express');
    return true;
  } catch (error: any) {
    log(`Error testing Supabase connection: ${error.message}`, 'error');
    return false;
  }
}