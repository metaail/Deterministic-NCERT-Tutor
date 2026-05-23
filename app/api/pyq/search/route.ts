import { NextRequest, NextResponse } from 'next/server';
import { searchPyq } from '@/lib/pyq/pyqRetriever';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, subjectCode, classLevel, chapterKey } = body;

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const pyqs = await searchPyq(query, subjectCode, classLevel, chapterKey);

    return NextResponse.json({
      success: true,
      results: pyqs
    });

  } catch (error: any) {
    console.error("[PYQ Search Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
