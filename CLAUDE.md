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
│   ├── icon-512.png             # also used as maskable icon
│   └── mascot/                  # capybara mascot: animated WebP + stills (see section 7)
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css          # Tailwind v4 @theme tokens, keyframes, .civic-btn
│   │   ├── layout.tsx           # fonts, metadata, viewport
│   │   ├── manifest.ts          # PWA manifest (served at /manifest.webmanifest)
│   │   └── page.tsx             # renders <EngrenumApp />
│   ├── components/
│   │   ├── EngrenumApp.tsx      # client root: path ↔ quiz, chest reward dialog, wires progress
│   │   ├── Dashboard.tsx        # home: journey panel + one LearningPathUnit per level
│   │   ├── LearningPathUnit.tsx # level banner, winding path of nodes, node popover, mascot
│   │   ├── JourneyPanel.tsx     # civic rank progress + daily mission cards
│   │   ├── Mascot.tsx           # capybara mascot (waving WebP / sleepy grayscale still)
│   │   ├── HudHeader.tsx        # sticky HUD: back, progress bar, sound, streak, XP, lives
│   │   └── EngrenumQuiz.tsx     # game engine for one QuizSession (lesson or challenge)
│   ├── data/
│   │   ├── levels.ts            # LEVELS + themed lessons, constants, rank/civic-title helpers
│   │   └── questions.json
│   ├── lib/
│   │   ├── path.ts              # buildPath(): levels + progress → path units/nodes with status
│   │   ├── progress.ts          # localStorage-backed progress store
│   │   └── sound.ts             # Web Audio API sound effects
│   └── types/
│       └── quiz.ts
│
│   (tests are colocated: every module has a sibling `*.test.ts(x)`)
├── design/
│   └── mascot/                  # capybara reference poses (480×620 PNG), reference sheet, palette — not shipped
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

export interface Lesson {
  id: string;
  title: string;
  questions: Question[];
}

export interface Level {
  id: string;
  sphereLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Short pt-BR line the mascot says next to this level's path. */
  mascotTip: string;
  lessons: Lesson[];
  /** Every question of the level; played together in the final challenge. */
  questions: Question[];
}

export type QuizSessionKind = "lesson" | "challenge";

/** One playable run of the quiz engine: a lesson or a level's final challenge. */
export interface QuizSession {
  id: string;
  kind: QuizSessionKind;
  levelId: string;
  title: string;
  questions: Question[];
}

export type PathNodeKind = "lesson" | "chest" | "challenge";

/**
 * completed: done (lessons and challenges stay replayable);
 * current: the next step to play;
 * available: unlocked side reward (an unopened chest);
 * locked: previous steps are still pending.
 */
export type PathNodeStatus = "completed" | "current" | "available" | "locked";

export interface PathNode {
  id: string;
  kind: PathNodeKind;
  title: string;
  status: PathNodeStatus;
  /** Present for lessons and challenges. */
  session?: QuizSession;
}

