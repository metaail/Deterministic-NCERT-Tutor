import assert from 'node:assert';
import { executeHybridSearch } from '../lib/vector/hybridSearch';
import { planRetrieval } from '../lib/chat/retrievalPlanner';
import { getStudentSearchFilters } from '../lib/vector/metadataFilters';
import { adminDb } from '../lib/firebase/admin';

async function runTests() {
    let failed = 0;
    let passed = 0;

    const runTest = async (name: string, fn: () => void | Promise<void>) => {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err: any) {
            console.error(`❌ FAIL: ${name}`);
            console.error(err.stack || err);
            failed++;
        }
    };

    console.log("=== Running Retrieval QA Tests ===\n");

    await runTest("Student Search Filters explicitly require 'published' status", () => {
        const filters = getStudentSearchFilters('PHY', '11', 'chap-1');
        assert.strictEqual(filters.status.$eq, 'published');
    });

    await runTest("planRetrieval throws if chapter is not published", async () => {
        const mockSnap = { exists: true, data: () => ({ status: 'draft' }) };
        
        let threw = false;
        if (adminDb) {
            const originalGet = adminDb.collection('chapters').doc('test-chap').get;
            adminDb.collection('chapters').doc('test-chap').get = () => Promise.resolve(mockSnap as any);
            
            try {
               try {
                 await planRetrieval({
                     query: 'test',
                     subjectCode: 'PHY',
                     classLevel: '11',
                     chapterKey: 'test-chap',
                     history: []
                 }, 'concept_explanation');
               } catch (e: any) {
                   threw = true;
                   assert.ok(e.message.includes('not published'), "Expected 'not published' error");
               }
               assert.ok(threw, "planRetrieval should have thrown");
            } finally {
                adminDb.collection('chapters').doc('test-chap').get = originalGet;
            }
        }
    });

    await runTest("Structure intent bypasses Pinecone and hits structure index", async () => {
        const mockChapSnap = { exists: true, data: () => ({ status: 'published' }) };
        const mockIndexSnap = { exists: true, data: () => ({ summaryPoints: ['A', 'B'] }) };
        
        if (adminDb) {
            const originalChapGet = adminDb.collection('chapters').doc('test-chap').get;
            const originalIndexGet = adminDb.collection('chapterStructureIndex').doc('test-chap').get;
            
            adminDb.collection('chapters').doc('test-chap').get = () => Promise.resolve(mockChapSnap as any);
            adminDb.collection('chapterStructureIndex').doc('test-chap').get = () => Promise.resolve(mockIndexSnap as any);
            
            try {
                const context = await planRetrieval({
                     query: 'summarize the chapter',
                     subjectCode: 'PHY',
                     classLevel: '11',
                     chapterKey: 'test-chap',
                     history: []
                 }, 'structure_query');
                 
                assert.deepStrictEqual(context.structureIndex, { summaryPoints: ['A', 'B'] });
                assert.strictEqual(context.textChunks.length, 0);
            } finally {
                adminDb.collection('chapters').doc('test-chap').get = originalChapGet;
                adminDb.collection('chapterStructureIndex').doc('test-chap').get = originalIndexGet;
            }
        }
    });

    await runTest("No image/imageUrl payloads allowed in PineconeMetadata strict schema", async () => {
         // Dynamically importing to check zod schema parsing
         const { PineconeMetadataSchema } = await import('../lib/vector/metadataSchema');
         let threw = false;
         try {
             PineconeMetadataSchema.parse({
                 chunkId: '123',
                 chapterKey: 'c1',
                 text: 'hello',
                 chunkType: 'text',
                 imageUrl: 'http://example.com/img.png' // Should fail .strict()
             });
         } catch(e) {
             threw = true;
         }
         assert.ok(threw, "Schema should reject imageUrl");
    });

    console.log(`\n=== Test Summary ===`);
    console.log(`Tests Run: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
