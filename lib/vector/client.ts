import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '@/lib/utils/env';

let pineconeClient: Pinecone | null = null;

export function getPineconeClient() {
  if (!pineconeClient && env.PINECONE_API_KEY) {
    pineconeClient = new Pinecone({
      apiKey: env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

export const INDEX_NAME_DENSE = 'neet-jee-reference-tutor-dense';
export const INDEX_NAME_SPARSE = 'neet-jee-reference-tutor-sparse';
