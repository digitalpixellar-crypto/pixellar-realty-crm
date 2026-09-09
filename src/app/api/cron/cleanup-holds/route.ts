import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const released = db.releaseExpiredHolds();
  return NextResponse.json({
    success: true,
    message: `Hold cleanup completed. Released ${released} expired unit holds.`,
    released_count: released,
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  return GET();
}
