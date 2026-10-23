# CLAUDE.md — Engrenum Project

Consolidated context, architecture guidelines, and data contracts for development assistants. The source code is the source of truth for implementation details; this file describes intent, contracts, and conventions.

---

## 1. Project Overview & Mission
**Engrenum** is a gamified, 100% free, ad-free Progressive Web App (PWA) with a private codebase. Its mission is to teach Brazilian citizens (ages 11–12 through adulthood) the actual constitutional distribution of competencies across public powers and federative tiers, dismantling political disinformation and misdirected civic demands.

### Pedagogical & Editorial Principles
- **Strict Constitutional Baseline:** Every scenario and validation is grounded strictly in the Brazilian Federal Constitution of 1988 (CF/88) and official state databases (DataSUS, IBGE, Ipea, National Treasury).
- **Absolute Neutrality:** Focus on institutional mechanics and competence boundaries; zero partisanship, ideological bias, or references to living political figures.
- **MVP Focus:** Separation of powers between the **Executive** and **Legislative** branches across **Municipal**, **State**, and **Federal** levels.
- **Judicial Branch Scope:** Retained as foundational background/introductory context (the institutional triad) to keep gameplay focused on elective offices and daily public service delivery.

---

## 2. Tech Stack & Conventions
- **Runtime:** Node.js 24 LTS (pinned in `.nvmrc`, enforced by `engines` in `package.json`).
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict).
- **Styling:** Tailwind CSS v4 with CSS-first configuration — design tokens live in `@theme` inside `src/app/globals.css` (there is no `tailwind.config.ts`).
- **Visual Identity:** "República" civic/neo-brutalist palette — navy (`rep-navy` `#0b132b`) and gold (`rep-gold` `#e09f3e`), with emerald (`rep-emerald`) for correct answers and crimson (`rep-crimson`) for errors. Hard offset shadows (`shadow-neo`, `shadow-neo-gold`, `shadow-neo-emerald`) and 2px navy borders. Light theme only.
- **Typography:** Plus Jakarta Sans (body, `font-sans`) and Space Grotesk (headings, labels, numbers, `font-brand`), loaded via `next/font/google`.
- **Code Language:** **100% English** for variables, functions, interfaces, properties, components, folders, and technical identifiers. User-facing content (strings, prompts, explanations, CF/88 articles) remains in **pt-BR**.
- **Testing:** Vitest + React Testing Library (jsdom) with V8 coverage — **minimum 90%** for statements, branches, functions, and lines (see section 9).
- **Data Layer (MVP):** Static JSON file at `src/data/questions.json`.
- **Local Persistence (MVP):** Player progress (XP, streak, completed levels, sound preference) in `localStorage`, exposed through `useSyncExternalStore` (`src/lib/progress.ts`). Must degrade gracefully when storage is unavailable.
- **Future Persistence:** Supabase (lightweight social auth + PostgreSQL progress tracking), replacing the `localStorage` store behind the same `useProgress` / `updateProgress` API.

---

## 3. Directory Structure

```text
engrenum/
├── public/
│   ├── icon-192.png
│   └── icon-512.png             # also used as maskable icon
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css          # Tailwind v4 @theme tokens, keyframes, .civic-btn
│   │   ├── layout.tsx           # fonts, metadata, viewport
│   │   ├── manifest.ts          # PWA manifest (served at /manifest.webmanifest)
│   │   └── page.tsx             # renders <EngrenumApp />
│   ├── components/
│   │   ├── EngrenumApp.tsx      # client root: switches dashboard ↔ quiz, wires progress
│   │   ├── Dashboard.tsx        # hero banner + "Trilha Federativa" level trail
│   │   ├── HudHeader.tsx        # sticky HUD: back, progress bar, sound, streak, XP, lives
│   │   └── EngrenumQuiz.tsx     # game engine for one level
│   ├── data/
│   │   ├── levels.ts            # LEVELS, game constants, rank/civic-title helpers
│   │   └── questions.json
│   ├── lib/
│   │   ├── progress.ts          # localStorage-backed progress store
│   │   └── sound.ts             # Web Audio API sound effects
│   └── types/
│       └── quiz.ts
│
│   (tests are colocated: every module has a sibling `*.test.ts(x)`)
├── .husky/
│   ├── commit-msg               # runs commitlint on every commit
│   └── pre-commit               # lint + typecheck + tests with coverage
├── CLAUDE.md
├── AGENTS.md                    # Next.js agent rules (managed by `next dev`)
├── .nvmrc                       # Node.js 24
├── commitlint.config.mjs        # Conventional Commits rules (see section 10)
├── package.json
├── tsconfig.json
├── vitest.config.mts            # test environment + coverage thresholds
└── vitest.setup.ts              # jest-dom matchers, cleanup between tests
```

