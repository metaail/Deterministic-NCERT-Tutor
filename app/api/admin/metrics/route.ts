import { NextResponse } from 'next/server';
import { getMetrics } from '@/lib/chat/retrievalMetrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metrics = getMetrics();
  return NextResponse.json(metrics);
}
