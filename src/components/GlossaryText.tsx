"use client";

import { useGlossaryTermDialog } from "@/components/useGlossaryTermDialog";
import { GLOSSARY_TERMS, segmentByGlossary } from "@/lib/glossary";
import type { GlossaryTerm } from "@/types/glossary";

interface GlossaryTextProps {
  text: string;
  terms?: GlossaryTerm[];
}

/**
 * Renders a text with its glossary terms as tappable links that open the term's definition.
 * Inline links are exempt from the 44px target rule (WCAG 2.5.8); the dialog is portaled to
 * <body> because the text usually sits inside a heading or paragraph.
 */
export default function GlossaryText({ text, terms = GLOSSARY_TERMS }: GlossaryTextProps) {
  const { openTerm, dialog } = useGlossaryTermDialog();

  return (
    <>
      {segmentByGlossary(text, terms).map((segment, i) => {
        const { term } = segment;
        if (!term) return segment.text;
        return (
          <button
            key={i}
            type="button"
            onClick={() => openTerm(term)}
            aria-haspopup="dialog"
            className="inline rounded-sm font-[inherit] text-[inherit] underline decoration-rep-gold decoration-dotted decoration-2 underline-offset-4 transition hover:bg-rep-gold/20"
          >
            {segment.text}
          </button>
        );
      })}
      {dialog}
    </>
  );
}
