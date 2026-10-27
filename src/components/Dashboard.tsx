"use client";

import { useState } from "react";
import BottomNav, { type HomeTab } from "@/components/BottomNav";
import JourneyPanel from "@/components/JourneyPanel";
import LearningPathUnit from "@/components/LearningPathUnit";
import { useGlossaryTermDialog } from "@/components/useGlossaryTermDialog";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { TERM_OF_DAY_XP, getTermOfDay } from "@/lib/glossary";
import { buildPath } from "@/lib/path";
import { useToday, type Progress } from "@/lib/progress";
import type { GlossaryTerm } from "@/types/glossary";
import type { Level, QuizSession } from "@/types/quiz";

interface DashboardProps {
  progress: Progress;
  onStartSession: (session: QuizSession) => void;
  onOpenChest: (chestId: string) => void;
  onStartSwipe: () => void;
  onOpenGlossary: () => void;
  /** Claims today's term of the day bonus (no-op if already claimed). */
  onReadTermOfDay: () => void;
  levels?: Level[];
}

export default function Dashboard({
  progress,
  onStartSession,
  onOpenChest,
  onStartSwipe,
  onOpenGlossary,
  onReadTermOfDay,
  levels = LEVELS,
}: DashboardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>("path");
  const units = buildPath(levels, progress);
  const today = useToday();
  const termOfDay = today ? getTermOfDay(today) : null;
  const isTermOfDayRead = today !== null && progress.termOfDayReadDay === today;
  const { openTerm, dialog } = useGlossaryTermDialog();

  function handleReadTermOfDay(term: GlossaryTerm) {
    onReadTermOfDay();
    openTerm(term, isTermOfDayRead ? 0 : TERM_OF_DAY_XP);
  }

  function handleOpenChest(chestId: string) {
    setSelectedNodeId(null);
    onOpenChest(chestId);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 lg:pb-6">
      {/* Desktop: journey | path | quick modes. Mobile: the bottom bar switches between path and
          profile (journey), and reaches the quick modes directly. */}
      <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:items-start lg:gap-8">
        <div className={`${activeTab === "profile" ? "" : "hidden"} lg:sticky lg:top-24 lg:col-start-1 lg:row-start-1 lg:block`}>
          <JourneyPanel progress={progress} />
        </div>

        <div className="hidden space-y-4 lg:sticky lg:top-24 lg:col-start-3 lg:row-start-1 lg:block">
          <section
            aria-labelledby="swipe-mode-title"
            className="rounded-2xl border-2 border-rep-navy bg-rep-navy p-4 text-white shadow-neo-gold"
          >
            <p className="font-brand text-[11px] font-bold uppercase tracking-wider text-rep-gold">{STRINGS.dashboard.swipeEyebrow}</p>
            <h2 id="swipe-mode-title" className="mt-1 font-brand text-base font-bold">
              {STRINGS.swipe.title}
            </h2>
            <p className="mt-1 text-xs leading-snug text-slate-300">
              {STRINGS.dashboard.swipeDescription}
            </p>
            <button
              type="button"
              onClick={onStartSwipe}
              className="civic-btn mt-3 min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy"
            >
              {STRINGS.dashboard.swipeAction}
            </button>
          </section>

          {termOfDay && (
            <section
              aria-labelledby="term-of-day-title"
              className="rounded-2xl border-2 border-rep-navy bg-white p-4 shadow-neo"
            >
              <p className="font-brand text-[11px] font-bold uppercase tracking-wider text-amber-800">
                <span aria-hidden="true">☀️ </span>
                {STRINGS.dashboard.termOfDayHeading}
              </p>
              <h2 id="term-of-day-title" className="mt-1 font-brand text-base font-bold leading-tight text-rep-navy">
                {termOfDay.term}
              </h2>
              <p className="mt-1 line-clamp-3 text-xs leading-snug text-rep-slate">{termOfDay.shortDefinition}</p>
              {isTermOfDayRead && (
                <p className="mt-2 font-brand text-xs font-bold text-rep-emerald-dark">{STRINGS.dashboard.termOfDayDone}</p>
              )}
              <button
                type="button"
                onClick={() => handleReadTermOfDay(termOfDay)}
                aria-haspopup="dialog"
                className="civic-btn mt-3 min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
              >
                {isTermOfDayRead ? STRINGS.dashboard.termOfDayReread : STRINGS.dashboard.termOfDayAction(TERM_OF_DAY_XP)}
              </button>
            </section>
          )}
        </div>

        <div
          className={`${activeTab === "path" ? "" : "hidden"} mx-auto w-full max-w-md space-y-12 lg:col-start-2 lg:row-start-1 lg:block`}
        >
          <h1 className="sr-only">{STRINGS.dashboard.heading}</h1>
          {units.map((unit, i) => (
            <LearningPathUnit
              key={unit.level.id}
              unit={unit}
              unitNumber={i + 1}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onStartSession={onStartSession}
              onOpenChest={handleOpenChest}
            />
          ))}
        </div>
      </div>

      <p className="pb-[env(safe-area-inset-bottom)] pt-10 text-center text-xs text-rep-muted">
        {STRINGS.dashboard.footer}
      </p>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onStartSwipe={onStartSwipe}
        onOpenTermOfDay={termOfDay ? () => handleReadTermOfDay(termOfDay) : undefined}
        isTermOfDayPending={termOfDay !== null && !isTermOfDayRead}
        onOpenGlossary={onOpenGlossary}
      />

      {dialog}
    </main>
  );
}
