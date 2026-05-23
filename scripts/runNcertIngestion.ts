import { runIngestionPipeline } from '@/lib/ingestion/pipeline';
import { IngestionContext } from '@/lib/ingestion/types';
import fs from 'fs';
import path from 'path';

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: npx tsx scripts/runNcertIngestion.ts <path-to-pdf>");
        process.exit(1);
    }

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const fileName = path.basename(filePath);

    // Mock PDF buffer loading
    const buffer = fs.readFileSync(filePath);

    const ctx: IngestionContext = {
         jobId: 'job-' + Date.now(),
         uploadedFileName: fileName,
         pdfBuffer: buffer,
         chapterKey: 'ch-' + Date.now(),
         metadata: {
             subject: 'Physics',
             classLevel: 'Class 11'
         },
         pdfPages: [],
         extractedText: "",
         normalizedText: "",
         detectedStructure: {},
         generatedChunks: []
    };

    console.log(`Starting ingestion pipeline for ${fileName}...`);
    try {
        await runIngestionPipeline(ctx);
        console.log(`Pipeline completed successfully for jobId: ${ctx.jobId}`);
    } catch(e) {
        console.error("Ingestion failed:", e);
        process.exit(1);
    }
    process.exit(0);
}

main();
