import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { STRINGS } from "@/data/strings";
import type { GlossaryTerm } from "@/types/glossary";
import GlossaryText from "./GlossaryText";

const veto: GlossaryTerm = {
  id: "veto",
  term: "Veto",
  category: "legislation",
  shortDefinition: "Recusa do chefe do Executivo a um projeto.",
  practicalExample: "O prefeito veta um trecho da lei.",
  constitutionalArticle: "Art. 66 da CF/88",
  aliases: [],
};

describe("GlossaryText", () => {
  it("keeps the text intact and turns glossary terms into buttons", () => {
    render(
      <p>
        <GlossaryText text="O veto pode ser derrubado." terms={[veto]} />
      </p>,
    );
    expect(screen.getByRole("paragraph")).toHaveTextContent("O veto pode ser derrubado.");
    expect(screen.getByRole("button", { name: "veto" })).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens the term's definition with Capi and returns focus when closed", async () => {
    render(<GlossaryText text="O veto pode ser derrubado." terms={[veto]} />);
    const link = screen.getByRole("button", { name: "veto" });
    await userEvent.click(link);

    const dialog = screen.getByRole("dialog", { name: "Veto" });
    expect(dialog).toHaveTextContent(STRINGS.glossary.capiExplains);
    expect(dialog).toHaveTextContent(veto.shortDefinition);
    expect(dialog).toHaveTextContent(veto.practicalExample);
    expect(dialog).toHaveTextContent(veto.constitutionalArticle as string);

    await userEvent.click(screen.getByRole("button", { name: STRINGS.glossary.confirm }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(link).toHaveFocus();
  });

  it("renders plain text when no term is mentioned", () => {
    render(<GlossaryText text="Nada para destacar." terms={[veto]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
