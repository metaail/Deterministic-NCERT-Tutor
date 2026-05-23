import { PyqIngestionContext } from '../types';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function parsePyqPdf(ctx: PyqIngestionContext): Promise<PyqIngestionContext> {
  const data = new Uint8Array(ctx.pdfBuffer);
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
  
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  let fullText = '';

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const strings = textContent.items.map((item: any) => item.str);
    fullText += strings.join(' ') + '\n';
  }
  
  ctx.extractedText = fullText;
  ctx.metadata.totalQuestions = 0;
  return ctx;
}

