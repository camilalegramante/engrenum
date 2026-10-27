"use client";

import { useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import GlossaryTermDialog from "@/components/GlossaryTermDialog";
import { GlossaryProgressContext } from "@/components/GlossaryProgressContext";
import type { GlossaryTerm } from "@/types/glossary";

interface OpenedTerm {
  term: GlossaryTerm;
  rewardXp: number;
}

interface GlossaryTermDialogControls {
  /** Opens the term (adding it to the album) with an optional extra reward, e.g. the term of the day. */
  openTerm: (term: GlossaryTerm, bonusXp?: number) => void;
  /** The open dialog, portaled to <body>; null when closed. */
  dialog: ReactNode;
}

/** Shared "open a glossary term" behavior: album discovery, reward and the dialog itself. */
export function useGlossaryTermDialog(): GlossaryTermDialogControls {
  const glossaryProgress = useContext(GlossaryProgressContext);
  const [opened, setOpened] = useState<OpenedTerm | null>(null);

  function openTerm(term: GlossaryTerm, bonusXp = 0) {
    const discoveryXp = glossaryProgress?.onDiscoverTerm(term.id) ?? 0;
    setOpened({ term, rewardXp: discoveryXp + bonusXp });
  }

  const dialog =
    opened &&
    createPortal(
      <GlossaryTermDialog
        term={opened.term}
        rewardXp={opened.rewardXp}
        isMastered={glossaryProgress?.masteredTermIds.includes(opened.term.id)}
        onClose={() => setOpened(null)}
      />,
      document.body,
    );

  return { openTerm, dialog };
}
