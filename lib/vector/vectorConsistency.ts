import { PineconeMetadata } from './metadataSchema';
import { ChapterChunk } from '@/types';
import { getNamespace } from './namespace';
import { mapToVectorStatus } from './statusMapper';

export function validateVectorConsistency(
  chunk: ChapterChunk,
  vectorMetadata: PineconeMetadata,
  actualNs: string
): 'PASS' | 'WARNING' | 'FAIL' {
  if (!chunk) return 'FAIL';
  if (!vectorMetadata) return 'FAIL';

  let hasWarning = false;

  const expectedNs = getNamespace(chunk.classLevel, chunk.subjectCode);
  if (actualNs !== expectedNs) return 'FAIL';

  if (vectorMetadata.chunkId !== chunk.chunkId) return 'FAIL';
  if (vectorMetadata.chapterKey !== chunk.chapterKey) return 'FAIL';
  
  if (vectorMetadata.status !== mapToVectorStatus(chunk.status)) return 'FAIL';

  if (!vectorMetadata.embeddingModel) return 'FAIL';
  if (!vectorMetadata.contentHash) return 'FAIL';

  // Check forbidden fields
  const anyMeta = vectorMetadata as any;
  const forbiddenFields = [
    'imageUrl', 'base64', 'imageData', 'croppedImage', 'diagramUrl', 'generatedImage'
  ];
  for (const field of forbiddenFields) {
    if (field in anyMeta) return 'FAIL';
  }

  return hasWarning ? 'WARNING' : 'PASS';
}