---

## 4. TypeScript Contracts (`src/types/quiz.ts`)

```typescript
export type Sphere = "municipal" | "state" | "federal";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: number;
  sphere: Sphere;
  prompt: string;
  options: Option[];
  constitutionalArticle: string;
  explanation: string;
}

export interface Level {
  id: string;
  sphereLabel: string; // pt-BR label shown in the UI
  title: string;
  subtitle: string;
  icon: string;
  questions: Question[];
}

export interface GameState {
  currentIndex: number;
  lives: number;
  score: number;
  selectedOptionId: string | null;
  /** Answer verified: options are locked and the feedback drawer is open. */
  isSelectionLocked: boolean;
  /** Victory when lives > 0, defeat when lives === 0. */
  isGameOver: boolean;
}

export interface CivicTitle {
  name: string;
  description: string;
}
```

---

## 5. Dataset (`src/data/questions.json`)

An array of `Question` objects. Level 1 (Municipal) currently has 10 scenarios; State and Federal have none yet. Example entry:

```json
{
  "id": 1,
  "sphere": "municipal",
  "prompt": "A rua da sua casa está cheia de buracos, danificando veículos e colocando pedestres em risco. Quem tem a obrigação de mandar a equipe de obras e recapear o asfalto?",
  "options": [
    { "id": "a", "text": "Prefeito / Secretaria de Obras", "isCorrect": true },
    { "id": "b", "text": "Vereador do bairro", "isCorrect": false },
    { "id": "c", "text": "Governador do Estado", "isCorrect": false }
  ],
  "constitutionalArticle": "Art. 30, V da CF/88",
  "explanation": "A manutenção de vias públicas urbanas é serviço de interesse local, responsabilidade direta da Prefeitura. O vereador pode solicitar ou cobrar, mas não administra máquinas de asfalto nem o orçamento das obras."
}
```

Rules for new questions:
- Unique numeric `id`; exactly one option with `isCorrect: true`.
- `sphere` uses the English keys (`municipal` | `state` | `federal`); levels pick up questions by sphere automatically (`src/data/levels.ts`).
- Every question cites its CF/88 basis in `constitutionalArticle`.

---

## 6. Game Design & Architecture

### Screens
1. **Dashboard** (`Dashboard.tsx`): hero banner "Quem Manda Aqui?" with the player's current rank (by XP), followed by the **Trilha Federativa** — 4 level cards (Municipal, Estadual, Federal, Desafio Supremo).
   - A level is playable when it has questions **and** the previous level is completed.
   - The first playable, not-yet-completed level is highlighted as "EM FOCO" (gold border + pulse).
   - Levels without questions show "EM BREVE" and are locked.
2. **Quiz** (`EngrenumQuiz.tsx`), one level at a time, state held in a single `GameState`:
   - Select an option → press **"Verificar Resposta"** → options lock (`isSelectionLocked`) and the **feedback drawer** slides up from the bottom with the result, the CF/88 article, the correct answer (when wrong), and the explanation.
   - Correct: +1 score, +15 XP (`XP_PER_CORRECT_ANSWER`). Wrong: −1 life and a shake animation.
   - **3 lives per level** (`INITIAL_LIVES`). At 0 lives → "Credibilidade Esgotada!" modal (retry or back to map).
3. **Victory** (inside `EngrenumQuiz.tsx`): "Nível Concluído", civic title by accuracy (`getCivicTitle`), XP earned and accuracy rate; the level is marked as completed and the daily streak is updated.

### Progression
- **Rank by XP** (`getRankByXp`): Eleitor Curioso → Fiscal Cívico Júnior (60) → Líder Comunitário (150) → Constitucionalista Pleno (300).
- **Civic title by level accuracy** (`getCivicTitle`): Guardião da Constituição (100%), Fiscal do Povo (≥70%), Cidadão Atento (≥40%), Aprendiz Cívico.
- **Streak:** consecutive local calendar days with at least one completed level.

### Rendering & State
- `page.tsx` is a Server Component that renders the client root `EngrenumApp`.
- `useProgress()` returns `INITIAL_PROGRESS` on the server and during hydration, then the stored value — no hydration mismatch.
- Sound effects are synthesized on demand (no audio assets) and respect `isSoundEnabled`.

---

