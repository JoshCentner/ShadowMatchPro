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

// Check and create storage bucket for profile images if needed
export async function checkStorageBuckets() {
  try {
    log('Starting storage bucket check...', 'express');
    
    if (!supabaseUrl || !supabaseKey) {
      log('Skipping storage bucket check - Supabase credentials missing', 'express');
      return;
    }

    log(`Using Supabase URL: ${supabaseUrl}`, 'express');
    log('Checking bucket permissions and existence...', 'express');
    
    // Directly try to get the bucket first (more reliable than listing in some cases)
    let { data: bucketData, error: getBucketError } = await supabase.storage.getBucket(AVATARS_BUCKET);
    
    // If we get specific errors, we'll try listing buckets as a fallback
    if (getBucketError && (getBucketError.message.includes('not found') || getBucketError.message.includes('does not exist'))) {
      // Try listing buckets as a backup approach
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        log(`Error checking storage buckets: ${listError.message}`, 'error');
        return;
      }
      
      // Check if our bucket already exists
      const bucketExists = buckets?.some(bucket => bucket.name === AVATARS_BUCKET);
      
      if (bucketExists) {
        log(`Storage bucket ${AVATARS_BUCKET} is available (found via list)`, 'express');
      } else {
        log(`Attempting to create storage bucket ${AVATARS_BUCKET}...`, 'express');
        
        // Try to create the bucket
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
        
        if (createError) {
          if (createError.message.includes('already exists')) {
            log(`Bucket ${AVATARS_BUCKET} already exists but couldn't be listed`, 'express');
          } else if (createError.message.includes('policy')) {
            log(`Unable to create bucket ${AVATARS_BUCKET} due to permissions. Please create it in the Supabase dashboard.`, 'express');
            log(`File uploads may fail until the bucket is created.`, 'express');
          } else {
            log(`Error creating bucket: ${createError.message}`, 'error');
            log(`File uploads may fail until the bucket is created.`, 'express');
          }
        } else {
          log(`Successfully created storage bucket ${AVATARS_BUCKET}`, 'express');
        }
      }
    } else if (getBucketError) {
      log(`Error getting bucket details: ${getBucketError.message}`, 'error');
      log(`File uploads may fail until bucket issues are resolved.`, 'express');
    } else {
      // Bucket exists and we got its details
      log(`Storage bucket ${AVATARS_BUCKET} is available`, 'express');
      
      if (bucketData && !bucketData.public) {
        log(`Note: The ${AVATARS_BUCKET} bucket is not public, image URLs may not be directly accessible`, 'express');
      }
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