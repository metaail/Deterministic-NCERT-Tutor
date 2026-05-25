import { PineconeMetadata } from '../vector/metadataSchema';

export function inspectTopK(chunks: PineconeMetadata[]) {
  if (!chunks || chunks.length === 0) {
    return {
       namespaces: [],
       chapters: [],
       topics: []
    };
  }

  const namespaces = new Set<string>();
  const chapters = new Set<string>();
  
  for (const c of chunks) {
     const ns = `${c.classLevel.replace('Class ', 'class')}_${c.subjectCode === '042' ? 'PHY' : c.subjectCode === '043' ? 'CHM' : c.subjectCode === '044' ? 'BIO' : 'MTH'}`;
     namespaces.add(ns);
     chapters.add(c.chapterKey);
  }

  return {
    namespaces: Array.from(namespaces),
    chapters: Array.from(chapters)
  };
}
