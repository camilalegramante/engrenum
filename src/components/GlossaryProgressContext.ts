import { createContext } from "react";

export interface GlossaryProgressValue {
  discoveredTermIds: string[];
  masteredTermIds: string[];
  /** Records that the player read a term; returns the XP awarded (0 when already in the album). */
  onDiscoverTerm: (termId: string) => number;
}

/** Album state for glossary views; null outside the app (nothing is tracked or rewarded). */
export const GlossaryProgressContext = createContext<GlossaryProgressValue | null>(null);
