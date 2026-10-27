import Image, { getImageProps } from "next/image";
import { STRINGS } from "@/data/strings";

interface MascotProps {
  /** happy: animated wave (reserved for the learning path); still: static image; sleepy: locked levels. */
  mood?: "happy" | "still" | "sleepy";
  className?: string;
}

// Intrinsic size of the assets in public/mascot (2x the largest display size).
const MASCOT_SIZE = { width: 140, height: 180 } as const;

/** The Engrenum capybara: still image by default, waving (animated) or napping (grayscale, for locked levels). */
export default function Mascot({ mood = "still", className = "" }: MascotProps) {
  if (mood === "still") {
    return (
      <span className={`inline-block ${className}`}>
        <Image
          src="/mascot/capybara.webp"
          alt={STRINGS.mascot.still}
          {...MASCOT_SIZE}
          unoptimized
          className="h-full w-full object-contain"
        />
      </span>
    );
  }

  if (mood === "sleepy") {
    return (
      <span className={`relative inline-block ${className}`}>
        <Image
          src="/mascot/capybara-sleepy.webp"
          alt={STRINGS.mascot.sleepy}
          {...MASCOT_SIZE}
          unoptimized
          className="h-full w-full object-contain opacity-70 grayscale"
        />
        <span className="absolute right-0 top-0 font-brand text-sm font-bold text-slate-400" aria-hidden="true">
          z<span className="align-super text-[10px]">z</span>
        </span>
      </span>
    );
  }

  // Animated WebP, with a still fallback for people who prefer reduced motion.
  const { props } = getImageProps({
    src: "/mascot/capybara-wave.webp",
    alt: STRINGS.mascot.waving,
    ...MASCOT_SIZE,
    unoptimized: true,
  });

  return (
    <picture className={`inline-block ${className}`}>
      <source media="(prefers-reduced-motion: reduce)" srcSet="/mascot/capybara.webp" />
      <img {...props} alt={props.alt} className="h-full w-full object-contain" />
    </picture>
  );
}
