import { NextResponse } from 'next/server'

// Temporarily disabled for build
export async function POST() {
  return NextResponse.json({ message: 'AI response temporarily disabled' }, { status: 503 })
} 