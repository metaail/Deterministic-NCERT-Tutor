'use server';

import { getSystemHealth } from './systemHealth';
import { executeHybridSearch } from '@/lib/vector/hybridSearch';
import { verifyResponse } from '@/lib/chat/verifier';

export async function fetchSystemDiagnostics() {
    return await getSystemHealth();
}

export async function runSampleRetrievalTest(chapterKey: string, subjectCode: string, classLevel: string) {
    try {
        const query = "test query for retrieval";
        const results = await executeHybridSearch(query, subjectCode, classLevel, chapterKey);
        
        const onlyPublished = results.every((r: any) => r.metadata.status === 'published');
        
        const noImageFields = results.every((r: any) => {
            const meta = r.metadata;
            return !meta.imageUrl && !meta.base64 && !meta.imageData;
        });

        const verifyRes = verifyResponse("This is a test ![image](http://bad.jpg)");
        const verifierActive = !verifyRes.isValid;

        return {
            success: true,
            resultsCount: results.length,
            onlyPublished,
            noImageFields,
            verifierActive
        };
    } catch (e: any) {
        return {
            success: false,
            error: e.message
        };
    }
}
