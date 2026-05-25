// Phase 7I test cases
import('node-fetch').then(async ({ default: fetch }) => {
  const tests = [
    {
      name: "Cartesian product query in Relations and Functions chapter",
      query: "What is the cartesian product of two non-empty sets?",
      chapterKey: "ch-maths-1779381135982", // Replace with valid chapterKey if needed
      expectBlocked: false
    },
    {
      name: "Quadratic query in Relations and Functions chapter is blocked",
      query: "what is quadratic equation explain with example",
      chapterKey: "ch-maths-1779381135982",
      expectBlocked: true
    },
    {
       name: "Query outside selected chapter is blocked (biology in maths)",
       query: "explain the human digestive system",
       chapterKey: "ch-maths-1779381135982",
       expectBlocked: true
    }
  ];

  for (const t of tests) {
    console.log(`\nRunning test: ${t.name}`);
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
    
    // Check if blocked by grounding guard or stream verifier
    const isBlocked = text.includes("is not available in the currently selected NCERT chapter") || text.includes("Content blocked by verifier") || text.includes("The retrieved text does not contain this information");
    
    if (isBlocked === t.expectBlocked) {
        console.log("✅ PASS");
    } else {
        console.error("❌ FAIL", "Expected blocked:", t.expectBlocked, "Actual text:", text);
    }
    
    if (!isBlocked && !t.expectBlocked) {
        // Also check if answer starts with I cannot
        if (text.toLowerCase().includes("i cannot")) {
            console.error("❌ FAIL: Answer includes forbidden 'I cannot' phrase");
        }
    }
  }
});
