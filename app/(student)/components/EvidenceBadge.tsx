import React from 'react';
import { BookOpen, AlertCircle, FileText, CheckCircle2, FlaskConical, LayoutTemplate, PenTool, Image as ImageIcon, History } from 'lucide-react';

interface EvidenceBadgeProps {
  chunk: any;
}

export function EvidenceBadge({ chunk }: EvidenceBadgeProps) {
  let label = "Concept";
  let Icon = BookOpen;
  let colorClass = "bg-blue-50 text-blue-600 border-blue-100";

  if (chunk.isDefinition) {
     label = "Definition";
     Icon = FileText;
     colorClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
  } else if (chunk.isFormula || chunk.hasFormula) {
     label = "Formula";
     Icon = FlaskConical;
     colorClass = "bg-purple-50 text-purple-600 border-purple-100";
  } else if (chunk.isSolvedExample) {
     label = "Example";
     Icon = CheckCircle2;
     colorClass = "bg-amber-50 text-amber-600 border-amber-100";
  } else if (chunk.isExercise) {
     label = "Exercise";
     Icon = PenTool;
     colorClass = "bg-rose-50 text-rose-600 border-rose-100";
  } else if (chunk.isSummaryPoint) {
     label = "Summary";
     Icon = LayoutTemplate;
     colorClass = "bg-indigo-50 text-indigo-600 border-indigo-100";
  } else if (chunk.figureRefs?.length > 0 || chunk.isFigureCaption || chunk.tableRefs?.length > 0) {
     label = "Figure Reference";
     Icon = ImageIcon;
     colorClass = "bg-teal-50 text-teal-600 border-teal-100";
  } else if (chunk.pyqRefs && chunk.pyqRefs.length > 0) {
     label = "PYQ Related";
     Icon = History;
     colorClass = "bg-orange-50 text-orange-600 border-orange-100";
  }

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${colorClass}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}
