// Implement deterministic reranking only
export function deterministicRerank(results: any[], originalQuery: string, finalTopK: number) {
    const qLower = originalQuery.toLowerCase();
    const queryTokens = qLower.split(/\s+/);
    
    const reranked = results.map(r => {
        let boost = 0;
        const meta = r.metadata;
        if (!meta) return { ...r, finalScore: r.rrfScore };
        
        // Exact metadata boosts
        if (meta.vectorType === 'formula' && (qLower.includes('formula') || qLower.includes('equation'))) boost += 0.2;
        if (meta.vectorType === 'example' && (qLower.includes('example') || qLower.includes('problem'))) boost += 0.2;
        if (meta.vectorType === 'exercise' && qLower.includes('exercise')) boost += 0.2;
        if (meta.vectorType === 'table' && qLower.includes('table')) boost += 0.2;
        if (meta.vectorType === 'figure' && (qLower.includes('figure') || qLower.includes('diagram'))) boost += 0.2;
        if (meta.vectorType === 'summary' && qLower.includes('summary')) boost += 0.2;
        
        // Number matching logic
        const matchesNumber = (num?: string) => num && queryTokens.includes(num);
        if (matchesNumber(meta.exampleNumber)) boost += 0.5;
        if (matchesNumber(meta.problemNumber)) boost += 0.5;
        if (matchesNumber(meta.exerciseNumber)) boost += 0.5;
        if (matchesNumber(meta.tableNumber)) boost += 0.5;
        if (matchesNumber(meta.figureNumber)) boost += 0.5;
        if (matchesNumber(meta.sectionNumber)) boost += 0.3;

        // concept overlap
        meta.conceptTags?.forEach((tag: string) => {
            if (qLower.includes(tag.toLowerCase())) boost += 0.05;
        });

        // alias overlap
        meta.retrievalAliases?.forEach((alias: string) => {
            if (qLower.includes(alias.toLowerCase())) boost += 0.1;
        });
        
        return {
            ...r,
            finalScore: r.rrfScore + boost
        };
    });
    
    reranked.sort((a, b) => b.finalScore - a.finalScore);
    return reranked.slice(0, finalTopK);
}
