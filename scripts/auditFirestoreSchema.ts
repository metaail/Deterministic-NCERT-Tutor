import { adminDb } from '../lib/firebase/admin';
import { 
  ChapterDocumentSchema, 
  ChapterChunkSchema, 
  ChapterStructureIndexSchema, 
  IngestionJobSchema 
} from '../lib/validators/models';
import { 
  PyqPaperSchema, 
  PyqQuestionSchema 
} from '../lib/pyq/validators';

interface AuditResult {
  collection: string;
  totalDocs: number;
  invalidDocs: number;
  missingFields: Set<string>;
  inconsistentFields: Set<string>;
  forbiddenFieldsFound: Set<string>;
  recommendedFixes: Set<string>;
}

const FORBIDDEN_FIELDS = [
  'imageUrl', 'base64', 'imageData', 'croppedImage', 'generatedImage'
];

function checkForbiddenFields(data: any, path: string = ''): string[] {
  let found: string[] = [];
  if (!data || typeof data !== 'object') return found;
  
  for (const [key, value] of Object.entries(data)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_FIELDS.includes(key)) {
      found.push(currentPath);
    }
    if (typeof value === 'object' && value !== null) {
      found.push(...checkForbiddenFields(value, currentPath));
    }
  }
  return found;
}

async function auditCollection(
  collectionName: string, 
  schema?: any, 
  customChecks?: (data: any, pushIssue: (type: 'missing' | 'inconsistent' | 'forbidden' | 'fix', msg: string) => void) => void
): Promise<AuditResult> {
  const result: AuditResult = {
    collection: collectionName,
    totalDocs: 0,
    invalidDocs: 0,
    missingFields: new Set(),
    inconsistentFields: new Set(),
    forbiddenFieldsFound: new Set(),
    recommendedFixes: new Set()
  };

  if (!adminDb) {
    console.warn(`Firestore not initialized for ${collectionName}`);
    return result;
  }

  const snapshot = await adminDb.collection(collectionName).limit(1000).get();
  result.totalDocs = snapshot.size;

  snapshot.forEach(doc => {
    const data = doc.data();
    let isInvalid = false;

    const pushIssue = (type: 'missing' | 'inconsistent' | 'forbidden' | 'fix', msg: string) => {
      isInvalid = true;
      if (type === 'missing') result.missingFields.add(msg);
      if (type === 'inconsistent') result.inconsistentFields.add(msg);
      if (type === 'forbidden') result.forbiddenFieldsFound.add(msg);
      if (type === 'fix') result.recommendedFixes.add(msg);
    };

    // 1. Check forbidden fields
    const forbidden = checkForbiddenFields(data);
    for (const f of forbidden) {
      pushIssue('forbidden', `Doc ${doc.id} has forbidden field: ${f}`);
      pushIssue('fix', `Remove image-related fields like ${f} to strictly enforce Deterministic constraints.`);
    }

    // 2. Schema validation
    if (schema) {
      const parsed = schema.safeParse(data);
      if (!parsed.success) {
        isInvalid = true;
        const issues = parsed.error.issues || parsed.error.errors || [];
        issues.forEach((err: any) => {
          const path = err.path.join('.');
          if (err.code === 'invalid_type' && err.received === 'undefined') {
            pushIssue('missing', `Missing field '${path}' in ${doc.id}`);
          } else {
            pushIssue('inconsistent', `Invalid field '${path}' in ${doc.id}: ${err.message}`);
          }
        });
      }
    }

    // 3. Custom checks
    if (customChecks) {
      customChecks(data, pushIssue);
    }

    if (isInvalid) {
      result.invalidDocs++;
    }
  });

  return result;
}

