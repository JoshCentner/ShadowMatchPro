import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.', 'error');
}

// Define bucket name for profile images
export const AVATARS_BUCKET = 'profile-images';

// Create a Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Check storage bucket for profile images
export async function checkStorageBuckets() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      log('Skipping storage bucket check - Supabase credentials missing', 'express');
      return;
    }
    
    // Check if the profile images bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      log(`Error checking storage buckets: ${listError.message}`, 'error');
      return;
    }
    
    // Check if our bucket already exists
    const bucketExists = buckets?.some(bucket => bucket.name === AVATARS_BUCKET);
    
    if (bucketExists) {
      log(`Storage bucket ${AVATARS_BUCKET} is available`, 'express');
      
      // Get bucket public status
      const { data, error: getError } = await supabase.storage.getBucket(AVATARS_BUCKET);
      
      if (getError) {
        log(`Error getting bucket details: ${getError.message}`, 'error');
      } else if (data && !data.public) {
        log(`Note: The ${AVATARS_BUCKET} bucket is not public, image URLs may not be directly accessible`, 'express');
      }
    } else {
      log(`Storage bucket ${AVATARS_BUCKET} does not exist. You may need to create it in the Supabase dashboard.`, 'express');
      log(`File uploads may fail until the bucket is created.`, 'express');
    }
  } catch (error: any) {
    log(`Error checking storage: ${error.message}`, 'error');
  }
}

// Test the connection and initialize storage
export async function testSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseKey) {
      log('Supabase credentials are missing, skipping initialization', 'error');
      return false;
    }
    
    // Test that the Supabase client can connect by checking if buckets are accessible
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      log(`Supabase storage connection test failed: ${error.message}`, 'error');
      return false;
    }
    
    log('Successfully connected to Supabase storage', 'express');
    
    // Check storage buckets when connection is successful
    await checkStorageBuckets();
    
    return true;
  } catch (error: any) {
    log(`Error testing Supabase connection: ${error.message}`, 'error');
    return false;
  }
}