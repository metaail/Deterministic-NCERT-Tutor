import { createHash } from 'crypto';

interface CacheEntry {
    result: any[];
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export function getRetrievalCache(query: string, subjectCode: string, classLevel: string, chapterKey: string): any[] | null {
    const key = hashQuery(query, subjectCode, classLevel, chapterKey);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.result;
}

export function setRetrievalCache(query: string, subjectCode: string, classLevel: string, chapterKey: string, result: any[]) {
    const key = hashQuery(query, subjectCode, classLevel, chapterKey);
    cache.set(key, {
        result,
        timestamp: Date.now()
    });
}

export function hashQuery(query: string, subjectCode: string, classLevel: string, chapterKey: string): string {
    const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ');
    const rawMatch = `${normalizedQuery}|${subjectCode}|${classLevel}|${chapterKey}`;
    return createHash('sha256').update(rawMatch).digest('hex');
}
