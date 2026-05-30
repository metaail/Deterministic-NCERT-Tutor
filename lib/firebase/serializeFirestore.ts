export function serializeFirestoreData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj?.toDate === 'function') {
    return obj.toDate().toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => serializeFirestoreData(item));
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = serializeFirestoreData(obj[key]);
      }
    }
    return newObj;
  }

  return obj;
}
