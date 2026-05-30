import http from 'http';

import { adminDb } from './lib/firebase/admin';

async function performTest() {
  const snapshot = await adminDb.collection("chapters")
        .where("status", "in", ["published", "indexed"])
        .where("chapterTitle", "==", "relationsAndFunctions")
        .get();
  
  let chapterId = snapshot.docs.length > 0 ? snapshot.docs[0].id : '';

  console.log("Using Chapter ID:", chapterId);

  if (!chapterId) {
      console.log("Chapter relationsAndFunctions not found!");
      return;
  }

  const query = 'How many examples are there in this chapter Write all the examples';
  
  const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => console.log("Output:", data));
    });
    
  req.write(JSON.stringify({
      query,
      subjectCode: '041',
      classLevel: 'Class 11',
      chapterKey: chapterId,
      history: []
  }));
  req.end();
}

performTest().catch(console.error);
