import { NextResponse } from 'next/server'

// Temporarily disabled for build
export async function POST() {
  return NextResponse.json({ message: 'Chat session temporarily disabled' }, { status: 503 })
} 