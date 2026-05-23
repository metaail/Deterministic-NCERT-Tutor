import { PyqQuestion } from './validators';

export function formatPyqContext(pyqs: PyqQuestion[]): string {
  if (!pyqs || pyqs.length === 0) {
    return "PYQ Match: No exact indexed PYQ match was found for this query. However, this concept is relevant for NEET/JEE preparation.";
  }

  let formatted = "Related PYQ Match\\n\\n";

  for (const pyq of pyqs) {
    formatted += `- Exam: ${pyq.exam}\n`;
    formatted += `- Year: ${pyq.year}\n`;
    formatted += `- Question number: ${pyq.questionNumber}\n`;
    formatted += `- Topic: ${pyq.topicTags.join(", ")}\n`;
    formatted += `- Short question preview: ${pyq.questionText.substring(0, 150)}...\n`;
    formatted += `- Why it matches this concept: This PYQ tests the topic "${pyq.topicTags[0] || 'the relevant concept'}" which is directly related to your query.\n`;
    
    if (pyq.hasVisual && pyq.visualReference) {
      formatted += `This PYQ contains a visual. Refer to the source PYQ paper, page ${pyq.visualReference.pageNumber || 'X'}. Visual description: ${pyq.visualReference.visualDescription || 'None'}\n`;
      if (pyq.visualDependency === 'required') {
        formatted += `The final numerical answer may depend on values shown in the visual. I can explain the method, but the exact answer must be verified from the source visual.\n`;
      }
    }
    
    formatted += `\n`;
  }

  return formatted;
}
