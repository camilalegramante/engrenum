"use client";

import { useState } from "react";
import JourneyPanel from "@/components/JourneyPanel";
import LearningPathUnit from "@/components/LearningPathUnit";
import { LEVELS } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { buildPath } from "@/lib/path";
import type { Progress } from "@/lib/progress";
import type { Level, QuizSession } from "@/types/quiz";

interface DashboardProps {
  progress: Progress;
  onStartSession: (session: QuizSession) => void;
  onOpenChest: (chestId: string) => void;
  onStartSwipe: () => void;
  levels?: Level[];
}

export default function Dashboard({
  progress,
  onStartSession,
  onOpenChest,
  onStartSwipe,
  levels = LEVELS,
}: DashboardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const units = buildPath(levels, progress);

  function handleOpenChest(chestId: string) {
    setSelectedNodeId(null);
    onOpenChest(chestId);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-3 lg:sticky lg:top-24 lg:order-last lg:space-y-4">
          <JourneyPanel progress={progress} />

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
        </div>

        <div className="mx-auto w-full max-w-md space-y-12">
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
    </main>
  );
}
