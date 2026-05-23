import { adminDb } from '@/lib/firebase/admin';
import Link from 'next/link';
import { publishChapter } from '@/lib/admin/publishActions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChapterReviewPage({ params }: { params: Promise<{ chapterKey: string }> }) {
    const { chapterKey } = await params;

    if (!adminDb) return <div>Firebase not loaded</div>;

    const chapterSnap = await adminDb.collection('chapters').doc(chapterKey).get();
    if (!chapterSnap.exists) return <div>Chapter not found: {chapterKey}</div>;
    const chapter = chapterSnap.data() as any;

    const structureSnap = await adminDb.collection('chapterStructureIndex').doc(chapterKey).get();
    const structure = structureSnap.exists ? structureSnap.data() as any : null;

    const chunksSnap = await adminDb.collection('chapterChunks').where('chapterKey', '==', chapterKey).limit(10).get();
    const sampleChunks = chunksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const handlePublish = async () => {
        'use server';
        await publishChapter(chapterKey);
        redirect(`/admin/chapters/${chapterKey}`);
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Link href="/admin/chapters" className="text-indigo-600 hover:underline text-sm mb-2 inline-block">&larr; Back to Chapters</Link>
                        <h1 className="text-3xl font-bold text-gray-800">{chapter.chapterTitleShort}</h1>
                        <p className="text-gray-500">Subject: {chapter.subject} | Class: {chapter.classLevel} | Status: <span className={`px-2 py-1 rounded text-xs font-semibold ${chapter.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{chapter.status}</span></p>
                    </div>
                    {chapter.status !== 'published' && (
                        <form action={handlePublish}>
                            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-sm hover:bg-indigo-700 font-medium">
                                Publish to Students
                            </button>
                        </form>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-6">
                        {/* Validation Warnings */}
                        {chapter.subjectMismatchWarning && (
                            <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
                                <h3 className="font-bold flex items-center gap-2">
                                    ⚠️ Validation Warning
                                </h3>
                                <p className="text-sm mt-1">Subject mismatch detected during ingestion. Please review the contents carefully before publishing.</p>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Structure Index (Summary Points)</h2>
                            {structure && structure.summaryPoints ? (
                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                    {structure.summaryPoints.map((pt: string, idx: number) => (
                                        <li key={idx}>{pt}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No summary points extracted.</p>
                            )}
                            
                            <h2 className="text-xl font-bold text-gray-800 mb-4 mt-6 border-b pb-2">Extracted Sections</h2>
                            {structure && structure.sections ? (
                                <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                                    {structure.sections.map((sec: string, idx: number) => (
                                        <li key={idx}>{sec}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500">No sections extracted.</p>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Sample Output Chunks ({sampleChunks.length} shown)</h2>
                            <div className="space-y-4">
                                {sampleChunks.map((chunk: any) => (
                                    <div key={chunk.id} className="p-4 border border-gray-100 rounded bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">{chunk.chunkType}</span>
                                            <span className="text-xs text-gray-500">Page {chunk.pageNumber}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{chunk.text.substring(0, 300)}...</p>
                                        <div className="mt-2 text-xs text-gray-500 flex gap-2">
                                          {chunk.concepts?.slice(0, 3).map((c:string, i:number) => <span key={i} className="bg-gray-200 px-1 rounded">{c}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Chapter Metadata</h2>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li><strong>Chapter Code:</strong> {chapterKey}</li>
                                <li><strong>Original File:</strong> {chapter.uploadedFileName}</li>
                                <li><strong>Pages:</strong> {chapter.totalPages}</li>
                                <li><strong>Chunks:</strong> {chapter.totalChunks}</li>
                                <li><strong>Ingestion Status:</strong> {chapter.status}</li>
                                <li><strong>Vector Density:</strong> {Math.round(chapter.totalChunks / chapter.totalPages)} chunks/page</li>
                            </ul>
                        </div>
                        
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="font-bold text-gray-800 mb-4 border-b pb-2">Entities Extracted</h2>
                            <ul className="text-sm space-y-2 text-gray-600">
                                <li className="flex justify-between"><span>Formulas (Equations):</span> <span>{chapter.totalFormulas}</span></li>
                                <li className="flex justify-between"><span>Figures (Captions):</span> <span>{chapter.totalFigures}</span></li>
                                <li className="flex justify-between"><span>Tables:</span> <span>{chapter.totalTables}</span></li>
                                <li className="flex justify-between"><span>Solved Examples:</span> <span>{chapter.totalExamples}</span></li>
                                <li className="flex justify-between"><span>Exercises/Problems:</span> <span>{chapter.totalExercises}</span></li>
                            </ul>
                            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded text-xs leading-relaxed border border-blue-100">
                                <strong>Visual Constraints:</strong> Images are not stored. All visual content is replaced with placeholders [Figure/Table X.Y] and stored as strictly structural metadata vectors.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
