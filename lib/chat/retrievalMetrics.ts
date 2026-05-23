export interface RetrievalMetrics {
  retrievalLatency: number;
  pineconeLatency?: number;
  geminiLatency: number;
  verifierLatency: number;
  totalLatency: number;
  timeToFirstToken: number;
  tokensPerSecond: number;
  cacheHit?: boolean;
}

export const metricsStore: Array<{ timestamp: number; path: string; metrics: RetrievalMetrics }> = [];

export function logMetrics(path: string, metrics: RetrievalMetrics) {
  metricsStore.push({ timestamp: Date.now(), path, metrics });
  if (metricsStore.length > 1000) {
    metricsStore.shift();
  }
}

export function getMetrics() {
  return [...metricsStore];
}