export interface PathUnit {
  level: Level;
  isComingSoon: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
  nodes: PathNode[];
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

export interface Rank {
  name: string;
  minXp: number;
}

export interface RankProgress {
  name: string;
  nextName: string | null;
  xpToNext: number;
  percent: number;
}
```

---

## 5. Dataset (`src/data/questions.json`)

An array of `Question` objects. Level 1 (Municipal) currently has 10 scenarios; State and Federal have none yet. Example entry:

```json
{
  "id": 1,
  "sphere": "municipal",
  "prompt": "A rua do seu bairro está cheia de buracos, danificando carros e colocando pedestres em risco. Quem tem o dever de mandar uma equipe tapar esses buracos?",
  "options": [
    { "id": "a", "text": "O vereador mais votado do bairro", "isCorrect": false },
    { "id": "b", "text": "Prefeito", "isCorrect": true },
    { "id": "c", "text": "Governador", "isCorrect": false },
    { "id": "d", "text": "Câmara de Vereadores", "isCorrect": false }
  ],
  "constitutionalArticle": "Art. 30, V da CF/88",
  "explanation": "A conservação de ruas e o tapa-buraco são serviços de interesse local, executados pela Prefeitura. Vereadores, sozinhos ou reunidos na Câmara, podem cobrar e fiscalizar, mas não comandam equipes nem contratam obras. O Governador cuida das rodovias estaduais, não das ruas da cidade."
}
```

Rules for new questions:
- Unique numeric `id`; exactly one option with `isCorrect: true`.
- `sphere` uses the English keys (`municipal` | `state` | `federal`); levels pick up questions by sphere automatically (`src/data/levels.ts`).
- Levels with themed lessons (e.g. Municipal) must list every new question id in one of their `lessons` (`pickQuestions([...])`); a test fails otherwise. Levels without themed lessons use `chunkIntoLessons`.
- Every question cites its CF/88 basis in `constitutionalArticle`.

Difficulty rules (the answer must never be obvious):
- **Neutral prompt:** describe the situation without naming the sphere, body, or office that answers it (no "creche *municipal*" when the answer is the municipal secretariat, no "equipe *de obras*" when the answer is the works department).
- **Four plausible alternatives:** distractors must be real, common confusions (Executive × Legislative, municipality × state × Union, who funds × who executes, decree × law), never absurd options.
- **No length or detail giveaway:** alternatives have similar length and specificity; the correct one must not be the only long, qualified, or "complete-sounding" option.
- **Vary the position** of the correct answer across the dataset.
- `src/data/levels.test.ts` enforces four alternatives, no correct-answer text inside the prompt, spread-out positions, and the correct option being the longest in at most 1/3 of the questions.

---

## 6. Game Design & Architecture

### Home: the learning path (`Dashboard.tsx`)
Inspired by language-learning apps (a winding path of steps, a mascot, rewards), but drawn in Engrenum's own navy/gold neo-brutalist identity — never copy another product's layout or art.
- **Journey panel** (`JourneyPanel.tsx`): civic rank with a progress bar to the next rank (`getRankProgress`) and the **daily mission** ("Complete 1 lição hoje", done when `lastPlayedDay` is today). Two cards side by side on mobile, sticky right column on desktop (`lg`).
- **One unit per level** (`LearningPathUnit.tsx`): a banner ("Nível N · Sphere", title, subtitle, `done/total ETAPAS`, "✓ CONCLUÍDO" or "EM BREVE"), then a **winding path** of round nodes, plus the **capybara mascot** (`Mascot.tsx`) beside it with the level's `mascotTip`. The mascot alternates sides per unit and the path winds away from it.
- **Path order per level** (`buildPath` in `src/lib/path.ts`): lessons in order → a **reward chest** after the 2nd lesson → the **Desafio final** (all questions of the level).
  - Lessons and the challenge are sequential: each unlocks when the previous one is completed. The first not-done step is `current` (navy node, pulse ring and a bobbing "JOGAR" callout).
  - The chest is a side reward: `available` once the lesson before it is done, it never blocks the next lesson, and opening it grants `CHEST_XP` (+20) once.
  - Completing the **Desafio final** completes the level (`completedLevelIds`), counts all its lessons as done, and unlocks the next level.
  - Levels without questions are "EM BREVE": dashed ghost nodes and a napping, grayscale capybara.
- **Node popover:** tapping a node toggles a card below it with title, details ("Lição 2 de 4 · 3 cenários") and the action ("Começar", "Jogar de novo", "Encarar desafio", "Refazer desafio", "Abrir baú"); locked nodes explain how to unlock.
- **Lessons** are hand-picked, themed groups of 2–3 questions defined in `src/data/levels.ts` (e.g. "Serviços do bairro"). Levels without themed lessons fall back to `chunkIntoLessons` (3 per lesson).

### Quiz (`EngrenumQuiz.tsx`)
Plays one `QuizSession` (a lesson or a challenge); state lives in a single `GameState`.
- Select an option → press **"Verificar Resposta"** → options lock (`isSelectionLocked`) and the **feedback drawer** slides up with the result, the CF/88 article, the correct answer (when wrong), and the explanation.
- Correct: +1 score, +15 XP (`XP_PER_CORRECT_ANSWER`). Wrong: −1 life and a shake animation.
- **3 lives per session** (`INITIAL_LIVES`). At 0 lives → "Credibilidade Esgotada!" dialog (retry or back to the path).
- **Victory:** lessons show "Lição Concluída" ("Lição perfeita!" at 100%); challenges show "Nível Concluído" with the civic title by accuracy (`getCivicTitle`). Both show XP earned and accuracy, then register the session (`registerSessionCompletion`) and update the streak.

### Progression
- **Rank by XP** (`RANKS`, `getRankProgress`): Eleitor Curioso (0) → Fiscal Cívico Júnior (60) → Líder Comunitário (150) → Constitucionalista Pleno (300).
- **Civic title by challenge accuracy** (`getCivicTitle`): Guardião da Constituição (100%), Fiscal do Povo (≥70%), Cidadão Atento (≥40%), Aprendiz Cívico.
- **Streak:** consecutive local calendar days with at least one completed lesson or challenge.
- **Stored progress** (`Progress`): `xp`, `streak`, `lastPlayedDay`, `completedLessonIds`, `completedLevelIds`, `openedChestIds`, `isSoundEnabled`.

### Rendering & State
- `page.tsx` is a Server Component that renders the client root `EngrenumApp`.
- `useProgress()` returns `INITIAL_PROGRESS` on the server and during hydration, then the stored value — no hydration mismatch.
- **Cache Components is enabled** (`next.config.ts`): never read the clock or randomness (`new Date()`, `Date.now()`, `Math.random()`) while prerendering. Client helpers that need "today" must bail out before reading the clock when the result can't depend on it (see `hasPlayedToday`), or run in event handlers.
- Sound effects are synthesized on demand (no audio assets) and respect `isSoundEnabled`.

---

## 7. Layout, Metadata & PWA
- `lang="pt-BR"`; viewport `width=device-width`, `initialScale: 1`, `viewportFit: "cover"`, `themeColor: "#ffffff"`.
- **Zoom must stay enabled.** Never set `maximumScale: 1` or `userScalable: false` — blocking pinch-zoom fails WCAG 1.4.4 and hurts low-vision users.
- Respect safe areas (`env(safe-area-inset-*)`) on the sticky header, sticky footer, and drawer.
- **Mascot assets** (`public/mascot/`), produced from a source video (crop → border flood-fill background removal → 10 fps @ 180 px tall → static body frozen from a reference frame → temporal stabilization → animated WebP):
  - `capybara-wave.webp`: seamless 1.5 s waving loop with alpha (~23 KB). Animated **WebP, not GIF**: GIF only has 1-bit transparency (jagged edges, no soft shadow) and is several times larger.
  - `capybara.webp`: still, eyes open; served instead of the animation under `prefers-reduced-motion: reduce` (via `<picture>`).
  - `capybara-sleepy.webp`: still, eyes closed; shown grayscale for locked / coming-soon levels.
  - Reference poses, palette and the generation guide live in `design/mascot/` (see its README); start new poses or animations from `capybara-neutral.png`.
  - Budget: keep the animated mascot ≤ 50 KB and stills ≤ 10 KB, 2× the largest display size, with `unoptimized` images (the optimizer must not touch animated WebP).
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
