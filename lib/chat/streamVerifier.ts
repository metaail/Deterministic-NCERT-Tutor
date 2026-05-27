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
    
    // Fix math delimiters $$ -> \[ or \]
    outputText = outputText.replace(/\$\$/g, () => this.buffer.split('$$').length % 2 === 0 ? '\\[' : '\\]');
    
    // If it's a standalone $ not preceded by \, change it to \( ... \)
    // Simple streaming replacement for single $ can be tricky, but we'll adapt slightly
    outputText = outputText.replace(/(^|[^\\])\$([^\$]+?)\$/g, '$1\\($2\\)');

    return { text: outputText };
  }
}

export function createStreamVerifier(controller: ReadableStreamDefaultController) {
  return new StreamVerifier(controller);
}
