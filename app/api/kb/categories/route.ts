import { NextResponse } from 'next/server'

// Temporarily disabled for build
export async function GET() {
  return NextResponse.json({ message: 'KB categories temporarily disabled' }, { status: 503 })
} 