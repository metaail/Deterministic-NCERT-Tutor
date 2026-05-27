export interface StreamMetrics {
  retrievalLatency: number;
  geminiLatency: number;
  verifierLatency: number;
  totalLatency: number;
  timeToFirstToken: number;
  tokensPerSecond: number;
  cacheHit?: boolean;
}

export interface StreamEvent {
  content?: string;
  metadata?: any;
  error?: string;
  done?: boolean;
}
