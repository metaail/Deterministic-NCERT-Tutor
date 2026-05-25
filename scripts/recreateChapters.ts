import { adminDb } from '../lib/firebase/admin';

async function main() {
  const chunksSnap = await adminDb.collection('chapterChunks').get();
  
  const chaptersMap = new Map();
  for (const doc of chunksSnap.docs) {
    const data = doc.data();
    if (!chaptersMap.has(data.chapterKey)) {
       chaptersMap.set(data.chapterKey, {
          title: data.chapterTitle || "Unknown Chapter",
          subject: data.subject,
          subjectCode: data.subjectCode,
          classLevel: data.classLevel,
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
       });
    }
  }

  for (const [key, val] of chaptersMap.entries()) {
     await adminDb.collection('chapters').doc(key).set(val);
     console.log("Created chapter:", key);
  }
}

main().catch(console.error);
