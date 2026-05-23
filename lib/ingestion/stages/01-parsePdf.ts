import { IngestionContext, PdfPageData, PdfTextItem } from '../types';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export async function parsePdf(ctx: IngestionContext): Promise<IngestionContext> {
  const data = new Uint8Array(ctx.pdfBuffer);
  
  // Set workerSrc to absolute path
  pdfjsLib.GlobalWorkerOptions.workerSrc = require('path').resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  
  const loadingTask = pdfjsLib.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  const pdfPages: PdfPageData[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    
    // Ignore binary images completely as per reference-only visual policy
    const items: PdfTextItem[] = [];
    
    for (const item of textContent.items) {
      if ('str' in item) {
        const textItem = item /* as TextItem */;
        const transform = textItem.transform;
        
        items.push({
          str: textItem.str,
          fontName: textItem.fontName,
          transform: transform,
          x: transform[4],
          y: transform[5],
          width: textItem.width,
          height: textItem.height,
        });
      }
    }
    
    pdfPages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  ctx.pdfPages = pdfPages;
  return ctx;
}
