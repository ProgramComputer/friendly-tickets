'use server'

import { createClient } from '@/lib/supabase/server'

const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadFile(file: File, sessionId: string) {
  try {
    // Validate file type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      throw new Error('File type not allowed')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit')
    }

    const supabase = createClient()
    const fileExt = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES]
    const fileName = `${sessionId}/${Date.now()}.${fileExt}`

    // Upload to chat-attachments bucket
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName)

    return {
      url: publicUrl,
      type: file.type,
      name: file.name,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

export async function deleteFile(filePath: string) {
  try {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('chat-attachments')
      .remove([filePath])

    if (error) throw error
  } catch (error) {
    console.error('Error deleting file:', error)
    throw error
  }
} 