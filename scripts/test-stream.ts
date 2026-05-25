import('node-fetch').then(async ({ default: fetch }) => {
  const start = Date.now();
  const req = await fetch('http://localhost:3000/api/chat/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subjectCode: "041", classLevel: "Class 11", chapterKey: "ch-maths-1779381135982",
      query: "how many figures are there in this chapter?"
    })
  });
  console.log("Status:", req.status);
  const text = await req.text();
  console.log("Body:", text);
  console.log("Time (ms):", Date.now() - start);
});