async function runAudit() {
  console.log("Starting Phase 7D Firestore Data Structure and Schema Audit...\n");

  const results: AuditResult[] = [];

  // Chapters
  results.push(await auditCollection('chapters', ChapterDocumentSchema, (data, pushIssue) => {
    if (data.summaryPoints !== undefined && !Array.isArray(data.summaryPoints)) {
      pushIssue('inconsistent', `summaryPoints is not an array`);
    }
    if (data.chapterKey && !/^[A-Z0-9_-]+$/.test(data.chapterKey)) {
      pushIssue('inconsistent', `chapterKey format may be inconsistent: ${data.chapterKey}`);
    }
  }));

  // Chapter Chunks
  results.push(await auditCollection('chapterChunks', ChapterChunkSchema, (data, pushIssue) => {
    if (['figure', 'table', 'formula'].includes(data.chunkType)) {
      if (!data.pageNumber && !data.ncertPageNumber) {
        pushIssue('missing', `pageNumber or ncertPageNumber missing for chunk ${data.chunkId}`);
      }
    }
    if (data.previousChunkId === data.chunkId) {
      pushIssue('inconsistent', `previousChunkId equals chunkId in ${data.chunkId}`);
    }
  }));

  // Chapter Structure Index
  results.push(await auditCollection('chapterStructureIndex', ChapterStructureIndexSchema, (data, pushIssue) => {
    if (!Array.isArray(data.summaryPoints) || data.summaryPoints.length === 0) {
      pushIssue('missing', `chapterStructureIndex must have summaryPoints`);
    }
  }));

  // Ingestion Jobs
  results.push(await auditCollection('ingestionJobs', IngestionJobSchema));

  // PYQ Papers
  results.push(await auditCollection('pyqPapers', PyqPaperSchema));

  // PYQ Questions
  results.push(await auditCollection('pyqQuestions', PyqQuestionSchema, (data, pushIssue) => {
    if (data.status === 'draft') {
      pushIssue('inconsistent', `Draft question found in pyqQuestions: ${data.questionId}. (Make sure UI filters these).`);
    }
  }));

  // Tutor Sessions (no strict zod schema, manual check)
  results.push(await auditCollection('tutorSessions', null, (data, pushIssue) => {
    if (!data.query) pushIssue('missing', 'query');
    if (!data.response) pushIssue('missing', 'response');
    if (!data.timestamp) pushIssue('missing', 'timestamp');
    if (!data.intent) pushIssue('missing', 'intent');
  }));

  // Admin Users (no strict zod schema, manual check)
  results.push(await auditCollection('adminUsers', null, (data, pushIssue) => {
    if (!data.email) pushIssue('missing', 'email');
    if (!data.role) pushIssue('missing', 'role');
  }));

  // Print Report
  console.log("========================================");
  console.log("         FIRESTORE SCHEMA AUDIT         ");
  console.log("========================================\n");

  let readyForPhase8 = true;
  let totalInvalid = 0;

  for (const r of results) {
    console.log(`Collection: ${r.collection}`);
    console.log(`Total Docs: ${r.totalDocs}`);
    console.log(`Invalid:    ${r.invalidDocs}`);
    totalInvalid += r.invalidDocs;

    if (r.missingFields.size > 0) {
      console.log(`Missing:    ${Array.from(r.missingFields).slice(0, 5).join(', ')}${r.missingFields.size > 5 ? '...' : ''}`);
      readyForPhase8 = false;
    }
    if (r.inconsistentFields.size > 0) {
      console.log(`Inconsist.: ${Array.from(r.inconsistentFields).slice(0, 5).join(', ')}${r.inconsistentFields.size > 5 ? '...' : ''}`);
      readyForPhase8 = false;
    }
    if (r.forbiddenFieldsFound.size > 0) {
      console.log(`FORBIDDEN:  ${Array.from(r.forbiddenFieldsFound).slice(0, 5).join(', ')}${r.forbiddenFieldsFound.size > 5 ? '...' : ''}`);
      readyForPhase8 = false;
    }
    if (r.recommendedFixes.size > 0) {
      console.log(`Fixes:      ${Array.from(r.recommendedFixes).slice(0, 5).join(', ')}${r.recommendedFixes.size > 5 ? '...' : ''}`);
    }
    console.log("----------------------------------------");
  }

  console.log(`\nAudit Complete.`);
  console.log(`Total Documents Flagged: ${totalInvalid}`);
  if (totalInvalid === 0) {
    console.log("\n✅ ALL COLLECTIONS ARE PHASE-8 READY.");
  } else {
    console.log("\n❌ ISSUES DETECTED. See report above for fixes before proceeding to Phase 8.");
  }

  process.exit(totalInvalid > 0 ? 1 : 0);
}

runAudit().catch(console.error);
