import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';
import { publishPyqPaper } from '@/lib/admin/publishActions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PyqPaperReviewPage({ params }: { params: Promise<{ paperId: string }> }) {
    const { paperId } = await params;

    if (!adminDb) return <div>Firebase not loaded</div>;

    const paperSnap = await adminDb.collection('pyqPapers').doc(paperId).get();
    if (!paperSnap.exists) return <div>Paper not found: {paperId}</div>;
    const paper = paperSnap.data() as any;

    const questionsSnap = await adminDb.collection('pyqQuestions').where('paperId', '==', paperId).limit(20).get();
    const questions = questionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let visualWarningsCount = 0;
    let missingAnswerCount = 0;
    
    // Check all questions for this paper, not just the limit 20
    const allQsSnap = await adminDb.collection('pyqQuestions').where('paperId', '==', paperId).get();
    allQsSnap.docs.forEach(doc => {
        const q = doc.data();
        if (q.hasVisual) visualWarningsCount++;
        if (!q.answer && !q.solutionText) missingAnswerCount++;
    });

    const handlePublish = async () => {
        'use server';
        await publishPyqPaper(paperId);
        redirect(`/admin/pyq/papers/${paperId}`);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link href="/admin/pyq/papers" className="text-indigo-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Papers</Link>
                        <h1 className="text-3xl font-bold text-gray-800">{paper.exam} {paper.year} - {paper.subject}</h1>
                        <p className="text-gray-500">File: {paper.sourceFileName} | Status: <span className={`px-2 py-1 rounded text-xs font-semibold ${paper.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{paper.status}</span></p>
                    </div>
                    {paper.status !== 'published' && (
                        <form action={handlePublish}>
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-sm hover:bg-indigo-700 font-medium">
                                Publish to Students
                            </button>
                        </form>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        {visualWarningsCount > 0 && (
                            <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200">
                                <h3 className="font-bold flex items-center gap-2">
                                    ⚠️ Context Visual References Detected
                                </h3>
                                <p className="text-sm mt-1">{visualWarningsCount} questions rely on images or visual figures from the original PDF. These are flagged with <code>VisualReference</code> metadata for the AI routing engine, images are NOT stored.</p>
                            </div>
                        )}
                        {missingAnswerCount > 0 && (
                            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
                                <h3 className="font-bold flex items-center gap-2">
                                    ℹ️ Missing Answer Keys
                                </h3>
                                <p className="text-sm mt-1">{missingAnswerCount} questions lack an explicit standard answer field. The student RAG will answer conceptually instead.</p>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Sample Extracted Questions (Showing {questions.length} / {paper.totalQuestions})</h2>
                            <div className="space-y-6">
                                {questions.map((q: any) => (
                                    <div key={q.id} className="p-4 border border-gray-100 rounded bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Q{q.questionNumber || 'X'}</span>
                                            {q.hasVisual && <span className="text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">Visual Dep: {q.visualDependency}</span>}
                                        </div>
                                        <p className="text-sm text-gray-800 font-medium whitespace-pre-wrap mb-4">{q.questionText}</p>
                                        
                                        {q.options && q.options.length > 0 && (
                                            <ol className="list-decimal list-inside text-sm text-gray-600 mb-4 space-y-1">
                                                {q.options.map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                                            </ol>
                                        )}

                                        <div className="bg-white p-3 rounded border border-gray-100 text-xs">
                                            <p><span className="font-bold text-gray-700">Answer:</span> {q.answer || 'Not provided'}</p>
                                            {q.topicTags && q.topicTags.length > 0 && (
                                                <div className="mt-2 text-gray-500 font-mono">Topics: {q.topicTags.join(', ')}</div>
                                            )}
                                            {q.hasVisual && (
                                                <p className="text-orange-600 mt-2">Visual Ref: pg {q.visualReference?.pageNumber} - {q.visualReference?.visualDescription}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {questions.length === 0 && <p className="text-sm text-gray-500">No questions extracted.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Paper Metadata</h2>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li><strong>Paper ID:</strong> {paperId}</li>
                                <li><strong>Status:</strong> {paper.status}</li>
                                <li><strong>CreatedAt:</strong> {new Date(paper.createdAt).toLocaleString()}</li>
                                <li><strong>Total Parsed Questions:</strong> {paper.totalQuestions}</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-xs text-gray-500 leading-relaxed">
                            <strong>Audit Log:</strong> 
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Raw textual questions mapped effectively.</li>
                                <li>No local image storage used.</li>
                                <li>Vector indexing bypassed for PYQs (we use Firestore concept/topic matching + exact lexical search).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
