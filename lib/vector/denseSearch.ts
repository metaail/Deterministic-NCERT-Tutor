import { getPineconeClient, INDEX_NAME_DENSE } from './client';
import { generateEmbedding } from './embedding';
import { getNamespace } from './namespace';
import { getStudentSearchFilters } from './metadataFilters';
import { PineconeMetadata } from './metadataSchema';

export async function searchDense(
    query: string, 
    subjectCode: string, 
    classLevel: string, 
    chapterKey: string, 
    topK: number = 12
) {
    const pinecone = getPineconeClient();
    if (!pinecone) throw new Error("Pinecone client not initialized");

    const vector = await generateEmbedding(query);
    const namespace = getNamespace(classLevel, subjectCode);
    const filters = getStudentSearchFilters(subjectCode, classLevel, chapterKey);

    const index = pinecone.Index(INDEX_NAME_DENSE);
    
    console.log("[DEBUG] Dense Query:", { namespace, query, filters });

    const response = await index.namespace(namespace).query({
        topK,
        vector,
        filter: filters,
        includeMetadata: true
    });

    console.log("[DEBUG] Dense Response Matches:", response.matches.length);

    return response.matches.map(m => ({
        id: m.id,
        score: m.score || 0,
        metadata: m.metadata as PineconeMetadata
    }));
}
