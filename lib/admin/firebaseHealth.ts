import { adminDb } from '@/lib/firebase/admin';

export async function getFirebaseHealth() {
    let initialized = false;
    let connected = false;
    const collections = {
        chapters: false,
        chapterChunks: false,
        chapterStructureIndex: false,
        ingestionJobs: false,
        tutorSessions: false
    };

    if (adminDb) {
        initialized = true;
        try {
            // Test connection
            const cols = await adminDb.listCollections();
            connected = true;

            // Test collections
            const colNames = cols.map(c => c.id);
            if (colNames.includes('chapters')) collections.chapters = true;
            if (colNames.includes('chapterChunks')) collections.chapterChunks = true;
            if (colNames.includes('chapterStructureIndex')) collections.chapterStructureIndex = true;
            if (colNames.includes('ingestionJobs')) collections.ingestionJobs = true;
            if (colNames.includes('tutorSessions')) collections.tutorSessions = true;

        } catch (e) {
            console.error("Firebase connection error:", e);
        }
    }

    return {
        initialized,
        connected,
        adminSdkStatus: initialized ? "Active" : "Inactive",
        collections
    };
}
