import http from 'http';
import { adminDb } from './lib/firebase/admin';

async function performTest() {
  const chapterId = 'ch-maths-1779381135982';

  const query = 'write all the summary of the chapter';
  
  const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      }
  }, (res) => {
      res.on('data', (chunk) => {
          console.log(`data: ${chunk.toString()}`);
      });
      res.on('end', () => {
          console.log('done');
      });
  });

  const body = JSON.stringify({
      messages: [{ role: 'user', content: query }],
      chapterKey: chapterId,
      subjectCode: '041',
      classLevel: 'Class 11'
  });

  req.on('error', (e) => {
      console.error(e);
  });

  req.write(body);
  req.end();
}

performTest().catch(console.error);
