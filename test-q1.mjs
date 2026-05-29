import http from 'http';

async function performTest() {
  const query = 'How many Examples are there ?';
  const chapterId = 'relationsAndFunctions';
  
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

performTest();
