import { useSupabase } from '@/lib/hooks/use-supabase'
import { v4 as uuidv4 } from 'uuid'

interface UploadResult {
  path: string
  url: string
}

export function useUpload() {
  const supabase = useSupabase()

  const uploadFile = async (file: File): Promise<UploadResult> => {
    try {
      // Create a unique file name to prevent collisions
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `uploads/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase
        .storage
        .from('attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('attachments')
        .getPublicUrl(filePath)

      return {
        path: filePath,
        url: publicUrl
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  return {
    uploadFile
  }
} 