"use client";

import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import EngrenumQuiz from "@/components/EngrenumQuiz";
import HudHeader from "@/components/HudHeader";
import Mascot from "@/components/Mascot";
import SwipeCardView from "@/components/SwipeCardView";
import { CHEST_XP, XP_PER_CORRECT_ANSWER } from "@/data/levels";
import { registerChestOpening, registerSessionCompletion, updateProgress, useProgress } from "@/lib/progress";
import { playSound } from "@/lib/sound";
import type { QuizSession } from "@/types/quiz";

export default function EngrenumApp() {
  const progress = useProgress();
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [chestReward, setChestReward] = useState<number | null>(null);
  const [isSwipeActive, setIsSwipeActive] = useState(false);

  function handleToggleSound() {
    const isEnabled = !progress.isSoundEnabled;
    updateProgress((p) => ({ ...p, isSoundEnabled: isEnabled }));
    playSound("tap", isEnabled);
  }

  function handleStartSession(session: QuizSession) {
    playSound("tap", progress.isSoundEnabled);
    setActiveSession(session);
  }

  function handleExitSession() {
    playSound("tap", progress.isSoundEnabled);
    setActiveSession(null);
  }

  function handleToggleSwipe(isActive: boolean) {
    playSound("tap", progress.isSoundEnabled);
    setIsSwipeActive(isActive);
  }

  function handleAwardCorrectAnswer() {
    updateProgress((p) => ({ ...p, xp: p.xp + XP_PER_CORRECT_ANSWER }));
  }

  function handleOpenChest(chestId: string) {
    playSound("correct", progress.isSoundEnabled);
    updateProgress((p) => registerChestOpening(p, chestId, CHEST_XP));
    setChestReward(CHEST_XP);
  }

  if (activeSession) {
    return (
      <EngrenumQuiz
        key={activeSession.id}
        session={activeSession}
        xp={progress.xp}
        streak={progress.streak}
        isSoundEnabled={progress.isSoundEnabled}
        onToggleSound={handleToggleSound}
        onCorrectAnswer={handleAwardCorrectAnswer}
        onComplete={() => updateProgress((p) => registerSessionCompletion(p, activeSession))}
        onExit={handleExitSession}
      />
    );
  }

  if (isSwipeActive) {
    return (
      <SwipeCardView
        xp={progress.xp}
        streak={progress.streak}
        isSoundEnabled={progress.isSoundEnabled}
        onToggleSound={handleToggleSound}
        onCorrectAnswer={handleAwardCorrectAnswer}
        onExit={() => handleToggleSwipe(false)}
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
        isWide
      />
      <Dashboard
        progress={progress}
        onStartSession={handleStartSession}
        onOpenChest={handleOpenChest}
        onStartSwipe={() => handleToggleSwipe(true)}
      />

      {chestReward !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-rep-navy/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chest-title"
        >
          <div className="w-full max-w-sm space-y-4 rounded-2xl border-2 border-rep-navy bg-white p-6 text-center shadow-neo">
            <Mascot className="mx-auto h-32 w-28" />
            <div>
              <h2 id="chest-title" className="font-brand text-xl font-bold text-rep-navy">
                Baú aberto!
              </h2>
              <p className="mt-1 text-sm text-rep-muted">
                Você ganhou <strong className="text-rep-navy">+{chestReward} XP</strong> de bônus pela dedicação.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChestReward(null)}
              autoFocus
              className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
            >
              Oba!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
