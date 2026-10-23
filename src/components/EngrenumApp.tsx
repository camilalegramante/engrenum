"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import EngrenumQuiz from "@/components/EngrenumQuiz";
import HudHeader from "@/components/HudHeader";
import { XP_PER_CORRECT_ANSWER } from "@/data/levels";
import { registerLevelCompletion, updateProgress, useProgress } from "@/lib/progress";
import { playSound } from "@/lib/sound";
import type { Level } from "@/types/quiz";

export default function EngrenumApp() {
  const progress = useProgress();
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);

  function handleToggleSound() {
    const isEnabled = !progress.isSoundEnabled;
    updateProgress((p) => ({ ...p, isSoundEnabled: isEnabled }));
    playSound("tap", isEnabled);
  }

  function handleStartLevel(level: Level) {
    playSound("tap", progress.isSoundEnabled);
    setActiveLevel(level);
  }

  function handleExitLevel() {
    playSound("tap", progress.isSoundEnabled);
    setActiveLevel(null);
  }

  if (activeLevel) {
    return (
      <EngrenumQuiz
        key={activeLevel.id}
        level={activeLevel}
        xp={progress.xp}
        streak={progress.streak}
        isSoundEnabled={progress.isSoundEnabled}
        onToggleSound={handleToggleSound}
        onCorrectAnswer={() => updateProgress((p) => ({ ...p, xp: p.xp + XP_PER_CORRECT_ANSWER }))}
        onLevelComplete={() => updateProgress((p) => registerLevelCompletion(p, activeLevel.id))}
        onExit={handleExitLevel}
      />
    );
  }

  return (
    <>
      <HudHeader
        xp={progress.xp}
        streak={progress.streak}
        isSoundEnabled={progress.isSoundEnabled}
        onToggleSound={handleToggleSound}
      />
      <Dashboard xp={progress.xp} completedLevelIds={progress.completedLevelIds} onStartLevel={handleStartLevel} />
    </>
  );
}
