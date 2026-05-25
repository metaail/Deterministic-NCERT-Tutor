import { getPineconeClient, INDEX_NAME_DENSE } from './client';
import { generateEmbedding, EMBEDDING_MODEL } from './embedding';
import { getNamespace } from './namespace';
import { PineconeMetadataSchema, PineconeMetadata } from './metadataSchema';
import { mapToVectorStatus } from './statusMapper';
import { adminDb } from '@/lib/firebase/admin';
import { ChapterChunk } from '@/types';
import * as crypto from 'crypto';

export async function upsertPendingChunks() {
    if (!adminDb) throw new Error("Firebase Admin DB not initialized");
    const pinecone = getPineconeClient();
    if (!pinecone) throw new Error("Pinecone client not initialized");

    const index = pinecone.Index(INDEX_NAME_DENSE);

    // 1. Read chapterChunks where embeddingStatus = "pending"
    // Filtering by status requires composite index if joining, will limit by embeddingStatus
    const snapshot = await adminDb.collection('chapterChunks')
        .where('embeddingStatus', '==', 'pending')
        .limit(50)
        .get();

    if (snapshot.empty) return 0;

    let upsertCount = 0;

    for (const doc of snapshot.docs) {
        const chunk = doc.data() as ChapterChunk;

        // 2. Generate text embeddings
        const vector = await generateEmbedding(chunk.text);

        const contentHash = crypto.createHash('md5').update(chunk.text).digest('hex');
        const textPreviewLength = Math.min(chunk.text.length, 500);
        const textPreview = chunk.text.substring(0, textPreviewLength) + (chunk.text.length > 500 ? '...' : '');

        // 3. Prepare metadata
        const metadata: PineconeMetadata = {
            chunkId: chunk.chunkId,
            chapterKey: chunk.chapterKey,
            subject: chunk.subject,
            subjectCode: chunk.subjectCode,
            classLevel: chunk.classLevel,
            chapterNumber: 0, // Fallback if not injected via chunk
            chapterTitle: chunk.chapterTitle,
            sectionTitle: chunk.sectionTitle,
            pageNumber: chunk.pageNumber,

            ncertPageNumber: chunk.ncertPageNumber,
            bookPageNumber: chunk.bookPageNumber,
            sectionNumber: chunk.sectionNumber,
            subsectionNumber: chunk.subsectionNumber,
            exampleNumber: chunk.exampleNumber,
            problemNumber: chunk.problemNumber,
            exerciseNumber: chunk.exerciseNumber,
            tableNumber: chunk.tableNumber,
            figureNumber: chunk.figureNumber,

            isDefinition: chunk.isDefinition || false,
            isLaw: chunk.isLaw || false,
            isFormula: chunk.isFormula || false,
            isSolvedExample: chunk.isSolvedExample || false,
            isExercise: chunk.isExercise || false,
            isSummaryPoint: chunk.isSummaryPoint || false,
            isTable: chunk.isTable || false,
            isFigureCaption: chunk.isFigureCaption || false,
            
            vectorType: chunk.vectorType || 'concept',
            prerequisiteConcepts: chunk.prerequisiteConcepts || [],
            relatedConcepts: chunk.relatedConcepts || [],
            retrievalAliases: chunk.retrievalAliases || [],
            headingPath: chunk.headingPath || [],
            previousChunkId: chunk.previousChunkId || undefined,
            nextChunkId: chunk.nextChunkId || undefined,
            
            contentType: chunk.contentType,
            chunkType: chunk.chunkType,
            chunkRole: chunk.chunkRole,
            chunkIndex: chunk.chunkIndex,
            
            concept: chunk.concept,
            concepts: chunk.concepts || [],
            conceptTags: chunk.conceptTags || [],
            keywords: [], // Reserved for sparse or extra extractions
            
            figureRefs: chunk.figureRefs || [],
            tableRefs: chunk.tableRefs || [],
            formulaRefs: chunk.formulaRefs || [],
            exerciseRefs: chunk.exerciseRefs || [],
            exampleRefs: chunk.exampleRefs || [],
            
            hasFormula: chunk.hasFormula || false,
            formulaLatexList: chunk.formulaLatexList || [],
            
            sourceType: "NCERT",
            status: mapToVectorStatus(chunk.status || ''),
            embeddingModel: EMBEDDING_MODEL,
            embeddingStatus: "indexed",
            
            textPreview,
            contentHash,
            createdAt: String(chunk.createdAt || new Date().toISOString()),
            updatedAt: new Date().toISOString(),
            metadataVersion: "v1"
        };

        // Strictly validate metadata 
        const validMetadata = PineconeMetadataSchema.parse(metadata);

        const namespace = getNamespace(chunk.classLevel, chunk.subjectCode);

        // Upsert vectors into dense Pinecone index
        await index.namespace(namespace).upsert({
            records: [{
                id: chunk.chunkId,
                values: vector,
                metadata: validMetadata
            }]
        });

        // Sparse is skipped via warning
        console.warn(`[Pinecone] Sparse index not available. Lexical fallback enabled app-side for chunk ${chunk.chunkId}.`);

        // Update chapterChunks
        await adminDb.collection('chapterChunks').doc(chunk.chunkId).set({
            embeddingStatus: "indexed",
            embeddingModel: EMBEDDING_MODEL,
            embeddingId: chunk.chunkId, 
            updatedAt: new Date().toISOString()
        }, { merge: true });

        upsertCount++;
    }

    return upsertCount;
}
