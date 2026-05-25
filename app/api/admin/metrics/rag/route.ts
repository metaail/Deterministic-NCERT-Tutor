import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '@/lib/utils/env';
import { getNamespace } from '@/lib/vector/namespace';

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Firestore not initialized" }, { status: 500 });
    }
    if (!env.PINECONE_API_KEY) {
      return NextResponse.json({ error: "Missing PINECONE_API_KEY" }, { status: 500 });
    }

    const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
    const index = pc.Index('neet-jee-reference-tutor-dense');

    const namespaces = [
      'class11_PHY',
      'class11_CHM',
      'class11_BIO',
      'class11_MTH',
      'class12_PHY',
      'class12_CHM',
      'class12_BIO',
      'class12_MTH'
    ];

    // 1. Fetch all Firestore chunks
    const snapshot = await adminDb.collection('chapterChunks').get();
    
    // For serialization, we collect basic stats instead of passing Map
    // We only expose limited safe metadata
    const firestoreChunksData: any[] = [];
    const _firestoreChunks = new Map<string, any>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      _firestoreChunks.set(doc.id, data);
      firestoreChunksData.push({
        id: doc.id,
        status: data.status || 'unknown',
        contentType: data.metadata?.contentType || 'unknown',
        subjectCode: data.subjectCode || 'unknown',
        classLevel: data.classLevel || 'unknown',
        embeddingStatus: data.embeddingStatus || 'pending'
      });
    });

    // 2. Fetch all Pinecone vectors
    const pineconeVectorsInfo: any[] = [];
    const _pineconeVectors = new Map<string, any>();
    
    for (const ns of namespaces) {
      try {
        const nsIndex = index.namespace(ns);
        let paginationToken: string | undefined = undefined;
        const allIds = [];

        do {
          const listResults: any = await nsIndex.listPaginated({ limit: 100, paginationToken });
          if (listResults.vectors) {
            allIds.push(...listResults.vectors.map((v: any) => v.id));
          }
          paginationToken = listResults.pagination?.next;
        } while (paginationToken);

        for (let i = 0; i < allIds.length; i += 100) {
          const batchIds = allIds.slice(i, i + 100).filter(Boolean);
          if (batchIds.length === 0) continue;
          
          const fetchResponse: any = await nsIndex.fetch({ ids: batchIds });

          for (const id of batchIds) {
            const vector = fetchResponse.records[id];
            if (vector && vector.metadata) {
              const meta = vector.metadata;
              _pineconeVectors.set(id, { ...meta, namespace: ns });
              pineconeVectorsInfo.push({
                id,
                namespace: ns,
                status: meta.status || 'unknown'
              });
            }
          }
        }
      } catch (e: any) {
        console.warn(`Failed fetching from ${ns}: ${e.message}`);
      }
    }

    let matchedCount = 0;
    const missingVectors: string[] = [];
    const orphanVectors: string[] = [];
    const orphanFirestoreChunks: string[] = [];
    
    const mismatchTable: any[] = [];
    const namespaceMismatchTable: any[] = [];
    const recommendations: string[] = [];

    let draftVectors = 0;
    let publishedVectors = 0;

    // 3. Compare
    for (const [id, fbData] of _firestoreChunks.entries()) {
      const pcMeta = _pineconeVectors.get(id);
      if (!pcMeta) {
        if (fbData.status === 'published') {
          missingVectors.push(id);
        }
        orphanFirestoreChunks.push(id);
      } else {
        matchedCount++;
        
        if (pcMeta.status === 'draft') draftVectors++;
        else if (pcMeta.status === 'published') publishedVectors++;

        // Metadata diff
        let mismatched = false;
        let mismatchDetails: any = { id };

        if (fbData.chapterKey !== pcMeta.chapterKey) { mismatched = true; mismatchDetails.chapterKey = `FB:${fbData.chapterKey} != PC:${pcMeta.chapterKey}`; }
        if (fbData.subjectCode !== pcMeta.subjectCode) { mismatched = true; mismatchDetails.subjectCode = `FB:${fbData.subjectCode} != PC:${pcMeta.subjectCode}`; }
        if (fbData.classLevel !== pcMeta.classLevel) { mismatched = true; mismatchDetails.classLevel = `FB:${fbData.classLevel} != PC:${pcMeta.classLevel}`; }
        if (fbData.status && fbData.status !== pcMeta.status) { mismatched = true; mismatchDetails.status = `FB:${fbData.status} != PC:${pcMeta.status}`; }
        if (fbData.contentHash && fbData.contentHash !== pcMeta.contentHash) { mismatched = true; mismatchDetails.contentHash = `FB:${fbData.contentHash} != PC:${pcMeta.contentHash}`; }

        const expectedNs = getNamespace(fbData.classLevel, fbData.subjectCode);
        if (pcMeta.namespace !== expectedNs) {
          namespaceMismatchTable.push({
            id,
            expectedNs,
            actualNs: pcMeta.namespace
          });
        }

        if (mismatched) {
          mismatchTable.push(mismatchDetails);
        }
      }
    }

    for (const [id, pcMeta] of _pineconeVectors.entries()) {
      if (!_firestoreChunks.has(id)) {
        orphanVectors.push(id);
        if (pcMeta.status === 'draft') draftVectors++;
        else if (pcMeta.status === 'published') publishedVectors++;
      }
    }

    if (orphanVectors.length > 0) recommendations.push(`${orphanVectors.length} orphan vectors found. Run repairPineconeConsistency.`);
    if (missingVectors.length > 0) recommendations.push(`${missingVectors.length} missing vectors. Run rebuildVectors.`);
    if (namespaceMismatchTable.length > 0) recommendations.push(`${namespaceMismatchTable.length} namespace mismatches. Run repairPineconeConsistency.`);
    if (mismatchTable.length > 0) recommendations.push(`${mismatchTable.length} metadata mismatches. Run repairPineconeConsistency.`);
    if (recommendations.length === 0) recommendations.push("No issues found. Ready for Phase 8.");

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      stats: {
        totalFirestoreChunks: firestoreChunksData.length,
        totalPineconeVectors: pineconeVectorsInfo.length,
        matchedCount,
        missingVectorsCount: missingVectors.length,
        orphanVectorsCount: orphanVectors.length,
        orphanFirestoreChunksCount: orphanFirestoreChunks.length,
        draftVectorsCount: draftVectors,
        publishedVectorsCount: publishedVectors
      },
      missingVectors: missingVectors.slice(0, 100),
      orphanVectors: orphanVectors.slice(0, 100),
      mismatchTable: mismatchTable.slice(0, 100),
      firestoreChunks: firestoreChunksData,
      pineconeVectors: pineconeVectorsInfo,
      recommendations
    });
  } catch (error: any) {
    console.error('RAG Health check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
