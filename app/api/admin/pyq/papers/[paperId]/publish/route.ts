import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ paperId: string }> }) {
  try {
    if (!adminDb) throw new Error("Firestore not available");
    
    // In Next.js 15, params is a Promise
    const resolvedParams = await params;
    const paperId = resolvedParams.paperId;

    const paperRef = adminDb.collection("pyqPapers").doc(paperId);
    await paperRef.update({
      status: "published",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const questionsSnap = await adminDb.collection("pyqQuestions")
      .where("paperId", "==", paperId).get();

    const batch = adminDb.batch();
    questionsSnap.forEach(doc => {
      batch.update(doc.ref, {
        status: "published",
        updatedAt: new Date().toISOString()
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true, publishedCount: questionsSnap.size });

  } catch (error: any) {
    console.error("[PYQ Publish Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
