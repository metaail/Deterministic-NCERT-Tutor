import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';
import { getPineconeClient, INDEX_NAME_DENSE } from '@/lib/vector/client';
import { runBenchmark } from '@/lib/rag/benchmarkEvaluator';

export const dynamic = 'force-dynamic';

export default async function RagQualityDashboard() {
    let logs: any[] = [];
    let namespaces: any = {};
    let pcStats: any = null;

    if (adminDb) {
        const snap = await adminDb.collection('retrievalLogs').orderBy('timestamp', 'desc').limit(20).get();
        logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    try {
        const pc = getPineconeClient();
        if (pc) {
            const index = pc.Index(INDEX_NAME_DENSE);
            pcStats = await index.describeIndexStats();
            namespaces = pcStats?.namespaces || {};
        }
    } catch(e) {
        console.error("Pinecone stat issue", e);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">RAG Quality Dashboard</h1>
                <Link href="/admin" className="text-indigo-600 hover:underline">Back to Admin</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Vector Capabilities</h2>
                    <ul className="text-sm space-y-2">
                         <li><strong>Total Dimensions:</strong> {pcStats?.dimension || 'N/A'}</li>
                         <li><strong>Total Vector Count:</strong> {pcStats?.totalRecordCount || 'N/A'}</li>
                         <li><strong>Index Fullness:</strong> {pcStats?.indexFullness || 0}</li>
                    </ul>
                    <h3 className="font-semibold text-sm mt-4 text-gray-700">Namespaces:</h3>
                    {Object.keys(namespaces).length > 0 ? (
                        <ul className="text-xs space-y-1 mt-2 text-gray-600 bg-gray-50 p-2 rounded">
                            {Object.entries(namespaces).map(([ns, stats]: [string, any]) => (
                                <li key={ns} className="flex justify-between"><span>{ns || 'default'}:</span> <span>{stats.recordCount} vectors</span></li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-gray-500 mt-2">No namespaces found.</p>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Retrieval Logs (Last 20)</h2>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                        {logs.map(log => (
                            <div key={log.id} className="text-xs p-3 bg-gray-50 border border-gray-100 rounded">
                                <div className="font-bold text-indigo-700 mb-1">{log.query}</div>
                                <div className="flex gap-3 text-gray-500">
                                    <span>Intent: {log.intent}</span>
                                    <span>Route: {log.retrievalRoute}</span>
                                    <span>Chunks: {log.topKChunks?.length}</span>
                                </div>
                            </div>
                        ))}
                        {logs.length === 0 && <p className="text-xs text-gray-500">No logs generated yet. Run benchmarks.</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h2 className="font-bold text-lg mb-4 text-gray-800 border-b pb-2">Run Retrieval Test</h2>
                <p className="text-sm text-gray-600 mb-4">Run `npx tsx scripts/benchmarkRag.ts` to trigger a simulated production benchmark set.</p>
            </div>
        </div>
    );
}
