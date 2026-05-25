import Link from 'next/link';
import { getGeminiUsage } from '@/lib/stats/geminiUsage';

export default function Page() {
  const geminiUsage = getGeminiUsage();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xl font-mono">
              P6
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500 font-mono text-sm mt-1">Platform Architecture Phase 6: Admin Review & Publish Workflow</p>
            </div>
          </div>
          {geminiUsage.isNearingLimit && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-sm font-bold tracking-tight">Capacity Nearing Limit</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/admin/chapters" className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition">
            <h2 className="text-lg font-bold text-gray-900 mb-2">NCERT Chapters</h2>
            <p className="text-sm text-gray-600">Review ingested NCERT chapters, inspect chunk quality, and publish to students.</p>
          </Link>
          
          <Link href="/admin/pyq/papers" className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition">
            <h2 className="text-lg font-bold text-gray-900 mb-2">PYQ Papers</h2>
            <p className="text-sm text-gray-600">Review parsed PYQ papers, validate visual dependencies, and publish verified questions.</p>
          </Link>

          <Link href="/admin/system" className="block p-6 bg-white border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition md:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-2">System Diagnostics</h2>
            <p className="text-sm text-gray-600">Monitor vector index health, API connections, ingestion statics, and job failures.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
