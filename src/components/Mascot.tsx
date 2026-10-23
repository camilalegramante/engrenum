interface MascotProps {
  mood?: "happy" | "sleepy";
  className?: string;
}

const TOOTH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/** Engrenito: the Engrenum gear mascot, drawn in the navy/gold palette. */
export default function Mascot({ mood = "happy", className = "" }: MascotProps) {
  const isSleepy = mood === "sleepy";
  const bodyClass = isSleepy ? "fill-slate-200 stroke-slate-400" : "fill-rep-gold stroke-rep-navy";
  const inkClass = isSleepy ? "stroke-slate-400" : "stroke-rep-navy";
  const inkFillClass = isSleepy ? "fill-slate-400" : "fill-rep-navy";

  return (
    <svg
      viewBox="0 0 124 132"
      className={className}
      role="img"
      aria-label={isSleepy ? "Engrenito cochilando" : "Engrenito, o mascote do Engrenum"}
    >
      <ellipse cx="60" cy="124" rx="34" ry="6" className="fill-rep-navy" opacity="0.12" />

      <g transform="translate(60 64)">
        {TOOTH_ANGLES.map((angle) => (
          <rect
            key={angle}
            x="-9"
            y="-50"
            width="18"
            height="18"
            rx="4"
            strokeWidth="4"
            className={bodyClass}
            transform={`rotate(${angle})`}
          />
        ))}
        <circle r="40" strokeWidth="4" className={bodyClass} />
      </g>

      <rect x="38" y="104" width="16" height="12" rx="6" className={inkFillClass} />
      <rect x="66" y="104" width="16" height="12" rx="6" className={inkFillClass} />

      {isSleepy ? (
        <>
          <path d="M40 60 q7 6 14 0" fill="none" strokeWidth="4" strokeLinecap="round" className={inkClass} />
          <path d="M66 60 q7 6 14 0" fill="none" strokeWidth="4" strokeLinecap="round" className={inkClass} />
          <circle cx="60" cy="78" r="3.5" className={inkFillClass} />
          <text x="96" y="22" className="fill-slate-400 font-brand text-[16px] font-bold">
            z
          </text>
          <text x="108" y="10" className="fill-slate-400 font-brand text-[11px] font-bold">
            z
          </text>
        </>
      ) : (
        <>
          <ellipse cx="47" cy="58" rx="8" ry="10" fill="white" strokeWidth="3" className={inkClass} />
          <ellipse cx="73" cy="58" rx="8" ry="10" fill="white" strokeWidth="3" className={inkClass} />
          <circle cx="49" cy="60" r="4" className={inkFillClass} />
          <circle cx="75" cy="60" r="4" className={inkFillClass} />
          <circle cx="36" cy="74" r="5" className="fill-rep-gold-light" />
          <circle cx="84" cy="74" r="5" className="fill-rep-gold-light" />
          <path d="M47 76 q13 13 26 0" fill="none" strokeWidth="4" strokeLinecap="round" className={inkClass} />
          {/* Waving arm */}
          <path d="M99 62 q14 -10 12 -28" fill="none" strokeWidth="5" strokeLinecap="round" className={inkClass} />
          <circle cx="111" cy="31" r="7" strokeWidth="3" className={bodyClass} />
        </>
      )}
    </svg>
  );
}
