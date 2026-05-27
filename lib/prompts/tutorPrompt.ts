export function buildTutorPrompt(query: string, contextString: string): string {
  return `Please answer the following student query based on the context.

${contextString}

Student Query: ${query}

Remember to follow the system prompt rules strictly. Never use $ delimiters for math, use \\( \\) and \\[ \\]. No images. Reference-only for visual elements. Follow the length constraints from the system instructions.`;
}
