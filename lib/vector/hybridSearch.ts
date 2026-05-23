import { searchDense } from './denseSearch';
import { searchSparse } from './sparseSearch';
import { lexicalSearchFallback } from './lexicalFallback';
import { fuseScores } from './scoreFusion';
import { deterministicRerank } from './reranker';

export async function executeHybridSearch(
    query: string,
    subjectCode: string,
    classLevel: string,
    chapterKey: string
) {
    const topKDense = 12;
    const topKSparse = 12;
    const finalTopK = 5;

    // 1. Run Dense Search and Sparse Search concurrently
    const [denseRes, sparseResInitial] = await Promise.all([
        searchDense(query, subjectCode, classLevel, chapterKey, topKDense),
        searchSparse(query, subjectCode, classLevel, chapterKey, topKSparse)
    ]);

    // 2. Lexical Fallback if Sparse is empty
    let sparseRes: any[] = sparseResInitial;
    if (sparseRes.length === 0) {
        sparseRes = await lexicalSearchFallback(query, subjectCode, classLevel, chapterKey, topKSparse);
    }

    // 3. Score Fusion
    const fusedRes = fuseScores(denseRes, sparseRes, finalTopK);

    // 4. Deterministic Rerank
    const finalRes = deterministicRerank(fusedRes, query, finalTopK);

    console.log("[DEBUG] Dense:", denseRes.length, "Sparse:", sparseRes.length, "Fused:", fusedRes.length, "Final:", finalRes.length);

    return finalRes;
}
