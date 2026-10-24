/** A campaign promise judged in the "Fato ou Fake Eleitoral" swipe game. */
export interface SwipeCard {
  id: number;
  /** Office the speaker is running for, e.g. "Candidato a Vereador". */
  speakerRole: string;
  statement: string;
  /** true when the promise fits the office's constitutional competences. */
  isLegitimate: boolean;
  constitutionalArticle: string;
  explanation: string;
}

/** Result of the last decision; null while the current card is undecided. */
export type SwipeFeedback = "correct" | "incorrect" | null;
