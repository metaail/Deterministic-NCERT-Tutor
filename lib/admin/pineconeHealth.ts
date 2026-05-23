import { getPineconeClient, INDEX_NAME_DENSE, INDEX_NAME_SPARSE } from '@/lib/vector/client';

export async function getPineconeHealth() {
    const pinecone = getPineconeClient();
    let initialized = !!pinecone;
    let connected = false;
    let denseExists = false;
    let sparseExists = false;
    let namespaces: string[] = [];
    let vectorCount = 0;

    if (pinecone) {
        try {
            const indexes = await pinecone.listIndexes();
            const idxNames = indexes.indexes?.map((i: any) => i.name) || [];
            
            denseExists = idxNames.includes(INDEX_NAME_DENSE);
            sparseExists = idxNames.includes(INDEX_NAME_SPARSE);
            
            if (denseExists) {
                connected = true;
                const index = pinecone.Index(INDEX_NAME_DENSE);
                const stats = await index.describeIndexStats();
                if (stats.namespaces) {
                    namespaces = Object.keys(stats.namespaces);
                    vectorCount = stats.totalRecordCount || 0;
                }
            }
        } catch (e) {
            console.error("Pinecone health check failed", e);
        }
    }

    return {
        initialized,
        connected,
        denseExists,
        sparseExists,
        namespaces,
        vectorCount
    };
}
