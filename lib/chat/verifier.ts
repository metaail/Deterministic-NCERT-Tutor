import { VerificationResult } from './chatTypes';

export function verifyResponse(responseText: string, allowedPyqs: any[] = []): VerificationResult {
  // 1. Check for image markdown tags
  if (/!\[.*?\]\(.*?\)/.test(responseText)) {
    return { isValid: false, reason: 'Image markdown tags detected.' };
  }

  // 2. Check for raw image URLs
  if (/https?:\/\/.*?\.(png|jpg|jpeg|gif|webp)/i.test(responseText)) {
    return { isValid: false, reason: 'Image URLs detected.' };
  }

  // 3. Check for base64 images
  if (/data:image\/.*?;base64/i.test(responseText)) {
    return { isValid: false, reason: 'Base64 image data detected.' };
  }

  // 4. Check for invalid math delimiters ($ or $$)
  if (/\$\$.*?\$\$/.test(responseText)) {
    return { isValid: false, reason: 'Invalid math delimiter $$ detected.' };
  }
  
  // 5. Check for fake PYQ citations
  // Example matches: "NEET 2021", "JEE 2020", "JEE Main 2019"
  const pyqRegex = /(NEET|JEE|JEE\sMain|JEE\sAdvanced)\s*(20\d{2}|19\d{2})/gi;
  let match;
  while ((match = pyqRegex.exec(responseText)) !== null) {
      const year = match[2];
      const examMatch = match[1].toUpperCase().replace(/\s/g, '_');
      
      const isAllowed = allowedPyqs.some(pyq => 
          pyq.year.toString() === year && 
          (pyq.exam === examMatch || pyq.exam.includes(examMatch.split('_')[0]))
      );
      
      if (!isAllowed) {
          return { isValid: false, reason: `Fake or unverified PYQ citation detected: ${match[0]}` };
      }
  }

  // Sanitization:
  let sanitized = responseText;
  sanitized = sanitized.replace(/\$\$([\s\S]*?)\$\$/g, '\\[$1\\]');
  sanitized = sanitized.replace(/(^|[^\\])\$([^\$]+?)\$/g, '$1\\($2\\)');

  return { isValid: true, sanitizedResponse: sanitized };
}
