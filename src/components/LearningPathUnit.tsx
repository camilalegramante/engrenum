import type { ReactNode } from "react";
import Mascot from "@/components/Mascot";
import { CHEST_XP } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import type { PathNode, PathNodeStatus, PathUnit, QuizSession } from "@/types/quiz";

interface LearningPathUnitProps {
  unit: PathUnit;
  unitNumber: number;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onStartSession: (session: QuizSession) => void;
  onOpenChest: (chestId: string) => void;
}

// Horizontal offsets (px) that make the path wind like a road.
const WINDING_OFFSETS = [0, 48, 76, 48, 0, -48, -76, -48];
const GHOST_NODE_COUNT = 3;

const NODE_STYLES: Record<PathNodeStatus, string> = {
  completed: "border-rep-navy bg-rep-gold text-rep-navy shadow-neo",
  current: "border-rep-navy bg-rep-navy text-rep-gold shadow-neo-gold",
  available: "border-rep-gold bg-amber-50 text-rep-navy shadow-neo-gold",
  locked: "border-slate-300 bg-slate-200 text-slate-400 shadow-[4px_4px_0_0_#cbd5e1]",
};

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      {children}
    </svg>
  );
}

function NodeIcon({ node }: { node: PathNode }) {
  if (node.kind === "chest") {
    return (
      <Icon>
        <rect x="3" y="9" width="18" height="11" rx="2" />
        <path d="M3 13h18M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" strokeLinecap="round" />
        <rect x="10.5" y="11.5" width="3" height="4" rx="1" fill="currentColor" />
      </Icon>
    );
  }
  if (node.status === "completed") {
    return (
      <Icon>
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} />
      </Icon>
    );
  }
  if (node.kind === "challenge") {
    return (
      <Icon>
        <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" strokeLinejoin="round" />
        <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" strokeLinecap="round" />
      </Icon>
    );
  }
  return (
    <Icon>
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"
        fill="currentColor"
        strokeLinejoin="round"
      />
    </Icon>
  );
}

