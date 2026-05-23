import assert from 'node:assert';
import { verifyResponse } from '../lib/chat/verifier';
import { getPineconeClient } from '../lib/vector/client';
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
            console.error(err.message || err);
            failed++;
        }
    };

    console.log("=== Running QA Tests ===\n");

    // --- Verifier Tests ---
    await runTest("Verifier blocks image markdown", () => {
        const res = verifyResponse("Here is the graph: ![graph](http://example.com/a.png)");
        assert.strictEqual(res.isValid, false);
        assert.ok(res.reason?.includes("Image markdown"));
    });

    await runTest("Verifier blocks raw image URLs", () => {
        const res = verifyResponse("Check it out here: http://example.com/test.jpg");
        assert.strictEqual(res.isValid, false);
        assert.ok(res.reason?.includes("URLs"));
    });

    await runTest("Verifier blocks base64 payloads", () => {
        const res = verifyResponse("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...");
        assert.strictEqual(res.isValid, false);
        assert.ok(res.reason?.includes("Base64"));
    });

    await runTest("Verifier blocks $$ delimiters", () => {
        const res = verifyResponse("The equation is $$ x^2 $$");
        assert.strictEqual(res.isValid, false);
        assert.ok(res.reason?.includes("delimiter $$"));
    });

    await runTest("Verifier fixes $ math delimiters", () => {
        const res = verifyResponse("Let $x=2$ be the value.");
        assert.strictEqual(res.isValid, true);
        assert.ok(res.sanitizedResponse?.includes("\\(x=2\\)"));
        assert.strictEqual(res.sanitizedResponse?.includes("$x=2$"), false);
    });

    await runTest("Verifier blocks fake PYQ references", () => {
        const res = verifyResponse("This came in NEET 2025!");
        assert.strictEqual(res.isValid, false);
        assert.ok(res.reason?.includes("Fake or unverified PYQ citation"));
    });

    await runTest("Verifier allows valid PYQ references", () => {
        const allowed = [{ year: 2021, exam: 'NEET' }];
        const res = verifyResponse("This came in NEET 2021!", allowed);
        assert.strictEqual(res.isValid, true);
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
