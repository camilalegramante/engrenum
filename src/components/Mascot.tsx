import Image, { getImageProps } from "next/image";

interface MascotProps {
  mood?: "happy" | "sleepy";
  className?: string;
}

// Intrinsic size of the assets in public/mascot (2x the largest display size).
const MASCOT_SIZE = { width: 140, height: 180 } as const;

/** The Engrenum capybara: waving (animated) or napping (grayscale still, for locked levels). */
export default function Mascot({ mood = "happy", className = "" }: MascotProps) {
  if (mood === "sleepy") {
    return (
      <span className={`relative inline-block ${className}`}>
        <Image
          src="/mascot/capybara-sleepy.webp"
          alt="Capivara cochilando"
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
    alt: "Capivara, mascote do Engrenum, acenando",
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