function NodePopover({
  node,
  lessonNumber,
  lessonCount,
  onStartSession,
  onOpenChest,
}: {
  node: PathNode;
  lessonNumber: number;
  lessonCount: number;
  onStartSession: (session: QuizSession) => void;
  onOpenChest: (chestId: string) => void;
}) {
  let subtitle = "";
  let actionLabel: string | null = null;
  let message: string | null = node.status === "locked" ? STRINGS.path.lockedMessage : null;

  if (node.kind === "chest") {
    subtitle = STRINGS.path.chestBonus(CHEST_XP);
    if (node.status === "available") actionLabel = STRINGS.path.openChest;
    if (node.status === "completed") message = STRINGS.path.chestOpened;
  } else if (node.session) {
    const scenarios = STRINGS.path.scenarios(node.session.questions.length);
    if (node.kind === "challenge") {
      subtitle = STRINGS.path.challengeSubtitle(scenarios);
      if (node.status === "current") actionLabel = STRINGS.path.startChallenge;
      if (node.status === "completed") actionLabel = STRINGS.path.redoChallenge;
    } else {
      subtitle = STRINGS.path.lessonSubtitle(lessonNumber, lessonCount, scenarios);
      if (node.status === "current") actionLabel = STRINGS.path.startLesson;
      if (node.status === "completed") actionLabel = STRINGS.path.replayLesson;
    }
  }

  function handleAction() {
    if (node.kind === "chest") onOpenChest(node.id);
    else if (node.session) onStartSession(node.session);
  }

  const isActive = node.status !== "locked";

  return (
    <div
      id={`popover-${node.id}`}
      className={`mt-3 w-full max-w-xs rounded-2xl border-2 p-4 text-left shadow-neo ${
        isActive ? "border-rep-navy bg-white" : "border-slate-300 bg-slate-50"
      }`}
    >
      <p className="font-bold text-rep-navy">{node.title}</p>
      <p className="mt-0.5 text-xs font-medium text-rep-muted">{subtitle}</p>
      {message && <p className="mt-2 text-sm text-rep-slate">{message}</p>}
      {actionLabel && (
        <button
          type="button"
          onClick={handleAction}
          className="civic-btn mt-3 min-h-[44px] w-full rounded-xl border-2 border-rep-navy bg-rep-navy py-3 font-brand text-sm font-bold uppercase tracking-wider text-white shadow-neo hover:bg-rep-navy-light"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function LearningPathUnit({
  unit,
  unitNumber,
  selectedNodeId,
  onSelectNode,
  onStartSession,
  onOpenChest,
}: LearningPathUnitProps) {
  const { level, isComingSoon, isUnlocked, isCompleted, nodes } = unit;
  // Alternate the mascot side per unit; the path winds away from it.
  const isMascotOnLeft = unitNumber % 2 === 1;
  const direction = isMascotOnLeft ? 1 : -1;
  const lessonNodes = nodes.filter((node) => node.kind === "lesson");
  const doneSteps = nodes.filter((node) => node.kind !== "chest" && node.status === "completed").length;
  const totalSteps = nodes.filter((node) => node.kind !== "chest").length;
  const isDimmed = isComingSoon || !isUnlocked;

  return (
    <section aria-labelledby={`unit-${level.id}`} className="space-y-6">
      <header
        className={`flex items-center justify-between gap-4 rounded-2xl border-2 p-4 sm:p-5 ${
          isDimmed ? "border-slate-300 bg-slate-100" : "border-rep-navy bg-rep-navy text-white shadow-neo"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`font-brand text-[11px] font-bold uppercase tracking-widest ${isDimmed ? "text-slate-400" : "text-rep-gold"}`}
          >
            {STRINGS.path.unitLabel(unitNumber, level.sphereLabel)}
          </p>
          <h2
            id={`unit-${level.id}`}
            className={`font-brand text-xl font-bold leading-tight ${isDimmed ? "text-slate-500" : "text-white"}`}
          >
            {level.title}
          </h2>
          <p className={`mt-0.5 text-xs ${isDimmed ? "text-slate-400" : "text-slate-300"}`}>{level.subtitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {isCompleted && (
              <span className="rounded bg-rep-emerald px-1.5 text-[10px] font-bold text-white">{STRINGS.path.levelCompleted}</span>
            )}
            {isComingSoon && (
              <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-500">{STRINGS.path.comingSoon}</span>
            )}
            {!isComingSoon && !isCompleted && (
              <span
                className={`rounded px-1.5 text-[10px] font-bold ${isUnlocked ? "bg-white/10 text-rep-gold" : "bg-slate-200 text-slate-500"}`}
              >
                {STRINGS.path.steps(doneSteps, totalSteps)}
              </span>
            )}
          </div>
        </div>
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${
            isDimmed ? "bg-slate-200 grayscale" : "bg-white/10"
          }`}
          aria-hidden="true"
        >
          {level.icon}
        </span>
      </header>

      <div className="relative">
        <div
          className={`pointer-events-none absolute top-16 flex w-28 flex-col items-center gap-1 ${isMascotOnLeft ? "left-0" : "right-0"}`}
        >
          {!isComingSoon && (
            <p className="rounded-xl border-2 border-rep-navy bg-white px-2 py-1.5 text-center text-[11px] font-semibold leading-snug text-rep-navy shadow-neo">
              {level.mascotTip}
            </p>
          )}
          <Mascot mood={isDimmed ? "sleepy" : "happy"} className="h-36 w-28" />
        </div>

        {isComingSoon ? (
          <div className="flex flex-col items-center gap-6 py-2" aria-hidden="true">
            {Array.from({ length: GHOST_NODE_COUNT }, (_, i) => (
              <span
                key={i}
                data-testid="ghost-node"
                className="block h-[72px] w-[72px] rounded-full border-2 border-dashed border-slate-300 bg-slate-100"
                style={{ transform: `translateX(${WINDING_OFFSETS[i] * direction}px)` }}
              />
            ))}
          </div>
        ) : (
          <ol className="flex flex-col items-center gap-8 py-2">
            {nodes.map((node, i) => {
              const isSelected = node.id === selectedNodeId;
              const lessonNumber = lessonNodes.indexOf(node) + 1;
              const size = node.kind === "challenge" ? "h-20 w-20" : "h-[72px] w-[72px]";
              return (
                <li key={node.id} className="flex w-full flex-col items-center">
                  <div
                    className="relative"
                    style={{ transform: `translateX(${WINDING_OFFSETS[i % WINDING_OFFSETS.length] * direction}px)` }}
                  >
                    {node.status === "current" && (
                      <span
                        className="pointer-events-none absolute inset-0 animate-pulse-ring rounded-full"
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectNode(isSelected ? null : node.id)}
                      aria-label={STRINGS.path.nodeLabel(node.title, STRINGS.path.status[node.status])}
                      aria-expanded={isSelected}
                      aria-controls={isSelected ? `popover-${node.id}` : undefined}
                      className={`civic-btn relative flex items-center justify-center rounded-full border-2 ${size} ${NODE_STYLES[node.status]}`}
                    >
                      <NodeIcon node={node} />
                      {/* Inside the button so the callout is clickable too */}
                      {node.status === "current" && (
                        <span
                          className="absolute -top-7 left-1/2 z-10 animate-bob whitespace-nowrap rounded-lg border-2 border-rep-navy bg-white px-2.5 py-0.5 font-brand text-xs font-bold uppercase tracking-wider text-rep-navy shadow-neo"
                          aria-hidden="true"
                        >
                          {STRINGS.path.play}
                        </span>
                      )}
                    </button>
                  </div>
                  {isSelected && (
                    <NodePopover
                      node={node}
                      lessonNumber={lessonNumber}
                      lessonCount={lessonNodes.length}
                      onStartSession={onStartSession}
                      onOpenChest={onOpenChest}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
