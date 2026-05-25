import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../lib/utils/env';

const REQUIRED_FIELDS = [
  'chunkId',
  'chapterKey',
  'subject',
  'subjectCode',
  'classLevel',
  'chapterNumber',
  'chapterTitle',
  'sectionTitle',
  'pageNumber',
  'contentType',
  'chunkType',
  'chunkRole',
  'chunkIndex',
  'concept',
  'concepts',
  'conceptTags',
  'keywords',
  'figureRefs',
  'tableRefs',
  'formulaRefs',
  'exerciseRefs',
  'exampleRefs',
  'hasFormula',
  'formulaLatexList',
  'sourceType',
  'status',
  'embeddingModel',
  'embeddingStatus',
  'textPreview',
  'contentHash',
  'createdAt',
  'updatedAt'
];

const FORBIDDEN_FIELDS = [
  'imageUrl',
  'base64',
  'imageData',
  'croppedImage',
  'diagramUrl',
  'generatedImage'
];

async function main() {
  if (!env.PINECONE_API_KEY) {
    console.error("Missing PINECONE_API_KEY");
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const indexName = 'neet-jee-reference-tutor-dense';
  const index = pc.Index(indexName);

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

  let allReady = true;
  let totalMissingFields = 0;
  let totalForbiddenFields = 0;
  let totalInvalidValues = 0;
  let totalOversized = 0;

  console.log("Starting Phase 7E Pinecone Vector Metadata Audit...\n");
  console.log("========================================");
  console.log("         PINECONE METADATA AUDIT        ");
  console.log("========================================");

  for (const ns of namespaces) {
    let vectorCount = 0;
    let numDrafts = 0;
    let numPublished = 0;
    const missingFieldsInNs = new Set<string>();
    const forbiddenFieldsInNs = new Set<string>();
    const invalidValuesInNs = new Set<string>();
    const oversizedInNs = new Set<string>();

    const nsIndex = index.namespace(ns);

    try {
      let paginationToken: string | undefined = undefined;
      const allIds = [];

      do {
        const listResults: any = await nsIndex.listPaginated({ limit: 100, paginationToken });
        if (listResults.vectors) {
          allIds.push(...listResults.vectors.map((v: any) => v.id));
        }
        paginationToken = listResults.pagination?.next;
      } while (paginationToken);

      vectorCount = allIds.length;

      for (let i = 0; i < allIds.length; i += 100) {
        const batchIds = allIds.slice(i, i + 100).filter(Boolean);
        if (batchIds.length === 0) continue;
        console.log(`Fetching ${batchIds.length} records...`);
        const fetchResponse: any = await nsIndex.fetch({ ids: batchIds });

        for (const id of batchIds) {
          const vector = fetchResponse.records[id];
          if (!vector || !vector.metadata) continue;
          
          const meta = vector.metadata as any;
          if (meta.status === 'draft') numDrafts++;
          if (meta.status === 'published') numPublished++;

          for (const field of REQUIRED_FIELDS) {
            if (!(field in meta)) {
              missingFieldsInNs.add(field);
              totalMissingFields++;
              allReady = false;
            }
          }

          for (const field of FORBIDDEN_FIELDS) {
            if (field in meta) {
              forbiddenFieldsInNs.add(field);
              totalForbiddenFields++;
              allReady = false;
            }
          }

          if (meta.textPreview && meta.textPreview.length > 5000) {
            oversizedInNs.add(`textPreview > 5000 chars in ${id}`);
            totalOversized++;
            allReady = false;
          }
          if (meta.fullPdfText || meta.rawText || meta.pageContent) {
            if (meta.fullPdfText?.length > 5000 || meta.rawText?.length > 5000 || meta.pageContent?.length > 5000) {
              oversizedInNs.add(`Full text field found in ${id}`);
              totalOversized++;
              allReady = false;
            }
          }
        }
      }
    } catch (e: any) {
      console.log(`Failed scanning ${ns}: ${e.stack}`);
    }

    console.log(`\nNamespace: ${ns}`);
    console.log(`Vectors:   ${vectorCount}`);
    console.log(`Published: ${numPublished}`);
    console.log(`Drafts:    ${numDrafts}`);
    
    if (missingFieldsInNs.size > 0) {
      console.log(`Missing Required Fields: ${Array.from(missingFieldsInNs).join(', ')}`);
    } else {
      console.log(`Missing Required Fields: NONE`);
    }

    if (invalidValuesInNs.size > 0) {
      console.log(`Invalid Values: ${Array.from(invalidValuesInNs).slice(0, 5).join(', ')}`);
    }

    if (forbiddenFieldsInNs.size > 0) {
      console.log(`FORBIDDEN Fields Found: ${Array.from(forbiddenFieldsInNs).join(', ')}`);
    }

    if (oversizedInNs.size > 0) {
      console.log(`Oversized Metadata Found: ${Array.from(oversizedInNs).slice(0, 5).join(', ')}`);
    }

    console.log("----------------------------------------");
  }

  console.log(`\nAudit Complete.`);
  const totalFlagged = totalMissingFields + totalForbiddenFields + totalInvalidValues + totalOversized;
  console.log(`Total Issues Flagged: ${totalFlagged}`);
  
  if (allReady && totalFlagged === 0) {
    console.log("\n✅ ALL NAMESPACES ARE PHASE-8 READY.");
    process.exit(0);
  } else {
    console.log("\n❌ ISSUES DETECTED. See report above for fixes before proceeding to Phase 8.");
    process.exit(1);
  }
}

main().catch(console.error);
