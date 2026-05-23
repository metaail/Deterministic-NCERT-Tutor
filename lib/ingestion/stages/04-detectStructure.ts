import { IngestionContext } from '../types';

export async function detectStructure(ctx: IngestionContext): Promise<IngestionContext> {
  // Phase 2 implementation: Heuristically determines section boundaries based on
  // NCERT typographical standards (e.g., changes in font weight or leading).
  
  if (!ctx.pdfPages) return ctx;
  
  const sections: any[] = [];
  
  // Heuristic: identify common large font sizes to spot headings
  const fontCount: Record<number, number> = {};
  for (const page of ctx.pdfPages) {
    for (const item of page.items) {
      if (item.str.trim() === '') continue;
      const sizeRounded = Math.round(item.height);
      if (!fontCount[sizeRounded]) fontCount[sizeRounded] = 0;
      fontCount[sizeRounded]++;
    }
  }
  
  // Find standard body size (the most common)
  const sortedSizes = Object.keys(fontCount).map(Number).sort((a, b) => fontCount[b] - fontCount[a]);
  const bodySize = sortedSizes.length > 0 ? sortedSizes[0] : 11;
  const headingSizeThreshold = bodySize * 1.15; // Anything > 15% larger is heuristically a heading
  
  let currentSectionTitle = "Introduction";
  let currentSectionContent = "";
  
  for (const page of ctx.pdfPages) {
    const sortedItems = [...page.items].sort((a, b) => {
      if (Math.abs(b.y - a.y) > 2) return b.y - a.y; 
      return a.x - b.x;
    });
    
    let lastY = -1;
    let lastX = -1;
    let lastWidth = -1;
    let lineStr = "";
    let lineMaxHeight = 0;
    
    for (const item of sortedItems) {
      if (item.y < 40) continue;
      if (item.y > page.height - 40 && item.str.length < 5) continue;
      
      const isNewLine = lastY !== -1 && Math.abs(item.y - lastY) > 2;
      
      if (isNewLine) {
        const textToProcess = lineStr.trim();
        if (textToProcess) {
          // Is it a heading?
          if (lineMaxHeight >= headingSizeThreshold && textToProcess.length < 150) {
            if (currentSectionContent.trim().length > 0) {
              sections.push({
                title: currentSectionTitle,
                content: currentSectionContent.trim()
              });
            }
            currentSectionTitle = textToProcess;
            currentSectionContent = "";
          } else {
            currentSectionContent += textToProcess + "\n";
          }
        }
        
        lineStr = item.str;
        lineMaxHeight = item.height;
      } else {
        const gap = item.x - (lastX + lastWidth);
        const prefixSpace = gap > 2 ? " " : "";
        lineStr += prefixSpace + item.str;
        if (item.height > lineMaxHeight) lineMaxHeight = item.height;
      }
      
      lastY = item.y;
      lastX = item.x;
      lastWidth = item.width;
    }
    
    // Process final line of page
    const textToProcess = lineStr.trim();
    if (textToProcess) {
      if (lineMaxHeight >= headingSizeThreshold && textToProcess.length < 150) {
        if (currentSectionContent.trim().length > 0) {
          sections.push({
            title: currentSectionTitle,
            content: currentSectionContent.trim()
          });
        }
        currentSectionTitle = textToProcess;
        currentSectionContent = "";
      } else {
        currentSectionContent += textToProcess + "\n";
      }
    }
  }
  
  if (currentSectionContent.trim().length > 0) {
    sections.push({
      title: currentSectionTitle,
      content: currentSectionContent.trim()
    });
  }
  
  ctx.detectedStructure = { sections };
  
  return ctx;
}
