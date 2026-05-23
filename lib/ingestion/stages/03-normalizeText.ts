import { IngestionContext } from '../types';

export async function normalizeText(ctx: IngestionContext): Promise<IngestionContext> {
  // Phase 2 implementation: Enforces mathematical rendering policy.
  // Converts all hallucinatory $ and $$ delimiters to standard ( ... ) and [ ... ].
  
  if (!ctx.extractedText) return ctx;
  
  let text = ctx.extractedText;
  
  // Replace $$ ... $$ with \[ ... \]
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, '\\[ $1 \\]');
  
  // Replace $ ... $ with \( ... \)
  text = text.replace(/\$([\s\S]*?)\$/g, '\\( $1 \\)');
  
  // Normalize whitespace a bit but preserve newlines
  text = text.replace(/[ \t]{2,}/g, ' ');
  
  ctx.normalizedText = text;
  
  return ctx;
}
