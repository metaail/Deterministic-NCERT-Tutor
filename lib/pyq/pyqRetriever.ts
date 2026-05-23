import { adminDb } from '@/lib/firebase/admin';
import { PyqQuestion } from './validators';
import { rankPyqs } from './pyqRanker';

export async function searchPyq(query: string, subjectCode: string, classLevel: string, chapterKey?: string): Promise<PyqQuestion[]> {
  if (!adminDb) return [];
  
  try {
    let pyqRef: any = adminDb.collection("pyqQuestions")
      .where("status", "==", "published");
      
    if (chapterKey) {
        pyqRef = pyqRef.where("chapterKey", "==", chapterKey);
    }
    
    // We fetch a bunch of candidates in the chapter, then rank them locally
    // If no chapterKey, we might fetch a lot, so limit it
    const snapshot = await pyqRef.limit(50).get();
    
    const candidates: PyqQuestion[] = [];
    snapshot.forEach((doc: any) => {
      candidates.push(doc.data() as PyqQuestion);
    });

    const ranked = rankPyqs(candidates, query);
    // Return top 2 matching PYQs
    return ranked.slice(0, 2);
  } catch (err) {
    console.error("PYQ retrieval error:", err);
    return [];
  }
}
