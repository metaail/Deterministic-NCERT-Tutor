import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ paperId: string }> }) {
  try {
    if (!adminDb) throw new Error("Firestore not available");
    
    // In Next.js 15, params is a Promise
    const resolvedParams = await params;
    const paperId = resolvedParams.paperId;

    const paperDoc = await adminDb.collection("pyqPapers").doc(paperId).get();
    if (!paperDoc.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const qSnap = await adminDb.collection("pyqQuestions")
      .where("paperId", "==", paperId).get();
      
    const questions: any[] = [];
    qSnap.forEach(doc => {
      questions.push(doc.data());
    });

    return NextResponse.json({
      paper: paperDoc.data(),
      questions
    });

  } catch (error: any) {
    console.error("[Get Paper Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
