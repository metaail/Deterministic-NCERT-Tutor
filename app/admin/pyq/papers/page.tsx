import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPyqPapersPage() {
    let papers: any[] = [];
    
    if (adminDb) {
        const snap = await adminDb.collection('pyqPapers').orderBy('createdAt', 'desc').get();
        papers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">PYQ Papers Review</h1>
                <Link href="/admin" className="text-indigo-600 hover:underline">Back to Admin</Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year & Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {papers.map(paper => (
                            <tr key={paper.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{paper.exam}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.year} - {paper.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{paper.sourceFileName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paper.totalQuestions}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${paper.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {paper.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <Link href={`/admin/pyq/papers/${paper.paperId}`} className="text-indigo-600 hover:text-indigo-900 font-medium">Review</Link>
                                </td>
                            </tr>
                        ))}
                        {papers.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No PYQ papers found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
