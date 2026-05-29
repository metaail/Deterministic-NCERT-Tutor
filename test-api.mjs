import http from 'http';

async function runTests() {
  console.log("Starting API tests...");
  
  const testChat = async (query, forceGeneral = false) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data });
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(JSON.stringify({
        query: query,
        history: [],
        subjectCode: 'math',
        classLevel: '10',
        chapterKey: 'maths_sample',
        forceGeneral: forceGeneral
      }));
      req.end();
    });
  };

  try {
    const res1 = await testChat('What is the capital of France?', true);
    console.log("Response 1 (Force General - Out of Chapter DB):");
    console.log("Status:", res1.status);
    console.log("Output Contains isGeneralDoubt?", res1.data.includes('isGeneralDoubt'));
    console.log("Raw Preview:", res1.data.slice(0, 300));
    console.log("---");

    const res2 = await testChat('What is real numbers?', false);
    console.log("Response 2 (Normal Chat - In Chapter Maths):");
    console.log("Status:", res2.status);
    console.log("Raw Preview:", res2.data.slice(0, 300));

  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTests();
