"use client";

import { useState, type PointerEvent } from "react";
import HudHeader from "@/components/HudHeader";
import Mascot from "@/components/Mascot";
import { XP_PER_CORRECT_ANSWER, getCivicTitle } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import swipeCardsData from "@/data/swipeCards.json";
import { playSound } from "@/lib/sound";
import type { SwipeCard, SwipeFeedback } from "@/types/swipe";

interface SwipeCardViewProps {
  xp: number;
  streak: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  onCorrectAnswer: () => void;
  onExit: () => void;
  cards?: SwipeCard[];
}

interface SwipeRoundState {
  currentIndex: number;
  score: number;
  /** The player's call on the current card: true = legitimate, false = illegal, null = undecided. */
  choice: boolean | null;
  isFinished: boolean;
}

const DEFAULT_CARDS: SwipeCard[] = swipeCardsData;

/** Horizontal drag (px) needed to commit a decision. */
const SWIPE_THRESHOLD = 100;
/** How far (px) a decided card flies off the stack. */
const FLING_DISTANCE = 600;
const MAX_ROTATION_DEG = 15;
/** Decorative cards drawn behind the current one. */
const STACK_DEPTH = 2;

const INITIAL_ROUND_STATE: SwipeRoundState = {
  currentIndex: 0,
  score: 0,
  choice: null,
  isFinished: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function SwipeCardView({
  xp,
  streak,
  isSoundEnabled,
  onToggleSound,
  onCorrectAnswer,
  onExit,
  cards = DEFAULT_CARDS,
}: SwipeCardViewProps) {
  const [round, setRound] = useState<SwipeRoundState>(INITIAL_ROUND_STATE);
  const [dragX, setDragX] = useState(0);
  /** Pointer x where the current drag began; null when not dragging. */
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const { currentIndex, score, choice, isFinished } = round;
  const totalCards = cards.length;
  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex === totalCards - 1;
  const isDecided = choice !== null;
  const isDragging = dragStartX !== null;
  const feedback: SwipeFeedback = isDecided ? (choice === currentCard.isLegitimate ? "correct" : "incorrect") : null;

  function decide(isLegitimateChoice: boolean) {
    const isCorrect = isLegitimateChoice === currentCard.isLegitimate;
    playSound(isCorrect ? "correct" : "error", isSoundEnabled);
    setRound((r) => ({ ...r, choice: isLegitimateChoice, score: r.score + (isCorrect ? 1 : 0) }));
    if (isCorrect) onCorrectAnswer();
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (isDecided) return;
    setDragStartX(event.clientX);
    // Keeps receiving moves even when the finger leaves the card (not implemented in every environment).
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragX(0);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (dragStartX === null) return;
    setDragX(event.clientX - dragStartX);
  }

  function handlePointerUp() {
    if (dragStartX === null) return;
    setDragStartX(null);
    setDragX(0);
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) decide(dragX > 0);
  }

  function handlePointerCancel() {
    setDragStartX(null);
    setDragX(0);
  }

  function handleNext() {
    if (isLastCard) {
      playSound("correct", isSoundEnabled);
      setRound((r) => ({ ...r, isFinished: true }));
      return;
    }
    playSound("tap", isSoundEnabled);
    setRound((r) => ({ ...r, currentIndex: r.currentIndex + 1, choice: null }));
  }

  function handleRestart() {
    playSound("tap", isSoundEnabled);
    setRound(INITIAL_ROUND_STATE);
  }

  if (isFinished) {
    const accuracy = Math.round((score / totalCards) * 100);
    const civicTitle = getCivicTitle(score, totalCards);
    return (
      <>
        <HudHeader xp={xp} streak={streak} isSoundEnabled={isSoundEnabled} onToggleSound={onToggleSound} onBack={onExit} />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-8 text-center">
          <Mascot className="mb-4 h-32 w-28" />
          <span className="mb-2 rounded-full bg-rep-navy px-3 py-1 font-brand text-xs font-bold uppercase tracking-widest text-rep-gold">
            {STRINGS.swipe.roundDoneBadge}
          </span>
          <h2 className="font-brand text-2xl font-bold tracking-tight text-rep-navy sm:text-3xl">{civicTitle.name}</h2>
          <p className="mt-1 max-w-sm text-sm font-medium text-rep-muted">{civicTitle.description}</p>

          <dl className="my-6 grid w-full max-w-sm grid-cols-3 gap-3">
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.swipe.hitsLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-rep-navy">
                {score}
                <span className="font-sans text-xs text-rep-muted">/{totalCards}</span>
              </dd>
            </div>
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.swipe.accuracyLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-rep-emerald">
                {accuracy}
                <span className="font-sans text-xs">%</span>
              </dd>
            </div>
            <div className="rounded-xl border-2 border-rep-navy bg-white p-3 text-left shadow-sm">
              <dt className="font-brand text-[11px] font-bold uppercase text-rep-muted">{STRINGS.swipe.pointsLabel}</dt>
              <dd className="mt-1 font-brand text-xl font-bold text-rep-navy">
                +{score * XP_PER_CORRECT_ANSWER} <span className="font-sans text-xs text-rep-gold">{STRINGS.common.xp}</span>
              </dd>
            </div>
          </dl>

          <div className="flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={onExit}
              className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-navy py-4 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:bg-rep-navy-light"
            >
              {STRINGS.common.backToPath}
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="civic-btn min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-white py-4 font-brand text-sm font-bold uppercase tracking-wider text-rep-navy shadow-neo hover:bg-slate-50"
            >
              {STRINGS.common.playAgain}
            </button>
          </div>
        </main>
      </>
    );
  }

  // A decided card flies off in the chosen direction; otherwise it follows the finger.
  const offsetX = isDecided ? (choice ? FLING_DISTANCE : -FLING_DISTANCE) : dragX;
  const rotation = clamp(offsetX / 20, -MAX_ROTATION_DEG, MAX_ROTATION_DEG);
  const legitimateHintOpacity = clamp(offsetX / SWIPE_THRESHOLD, 0, 1);
  const illegalHintOpacity = clamp(-offsetX / SWIPE_THRESHOLD, 0, 1);
  const stackedCards = cards.slice(currentIndex + 1, currentIndex + 1 + STACK_DEPTH);
  const progressPercent = ((currentIndex + (isDecided ? 1 : 0)) / totalCards) * 100;
  const isCorrect = feedback === "correct";

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

      <main className={`mx-auto w-full max-w-xl flex-1 overflow-x-clip px-4 py-6 ${isDecided ? "pb-80" : ""}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="font-brand text-sm font-bold uppercase tracking-wider text-rep-navy">{STRINGS.swipe.title}</h1>
          <span className="shrink-0 font-brand text-xs font-semibold text-rep-muted">
            {STRINGS.swipe.cardCounter(currentIndex + 1, totalCards)}
          </span>
        </div>
        <p className="mb-5 text-sm text-rep-muted">
          {STRINGS.swipe.hintStart} <strong className="text-rep-emerald-dark">{STRINGS.swipe.hintRight}</strong>{" "}
          {STRINGS.swipe.hintMiddle} <strong className="text-rep-crimson">{STRINGS.swipe.hintLeft}</strong>{" "}
          {STRINGS.swipe.hintEnd}
        </p>

        <div className="grid">
          {stackedCards
            .map((card, i) => (
              <div
                key={card.id}
                aria-hidden="true"
                className="col-start-1 row-start-1 rounded-2xl border-2 border-rep-navy bg-white shadow-neo"
                style={{ transform: `translateY(${(i + 1) * 10}px) scale(${1 - (i + 1) * 0.04})`, opacity: 1 - (i + 1) * 0.25 }}
              />
            ))
            .reverse()}

          <article
            key={currentCard.id}
            aria-labelledby="swipe-statement"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className={`relative col-start-1 row-start-1 touch-pan-y select-none space-y-4 rounded-2xl border-2 border-rep-navy bg-white p-5 shadow-neo sm:p-6 [&_img]:pointer-events-none ${
              isDecided ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"
            }`}
            style={{
              transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.35s ease-out, opacity 0.35s ease-out",
              opacity: isDecided ? 0 : 1,
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rep-navy px-3 py-1 font-brand text-xs font-bold uppercase tracking-wider text-white">
              <span className="h-2 w-2 rounded-full bg-rep-gold" aria-hidden="true" />
              {currentCard.speakerRole}
            </span>

            <p id="swipe-statement" className="text-lg font-bold leading-snug text-rep-navy sm:text-xl">
              {STRINGS.swipe.statement(currentCard.statement)}
            </p>

            <div className="flex items-center gap-3 rounded-xl border border-rep-border bg-rep-cream p-3">
              <Mascot className="h-16 w-12 shrink-0" />
              <p className="text-xs font-semibold leading-snug text-rep-slate">
                <span className="font-brand font-bold text-rep-navy">{STRINGS.swipe.mascotLead}</span>{" "}
                {STRINGS.swipe.mascotQuestion}
              </p>
            </div>

            {/* Translucent verdict stamps that fade in while dragging */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-4 -rotate-12 rounded-lg border-4 border-rep-emerald bg-emerald-50/90 px-3 py-1 font-brand text-xl font-bold uppercase text-rep-emerald-dark"
              style={{ opacity: legitimateHintOpacity }}
            >
              {STRINGS.swipe.legitimateStamp}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-4 rotate-12 rounded-lg border-4 border-rep-crimson bg-rose-50/90 px-3 py-1 font-brand text-xl font-bold uppercase text-rep-crimson"
              style={{ opacity: illegalHintOpacity }}
            >
              {STRINGS.swipe.illegalStamp}
            </span>
          </article>
        </div>
      </main>

      {!isDecided && (
        <footer className="sticky bottom-0 z-20 w-full border-t-2 border-rep-navy bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => decide(false)}
              className="civic-btn flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-rep-navy bg-rose-100 py-3.5 font-brand text-sm font-bold text-rep-crimson shadow-neo hover:bg-rose-200"
            >
              <span aria-hidden="true">✕</span>
              {STRINGS.swipe.illegalAction}
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              className="civic-btn flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-rep-navy bg-emerald-100 py-3.5 font-brand text-sm font-bold text-rep-emerald-dark shadow-neo hover:bg-emerald-200"
            >
              <span aria-hidden="true">✓</span>
              {STRINGS.swipe.legitimateAction}
            </button>
          </div>
        </footer>
      )}

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
                {isCorrect ? "✓" : "✕"}
              </div>
              <div className="space-y-1.5">
                <h2
                  className={`font-brand text-lg font-bold leading-tight ${isCorrect ? "text-rep-emerald-dark" : "text-rep-crimson"}`}
                >
                  {isCorrect ? STRINGS.swipe.correctTitle : STRINGS.swipe.wrongTitle}
                </h2>
                <p className="text-sm font-bold text-rep-navy">
                  {currentCard.isLegitimate ? STRINGS.swipe.legitimateVerdict : STRINGS.swipe.illegalVerdict}
                </p>
                <p className="inline-block rounded-md bg-white/80 px-2 py-0.5 font-brand text-xs font-bold text-rep-navy ring-1 ring-rep-border">
                  📖 {currentCard.constitutionalArticle}
                </p>
                <p className="text-sm font-medium leading-relaxed text-slate-700">{currentCard.explanation}</p>
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
                {isLastCard ? STRINGS.common.seeResult : STRINGS.swipe.nextCard}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
