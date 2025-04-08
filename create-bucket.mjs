import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const AVATARS_BUCKET = 'profile-images';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    console.log(`Attempting to create storage bucket ${AVATARS_BUCKET}...`);
    
    // Try to create the bucket
    const { data, error } = await supabase.storage.createBucket(AVATARS_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`Bucket ${AVATARS_BUCKET} already exists.`);
        
        // Update bucket to ensure it's public
        const { error: updateError } = await supabase.storage.updateBucket(AVATARS_BUCKET, {
          public: true
        });
        
        if (updateError) {
          console.error(`Error updating bucket to public: ${updateError.message}`);
        } else {
          console.log(`Bucket ${AVATARS_BUCKET} updated to be public.`);
        }
      } else {
        console.error(`Error creating bucket: ${error.message}`);
      }
    } else {
      console.log(`Successfully created storage bucket ${AVATARS_BUCKET}`);
    }
    
    // Create or update a public policy for the bucket
    try {
      const policyName = `${AVATARS_BUCKET}-public-policy`;
      
      // Try to update policy first (in case it exists)
      const { error: policyError } = await supabase.storage.from(AVATARS_BUCKET).updateBucketPolicy(
        '*',
        'SELECT'
      );
      
      if (policyError) {
        console.error(`Error updating bucket policy: ${policyError.message}`);
      } else {
        console.log(`Successfully updated bucket policy to allow public access`);
      }
    } catch (policyError) {
      console.error(`Error with bucket policy: ${policyError.message}`);
    }
    
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
  }
}

// Execute the function
createBucket()
  .then(() => {
    console.log('Operation completed');
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });