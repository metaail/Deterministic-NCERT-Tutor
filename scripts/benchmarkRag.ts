import { runBenchmark } from '../lib/rag/benchmarkEvaluator';
import { adminDb } from '../lib/firebase/admin';

async function main() {
    console.log("Starting RAG Benchmark Engine...");

    if (!adminDb) {
        console.error("Firebase not initialized");
        process.exit(1);
    }
    
    // Attempting to find a published chapter
    const chaptersSnap = await adminDb.collection('chapters').where('status', '==', 'published').limit(1).get();
    
    if (chaptersSnap.empty) {
        console.error("No published chapters found for testing. Please ingest and publish a chapter first.");
        process.exit(1);
    }

    const chapter = chaptersSnap.docs[0].data() as any;
    const chapterKey = chaptersSnap.docs[0].id;
    const subjectCode = chapter.subjectCode || 'ZOO';
    const classLevel = chapter.classLevel || '11';

    console.log(`Using target chapter: ${chapterKey} (Subject: ${subjectCode}, Class: ${classLevel})`);

    const queries = [
        {
            query: "Explain the main concepts in this chapter.",
            intent: 'structure_query' as any,
            subjectCode,
            classLevel,
            chapterKey
        },
        {
            query: "Define what this process means fundamentally.",
            intent: 'concept_explanation' as any,
            subjectCode,
            classLevel,
            chapterKey
        },
        {
            query: "What does Figure 1.3 illustrate?",
            intent: 'figure_query' as any,
            subjectCode,
            classLevel,
            chapterKey
        },
        {
            query: "Show me the formula for this concept.",
            intent: 'formula_query' as any,
            subjectCode,
            classLevel,
            chapterKey
        },
    ];

    console.log("Running", queries.length, "queries...");

    const results = await runBenchmark(queries);

    let passedCount = 0;

    for (const r of results) {
        if (r.passed) {
            console.log(`[PASS] ${r.query} (Chunks: ${r.topKCount})`);
            passedCount++;
        } else {
            console.log(`[FAIL] ${r.query} (Error: ${r.error || 'No chunks returned'})`);
        }
    }

    console.log(`\nBenchmark Complete. Passed ${passedCount} / ${queries.length}`);
    process.exit(passedCount === queries.length ? 0 : 1);
}

main();
