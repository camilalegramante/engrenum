"use client";

import { useState } from "react";
import GlossaryText from "@/components/GlossaryText";
import HudHeader from "@/components/HudHeader";
import { INITIAL_LIVES, XP_PER_CORRECT_ANSWER, getCivicTitle } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { toStepView } from "@/lib/session";
import { playSound } from "@/lib/sound";
import type { GameState, QuizSession } from "@/types/quiz";

interface EngrenumQuizProps {
  session: QuizSession;
  xp: number;
  streak: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onCorrectAnswer: () => void;
  onComplete: () => void;
  onExit: () => void;
}

const INITIAL_GAME_STATE: GameState = {
  currentIndex: 0,
  lives: INITIAL_LIVES,
  score: 0,
  selectedOptionId: null,
  isSelectionLocked: false,
  isGameOver: false,
};

export default function EngrenumQuiz({
  session,
  xp,
  streak,
  isSoundEnabled,
  onToggleSound,
  onCorrectAnswer,
  onComplete,
  onExit,
}: EngrenumQuizProps) {
  const [game, setGame] = useState<GameState>(INITIAL_GAME_STATE);

  const { currentIndex, lives, score, selectedOptionId, isSelectionLocked, isGameOver } = game;
  const totalQuestions = session.steps.length;
  // Every mechanic (scenario, Fato ou Fake, glossary clue) is played as a prompt with options.
  const step = toStepView(session.steps[currentIndex]);
  const selectedOption = step.options.find((o) => o.id === selectedOptionId);
  const isAnswerCorrect = isSelectionLocked && (selectedOption?.isCorrect ?? false);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const hasWon = isGameOver && lives > 0;
  const hasLost = isGameOver && lives === 0;

  function handleSelectOption(optionId: string) {
    playSound("tap", isSoundEnabled);
    setGame((g) => ({ ...g, selectedOptionId: optionId }));
  }

  function handleVerify() {
    if (!selectedOption) return;
    if (selectedOption.isCorrect) {
      playSound("correct", isSoundEnabled);
      setGame((g) => ({ ...g, isSelectionLocked: true, score: g.score + 1 }));
      onCorrectAnswer();
    } else {
      playSound("error", isSoundEnabled);
      setGame((g) => ({ ...g, isSelectionLocked: true, lives: Math.max(0, g.lives - 1) }));
    }
  }

  function handleNext() {
    if (lives === 0) {
      playSound("error", isSoundEnabled);
      setGame((g) => ({ ...g, isGameOver: true }));
      return;
    }
    if (isLastQuestion) {
      playSound("correct", isSoundEnabled);
      setGame((g) => ({ ...g, isGameOver: true }));
      onComplete();
      return;
    }
    playSound("tap", isSoundEnabled);
    setGame((g) => ({
      ...g,
      currentIndex: g.currentIndex + 1,
      selectedOptionId: null,
      isSelectionLocked: false,
    }));
  }

  function handleRestart() {
    playSound("tap", isSoundEnabled);
    setGame(INITIAL_GAME_STATE);
  }

  if (hasWon) {
    const accuracy = Math.round((score / totalQuestions) * 100);
    const isChallenge = session.kind === "challenge";
    const civicTitle = getCivicTitle(score, totalQuestions);
    const heading = isChallenge
      ? civicTitle.name
      : accuracy === 100
        ? STRINGS.quiz.perfectLesson
        : STRINGS.quiz.lessonDone;
    const description = isChallenge ? civicTitle.description : STRINGS.quiz.lessonDoneDescription(session.title);
    return (
      <>
        <HudHeader
          xp={xp}
          streak={streak}
          isSoundEnabled={isSoundEnabled}
          onToggleSound={onToggleSound}
          onBack={onExit}
        />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-8 text-center">
          <div
            className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-rep-navy bg-rep-navy text-3xl shadow-neo-gold"
            aria-hidden="true"
          >
            ⚖️
          </div>
          <span className="mb-2 rounded-full bg-rep-navy px-3 py-1 font-brand text-xs font-bold uppercase tracking-widest text-rep-gold">
            {isChallenge ? STRINGS.quiz.levelDoneBadge : STRINGS.quiz.lessonDoneBadge}
          </span>
          <h2 className="font-brand text-2xl font-bold tracking-tight text-rep-navy sm:text-3xl">{heading}</h2>
          <p className="mt-1 max-w-sm text-sm font-medium text-rep-muted">{description}</p>

          <dl className="my-6 grid w-full max-w-sm grid-cols-2 gap-3">
            <div className="rounded-xl border-2 border-rep-navy bg-white p-4 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.quiz.pointsLabel}</dt>
              <dd className="mt-1 font-brand text-2xl font-bold text-rep-navy">
                +{score * XP_PER_CORRECT_ANSWER} <span className="font-sans text-xs text-rep-gold">{STRINGS.common.xp}</span>
              </dd>
            </div>
            <div className="rounded-xl border-2 border-rep-navy bg-white p-4 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.quiz.accuracyLabel}</dt>
              <dd className="mt-1 font-brand text-2xl font-bold text-rep-emerald">
                {accuracy}
                <span className="font-sans text-xs">%</span>
              </dd>
            </div>
          </dl>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={onExit}
              className="civic-btn w-full rounded-xl border-2 border-rep-navy bg-rep-navy py-4 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:bg-rep-navy-light"
            >
              {STRINGS.common.backToPath}
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="civic-btn w-full rounded-xl border-2 border-rep-navy bg-white py-4 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo hover:bg-slate-50"
            >
              {STRINGS.common.playAgain}
            </button>
          </div>
        </main>
      </>
    );
  }

  const progressPercent = ((currentIndex + (isSelectionLocked ? 1 : 0)) / totalQuestions) * 100;

  return (
    <>
      <HudHeader
        xp={xp}
        streak={streak}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={onToggleSound}
        lives={lives}
        progressPercent={progressPercent}
        onBack={onExit}
      />

      <main
        className={`mx-auto w-full max-w-xl flex-1 px-4 py-6 ${isSelectionLocked ? "pb-80" : ""} ${isSelectionLocked && !isAnswerCorrect ? "animate-shake" : ""}`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rep-border bg-slate-100 px-3 py-1 font-brand text-xs font-bold uppercase tracking-wider text-rep-navy">
              <span className="h-2 w-2 rounded-full bg-rep-gold" />
              {step.badge}
            </span>
            <span className="font-brand text-xs font-semibold text-rep-muted">
              {STRINGS.quiz.phase(currentIndex + 1, totalQuestions)}
            </span>
          </div>

          <div className="space-y-3 rounded-2xl border-2 border-rep-navy bg-white p-5 shadow-neo sm:p-6">
            <p className="font-brand text-xs uppercase tracking-wider text-rep-muted">{step.eyebrow}</p>
            <h2 className="text-lg font-bold leading-snug text-rep-navy sm:text-xl">
              {/* Glossary links only after verifying, so a definition never hints at the answer */}
              {isSelectionLocked ? <GlossaryText text={step.prompt} /> : step.prompt}
            </h2>
            {step.instruction && <p className="text-sm font-semibold text-rep-slate">{step.instruction}</p>}
          </div>

          <ul className={step.layout === "split" ? "grid grid-cols-2 gap-3 pt-2" : "space-y-3 pt-2"}>
            {step.options.map((option) => {
              const isSelected = option.id === selectedOptionId;
              let cardStyle = "border-slate-300 bg-white shadow-sm hover:-translate-y-0.5";
              let indicatorStyle = "border-slate-300";
              let indicatorMark = "";

              if (isSelectionLocked) {
                if (option.isCorrect) {
                  cardStyle = "border-rep-emerald bg-emerald-50 shadow-neo-emerald";
                  indicatorStyle = "border-rep-emerald bg-rep-emerald text-white";
                  indicatorMark = "✓";
                } else if (isSelected) {
                  cardStyle = "border-rep-crimson bg-rose-50";
                  indicatorStyle = "border-rep-crimson bg-rep-crimson text-white";
                  indicatorMark = "✕";
                } else {
                  cardStyle = "border-slate-200 bg-white opacity-60";
                }
              } else if (isSelected) {
                cardStyle = "border-rep-navy bg-white shadow-neo";
                indicatorStyle = "border-rep-navy bg-rep-navy text-white";
                indicatorMark = "✓";
              }

              return (
                <li key={`${currentIndex}-${option.id}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectOption(option.id)}
                    disabled={isSelectionLocked}
                    aria-pressed={isSelected}
                    className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-xl border-2 p-4 text-left text-sm font-semibold text-rep-navy transition-all duration-150 disabled:cursor-default sm:text-base ${cardStyle}`}
                  >
                    <span>{option.text}</span>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 font-brand text-xs font-bold ${indicatorStyle}`}
                      aria-hidden="true"
                    >
                      {indicatorMark}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      {!isSelectionLocked && (
        <footer className="sticky bottom-0 z-20 w-full border-t-2 border-rep-navy bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto flex max-w-xl items-center justify-end">
            <button
              type="button"
              onClick={handleVerify}
              disabled={!selectedOptionId}
              className={`civic-btn min-h-[44px] w-full rounded-xl border-2 py-3.5 font-brand text-sm font-bold uppercase tracking-wider sm:w-auto sm:px-10 ${
                selectedOptionId
                  ? "border-rep-navy bg-rep-navy text-white shadow-neo hover:bg-rep-navy-light"
                  : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-400"
              }`}
            >
              {STRINGS.quiz.verify}
            </button>
          </div>
        </footer>
      )}

      {isSelectionLocked && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-x-0 bottom-0 z-40 animate-drawer border-t-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl ${
            isAnswerCorrect ? "border-rep-emerald-dark bg-emerald-50" : "border-rep-crimson bg-rose-50"
          }`}
        >
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-bold text-white ${
                  isAnswerCorrect ? "border-rep-emerald-dark bg-rep-emerald" : "border-rep-crimson bg-rose-600"
                }`}
                aria-hidden="true"
              >
                {isAnswerCorrect ? "✓" : "✕"}
              </div>
              <div className="space-y-1.5">
                <h3
                  className={`font-brand text-lg font-bold leading-tight ${isAnswerCorrect ? "text-rep-emerald-dark" : "text-rep-crimson"}`}
                >
                  {isAnswerCorrect
                    ? STRINGS.quiz.correctTitle
                    : lives === 0
                      ? STRINGS.quiz.outOfLivesTitle
                      : STRINGS.quiz.wrongTitle}
                </h3>
                {step.constitutionalArticle && (
                  <p className="inline-block rounded-md bg-white/80 px-2 py-0.5 font-brand text-xs font-bold text-rep-navy ring-1 ring-rep-border">
                    📖 {step.constitutionalArticle}
                  </p>
                )}
                {!isAnswerCorrect && <p className="text-sm font-bold text-rep-navy">{step.correctAnswer}</p>}
                <p className="text-sm font-medium leading-relaxed text-slate-700">
                  <GlossaryText text={step.explanation} />
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleNext}
                autoFocus
                className={`civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:opacity-90 sm:w-auto sm:px-8 ${
                  isAnswerCorrect ? "bg-rep-emerald-dark" : "bg-rep-crimson"
                }`}
              >
                {lives === 0
                  ? STRINGS.common.seeResult
                  : isLastQuestion
                    ? STRINGS.quiz.finishLevel
                    : STRINGS.quiz.nextQuestion}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasLost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-rep-navy/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="defeat-title"
        >
          <div className="w-full max-w-sm space-y-4 rounded-2xl border-2 border-rep-navy bg-white p-6 text-center shadow-neo">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-rose-300 bg-rose-100 text-2xl"
              aria-hidden="true"
            >
              ⚖️
            </div>
            <div>
              <h3 id="defeat-title" className="font-brand text-xl font-bold text-rep-navy">
                {STRINGS.quiz.outOfLivesTitle}
              </h3>
              <p className="mt-1 text-sm text-rep-muted">
                {STRINGS.quiz.defeatMessage(score, currentIndex + 1)}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleRestart}
                autoFocus
                className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-navy py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo"
              >
                {STRINGS.quiz.retry}
              </button>
              <button
                type="button"
                onClick={onExit}
                className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-white py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo"
              >
                {STRINGS.quiz.backToMap}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
