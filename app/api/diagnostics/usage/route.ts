import { NextResponse } from 'next/server';
import { getGeminiUsage } from '@/lib/stats/geminiUsage';

export async function GET() {
    const usage = getGeminiUsage();
    
    return NextResponse.json({
        service: 'gemini',
        requests: usage.requests,
        limit: usage.limit,
        isNearingLimit: usage.isNearingLimit,
        ratio: usage.requests / usage.limit,
        status: usage.isNearingLimit ? 'warning' : 'ok'
    });
}
