export function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  // Fallback for serialized timestamps that might not be instances anymore
  if ('_seconds' in obj && '_nanoseconds' in obj) {
    return new Date(obj._seconds * 1000).toISOString();
  }
  if ('seconds' in obj && 'nanoseconds' in obj) {
    return new Date(obj.seconds * 1000).toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeFirestoreData(item));
  }

  const plain: any = {};
  for (const key of Object.keys(obj)) {
    // Drop document references
    if (obj[key]?.path && typeof obj[key].get === 'function') {
      plain[key] = obj[key].path;
      continue;
    }
    plain[key] = serializeFirestoreData(obj[key]);
  }
  return plain;
}

