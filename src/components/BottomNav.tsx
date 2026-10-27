import { STRINGS } from "@/data/strings";

/** Home views switched by the bottom bar on mobile (desktop shows both side by side). */
export type HomeTab = "path" | "profile";

interface BottomNavProps {
  activeTab: HomeTab;
  onSelectTab: (tab: HomeTab) => void;
  onStartSwipe: () => void;
  /** Absent until the client knows today's date. */
  onOpenTermOfDay?: () => void;
  isTermOfDayPending: boolean;
  onOpenGlossary: () => void;
}

interface NavItemProps {
  icon: string;
  label: string;
  onClick?: () => void;
  ariaLabel?: string;
  isActive?: boolean;
  hasBadge?: boolean;
}

function NavItem({ icon, label, onClick, ariaLabel, isActive, hasBadge = false }: NavItemProps) {
  return (
    <li className="flex-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        aria-label={ariaLabel}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 font-brand text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50 ${
          isActive ? "bg-rep-navy text-rep-gold" : "text-rep-navy hover:bg-slate-100"
        }`}
      >
        <span className="text-lg leading-none" aria-hidden="true">
          {icon}
        </span>
        <span className="leading-tight">{label}</span>
        {hasBadge && (
          <span
            className="absolute right-[calc(50%-18px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-rep-crimson"
            aria-hidden="true"
          />
        )}
      </button>
    </li>
  );
}

/**
 * Mobile-only bottom bar: path, quick mode, term of the day, glossary and profile.
 * `transform-gpu` gives it its own compositing layer, so it stays pinned during momentum scrolling.
 */
export default function BottomNav({
  activeTab,
  onSelectTab,
  onStartSwipe,
  onOpenTermOfDay,
  isTermOfDayPending,
  onOpenGlossary,
}: BottomNavProps) {
  const labels = STRINGS.bottomNav;
  return (
    <nav
      aria-label={labels.label}
      className="fixed inset-x-0 bottom-0 z-30 transform-gpu border-t-2 border-rep-navy bg-white px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1 lg:hidden"
    >
      <ul className="mx-auto flex max-w-xl gap-1">
        <NavItem icon="🗺️" label={labels.path} isActive={activeTab === "path"} onClick={() => onSelectTab("path")} />
        <NavItem icon="⚡" label={labels.quickMode} onClick={onStartSwipe} />
        <NavItem
          icon="☀️"
          label={labels.termOfDay}
          ariaLabel={isTermOfDayPending ? labels.termOfDayPending : undefined}
          onClick={onOpenTermOfDay}
          hasBadge={isTermOfDayPending}
        />
        <NavItem icon="📖" label={labels.glossary} onClick={onOpenGlossary} />
        <NavItem icon="👤" label={labels.profile} isActive={activeTab === "profile"} onClick={() => onSelectTab("profile")} />
      </ul>
    </nav>
  );
}
