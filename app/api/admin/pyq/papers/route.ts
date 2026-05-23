import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    if (!adminDb) return NextResponse.json({ papers: [] });

    const snapshot = await adminDb.collection("pyqPapers").orderBy("createdAt", "desc").get();
    const papers: any[] = [];
    snapshot.forEach(doc => {
      papers.push(doc.data());
    });

    return NextResponse.json({ papers });
  } catch (error: any) {
    console.error("[Get Papers Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
