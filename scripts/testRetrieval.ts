import { planRetrieval } from '../lib/chat/retrievalPlanner';

async function main() {
    const query = process.argv[2] || "Explain the main concept";
    const subjectCode = process.argv[3] || 'PHY';
    const classLevel = process.argv[4] || '11';
    const chapterKey = process.argv[5] || 'mock-chap';

    console.log(`Testing Retrieval for: "${query}" in ${subjectCode}-${classLevel} (${chapterKey})`);

    try {
        const payload = await planRetrieval({
            query,
            subjectCode,
            classLevel,
            chapterKey,
            history: []
        }, 'concept_explanation');

        console.log(`Intent detected/used: ${payload.intent}`);
        console.log(`Returned Chunks: ${payload.textChunks.length}`);
        
        payload.textChunks.forEach((c: any, i: number) => {
             console.log(`\n[Chunk ${i+1}] Type: ${c.chunkType}`);
             console.log(c.baseText.substring(0, 150) + "...");
        });

    } catch(e) {
        console.error("Retrieval failed:", e);
    }
    process.exit(0);
}

main();