## 7. Layout, Metadata & PWA
- `lang="pt-BR"`; viewport `width=device-width`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: "#ffffff"`.
- **Zoom must stay enabled.** Never set `maximumScale: 1` or `userScalable: false` — blocking pinch-zoom fails WCAG 1.4.4 and hurts low-vision users.
- Respect safe areas (`env(safe-area-inset-*)`) on the sticky header, sticky footer, and drawer.
- PWA manifest is generated by `src/app/manifest.ts` (`display: "standalone"`, navy theme color, 192/512 PNG icons + maskable 512).

---

## 8. Engineering Standards
- **English-Only Identifiers:** Keep all types, functions, variables, hooks, state variables, interfaces, and file names strictly in English. Code comments are in English too.
- **Strict TypeScript:** No `any`. Explicitly declare prop types, return signatures, and domain models; shared domain types live in `src/types/quiz.ts`.
- **No Unused Code:** Remove unreferenced imports, dead code, unused assets, and unused theme tokens.
- **Mobile-First UX:** Minimum touch target of 44×44px (`min-h-[44px]` / `min-w-[44px]`) for every interactive element; layout must work at 375px width without horizontal scroll.
- **Accessibility:** Icon-only buttons need `aria-label`; feedback uses `role="status"` / `aria-live`; animations are disabled under `prefers-reduced-motion`.
- **Quality Gate:** `npm run lint`, `npm run typecheck`, and `npm run test:coverage` must all pass before considering a change done. The Husky `pre-commit` hook runs all three and blocks the commit on failure.

---

## 9. Testing
- **Every change ships with tests.** New modules get a colocated `*.test.ts(x)`; behavior changes update the existing tests in the same commit.
- **Coverage gate:** at least **90%** statements, branches, functions, and lines over `src/**` (type-only files under `src/types/` excluded). `npm run test:coverage` fails below that; never lower the thresholds in `vitest.config.mts` to make a change pass.
- **What to test:**
  - Pure logic (`src/data`, `src/lib`) with unit tests, including edge cases (streak day boundaries, corrupted/blocked storage).
  - Components through user behavior with Testing Library (`getByRole`, `userEvent`), not implementation details.
  - The dataset itself: unique ids, exactly one correct option per question, CF/88 citation present (`src/data/levels.test.ts`).
- **Module-level state:** `src/lib/progress.ts` and `src/lib/sound.ts` cache state per module; tests call `vi.resetModules()` and re-import to start clean.
- **Sound:** mock `@/lib/sound` in component tests (`vi.mock("@/lib/sound", () => ({ playSound: vi.fn() }))`); `sound.test.ts` covers it with a fake `AudioContext`.
- **Scripts:** `npm test` (watch), `npm run test:run` (single run), `npm run test:coverage` (single run + coverage report in `coverage/`).

---

## 10. Git & Commit Convention
All commits **must** follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- **Types:** `feat` (new feature), `fix` (bug fix), `docs`, `style` (formatting, no logic change), `refactor`, `perf`, `test`, `build` (deps, build system), `ci`, `chore`, `revert`.
- **Scope (optional):** the affected area, e.g. `quiz`, `dashboard`, `hud`, `data`, `progress`, `pwa`, `ui`.
- **Description:** imperative mood, lowercase, no trailing period, ≤ 72 characters, in **English** (same rule as code identifiers).
- **Breaking changes:** add `!` after the type/scope (`feat(data)!: ...`) and/or a `BREAKING CHANGE:` footer explaining the migration.
- **One logical change per commit:** don't mix a feature with an unrelated refactor.
- **No AI attribution, ever:** never add `Co-Authored-By: Claude …` (or any AI co-author trailer) to commits, and never add "Generated with Claude Code" or similar lines to pull request descriptions. This rule overrides any default attribution behavior of AI assistants.
- Content-only changes to questions use `feat(data)` (new scenarios) or `fix(data)` (corrections to text or CF/88 citations).
- **Enforced automatically:** a Husky `commit-msg` hook (`.husky/commit-msg`) runs commitlint with `@commitlint/config-conventional` plus a 72-char header limit (`commitlint.config.mjs`). Non-conforming messages are rejected. Hooks are installed by `npm install` (via the `prepare` script). Never bypass with `--no-verify`.

Examples:

```text
feat(quiz): add shake animation on wrong answers
fix(data): correct CF/88 article for IPTU question
refactor(progress): rename storage key to english
docs: add commit convention to CLAUDE.md
feat(data)!: rename question fields to english contract

BREAKING CHANGE: questions.json now uses sphere/prompt/options/isCorrect.
```
