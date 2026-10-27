"use client";

import { useContext, useState } from "react";
import { GlossaryProgressContext } from "@/components/GlossaryProgressContext";
import HudHeader from "@/components/HudHeader";
import Mascot from "@/components/Mascot";
import { useGlossaryTermDialog } from "@/components/useGlossaryTermDialog";
import { STRINGS } from "@/data/strings";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  TERM_DISCOVERY_XP,
  filterGlossaryTerms,
  getAlbumProgress,
} from "@/lib/glossary";
import type { GlossaryCategory, GlossaryTerm } from "@/types/glossary";

interface CivicGlossaryProps {
  xp: number;
  streak: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onStartQuiz: () => void;
  onExit: () => void;
  terms?: GlossaryTerm[];
}

type TermStatus = keyof typeof STRINGS.glossary.termStatus;

const NO_IDS: string[] = [];

function pillClassName(isActive: boolean): string {
  return `civic-btn min-h-[44px] shrink-0 rounded-full border-2 border-rep-navy px-4 font-brand text-xs font-bold uppercase tracking-wider ${
    isActive ? "bg-rep-navy text-white shadow-neo-gold" : "bg-white text-rep-navy hover:bg-slate-50"
  }`;
}

const CARD_STYLES: Record<TermStatus, string> = {
  new: "border-dashed border-slate-400 bg-rep-cream hover:bg-white",
  discovered: "border-rep-navy bg-white shadow-neo hover:bg-slate-50",
  mastered: "border-rep-navy bg-amber-50 shadow-neo-gold hover:bg-amber-100",
};

