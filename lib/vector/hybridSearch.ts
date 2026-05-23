import { searchDense } from './denseSearch';
import { searchSparse } from './sparseSearch';
import { lexicalSearchFallback } from './lexicalFallback';
import { fuseScores } from './scoreFusion';
import { deterministicRerank } from './reranker';
import { getRetrievalCache, setRetrievalCache } from '@/lib/cache/retrievalCache';

export async function executeHybridSearch(
    query: string,
    subjectCode: string,
    classLevel: string,
    chapterKey: string
) {
    const cached = getRetrievalCache(query, subjectCode, classLevel, chapterKey);
    if (cached) {
        console.log("[HybridSearch] Cache hit");
        (cached as any).isCacheHit = true;
        return cached;
    }

    const topKDense = 12;
    const topKSparse = 12;
    const finalTopK = 5;

    // 1. Run Dense Search and Sparse Search concurrently
    const [denseRes, sparseResInitial] = await Promise.all([
        searchDense(query, subjectCode, classLevel, chapterKey, topKDense),
        searchSparse(query, subjectCode, classLevel, chapterKey, topKSparse)
    ]);

    // 2. Lexical Fallback if BOTH Dense and Sparse are empty or poor
    let sparseRes: any[] = sparseResInitial;
    // Pinecone-only fast path optimization: fallback only if high confidence matches are missing
    const hasHighConfidence = denseRes.length > 0 && denseRes[0].score && denseRes[0].score > 0.70;
    if (!hasHighConfidence && denseRes.length < 3) {
        sparseRes = await lexicalSearchFallback(query, subjectCode, classLevel, chapterKey, topKSparse);
    }

    // 3. Score Fusion
    const fusedRes = fuseScores(denseRes, sparseRes, finalTopK);

    // 4. Deterministic Rerank
    const finalRes = deterministicRerank(fusedRes, query, finalTopK);

    console.log("[DEBUG] Dense:", denseRes.length, "Sparse:", sparseRes.length, "Fused:", fusedRes.length, "Final:", finalRes.length);

    setRetrievalCache(query, subjectCode, classLevel, chapterKey, finalRes);
    return finalRes;
}
