import('node-fetch').then(async ({ default: fetch }) => {
  const tests = [
    // Positive Cases
    {
      name: "[Positive] Simple math query routing",
      query: "What is 5 + 7 * 3?",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "simple_math_query"
    },
    {
      name: "[Positive] Simple arithmetic keyword",
      query: "Simple arithmetic: 10/2",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "simple_math_query"
    },
    {
      name: "[Positive] Element counting logic",
      query: "how many elements are in A cross B?",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "simple_math_query"
    },

    // Negative Cases (should route to RAG / Concept Explanation, etc.)
    {
      name: "[Negative] Conceptual questions",
      query: "What is a relation?",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "concept_explanation"
    },
    {
      name: "[Negative] Request for proofs",
      query: "Prove that every function is a relation",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "concept_explanation"
    },
    {
      name: "[Negative] Ask for an example",
      query: "what is an example of a relation",
      chapterKey: "ch-maths-1779381135982",
      expectIntent: "example_query"
    },

    // Edge Cases
    {
      name: "[Edge Case] Mixing simple math and conceptual (relies on order in regex)",
      query: "What is 5+5 and what is a relation?",
      chapterKey: "ch-maths-1779381135982",
      // Since it starts with "What is 5+5", regex `/^what is \d+[\s\+\-\*\/]+\d+/i` catches it
      expectIntent: "simple_math_query"
    }
  ];

  for (const t of tests) {
    console.log(`\nRunning Phase 7J test: ${t.name}`);
    const start = Date.now();
    const req = await fetch('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectCode: "041", classLevel: "Class 11", chapterKey: t.chapterKey, query: t.query
      })
    });
    const text = await req.text();
    console.log(`Time: ${Date.now() - start}ms`);
    
    if (text.includes(t.expectIntent)) {
        console.log(`✅ PASS: Correct intent routed (${t.expectIntent})`);
    } else {
        console.error(`❌ FAIL: Expected intent ${t.expectIntent} not found. Response extract:`, text.substring(0, 200));
    }
  }
});
