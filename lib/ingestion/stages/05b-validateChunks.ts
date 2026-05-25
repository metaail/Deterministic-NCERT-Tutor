import { IngestionContext } from '../types';

export async function validateChunks(ctx: IngestionContext): Promise<IngestionContext> {
    if (!ctx.generatedChunks) {
        return ctx;
    }

    const MAX_CHUNK_LENGTH = 10000; // Define a reasonable maximum token/character limit

    for (const chunk of ctx.generatedChunks) {
        if (chunk.text) {
            // Check for excessive length
            if (chunk.text.length > MAX_CHUNK_LENGTH) {
                console.warn(`[ValidateChunks] Warning: Chunk ${chunk.chunkId} exceeds length limit (${chunk.text.length} > ${MAX_CHUNK_LENGTH}). Truncating.`);
                chunk.text = chunk.text.substring(0, MAX_CHUNK_LENGTH);
            }

            // Check for non-ASCII characters and clean them
            // eslint-disable-next-line no-control-regex
            const hasNonAscii = /[^\x00-\x7F]/.test(chunk.text);
            if (hasNonAscii) {
                console.warn(`[ValidateChunks] Warning: Chunk ${chunk.chunkId} contains non-ASCII characters. Cleaning...`);
                // Replace non-ASCII characters with spaces or just remove them
                // For a math textbook, there might be smart quotes or em dashes. Let's do a safe replace.
                chunk.text = chunk.text.replace(/[^\x00-\x7F]/g, ' ');
            }
        }
    }

    return ctx;
}
