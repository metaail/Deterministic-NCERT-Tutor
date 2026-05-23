import { adminDb } from '@/lib/firebase/admin';

export async function logPromptAudit(query: string, response: string, intent: string, isValid: boolean) {
    if (!adminDb) return;
    try {
        await adminDb.collection('promptAudits').add({
            query,
            responsePreview: response.substring(0, 200),
            intent,
            isValid,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Audit log failed to save", e);
    }
}
