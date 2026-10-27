"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import Mascot from "@/components/Mascot";
import { STRINGS } from "@/data/strings";
import type { GlossaryTerm } from "@/types/glossary";

interface GlossaryTermDialogProps {
  term: GlossaryTerm;
  onClose: () => void;
  /** XP earned by opening it (new album entry, term of the day); 0 hides the reward. */
  rewardXp?: number;
  isMastered?: boolean;
}

/** In-depth view of a glossary term: bottom sheet on mobile, centered card on larger screens. */
export default function GlossaryTermDialog({ term, onClose, rewardXp = 0, isMastered = false }: GlossaryTermDialogProps) {
  // Read while rendering, before autoFocus moves focus into the dialog.
  const [opener] = useState(() => document.activeElement);

  // Gives focus back to whatever opened the dialog (a term card or an inline term).
  useEffect(() => {
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [opener]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") onClose();
  }

  const titleId = `glossary-term-${term.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-rep-navy/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90dvh] w-full max-w-md animate-drawer space-y-4 overflow-y-auto rounded-t-2xl border-2 border-rep-navy bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-left shadow-neo sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rep-navy px-3 py-1 font-brand text-[11px] font-bold uppercase tracking-wider text-white">
                <span className="h-2 w-2 rounded-full bg-rep-gold" aria-hidden="true" />
                {STRINGS.glossary.categories[term.category]}
              </span>
              {isMastered && (
                <span className="rounded-full border border-rep-gold bg-amber-50 px-2.5 py-0.5 font-brand text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  <span aria-hidden="true">★ </span>
                  {STRINGS.glossary.masteredMark}
                </span>
              )}
            </div>
            <h2 id={titleId} className="font-brand text-xl font-bold leading-tight text-rep-navy">
              {term.term}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={STRINGS.glossary.close}
            title={STRINGS.glossary.close}
            className="-mr-2 -mt-1 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-lg font-bold text-rep-navy transition hover:bg-slate-100"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {rewardXp > 0 && (
          <p className="flex items-center gap-2 rounded-xl border-2 border-rep-emerald bg-emerald-50 px-3 py-2 font-brand text-sm font-bold text-rep-emerald-dark shadow-neo-emerald">
            <span aria-hidden="true">🏛️</span>
            <span>
              {STRINGS.glossary.reward(rewardXp)} <span className="font-sans text-xs font-semibold">{STRINGS.glossary.newDiscovery}</span>
            </span>
          </p>
        )}

        <section className="flex items-center gap-3 rounded-xl border-2 border-rep-gold bg-amber-50 p-3">
          <Mascot className="h-20 w-16 shrink-0" />
          <div>
            <p className="font-brand text-xs font-bold uppercase tracking-wider text-rep-navy">{STRINGS.glossary.capiExplains}</p>
            <p className="mt-1 text-sm font-semibold leading-snug text-rep-slate">{term.shortDefinition}</p>
          </div>
        </section>

        <section className="space-y-1">
          <h3 className="font-brand text-xs font-bold uppercase tracking-wider text-rep-muted">
            <span aria-hidden="true">🏘️ </span>
            {STRINGS.glossary.practicalExample}
          </h3>
          <p className="text-sm font-medium leading-relaxed text-slate-700">{term.practicalExample}</p>
        </section>

        {term.constitutionalArticle && (
          <p className="inline-block rounded-md bg-rep-cream px-2 py-0.5 font-brand text-xs font-bold text-rep-navy ring-1 ring-rep-border">
            📖 {term.constitutionalArticle}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
        >
          {STRINGS.glossary.confirm}
        </button>
      </div>
    </div>
  );
}
