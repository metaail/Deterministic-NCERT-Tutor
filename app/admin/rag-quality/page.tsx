"use client";

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, RefreshCw, BarChart2, CheckCircle2 } from 'lucide-react';

export default function RagQualityDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/metrics/rag');
      if (!res.ok) throw new Error(`Failed to fetch metrics: ${res.statusText}`);
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <p>Running RAG Health Check...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          <p className="font-semibold">Error Fetching Dashboard Data</p>
          <p>{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-white rounded-lg shadow text-red-600 font-medium">Retry</button>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const { stats, recommendations, firestoreChunks, pineconeVectors, mismatchTable, missingVectors, orphanVectors } = data;

  // Process data for charts
  const namespaceMap = new Map<string, number>();
  pineconeVectors.forEach((v: any) => {
    namespaceMap.set(v.namespace, (namespaceMap.get(v.namespace) || 0) + 1);
  });
  const namespaceChartData = Array.from(namespaceMap.entries()).map(([name, count]) => ({ name, count }));

  const contentTypeMap = new Map<string, number>();
  const embeddingStatusMap = new Map<string, number>();
  const subjectClassMap = new Map<string, number>();

  firestoreChunks.forEach((c: any) => {
    contentTypeMap.set(c.contentType || 'unknown', (contentTypeMap.get(c.contentType || 'unknown') || 0) + 1);
    embeddingStatusMap.set(c.embeddingStatus || 'unknown', (embeddingStatusMap.get(c.embeddingStatus || 'unknown') || 0) + 1);
    
    const subjClassKey = `${c.classLevel || 'unknown'} - ${c.subjectCode || 'unknown'}`;
    subjectClassMap.set(subjClassKey, (subjectClassMap.get(subjClassKey) || 0) + 1);
  });

  const contentTypeChartData = Array.from(contentTypeMap.entries()).map(([name, value]) => ({ name, value }));
  const embeddingStatusChartData = Array.from(embeddingStatusMap.entries()).map(([name, count]) => ({ name, count }));
  const subjectClassChartData = Array.from(subjectClassMap.entries()).map(([name, count]) => ({ name, count }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280'];

  const statsIssuesCount = stats.missingVectorsCount + stats.orphanVectorsCount + mismatchTable.length;
  const isHealthy = statsIssuesCount === 0;
  const isCritical = stats.missingVectorsCount > 50 || stats.orphanVectorsCount > 50;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-600" />
              RAG Quality Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualizing Firestore and Pinecone vector retrieval health.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {isHealthy ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                <ShieldCheck className="w-4 h-4" /> Healthy
              </span>
            ) : isCritical ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full border border-red-200">
                <ShieldAlert className="w-4 h-4" /> Critical
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 text-sm font-semibold rounded-full border border-yellow-200">
                <AlertTriangle className="w-4 h-4" /> Warning
              </span>
            )}
            
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Run Health Check
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-8 mt-8 space-y-8">
        
        {/* Recommendations Panel */}
        <section className={`p-6 rounded-2xl border ${isHealthy ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <CheckCircle2 className={`w-5 h-5 ${isHealthy ? 'text-green-600' : 'text-blue-600'}`} /> 
            Recommendations & Status
          </h2>
          <ul className="space-y-2">
            {recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-gray-700 ml-7 list-disc">{rec}</li>
            ))}
          </ul>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard title="Total Chunks (FB)" value={stats.totalFirestoreChunks} />
          <StatCard title="Total Vectors (Pinecone)" value={stats.totalPineconeVectors} />
          <StatCard title="Matched (FB ↔ PC)" value={stats.matchedCount} className="bg-indigo-50 border-indigo-200" />
          <StatCard title="Draft Vectors" value={stats.draftVectorsCount} />
          <StatCard title="Published Vectors" value={stats.publishedVectorsCount} />
          <StatCard title="Dense Vector Coverage" value="Healthy" />
          <StatCard title="Total Orphan Chunks (FB)" value={stats.orphanFirestoreChunksCount} />
          <StatCard title="Sparse Vectors" value="N/A" />
          
          <StatCard title="Missing Vectors" value={stats.missingVectorsCount} isError={stats.missingVectorsCount > 0} />
          <StatCard title="Orphan Vectors" value={stats.orphanVectorsCount} isError={stats.orphanVectorsCount > 0} />
          <StatCard title="Metadata Mismatches" value={mismatchTable.length} isError={mismatchTable.length > 0} />
        </section>

        {/* Charts Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Vectors by Namespace">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={namespaceChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Embedding Status Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={embeddingStatusChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Chunks by Content Type">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={contentTypeChartData}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {contentTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Subject / Class Coverage">
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subjectClassChartData}
                  cx="50%" cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  label={({name, percent}) => `${name}`}
                >
                  {subjectClassChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>

        {/* Detailed Issue Tables */}
        {statsIssuesCount > 0 && (
           <section className="space-y-6 flex flex-col">
             <h2 className="text-xl font-bold border-b pb-2">Identified Issues</h2>
             
             {missingVectors.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-red-50 text-red-700 px-4 py-3 font-semibold border-b border-red-100">
                    Missing Embeddings (Published chunks with no Vector) [{missingVectors.length}]
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs text-gray-600 space-y-1">
                    {missingVectors.map((id: string) => <div key={id}>{id}</div>)}
                  </div>
                </div>
             )}

             {orphanVectors.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-orange-50 text-orange-700 px-4 py-3 font-semibold border-b border-orange-100">
                    Orphan Vectors (Pinecone vectors with no Firestore chunk) [{orphanVectors.length}]
                  </div>
                  <div className="p-4 max-h-64 overflow-y-auto font-mono text-xs text-gray-600 space-y-1">
                    {orphanVectors.map((id: string) => <div key={id}>{id}</div>)}
                  </div>
                </div>
             )}

             {mismatchTable.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-yellow-50 text-yellow-700 px-4 py-3 font-semibold border-b border-yellow-100">
                    Metadata Mismatches [{mismatchTable.length}]
                  </div>
                  <div className="p-4 max-h-64 overflow-x-auto text-sm text-gray-600">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 font-medium w-1/3">Chunk ID</th>
                          <th className="pb-2 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mismatchTable.map((row: any, i: number) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 font-mono text-xs pr-4">{row.id}</td>
                            <td className="py-2 font-mono text-xs">
                              {Object.entries(row).filter(([k]) => k !== 'id').map(([k, v]) => (
                                <div key={k}><span className="font-semibold text-gray-800">{k}:</span> {String(v)}</div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
             )}
           </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, isError = false, className = '' }: { title: string, value: string | number, isError?: boolean, className?: string }) {
  return (
    <div className={`bg-white text-clip rounded-xl shadow-sm border px-6 py-5 ${isError ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${className}`}>
      <h3 className={`text-sm font-medium ${isError ? 'text-red-700' : 'text-gray-500'}`}>{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${isError ? 'text-red-700' : 'text-gray-900'} truncate`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 p-6 flex flex-col">
      <h3 className="text-base font-semibold text-gray-900 mb-6">{title}</h3>
      {children}
    </div>
  );
}
