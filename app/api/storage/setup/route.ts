import { NextResponse } from 'next/server'
import { setupStorageBucket } from '@/lib/services/storage-setup'

export async function POST() {
  try {
    const result = await setupStorageBucket()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set up storage bucket' },
      { status: 500 }
    )
  }
} 