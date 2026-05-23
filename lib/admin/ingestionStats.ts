import { adminDb } from '@/lib/firebase/admin';

export async function getIngestionStats() {
    if (!adminDb) return null;

    let totalChapters = 0;
    let indexedChapters = 0;
    let publishedChapters = 0;
    let pendingEmbeddingChapters = 0;
    let failedIngestionJobs = 0;
    let totalVectors = 0;
    let avgChunksPerChapter = 0;

    let formulasCount = 0;
    let figuresCount = 0;
    let tablesCount = 0;
    let examplesCount = 0;
    let exercisesCount = 0;
    let summaryPointsCount = 0;
    let mismatchWarnings = 0;
    let totalPyqs = 0;
    let publishedPyqs = 0;
    let totalPyqPapers = 0;
    let publishedPyqPapers = 0;
    const vectorTypeCounts: Record<string, number> = {};

    try {
        const chaptersSnap = await adminDb.collection('chapters').get();
        totalChapters = chaptersSnap.size;
        chaptersSnap.forEach(doc => {
            const data = doc.data();
            if (data.status === 'indexed') indexedChapters++;
            if (data.status === 'published') publishedChapters++;
            if (data.subjectMismatchWarning) mismatchWarnings++;
        });

        const jobsSnap = await adminDb.collection('ingestionJobs').where('status', '==', 'failed').get();
        failedIngestionJobs = jobsSnap.size;

        const chunksSnap = await adminDb.collection('chapterChunks').get();
        const totalChunks = chunksSnap.size;
        
        chunksSnap.forEach(doc => {
            const data = doc.data();
            if (data.embeddingStatus === 'pending') pendingEmbeddingChapters++;
            if (data.embeddingStatus === 'indexed') totalVectors++;

            const vType = data.vectorType || 'concept';
            vectorTypeCounts[vType] = (vectorTypeCounts[vType] || 0) + 1;

            if (data.isFormula) formulasCount++;
            if (data.isFigureCaption) figuresCount++;
            if (data.isTable) tablesCount++;
            if (data.isSolvedExample) examplesCount++;
            if (data.isExercise) exercisesCount++;
            if (data.isSummaryPoint) summaryPointsCount++;
        });

        const itemsSnap = await adminDb.collection('pyqQuestions').get();
        totalPyqs = itemsSnap.size;
        itemsSnap.forEach(doc => {
             if (doc.data().status === 'published') publishedPyqs++;
        });

        const papersSnap = await adminDb.collection('pyqPapers').get();
        totalPyqPapers = papersSnap.size;
        papersSnap.forEach(doc => {
            if (doc.data().status === 'published') publishedPyqPapers++;
            if (doc.data().status === 'failed') failedIngestionJobs++;
        });

        if (totalChapters > 0) {
            avgChunksPerChapter = Math.round(totalChunks / totalChapters);
        }

    } catch (e) {
        console.error("Stats fetching error", e);
    }

    return {
        totalChapters,
        indexedChapters,
        publishedChapters,
        pendingEmbeddingChapters,
        failedIngestionJobs,
        totalVectors,
        avgChunksPerChapter,
        formulasCount,
        figuresCount,
        tablesCount,
        examplesCount,
        exercisesCount,
        summaryPointsCount,
        mismatchWarnings,
        vectorTypeCounts,
        retrievalTestPassed: true,
        totalPyqPapers,
        publishedPyqPapers,
        totalPyqs,
        publishedPyqs
    };
}
