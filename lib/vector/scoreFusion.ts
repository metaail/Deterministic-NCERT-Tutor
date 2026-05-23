// Deterministic reciprocal rank fusion
export function fuseScores(denseResults: any[], sparseResults: any[], finalTopK: number = 5) {
    const fusionMap = new Map<string, any>();
    
    const k = 60; // Standard RRF factor

    denseResults.forEach((res, index) => {
        const id = res.id;
        const rrfScore = 1 / (k + index + 1);
        fusionMap.set(id, { id, metadata: res.metadata, denseScore: res.score, rrfScore });
    });

    sparseResults.forEach((res, index) => {
        const id = res.id;
        const rrfScore = 1 / (k + index + 1);
        if (fusionMap.has(id)) {
            const existing = fusionMap.get(id);
            existing.rrfScore += rrfScore;
            existing.sparseScore = res.score;
        } else {
            fusionMap.set(id, { id, metadata: res.metadata, sparseScore: res.score, rrfScore });
        }
    });

    const fused = Array.from(fusionMap.values());
    fused.sort((a, b) => b.rrfScore - a.rrfScore);
    
    return fused.slice(0, Math.max(finalTopK * 2, fused.length));
}
