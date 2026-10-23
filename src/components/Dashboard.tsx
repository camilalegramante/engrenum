"use client";

import { useState } from "react";
import JourneyPanel from "@/components/JourneyPanel";
import LearningPathUnit from "@/components/LearningPathUnit";
import { LEVELS } from "@/data/levels";
import { buildPath } from "@/lib/path";
import type { Progress } from "@/lib/progress";
import type { Level, QuizSession } from "@/types/quiz";

interface DashboardProps {
  progress: Progress;
  onStartSession: (session: QuizSession) => void;
  onOpenChest: (chestId: string) => void;
  levels?: Level[];
}

export default function Dashboard({ progress, onStartSession, onOpenChest, levels = LEVELS }: DashboardProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const units = buildPath(levels, progress);

  function handleOpenChest(chestId: string) {
    setSelectedNodeId(null);
    onOpenChest(chestId);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <JourneyPanel progress={progress} className="lg:sticky lg:top-24 lg:order-last" />

        <div className="mx-auto w-full max-w-md space-y-12">
          <h1 className="sr-only">Quem Manda Aqui? Trilha Federativa</h1>
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
        Conteúdo educativo baseado na Constituição Federal de 1988.
      </p>
    </main>
  );
}
