"use client";

import { useState, type ReactNode } from "react";
import CivicGlossary from "@/components/CivicGlossary";
import Dashboard from "@/components/Dashboard";
import EngrenumQuiz from "@/components/EngrenumQuiz";
import { GlossaryProgressContext, type GlossaryProgressValue } from "@/components/GlossaryProgressContext";
import HudHeader from "@/components/HudHeader";
import Mascot from "@/components/Mascot";
import SwipeCardView from "@/components/SwipeCardView";
import TermQuiz from "@/components/TermQuiz";
import { CHEST_XP, XP_PER_CORRECT_ANSWER } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import {
  GLOSSARY_TERMS,
  TERM_DISCOVERY_XP,
  TERM_OF_DAY_XP,
  TERM_QUIZ_XP,
  buildTermQuizRound,
} from "@/lib/glossary";
import {
  registerChestOpening,
  registerSessionCompletion,
  registerTermDiscovery,
  registerTermMastery,
  registerTermOfDayRead,
  updateProgress,
  useProgress,
} from "@/lib/progress";
import { playSound } from "@/lib/sound";
import type { TermQuizQuestion } from "@/types/glossary";
import type { QuizSession } from "@/types/quiz";

/** Screens reachable from the path, besides quiz sessions. */
type Screen = "path" | "swipe" | "glossary" | "termQuiz";

interface TermQuizRound {
  /** Remounts the mini game on "Jogar novamente". */
  id: number;
  questions: TermQuizQuestion[];
}

export default function EngrenumApp() {
  const progress = useProgress();
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);
  const [chestReward, setChestReward] = useState<number | null>(null);
  const [screen, setScreen] = useState<Screen>("path");
  const [termQuizRound, setTermQuizRound] = useState<TermQuizRound | null>(null);

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

  function handleChangeScreen(nextScreen: Screen) {
    playSound("tap", progress.isSoundEnabled);
    setScreen(nextScreen);
  }

  function handleAwardCorrectAnswer() {
    updateProgress((p) => ({ ...p, xp: p.xp + XP_PER_CORRECT_ANSWER }));
  }

  function handleDiscoverTerm(termId: string): number {
    if (progress.discoveredTermIds.includes(termId)) return 0;
    playSound("correct", progress.isSoundEnabled);
    updateProgress((p) => registerTermDiscovery(p, termId, TERM_DISCOVERY_XP));
    return TERM_DISCOVERY_XP;
  }

  function handleStartTermQuiz() {
    playSound("tap", progress.isSoundEnabled);
    const questions = buildTermQuizRound(GLOSSARY_TERMS, progress.masteredTermIds);
    setTermQuizRound((round) => ({ id: (round?.id ?? 0) + 1, questions }));
    setScreen("termQuiz");
  }

  const glossaryProgress: GlossaryProgressValue = {
    discoveredTermIds: progress.discoveredTermIds,
    masteredTermIds: progress.masteredTermIds,
    onDiscoverTerm: handleDiscoverTerm,
  };

  function handleOpenChest(chestId: string) {
    playSound("correct", progress.isSoundEnabled);
    updateProgress((p) => registerChestOpening(p, chestId, CHEST_XP));
    setChestReward(CHEST_XP);
  }

  function renderScreen(): ReactNode {
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

    if (screen === "termQuiz" && termQuizRound) {
      return (
        <TermQuiz
          key={termQuizRound.id}
          questions={termQuizRound.questions}
          xp={progress.xp}
          streak={progress.streak}
          isSoundEnabled={progress.isSoundEnabled}
          onToggleSound={handleToggleSound}
          onCorrectAnswer={(termId) => updateProgress((p) => registerTermMastery(p, termId, TERM_QUIZ_XP))}
          onPlayAgain={handleStartTermQuiz}
          onExit={() => handleChangeScreen("glossary")}
          masteredCount={progress.masteredTermIds.length}
          totalTerms={GLOSSARY_TERMS.length}
        />
      );
    }

    if (screen === "glossary") {
      return (
        <CivicGlossary
          xp={progress.xp}
          streak={progress.streak}
          isSoundEnabled={progress.isSoundEnabled}
          onToggleSound={handleToggleSound}
          onStartQuiz={handleStartTermQuiz}
          onExit={() => handleChangeScreen("path")}
        />
      );
    }

    if (screen === "swipe") {
      return (
        <SwipeCardView
          xp={progress.xp}
          streak={progress.streak}
          isSoundEnabled={progress.isSoundEnabled}
          onToggleSound={handleToggleSound}
          onCorrectAnswer={handleAwardCorrectAnswer}
          onExit={() => handleChangeScreen("path")}
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
          onOpenGlossary={() => handleChangeScreen("glossary")}
          isWide
        />
        <Dashboard
          progress={progress}
          onStartSession={handleStartSession}
          onOpenChest={handleOpenChest}
          onStartSwipe={() => handleChangeScreen("swipe")}
          onOpenGlossary={() => handleChangeScreen("glossary")}
          onReadTermOfDay={() => updateProgress((p) => registerTermOfDayRead(p, TERM_OF_DAY_XP))}
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
                  {STRINGS.chest.title}
                </h2>
                <p className="mt-1 text-sm text-rep-muted">
                  {STRINGS.chest.rewardBefore} <strong className="text-rep-navy">{STRINGS.chest.reward(chestReward)}</strong>{" "}
                  {STRINGS.chest.rewardAfter}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChestReward(null)}
                autoFocus
                className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-gold py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
              >
                {STRINGS.chest.confirm}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return <GlossaryProgressContext.Provider value={glossaryProgress}>{renderScreen()}</GlossaryProgressContext.Provider>;
}
