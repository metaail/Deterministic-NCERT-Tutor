import { NextRequest, NextResponse } from 'next/server';
import { runPyqPipeline } from '@/lib/pyq/pyqIngestionPipeline';
import { PyqIngestionContext } from '@/lib/pyq/types';
import { ExamEnum } from '@/lib/pyq/validators';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const exam = formData.get('exam') as string;
    const year = parseInt(formData.get('year') as string);
    const subject = formData.get('subject') as string;
    
    if (!file || !exam || !year || !subject) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const validExam = ExamEnum.parse(exam);

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const paperId = `${validExam}_${year}_${subject}`.replace(/\s+/g, '_');
    
    const ctx: PyqIngestionContext = {
      paperId,
      sourceFileName: (file as any).name || "unknown.pdf",
      pdfBuffer: buffer,
      metadata: {
        paperId,
        exam: validExam,
        year,
        subject,
        sourceFileName: (file as any).name || "unknown.pdf",
        status: "uploaded",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      pdfPages: [],
      extractedText: "",
      rawQuestions: [],
      pyqRecords: []
    };

    const resultCtx = await runPyqPipeline(ctx);

    return NextResponse.json({
      success: true,
      paperId: resultCtx.paperId,
      totalQuestions: resultCtx.metadata.totalQuestions
    });

  } catch (error: any) {
    console.error("[PYQ Ingest Error]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
