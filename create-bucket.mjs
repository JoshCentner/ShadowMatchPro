import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials are missing');
  process.exit(1);
}

const AVATARS_BUCKET = 'profile-images';

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === AVATARS_BUCKET);
    
    if (bucketExists) {
      console.log(`Bucket ${AVATARS_BUCKET} already exists.`);
      
      // Update bucket to be public
      const { error: updateError } = await supabase.storage.updateBucket(AVATARS_BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (updateError) {
        console.error('Error updating bucket:', updateError.message);
      } else {
        console.log(`Updated bucket ${AVATARS_BUCKET} settings.`);
      }
    } else {
      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError.message);
      } else {
        console.log(`Created bucket ${AVATARS_BUCKET}.`);
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createBucket();

