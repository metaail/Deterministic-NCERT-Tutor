export class StreamVerifier {
  private buffer: string = '';
  private controller: ReadableStreamDefaultController;
  private hasBlockedContent: boolean = false;

  constructor(controller: ReadableStreamDefaultController) {
    this.controller = controller;
  }

  processChunk(chunk: string): { text?: string; error?: string } {
    this.buffer += chunk;
    let outputText = chunk;

    // Reject unsupported claims / unrelated chapter content
    const lower = this.buffer.toLowerCase();
    if (lower.includes('while the context does not') || lower.includes('outside the context') || lower.includes('general knowledge') || lower.includes('however, in general') || lower.includes('although not in the ncert')) {
        if (!this.hasBlockedContent) {
           this.hasBlockedContent = true;
           return { error: 'Model generated answer outside the retrieved NCERT context.' };
        }
    }

    // Strip out base64 or image markdown safely instead of crashing stream
    if (outputText.includes('data:image') || outputText.includes('base64')) {
       outputText = outputText.replace(/data:image\/[^;]+;base64,[a-zA-Z0-9+/=]+/g, '[IMAGE CONTENT REMOVED]');
    }
    if (outputText.includes('![')) {
       outputText = outputText.replace(/!\[.*?\]\(.*?\)/g, '[IMAGE REMOVED]');
    }
    
    // Convert math delimiters $$ -> \[ or \] 
    // We only process outputText (the chunk) but we maintain state of how many $$ we've seen if needed.
    // However, it's safer to just replace all $$ in the chunk securely or do nothing and let KaTeX handle it.
    // Many Markdown math plugins handle $$ natively. We will preserve it or replace with \[ \] safely.
    let dollarCount = (this.buffer.slice(0, -chunk.length).match(/\$\$/g) || []).length;
    outputText = outputText.replace(/\$\$/g, () => {
        dollarCount++;
        return dollarCount % 2 !== 0 ? '\\[' : '\\]';
    });
    
    // For single $, let it be handled by KaTeX or replace it cautiously
    // React-markdown remark-math handles $ usually, so we don't strictly need to force convert $ to \( \)
    // outputText = outputText.replace(/(^|[^\\])\$([^\$]+?)\$/g, '$1\\($2\\)');

    return { text: outputText };
  }
}

export function createStreamVerifier(controller: ReadableStreamDefaultController) {
  return new StreamVerifier(controller);
}
