import fs from 'fs';

async function test() {
  const req = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subjectCode: "041",
      classLevel: "Class 11",
      chapterKey: "ch-maths-1779380737896", 
      query: "What is the cartesian product of two non-empty sets?"
    })
  });
  console.log(await req.json());
}
test();
