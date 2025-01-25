import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { getSession } from '@/lib/supabase/server'

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define message attachment upload endpoint
  messageAttachment: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
    pdf: { maxFileSize: '8MB', maxFileCount: 1 },
    text: { maxFileSize: '1MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getSession()

      if (!session) throw new Error('Unauthorized')

      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', {
        userId: metadata.userId,
        fileName: file.name,
        fileUrl: file.url,
      })
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter 