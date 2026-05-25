import { searchDense } from '../lib/vector/denseSearch';
import { getNamespace } from '../lib/vector/namespace';
import { scoreRetrieval } from '../lib/rag/retrievalQualityScorer';
import { inspectTopK } from '../lib/rag/topKInspector';
import { PineconeMetadata } from '../lib/vector/metadataSchema';

export interface BenchmarkQuery {
  id: string;
  query: string;
  type: string;
  expectedClass: string;
  expectedSubject: string; // 041, 042, etc.
  expectedChapter: string;
  expectedTags: string[];
}

const queries: BenchmarkQuery[] = [
  {
    id: "Q1",
    query: "Explain the concept of empty sets.",
    type: "concept explanation",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11", // Example key
    expectedTags: ["empty set", "null set", "void set"]
  },
  {
    id: "Q2",
    query: "What is the formula for the union of two sets?",
    type: "exact formula",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11",
    expectedTags: ["union", "formula", "sets"]
  },
  {
    id: "Q3",
    query: "Are there examples of infinite sets?",
    type: "exercise/example",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11",
    expectedTags: ["infinite", "example"]
  },
  {
    id: "Q4",
    query: "Summarize the properties of equivalent sets.",
    type: "summary",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11",
    expectedTags: ["equivalent", "summary"]
  },
  {
    id: "Q5",
    query: "How are sets used in geometry?", // Something maybe not fully covered but math
    type: "similar-but-different",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11",
    expectedTags: []
  },
  {
    id: "Q6",
    query: "Explain Newton's laws of motion", // Wrong subject for math context if we specify math context
    type: "wrong-subject",
    expectedClass: "Class 11",
    expectedSubject: "041",
    expectedChapter: "ch-maths-11",
    expectedTags: []
  }
];

async function main() {
  console.log("Starting Retrieval Accuracy Benchmark...");
  
  const results = [];
  let top1Acc = 0;
  let top3Acc = 0;
  let top5Acc = 0;
  let totalValid = 0;

  for (const q of queries) {
    console.log(`\nTesting Query [${q.id}] (${q.type}): "${q.query}"`);
    
    try {
      // Simulate semantic search intent detection extracting context
      // Note: we'll run against ch-maths-1779381135982 instead of ch-maths-11 since that's what we actually have in pinecone!
      const actualChapter = q.expectedChapter === 'ch-maths-11' ? 'ch-maths-1779381135982' : q.expectedChapter;

      const searchResult = await searchDense(q.query, q.expectedSubject, q.expectedClass, actualChapter);
      const chunks = searchResult.map((r: any) => r.metadata) as PineconeMetadata[];

      const score = scoreRetrieval(q.query, q.expectedClass, q.expectedSubject, q.expectedChapter, q.expectedTags, chunks, q.type === 'wrong-subject');
      const inspection = inspectTopK(chunks);

      results.push({
         query: q.query,
         type: q.type,
         score,
         inspection,
         chunksCount: chunks.length
      });

      if (q.type !== 'wrong-subject' && q.type !== 'missing-data') {
         totalValid++;
         if (score.top1Match) top1Acc++;
         if (score.top3Match) top3Acc++;
         if (score.top5Match) top5Acc++;
      }

      console.log(`  Top 1: ${score.top1Match} | Top 3: ${score.top3Match} | Top 5: ${score.top5Match}`);
      console.log(`  Namespaces hit: ${inspection.namespaces.join(', ')}`);
      if (score.wrongSubjectCount > 0) console.log(`  ❌ WRONG SUBJECT BLEED DETECTED (${score.wrongSubjectCount} vectors)`);
      if (score.draftCount > 0) console.log(`  ❌ DRAFT LEAK DETECTED (${score.draftCount} vectors)`);

    } catch(e: any) {
      console.error(`Failed on query ${q.id}: ${e.message}`);
    }
  }

  console.log("\n==========================================");
  console.log("        BENCHMARK RESULTS                 ");
  console.log("==========================================");
  console.log(`Total Valid Target Queries: ${totalValid}`);
  console.log(`Top 1 Accuracy: ${totalValid > 0 ? ((top1Acc / totalValid) * 100).toFixed(1) : 0}%`);
  console.log(`Top 3 Accuracy: ${totalValid > 0 ? ((top3Acc / totalValid) * 100).toFixed(1) : 0}%`);
  console.log(`Top 5 Accuracy: ${totalValid > 0 ? ((top5Acc / totalValid) * 100).toFixed(1) : 0}%`);
  
  const allDrafts = results.reduce((acc, r) => acc + r.score.draftCount, 0);
  const allBleeds = results.reduce((acc, r) => acc + r.score.wrongSubjectCount, 0);
  const allForbidden = results.reduce((acc, r) => acc + r.score.forbiddenFieldsCount, 0);

  console.log(`Total Draft/Unpublished Leaks: ${allDrafts}`);
  console.log(`Total Wrong-Subject Bleeds: ${allBleeds}`);
  console.log(`Total Forbidden Fields Detected: ${allForbidden}`);

  if (allDrafts > 0 || allBleeds > 0 || allForbidden > 0) {
      console.error("\n❌ Benchmark FAILED strictly on safety/security criteria.");
      process.exit(1);
  }
}

main().catch(console.error);
