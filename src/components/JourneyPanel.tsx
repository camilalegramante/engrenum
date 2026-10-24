import { getRankProgress } from "@/data/levels";
import { STRINGS } from "@/data/strings";
import { hasPlayedToday, type Progress } from "@/lib/progress";

interface JourneyPanelProps {
  progress: Progress;
}

export default function JourneyPanel({ progress }: JourneyPanelProps) {
  const rank = getRankProgress(progress.xp);
  const isMissionDone = hasPlayedToday(progress);

  return (
    <aside aria-label={STRINGS.journey.label} className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
      <section className="rounded-2xl border-2 border-rep-navy bg-white p-4 shadow-neo">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rep-gold bg-rep-gold/20 font-brand font-bold text-rep-gold"
            aria-hidden="true"
          >
            ★
          </span>
          <h2 className="font-brand text-[11px] font-bold uppercase tracking-wider text-rep-muted">{STRINGS.journey.rankHeading}</h2>
        </div>
        <p className="mt-2 text-sm font-bold leading-snug text-rep-navy lg:text-base">{rank.name}</p>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full border border-rep-border bg-slate-100"
          role="progressbar"
          aria-label={STRINGS.journey.rankProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={rank.percent}
        >
          <div className="h-full bg-rep-gold transition-all duration-500" style={{ width: `${rank.percent}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-rep-muted">
          {rank.nextName ? STRINGS.journey.xpToNextRank(rank.xpToNext, rank.nextName) : STRINGS.journey.topRank}
        </p>
      </section>

      <section className="rounded-2xl border-2 border-rep-navy bg-white p-4 shadow-neo">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50"
            aria-hidden="true"
          >
            🔥
          </span>
          <h2 className="font-brand text-[11px] font-bold uppercase tracking-wider text-rep-muted">{STRINGS.journey.missionHeading}</h2>
        </div>
        <p className="mt-2 text-sm font-bold leading-snug text-rep-navy lg:text-base">{STRINGS.journey.mission}</p>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full border border-rep-border bg-slate-100"
          role="progressbar"
          aria-label={STRINGS.journey.missionProgress}
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={isMissionDone ? 1 : 0}
        >
          <div className={`h-full bg-rep-emerald transition-all duration-500 ${isMissionDone ? "w-full" : "w-0"}`} />
        </div>
        <p className="mt-1.5 text-[11px] leading-snug text-rep-muted">
          {isMissionDone ? STRINGS.journey.missionDone(progress.streak) : STRINGS.journey.missionPending}
        </p>
      </section>
    </aside>
  );
}
