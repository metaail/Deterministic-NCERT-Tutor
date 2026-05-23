import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminChaptersPage() {
    let chapters: any[] = [];
    
    if (adminDb) {
        const snap = await adminDb.collection('chapters').orderBy('createdAt', 'desc').get();
        chapters = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">NCERT Chapters Review</h1>
                <Link href="/admin" className="text-indigo-600 hover:underline">Back to Admin</Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chapter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chunks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {chapters.map(chapter => (
                            <tr key={chapter.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chapter.chapterTitleShort} (Ch {chapter.chapterNumber})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chapter.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chapter.classLevel}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chapter.totalChunks}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${chapter.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {chapter.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <Link href={`/admin/chapters/${chapter.chapterKey}`} className="text-indigo-600 hover:text-indigo-900 font-medium">Review</Link>
                                </td>
                            </tr>
                        ))}
                        {chapters.length === 0 && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No chapters found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
