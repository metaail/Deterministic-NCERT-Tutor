import { PyqIngestionContext } from '../types';
import { generateContent } from '@/lib/gemini';

export async function detectVisualReferences(ctx: PyqIngestionContext): Promise<PyqIngestionContext> {
  // Batch process or loop through raw questions
  // For simplicity, we process them in memory here based on keywords, or use LLM if needed
  
  for (const q of ctx.rawQuestions) {
    const text = (q.questionText + " " + (q.solutionText || "")).toLowerCase();
    
    // Simple heuristic for visual dependencies
    const hasVisualKw = text.includes("figure") || text.includes("diagram") || text.includes("graph") || text.includes("shown below");
    
    q.hasVisual = hasVisualKw;
    q.visualDependency = hasVisualKw ? "helpful" : "none";
    if (text.includes("in the given figure") || text.includes("as shown")) {
        q.visualDependency = "required";
    }
    
    let description = undefined;
    if (hasVisualKw) {
        description = "Contains a visual reference such as a diagram, graph, or figure.";
    }

    q.visualReference = {
        hasVisual: hasVisualKw,
        visualDescription: description,
        pageNumber: 1, // Defaulting to 1 for MVP
        displayPolicy: "reference_only"
    };
  }

  return ctx;
}
