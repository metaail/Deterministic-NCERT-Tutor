import http from 'http';

async function performTest() {
  const query = 'list out few important question from this chapter';
  const chapterId = 'maths_sample';
  
  console.log("Starting timer...");
  const t0 = Date.now();
  
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
      res.on('data', c => { 
          if(data === '') console.log("Time to first byte:", Date.now() - t0, "ms");
          data += c; 
      });
      res.on('end', () => {
          console.log("Time to end:", Date.now() - t0, "ms");
          console.log("Output:", data);
      });
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
