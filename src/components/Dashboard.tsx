import { LEVELS, getRankByXp } from "@/data/levels";
import type { Level } from "@/types/quiz";

interface DashboardProps {
  xp: number;
  completedLevelIds: string[];
  onStartLevel: (level: Level) => void;
  levels?: Level[];
}

export default function Dashboard({ xp, completedLevelIds, onStartLevel, levels = LEVELS }: DashboardProps) {
  const isAvailable = levels.map(
    (level, i) => level.questions.length > 0 && (i === 0 || completedLevelIds.includes(levels[i - 1].id)),
  );
  const focusedIndex = levels.findIndex((level, i) => isAvailable[i] && !completedLevelIds.includes(level.id));

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-6">
      {/* Hero banner with modernist arches */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-rep-navy bg-rep-navy p-6 text-white shadow-neo">
        <svg
          className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 opacity-10"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="4" />
          <path d="M 10 190 Q 100 20 190 190" stroke="white" strokeWidth="5" />
          <path d="M 40 190 Q 100 70 160 190" stroke="white" strokeWidth="3" />
        </svg>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded border border-white/20 bg-white/10 px-2.5 py-1 font-brand text-xs uppercase tracking-widest text-rep-gold">
            Guia Constitucional Interativo
          </div>
          <h1 className="font-brand text-2xl font-bold tracking-tight text-white sm:text-3xl">Quem Manda Aqui?</h1>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-slate-300">
            Domine as fronteiras entre Prefeito, Governador, Presidente e o Poder Legislativo brasileiro.
          </p>

          <div className="flex items-center gap-3 pt-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rep-gold bg-rep-gold/20 font-brand text-lg font-bold text-rep-gold"
              aria-hidden="true"
            >
              ★
            </div>
            <div>
              <p className="font-brand text-[11px] uppercase tracking-wider text-slate-400">Título Cívico Atual</p>
              <p className="text-sm font-bold text-white">{getRankByXp(xp)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Federative trail */}
      <section className="space-y-4 pt-2">
        <h2 className="flex items-center gap-2 font-brand text-xs font-bold uppercase tracking-widest text-rep-muted">
          <span>Trilha Federativa</span>
          <span className="h-px flex-1 bg-rep-border" />
        </h2>

        <ol className="space-y-4">
          {levels.map((level, i) => {
            const available = isAvailable[i];
            const isFocused = i === focusedIndex;
            const isCompleted = completedLevelIds.includes(level.id);
            const isComingSoon = level.questions.length === 0;

            return (
              <li key={level.id}>
                <button
                  type="button"
                  onClick={() => onStartLevel(level)}
                  disabled={!available}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left transition-all sm:p-5 ${
                    available
                      ? "civic-btn cursor-pointer bg-white shadow-neo hover:bg-slate-50"
                      : "cursor-not-allowed border-slate-300 bg-slate-100/70 opacity-60"
                  } ${isFocused ? "animate-pulse-ring border-rep-gold" : available ? "border-rep-navy" : ""}`}
                >
                  <div className="flex items-center gap-3.5 sm:gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl ${
                        available ? "bg-rep-navy text-white" : "bg-slate-200 text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      {available ? level.icon : "🔒"}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-brand text-[10px] font-bold uppercase tracking-wider ${isFocused ? "text-rep-gold" : "text-rep-muted"}`}
                        >
                          {level.sphereLabel}
                        </span>
                        {isFocused && (
                          <span className="rounded bg-rep-gold/20 px-1.5 text-[10px] font-bold text-rep-navy">EM FOCO</span>
                        )}
                        {isCompleted && (
                          <span className="rounded bg-emerald-100 px-1.5 text-[10px] font-bold text-rep-emerald-dark">
                            ✓ CONCLUÍDO
                          </span>
                        )}
                        {isComingSoon && (
                          <span className="rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-500">EM BREVE</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold leading-snug text-rep-navy sm:text-base">{level.title}</h3>
                      <p className="mt-0.5 line-clamp-1 text-xs text-rep-muted">{level.subtitle}</p>
                    </div>
                  </div>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold ${
                      available
                        ? "border-rep-navy bg-rep-gold text-rep-navy"
                        : "border-slate-400 bg-slate-200 text-slate-400"
                    }`}
                    aria-hidden="true"
                  >
                    →
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="pb-[env(safe-area-inset-bottom)] pt-2 text-center text-xs text-rep-muted">
        Conteúdo educativo baseado na Constituição Federal de 1988.
      </p>
    </main>
  );
}
