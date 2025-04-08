import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Create a mock Supabase client first with dummy methods
// This allows us to avoid the immediate "supabaseUrl is required" error
// while we wait for the real configuration to load
const createMockClient = () => {
  return {
    storage: {
      getBucket: async () => ({ data: null, error: new Error('Mock client - not initialized') }),
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Mock client - not initialized') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  } as unknown as ReturnType<typeof createClient>;
};

// Start with a mock client
let supabaseClient = createMockClient();
let isInitialized = false;

// Fetch config from server
async function initSupabase() {
  if (isInitialized) return;
  
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error('Failed to fetch Supabase configuration');
    }
    
    const config = await response.json();
    const { supabaseUrl, supabaseAnonKey } = config;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials are missing from server config');
      return;
    }
    
    // Create the real client with actual credentials
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isInitialized = true;
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

// Try to initialize now and whenever this module is imported
initSupabase();

// Export the client - it will be updated when initialization completes
export const supabase = supabaseClient;

// Define storage bucket name - must match the server-side bucket name
export const AVATARS_BUCKET = 'profile-images';

/**
 * Upload a profile image to Supabase storage
 * @param file File to upload
 * @param userId User ID to use in the file path
 * @returns URL of the uploaded file
 * @throws Error if upload fails
 */
export async function uploadProfileImage(file: File, userId: number): Promise<string> {
  try {
    // Check if Supabase has been initialized
    if (!isInitialized) {
      // Try initializing one more time
      await initSupabase();
      
      if (!isInitialized) {
        throw new Error(
          'Supabase is not configured. Please contact an administrator to set up Supabase credentials.'
        );
      }
    }
    
    // Check if the bucket exists first
    const { error: bucketCheckError } = await supabase.storage.getBucket(AVATARS_BUCKET);
    
    if (bucketCheckError) {
      // Handle specific error cases
      if (bucketCheckError.message.includes('not found') || 
          bucketCheckError.message.includes('does not exist')) {
        throw new Error(
          `Profile image storage is not set up. Please contact an administrator to create the '${AVATARS_BUCKET}' bucket in Supabase.`
        );
      }
      
      // Handle mock client case
      if (bucketCheckError.message.includes('not initialized')) {
        throw new Error(
          'Supabase storage is not yet initialized. Please try again in a moment.'
        );
      }
      
      throw bucketCheckError;
    }
    
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${uuidv4()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload file to Supabase
    const { data, error } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('policy')) {
        throw new Error(
          'You do not have permission to upload files. Please contact an administrator.'
        );
      }
      
      if (error.message.includes('not initialized')) {
        throw new Error(
          'Supabase storage is not yet initialized. Please try again in a moment.'
        );
      }
      
      throw error;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AVATARS_BUCKET)
      .getPublicUrl(data?.path || filePath);
    
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw error;
  }
}