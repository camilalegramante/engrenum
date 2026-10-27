"use client";

import { useState } from "react";
import HudHeader from "@/components/HudHeader";
import Mascot from "@/components/Mascot";
import { STRINGS } from "@/data/strings";
import { TERM_QUIZ_XP } from "@/lib/glossary";
import { playSound } from "@/lib/sound";
import type { TermQuizQuestion } from "@/types/glossary";

interface TermQuizProps {
  questions: TermQuizQuestion[];
  xp: number;
  streak: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onCorrectAnswer: (termId: string) => void;
  onPlayAgain: () => void;
  onExit: () => void;
  masteredCount: number;
  totalTerms: number;
}

interface TermQuizState {
  currentIndex: number;
  score: number;
  /** The player's pick for the current clue; null while undecided. */
  selectedTermId: string | null;
  isFinished: boolean;
}

const INITIAL_STATE: TermQuizState = { currentIndex: 0, score: 0, selectedTermId: null, isFinished: false };

/** "Qual é o termo?": Capi reads a definition and the player picks the matching term. */
export default function TermQuiz({
  questions,
  xp,
  streak,
  isSoundEnabled,
  onToggleSound,
  onCorrectAnswer,
  onPlayAgain,
  onExit,
  masteredCount,
  totalTerms,
}: TermQuizProps) {
  const [quiz, setQuiz] = useState<TermQuizState>(INITIAL_STATE);

  const { currentIndex, score, selectedTermId, isFinished } = quiz;
  const totalQuestions = questions.length;
  const current = questions[currentIndex];
  const isDecided = selectedTermId !== null;
  const isCorrect = selectedTermId === current.term.id;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  function handleSelect(termId: string) {
    const isHit = termId === current.term.id;
    playSound(isHit ? "correct" : "error", isSoundEnabled);
    setQuiz((q) => ({ ...q, selectedTermId: termId, score: q.score + (isHit ? 1 : 0) }));
    if (isHit) onCorrectAnswer(termId);
  }

  function handleNext() {
    if (isLastQuestion) {
      playSound("correct", isSoundEnabled);
      setQuiz((q) => ({ ...q, isFinished: true }));
      return;
    }
    playSound("tap", isSoundEnabled);
    setQuiz((q) => ({ ...q, currentIndex: q.currentIndex + 1, selectedTermId: null }));
  }

  if (isFinished) {
    const isPerfect = score === totalQuestions;
    return (
      <>
        <HudHeader xp={xp} streak={streak} isSoundEnabled={isSoundEnabled} onToggleSound={onToggleSound} onBack={onExit} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-8 text-center">
          <Mascot className="mb-4 h-32 w-28" />
          <span className="mb-2 rounded-full bg-rep-navy px-3 py-1 font-brand text-xs font-bold uppercase tracking-widest text-rep-gold">
            {STRINGS.termQuiz.roundDoneBadge}
          </span>
          <h2 className="font-brand text-2xl font-bold tracking-tight text-rep-navy sm:text-3xl">
            {isPerfect ? STRINGS.termQuiz.perfectRound : STRINGS.termQuiz.roundDone}
          </h2>
          <p className="mt-1 max-w-sm text-sm font-medium text-rep-muted">{STRINGS.termQuiz.roundDoneDescription}</p>

          <dl className="my-6 grid w-full max-w-sm grid-cols-3 gap-3">
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.termQuiz.hitsLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-rep-navy">
                {score}
                <span className="font-sans text-xs text-rep-muted">/{totalQuestions}</span>
              </dd>
            </div>
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.termQuiz.pointsLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-rep-navy">
                +{score * TERM_QUIZ_XP} <span className="font-sans text-xs text-rep-gold">{STRINGS.common.xp}</span>
              </dd>
            </div>
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.termQuiz.masteredLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-amber-700">
                {masteredCount}
                <span className="font-sans text-xs text-rep-muted">/{totalTerms}</span>
              </dd>
            </div>
          </dl>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={onExit}
              className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-navy py-4 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:bg-rep-navy-light"
            >
              {STRINGS.termQuiz.backToGlossary}
            </button>
            <button
              type="button"
              onClick={onPlayAgain}
              className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-white py-4 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo hover:bg-slate-50"
            >
              {STRINGS.common.playAgain}
            </button>
          </div>
        </main>
      </>
    );
  }

  const progressPercent = ((currentIndex + (isDecided ? 1 : 0)) / totalQuestions) * 100;

  return (
    <>
      <HudHeader
        xp={xp}
        streak={streak}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={onToggleSound}
        progressPercent={progressPercent}
        onBack={onExit}
      />

      <main className={`mx-auto w-full max-w-xl flex-1 px-4 py-6 ${isDecided ? "pb-80" : ""} ${isDecided && !isCorrect ? "animate-shake" : ""}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-brand text-sm font-bold uppercase tracking-wider text-rep-navy">{STRINGS.termQuiz.title}</h1>
          <span className="shrink-0 font-brand text-xs font-semibold text-rep-muted">
            {STRINGS.termQuiz.clueCounter(currentIndex + 1, totalQuestions)}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border-2 border-rep-navy bg-white p-4 shadow-neo sm:p-5">
          <Mascot className="h-20 w-16 shrink-0" />
          <div>
            <p className="font-brand text-xs font-bold uppercase tracking-wider text-rep-muted">{STRINGS.termQuiz.clueLead}</p>
            <h2 className="mt-1 text-base font-bold leading-snug text-rep-navy sm:text-lg">{STRINGS.termQuiz.clue(current.clue)}</h2>
          </div>
        </div>

        <ul aria-label={STRINGS.termQuiz.optionsLabel} className="mt-5 grid gap-3 sm:grid-cols-2">
          {current.options.map((option) => {
            const isAnswer = option.id === current.term.id;
            const isSelected = option.id === selectedTermId;
            let style = "border-rep-navy bg-white shadow-neo hover:-translate-y-0.5";
            if (isDecided) {
              if (isAnswer) style = "border-rep-emerald bg-emerald-50 shadow-neo-emerald";
              else if (isSelected) style = "border-rep-crimson bg-rose-50";
              else style = "border-slate-200 bg-white opacity-60";
            }
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  disabled={isDecided}
                  className={`civic-btn flex min-h-[56px] w-full items-center justify-center rounded-xl border-2 px-4 py-3 text-center font-brand text-sm font-bold text-rep-navy transition-all duration-150 disabled:cursor-default sm:text-base ${style}`}
                >
                  {option.term}
                </button>
              </li>
            );
          })}
        </ul>
      </main>

      {isDecided && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed inset-x-0 bottom-0 z-40 animate-drawer border-t-2 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-2xl ${
            isCorrect ? "border-rep-emerald-dark bg-emerald-50" : "border-rep-crimson bg-rose-50"
          }`}
        >
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-bold text-white ${
                  isCorrect ? "border-rep-emerald-dark bg-rep-emerald" : "border-rep-crimson bg-rose-600"
                }`}
                aria-hidden="true"
              >
                {isCorrect ? "★" : "✕"}
              </div>
              <div className="space-y-1.5">
                <h3 className={`font-brand text-lg font-bold leading-tight ${isCorrect ? "text-rep-emerald-dark" : "text-rep-crimson"}`}>
                  {isCorrect ? STRINGS.termQuiz.correctTitle : STRINGS.termQuiz.wrongTitle}
                </h3>
                <p className="text-sm font-bold text-rep-navy">{STRINGS.termQuiz.answer(current.term.term)}</p>
                {current.term.constitutionalArticle && (
                  <p className="inline-block rounded-md bg-white/80 px-2 py-0.5 font-brand text-xs font-bold text-rep-navy ring-1 ring-rep-border">
                    📖 {current.term.constitutionalArticle}
                  </p>
                )}
                <p className="text-sm font-medium leading-relaxed text-slate-700">{current.term.practicalExample}</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleNext}
                autoFocus
                className={`civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy py-3.5 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:opacity-90 sm:w-auto sm:px-8 ${
                  isCorrect ? "bg-rep-emerald-dark" : "bg-rep-crimson"
                }`}
              >
                {isLastQuestion ? STRINGS.common.seeResult : STRINGS.termQuiz.nextClue}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
