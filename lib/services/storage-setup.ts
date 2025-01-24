'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function setupStorageBucket() {
  const supabase = createServerSupabaseClient()
  const BUCKET_NAME = 'chat-attachments'
  
  try {
    // Get existing buckets
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets()

    if (listError) throw listError

    const existingBucket = buckets?.find(b => b.name === BUCKET_NAME)

    if (!existingBucket) {
      // Create new bucket if it doesn't exist
      const { data: bucket, error: createError } = await supabase
        .storage
        .createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880, // 5MB in bytes
          allowedMimeTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        })

      if (createError) throw createError
      console.log('Storage bucket created:', bucket)
      return { success: true, bucket, action: 'created' }
    }

    // Update existing bucket settings
    const { data: bucket, error: updateError } = await supabase
      .storage
      .updateBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      })

    if (updateError) throw updateError
    console.log('Storage bucket updated:', bucket)
    return { success: true, bucket, action: 'updated' }

  } catch (error) {
    console.error('Error setting up storage bucket:', error)
    return { success: false, error }
  }
} 