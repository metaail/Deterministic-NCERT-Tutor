'use client';

import { useState, useEffect } from 'react';

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch metrics');
        return res.json();
      })
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to fetch:", e);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading metrics...</div>;

  const total = metrics.length;
  const avgTotalLatency = total ? metrics.reduce((acc, m) => acc + m.metrics.totalLatency, 0) / total : 0;
  const avgTTFT = total ? metrics.reduce((acc, m) => acc + m.metrics.timeToFirstToken, 0) / total : 0;
  const avgRetrieval = total ? metrics.reduce((acc, m) => acc + m.metrics.retrievalLatency, 0) / total : 0;
  const avgGemini = total ? metrics.reduce((acc, m) => acc + m.metrics.geminiLatency, 0) / total : 0;
  const avgVerifier = total ? metrics.reduce((acc, m) => acc + m.metrics.verifierLatency, 0) / total : 0;

  const cacheHits = metrics.filter(m => m.metrics.cacheHit).length;
  const cacheHitRate = total ? (cacheHits / total) * 100 : 0;

  const slowest = [...metrics].sort((a, b) => b.metrics.totalLatency - a.metrics.totalLatency).slice(0, 10);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900">Performance & Latency Instrumentation</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Average Latency</div>
          <div className="text-2xl font-mono text-gray-900">{(avgTotalLatency/1000).toFixed(2)}s</div>
        </div>
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Average TTFT</div>
          <div className="text-2xl font-mono text-indigo-600">{(avgTTFT/1000).toFixed(2)}s</div>
        </div>
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Cache Hit Rate</div>
          <div className="text-2xl font-mono text-green-600">{cacheHitRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Total Queries</div>
          <div className="text-2xl font-mono text-gray-900">{total}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Avg Retrieval Timing</div>
          <div className="text-xl font-mono text-gray-900">{(avgRetrieval/1000).toFixed(2)}s</div>
        </div>
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Avg Stream Timing</div>
          <div className="text-xl font-mono text-gray-900">{(avgGemini/1000).toFixed(2)}s</div>
        </div>
        <div className="bg-white p-4 items-center rounded border border-gray-200">
          <div className="text-sm text-gray-500">Avg Verifier Overhead</div>
          <div className="text-xl font-mono text-gray-900">{avgVerifier.toFixed(2)}ms</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Slowest Queries</h2>
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Total Latency</th>
                <th className="p-3">TTFT</th>
                <th className="p-3">Retrieval</th>
                <th className="p-3">Stream</th>
                <th className="p-3">Tokens/sec</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slowest.map((s, idx) => (
                <tr key={idx}>
                  <td className="p-3">{new Date(s.timestamp).toLocaleTimeString()}</td>
                  <td className="p-3 font-mono">{(s.metrics.totalLatency/1000).toFixed(2)}s</td>
                  <td className="p-3 font-mono text-indigo-600">{(s.metrics.timeToFirstToken/1000).toFixed(2)}s</td>
                  <td className="p-3 font-mono">{(s.metrics.retrievalLatency/1000).toFixed(2)}s</td>
                  <td className="p-3 font-mono">{(s.metrics.geminiLatency/1000).toFixed(2)}s</td>
                  <td className="p-3 font-mono">{s.metrics.tokensPerSecond.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
