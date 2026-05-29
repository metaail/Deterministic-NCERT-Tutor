import { adminDb } from './lib/firebase/admin.js';
async function run() {
  const doc = await adminDb.collection('chapterStructureIndex').doc('ch-maths-1779381135982').get();
  console.log(JSON.stringify(doc.data(), null, 2));
}
run();
