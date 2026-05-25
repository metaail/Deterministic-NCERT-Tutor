import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
import { IngestionContext } from '@/lib/ingestion/types';
import fs from 'fs';
import path from 'path';

async function main() {
    const rawText = fs.readFileSync('maths_sample.txt', 'utf8');

    const pdfPages = [];
    const pages = rawText.split(/==Start of OCR for page \d+==/).filter(p => p.trim());
    
    let pageNum = 1;
    for (const pageBody of pages) {
        const textToProcess = pageBody.replace(/==End of OCR for page \d+==/g, '').trim();
        const lines = textToProcess.split('\n');
        
        const items = [];
        let y = 800;
        for (const line of lines) {
            if (!line.trim()) continue;
            
            // Very simple heuristic to give headings bigger fonts
            const isHeading = line.length < 50 && !line.includes('.') && /^[A-Z0-9]/.test(line) && line.toUpperCase() === line;
            let height = isHeading ? 16 : 11;
            if (line.includes('Definition') || line.includes('Example')) {
                height = 14;
            }

            items.push({
                str: line.trim(),
                fontName: 'Helvetica',
                transform: [1, 0, 0, 1, 50, y],
                x: 50,
                y: y,
                width: line.length * 5,
                height: height
            });
            y -= (height + 4);
        }

        pdfPages.push({
            pageNumber: pageNum++,
            width: 600,
            height: 850,
            items
        });
    }

    const ctx: IngestionContext = {
         jobId: 'job-maths-' + Date.now(),
         uploadedFileName: '11th-Maths-Chapter2.pdf',
         pdfBuffer: Buffer.from('dummy'), // Dummy
         chapterKey: 'ch-maths-' + Date.now(),
         metadata: {
             subject: 'Mathematics',
             subjectCode: '041',
             classLevel: 'Class 11',
             chapterNumber: 2,
             chapterTitle: 'Relations and Functions',
             chapterTitleShort: 'Rel & Func'
         },
         pdfPages: pdfPages,
         extractedText: "",
         normalizedText: "",
         detectedStructure: {},
         generatedChunks: []
    };

    console.log(`Starting custom ingestion pipeline for maths text...`);
    
    try {
        const { extractPages } = await import('@/lib/ingestion/stages/02-extractPages');
        const { validateIdentity } = await import('@/lib/ingestion/stages/02b-validateIdentity');
        const { normalizeText } = await import('@/lib/ingestion/stages/03-normalizeText');
        const { detectStructure } = await import('@/lib/ingestion/stages/04-detectStructure');
        const { buildChunks } = await import('@/lib/ingestion/stages/05-buildChunks');
        const { validateChunks } = await import('@/lib/ingestion/stages/05b-validateChunks');
        const { buildChapterStructureIndex } = await import('@/lib/ingestion/stages/06-buildChapterStructureIndex');
        const { saveFirestore } = await import('@/lib/ingestion/stages/07-saveFirestore');
        const { finalizeChapter } = await import('@/lib/ingestion/stages/08-finalizeChapter');

        let c = ctx;
        c = await extractPages(c);
        c = await validateIdentity(c);
        c = await normalizeText(c);
        c = await detectStructure(c);
        c = await buildChunks(c);
        c = await validateChunks(c);
        c = await buildChapterStructureIndex(c);
        c = await saveFirestore(c);
        await finalizeChapter(c);

        console.log(`Pipeline completed successfully for jobId: ${ctx.jobId}`);
    } catch(e) {
        console.error("Ingestion failed:", e);
        process.exit(1);
    }
    process.exit(0);
}

main();
