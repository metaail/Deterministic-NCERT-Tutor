import { IngestionContext } from '../types';

export async function extractPages(ctx: IngestionContext): Promise<IngestionContext> {
  // Phase 2 implementation: Iterates through geometric data to extract pure text
  // while filtering out repeating NCERT footers and page number artifacts.
  
  if (!ctx.pdfPages) {
    throw new Error("No pdfPages found to extract.");
  }

  let fullText = '';
  
  for (const page of ctx.pdfPages) {
    // Sort items by Y axis (top to bottom) first, then X axis (left to right).
    // Note: PDF y coordinate is usually from bottom to top, so higher Y means higher on page.
    // We sort descending by Y.
    const sortedItems = [...page.items].sort((a, b) => {
      // Small delta (e.g. 2px) to consider them on the same line
      if (Math.abs(b.y - a.y) > 2) {
        return b.y - a.y; 
      }
      return a.x - b.x;
    });
    
    let pageText = '';
    let lastY = -1;
    let lastX = -1;
    let lastWidth = -1;
    
    for (const item of sortedItems) {
      // Basic heuristic for ignoring standard footers/page numbers
      if (item.y < 40) continue;
      // Basic heuristic for ignoring header artifacts
      if (item.y > page.height - 40 && item.str.length < 5) continue;
      
      const isNewLine = lastY !== -1 && Math.abs(item.y - lastY) > 2;
      
      if (isNewLine) {
        pageText += '\n';
      } else if (lastY !== -1) {
        // Add space if there is a gap between words on the same line
        const gap = item.x - (lastX + lastWidth);
        if (gap > 2) {
          pageText += ' ';
        }
      }
      
      pageText += item.str;
      lastY = item.y;
      lastX = item.x;
      lastWidth = item.width;
    }
    
    fullText += pageText + '\n\n';
  }
  
  ctx.extractedText = fullText;
  return ctx;
}
