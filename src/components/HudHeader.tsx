interface HudHeaderProps {
  xp: number;
  streak: number;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  lives?: number;
  progressPercent?: number;
  onBack?: () => void;
}

export default function HudHeader({
  xp,
  streak,
  isSoundEnabled,
  onToggleSound,
  lives,
  progressPercent,
  onBack,
}: HudHeaderProps) {
  const isInLesson = progressPercent !== undefined;

  return (
    <header className="sticky top-0 z-30 w-full border-b-2 border-rep-navy bg-white px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="-ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-rep-navy transition hover:bg-slate-100"
              aria-label="Voltar ao mapa"
              title="Voltar ao mapa"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          ) : (
            <span className="flex min-h-[44px] items-center pr-1 text-xl" aria-hidden="true">
              ⚙️
            </span>
          )}
          <span
            className={`font-brand text-sm font-bold uppercase tracking-wider text-rep-navy ${onBack ? "hidden sm:inline-block" : ""}`}
          >
            Engrenum
          </span>
        </div>

        {isInLesson && (
          <div
            className="h-2.5 max-w-xs flex-1 overflow-hidden rounded-full border border-rep-border bg-slate-100"
            role="progressbar"
            aria-label="Progresso do nível"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progressPercent)}
          >
            <div className="h-full bg-rep-gold transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs font-bold sm:gap-2 sm:text-sm">
          <button
            type="button"
            onClick={onToggleSound}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-rep-slate transition hover:bg-slate-100"
            aria-label={isSoundEnabled ? "Desativar som" : "Ativar som"}
            aria-pressed={isSoundEnabled}
            title="Alternar som"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rep-border">
              {isSoundEnabled ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              )}
            </span>
          </button>

          {/* During a lesson on small screens, the streak gives its room to the progress bar */}
          <div
            className={`items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-amber-800 ${isInLesson ? "hidden sm:flex" : "flex"}`}
            title="Dias seguidos de foco cívico"
          >
            <span aria-hidden="true">🔥</span>
            <span className="font-brand">{streak}</span>
            <span className="sr-only">dias seguidos</span>
          </div>

          <div
            className="flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-rep-emerald-dark"
            title="Pontos de cidadania (XP)"
          >
            <span aria-hidden="true">🏛️</span>
            <span className="font-brand">{xp}</span>
            <span className="sr-only">pontos de XP</span>
          </div>

          {lives !== undefined && (
            <div
              className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rep-crimson"
              title="Fichas de credibilidade (vidas)"
            >
              <span aria-hidden="true">⚖️</span>
              <span className="font-brand">{lives}</span>
              <span className="sr-only">vidas restantes</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