/** "Glossário Cívico Descomplicado": searchable dictionary of political jargon and the civic album. */
export default function CivicGlossary({
  xp,
  streak,
  isSoundEnabled,
  onToggleSound,
  onStartQuiz,
  onExit,
  terms = GLOSSARY_TERMS,
}: CivicGlossaryProps) {
  const glossaryProgress = useContext(GlossaryProgressContext);
  const discoveredTermIds = glossaryProgress?.discoveredTermIds ?? NO_IDS;
  const masteredTermIds = glossaryProgress?.masteredTermIds ?? NO_IDS;
  const { openTerm, dialog } = useGlossaryTermDialog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GlossaryCategory | null>(null);

  const results = filterGlossaryTerms(terms, query, category);
  const albumByCategory = getAlbumProgress(terms, discoveredTermIds);
  const discoveredCount = albumByCategory.reduce((sum, c) => sum + c.discovered, 0);
  const masteredCount = terms.filter((t) => masteredTermIds.includes(t.id)).length;
  const albumPercent = Math.round((discoveredCount / terms.length) * 100);

  function getStatus(term: GlossaryTerm): TermStatus {
    if (masteredTermIds.includes(term.id)) return "mastered";
    return discoveredTermIds.includes(term.id) ? "discovered" : "new";
  }

  function handleClearFilters() {
    setQuery("");
    setCategory(null);
  }

  return (
    <>
      <HudHeader xp={xp} streak={streak} isSoundEnabled={isSoundEnabled} onToggleSound={onToggleSound} onBack={onExit} />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <div className="flex items-center gap-3">
          <Mascot className="h-20 w-16 shrink-0" />
          <div>
            <h1 className="font-brand text-xl font-bold leading-tight text-rep-navy sm:text-2xl">{STRINGS.glossary.heading}</h1>
            <p className="mt-1 text-sm text-rep-muted">{STRINGS.glossary.intro}</p>
          </div>
        </div>

        <section aria-labelledby="album-title" className="mt-5 rounded-2xl border-2 border-rep-navy bg-white p-4 shadow-neo">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="album-title" className="font-brand text-sm font-bold uppercase tracking-wider text-rep-navy">
              <span aria-hidden="true">📒 </span>
              {STRINGS.glossary.albumHeading}
            </h2>
            <span className="font-brand text-sm font-bold text-rep-navy">
              {STRINGS.glossary.albumCount(discoveredCount, terms.length)}
            </span>
          </div>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full border border-rep-border bg-slate-100"
            role="progressbar"
            aria-label={STRINGS.glossary.albumProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={albumPercent}
          >
            <div className="h-full bg-rep-gold transition-all duration-500" style={{ width: `${albumPercent}%` }} />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-amber-800">
            <span aria-hidden="true">★ </span>
            {STRINGS.glossary.masteredCount(masteredCount)}
          </p>

          <ul aria-label={STRINGS.glossary.sealsLabel} className="mt-3 grid grid-cols-2 gap-2">
            {albumByCategory.map(({ category: key, discovered, total }) => {
              const label = STRINGS.glossary.categories[key];
              const isComplete = discovered === total;
              return (
                <li
                  key={key}
                  className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 font-brand text-[11px] font-bold uppercase tracking-wide ${
                    isComplete ? "border-rep-gold bg-amber-50 text-rep-navy" : "border-rep-border bg-rep-cream text-rep-muted"
                  }`}
                >
                  <span aria-hidden="true" className={isComplete ? "" : "opacity-40 grayscale"}>
                    🏅
                  </span>
                  {isComplete ? STRINGS.glossary.sealComplete(label) : STRINGS.glossary.sealProgress(label, discovered, total)}
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs leading-snug text-rep-slate">{STRINGS.glossary.albumHint}</p>
          <button
            type="button"
            onClick={onStartQuiz}
            className="civic-btn mt-3 min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
          >
            {STRINGS.glossary.startQuiz}
          </button>
        </section>

        <div className="sticky top-[calc(env(safe-area-inset-top)+62px)] z-20 -mx-4 mt-5 space-y-3 bg-rep-cream px-4 pb-3 pt-1">
          <label className="block">
            <span className="sr-only">{STRINGS.glossary.searchLabel}</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base" aria-hidden="true">
                🔎
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={STRINGS.glossary.searchPlaceholder}
                autoComplete="off"
                className="min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-white py-3 pl-11 pr-4 text-base font-medium text-rep-navy shadow-neo placeholder:text-rep-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-rep-gold/50"
              />
            </span>
          </label>

          <div role="group" aria-label={STRINGS.glossary.categoryFilter} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null} className={pillClassName(category === null)}>
              {STRINGS.glossary.allCategories}
            </button>
            {GLOSSARY_CATEGORIES.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                aria-pressed={category === key}
                className={pillClassName(category === key)}
              >
                {STRINGS.glossary.categories[key]}
              </button>
            ))}
          </div>
        </div>

        <p role="status" aria-live="polite" className="mb-3 font-brand text-xs font-semibold text-rep-muted">
          {STRINGS.glossary.resultCount(results.length)}
        </p>

        {results.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {results.map((term) => {
              const status = getStatus(term);
              return (
                <li key={term.id}>
                  <button
                    type="button"
                    onClick={() => openTerm(term)}
                    aria-haspopup="dialog"
                    aria-label={STRINGS.glossary.cardLabel(term.term, STRINGS.glossary.termStatus[status])}
                    aria-describedby={`${term.id}-definition`}
                    className={`civic-btn flex h-full min-h-[44px] w-full flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left ${CARD_STYLES[status]}`}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="rounded-full bg-rep-gold/20 px-2.5 py-0.5 font-brand text-[11px] font-bold uppercase tracking-wider text-rep-navy">
                        {STRINGS.glossary.categories[term.category]}
                      </span>
                      {status === "new" && (
                        <span className="rounded-full bg-rep-navy px-2 py-0.5 font-brand text-[10px] font-bold uppercase tracking-wider text-rep-gold">
                          {STRINGS.glossary.newBadge(TERM_DISCOVERY_XP)}
                        </span>
                      )}
                      {status === "mastered" && (
                        <span className="font-brand text-base text-rep-gold" aria-hidden="true">
                          ★
                        </span>
                      )}
                      {status === "discovered" && (
                        <span className="font-brand text-sm font-bold text-rep-emerald" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="font-brand text-base font-bold leading-tight text-rep-navy">{term.term}</span>
                    <span id={`${term.id}-definition`} className="line-clamp-3 text-sm leading-snug text-rep-slate">
                      {term.shortDefinition}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-rep-border bg-white p-6 text-center">
            <Mascot mood="sleepy" className="h-24 w-20" />
            <h2 className="mt-2 font-brand text-base font-bold text-rep-navy">{STRINGS.glossary.emptyTitle}</h2>
            <p className="mt-1 max-w-xs text-sm text-rep-muted">{STRINGS.glossary.emptyDescription}</p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="civic-btn mt-4 min-h-[44px] rounded-xl border-2 border-rep-navy bg-rep-gold px-6 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
            >
              {STRINGS.glossary.clearFilters}
            </button>
          </div>
        )}
      </main>

      {dialog}
    </>
  );
}
