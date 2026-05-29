export const getVectorClient = () => ({});
export const getPineconeIndex = () => ({});
export const getPineconeClient = () => ({ listIndexes: () => ({ indexes: [] }), Index: (name?: string) => ({ describeIndexStats: () => ({ namespaces: {}, totalRecordCount: 0 }) }) });
export const INDEX_NAME_DENSE = 'dense';
export const INDEX_NAME_SPARSE = 'sparse';
