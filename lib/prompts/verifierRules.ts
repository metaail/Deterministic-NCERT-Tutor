export const VERIFIER_RULES = `
The response must adhere to the following rules:
- No image tags (![...](...))
- No image URLs (http...png/jpg)
- No base64 encoded strings
- No single $ or double $$ delimiters for LaTeX. Only \\( \\) and \\[ \\].
- No hallucinatory figure or table references that are not present in the content.
`;
