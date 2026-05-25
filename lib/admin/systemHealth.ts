import { getFirebaseHealth } from './firebaseHealth';
import { getPineconeHealth } from './pineconeHealth';
import { getIngestionStats } from './ingestionStats';
import { env } from '@/lib/utils/env';
import { getGeminiUsage } from '@/lib/stats/geminiUsage';

export async function getSystemHealth() {
    const envAudit = {
        FIREBASE_PROJECT_ID: !!env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!env.FIREBASE_PRIVATE_KEY,
        PINECONE_API_KEY: !!env.PINECONE_API_KEY,
        GEMINI_API_KEY: !!env.GEMINI_API_KEY
    };

    const firebase = await getFirebaseHealth();
    const pinecone = await getPineconeHealth();
    const stats = await getIngestionStats();
    const geminiUsage = getGeminiUsage();

    const retrievalDiag = {
        totalVectors: pinecone.vectorCount || (stats?.totalVectors || 0),
        avgChunksPerChapter: stats?.avgChunksPerChapter || 0,
        hybridSearchEnabled: true,
        lexicalFallbackEnabled: true,
        verifierEnabled: true
    };

    return {
        firebase,
        pinecone,
        stats,
        retrievalDiag,
        envAudit,
        geminiUsage
    };
}
