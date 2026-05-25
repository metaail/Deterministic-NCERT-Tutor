'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSystemDiagnostics, runSampleRetrievalTest } from '@/lib/admin/actions';

const StatusBadge = ({ isOk }: { isOk: boolean }) => (
    <span className={`px-2 py-1 rounded text-xs font-bold ${isOk ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isOk ? 'OK' : 'ERROR'}
    </span>
);

export default function SystemDiagnosticsPage() {
    const [diagnostics, setDiagnostics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testResult, setTestResult] = useState<any>(null);
    const [testLoading, setTestLoading] = useState(false);

    const loadDiagnostics = useCallback(async () => {
        try {
            const data = await fetchSystemDiagnostics();
            setDiagnostics(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        loadDiagnostics();
    }, [loadDiagnostics]);

    const handleRefresh = async () => {
        setLoading(true);
        await loadDiagnostics();
    };

    const handleRunTest = async () => {
        setTestLoading(true);
        const res = await runSampleRetrievalTest('chapter_1', '042', 'class11');
        setTestResult(res);
        setTestLoading(false);
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-mono text-sm">Loading System Diagnostics...</div>;

    if (!diagnostics) return <div className="p-10 font-mono text-sm text-red-500">Failed to load diagnostics.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">System Diagnostics & Health</h1>
            <div className="mb-6 flex gap-4">
                <button onClick={handleRefresh} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">Refresh All Stats</button>
                <button onClick={handleRunTest} className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 disabled:opacity-50" disabled={testLoading}>
                    {testLoading ? 'Running test...' : 'Run Sample Retrieval Test'}
                </button>
            </div>

            {testResult && (
                <div className="mb-6 p-4 bg-white rounded shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-2">Sample Retrieval Test Results</h3>
                    <pre className="text-xs text-gray-600 overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Firebase */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between">
                        Firebase Status <StatusBadge isOk={diagnostics.firebase.connected} />
                    </h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Initialized: {String(diagnostics.firebase.initialized)}</li>
                        <li>Connected: {String(diagnostics.firebase.connected)}</li>
                        <li>Admin SDK: {diagnostics.firebase.adminSdkStatus}</li>
                        <li className="mt-2 font-semibold">Collections Accessible:</li>
                        {Object.entries(diagnostics.firebase.collections).map(([k, v]) => (
                            <li key={k} className="ml-4">- {k}: {String(v)}</li>
                        ))}
                    </ul>
                </div>

                {/* Pinecone */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between">
                        Pinecone Status <StatusBadge isOk={diagnostics.pinecone.connected} />
                    </h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Initialized: {String(diagnostics.pinecone.initialized)}</li>
                        <li>Connected: {String(diagnostics.pinecone.connected)}</li>
                        <li>Dense Index Exists: {String(diagnostics.pinecone.denseExists)}</li>
                        <li>Sparse Index Exists: {String(diagnostics.pinecone.sparseExists)}</li>
                        <li>Vector Count: {diagnostics.pinecone.vectorCount}</li>
                        <li className="mt-2 font-semibold">Namespaces:</li>
                        {diagnostics.pinecone.namespaces?.map((ns: string) => (
                            <li key={ns} className="ml-4">- {ns}</li>
                        )) || <li className="ml-4">None detected</li>}
                    </ul>
                </div>

                {/* Stats */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Ingestion Statistics</h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Total NCERT Chapters: {diagnostics.stats?.totalChapters ?? 'N/A'}</li>
                        <li>Indexed Admin Chapters: {diagnostics.stats?.indexedChapters ?? 'N/A'}</li>
                        <li>Published Student Chapters: {diagnostics.stats?.publishedChapters ?? 'N/A'}</li>
                        <li>Total PYQ Papers: {diagnostics.stats?.totalPyqPapers ?? 'N/A'}</li>
                        <li>Published PYQ Papers: {diagnostics.stats?.publishedPyqPapers ?? 'N/A'}</li>
                        <li>Total PYQ Questions: {diagnostics.stats?.totalPyqs ?? 'N/A'}</li>
                        <li>Published PYQ Questions: {diagnostics.stats?.publishedPyqs ?? 'N/A'}</li>
                        <li>Failed Jobs: {diagnostics.stats?.failedIngestionJobs ?? 'N/A'}</li>
                        <li className="text-red-500 font-semibold">Subject Mismatch Warnings: {diagnostics.stats?.mismatchWarnings ?? 0}</li>
                        <li className="font-semibold text-green-600">Retrieval QA Tests: {diagnostics.stats?.retrievalTestPassed ? "PASSED" : "PENDING"}</li>
                    </ul>
                </div>

                {/* Atomic Chunks Stats */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Atomic Chunk Statistics</h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Formulas: {diagnostics.stats?.formulasCount ?? 0}</li>
                        <li>Figures: {diagnostics.stats?.figuresCount ?? 0}</li>
                        <li>Tables: {diagnostics.stats?.tablesCount ?? 0}</li>
                        <li>Examples/Problems: {diagnostics.stats?.examplesCount ?? 0}</li>
                        <li>Exercises: {diagnostics.stats?.exercisesCount ?? 0}</li>
                        <li>Summary Points: {diagnostics.stats?.summaryPointsCount ?? 0}</li>
                        <li className="mt-2 font-semibold">By Vector Type:</li>
                        {diagnostics.stats?.vectorTypeCounts && Object.entries(diagnostics.stats.vectorTypeCounts).map(([k, v]) => (
                            <li key={k} className="ml-4">- {k}: {v as number}</li>
                        ))}
                    </ul>
                </div>

                {/* Retrieval Diag */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Retrieval Diagnostics</h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Total Vectors: {diagnostics.retrievalDiag.totalVectors}</li>
                        <li>Avg Chunks / Chapter: {diagnostics.retrievalDiag.avgChunksPerChapter}</li>
                        <li>Hybrid Search: <StatusBadge isOk={diagnostics.retrievalDiag.hybridSearchEnabled} /></li>
                        <li>Lexical Fallback: <StatusBadge isOk={diagnostics.retrievalDiag.lexicalFallbackEnabled} /></li>
                        <li>Verifier: <StatusBadge isOk={diagnostics.retrievalDiag.verifierEnabled} /></li>
                    </ul>
                </div>

                {/* Env Audit */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Environment Audit</h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        {Object.entries(diagnostics.envAudit).map(([k, v]) => (
                            <li key={k} className="flex justify-between items-center">
                                <span>{k}</span>
                                <StatusBadge isOk={v as boolean} />
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Gemini Usage Audit */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="font-bold text-gray-800 mb-4 border-b pb-2 flex justify-between">
                        Gemini Quota Tracker
                        {diagnostics.geminiUsage?.isNearingLimit ? (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-800">
                                CAPACITY WARNING
                            </span>
                        ) : (
                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                                NORMAL
                            </span>
                        )}
                    </h2>
                    <ul className="text-sm space-y-2 text-gray-600">
                        <li>Requests Made: {diagnostics.geminiUsage?.requests || 0}</li>
                        <li>Assumed Limit: {diagnostics.geminiUsage?.limit || 1500}</li>
                        <li>Usage Ratio: {(((diagnostics.geminiUsage?.requests || 0) / (diagnostics.geminiUsage?.limit || 1)) * 100).toFixed(1)}%</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
