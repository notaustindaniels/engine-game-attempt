# Scenario Creator

A domain-agnostic scenario-editor web app in strict TypeScript, modeled 1:1 on the
Custom Scenarios editor of Ndemic Creations' *After Inc: Revival* — and re-skinnable
to any business niche without a single component change. Built per [spec.md](spec.md).

The same eleven-editor machine that describes a settlement holding out against
zombie infestations describes a wedding-photography studio holding out against
seasonal booking droughts and a saturated local market. Mechanics are shared;
language never leaks across domains.

## Quick start

```bash
npm ci
npm run dev                    # editor UI (theme/domain via query params, see below)
npm test                       # full Vitest suite
npm run build                  # tsc -b && vite build
npm run generate:example       # random business niche → /examples/<niche>-scenario.json
npm run generate:example -- craft-brewery   # or a specific niche
```

URL parameters: `?theme=after-inc|clean-slate` and `?domain=after-inc|biz-<niche-id>`
(e.g. `?theme=clean-slate&domain=biz-daycare-center`).

## Architecture

Two abstraction layers, enforced by tests:

- **Theme layer** (`src/theme/`, `assets/<theme>/`): every color token, font, UI
  chrome string, and icon resolves through one registry. Components consume
  `useTheme()` only. `tests/structural.test.tsx` renders the whole app under both
  themes and asserts byte-identical structure after stripping text/asset payloads.
- **Domain layer** (`src/domain/`, `src/engine/blueprint.ts`): the 11-editor
  structure, field kinds, ranges, and ADD/SET semantics are declarative data
  derived from the wiki research; the active `DomainSchema` supplies the entire
  content language (editor titles, field labels, option pools, event galleries).
  `src/engine/scenario.ts` builds the Zod validation schema *and* the defaults
  from that same data, so UI, defaults, and import validation cannot drift.

Research provenance: every blueprint field carries a wiki source URL or a
`GAP:` marker cross-referenced in [docs/research/GAPS.md](docs/research/GAPS.md);
`tests/blueprintResearch.test.ts` enforces this mechanically. Full research spec:
[docs/research/](docs/research/), framework rationale: [docs/ADR-001.md](docs/ADR-001.md).

## Add a theme

1. Create `assets/<your-theme-id>/theme.json` with the same shape as the two
   shipped themes — `id` (must equal the folder name), `name`, `description`,
   `tokens` (color/font/radius/spacing), `strings`, and `icons`. The `strings`
   and `icons` key sets must match the shipped themes exactly (the parity tests
   in `tests/theme.test.ts` will tell you what's missing).
2. Create `assets/<your-theme-id>/icons/` containing one SVG per file name your
   `icons` map references, including the required `fallback` entry.
3. Done. The registry discovers theme folders via `import.meta.glob` — there is
   no list to update and no component to touch. Use it with `?theme=<your-theme-id>`.

## Add a domain schema

A domain is the full semantic layer for one world (game or industry): the name,
description, event text, and icon references for every mechanic.

1. Build a `DomainSchema` object (see `src/domain/types.ts`):
   - `lexicon`: a label for **every** token in `blueprintTokens()` — editor
     titles, field labels, month names. Missing tokens fail registration loudly.
   - `pools`: `resources`, `terrains`, `areaLayouts`, `seasons`, `leaders`,
     `modifiers`, `goalTypes`, `eventImages`, `difficulties` — the option pools
     select fields and the resource table draw from.
   - `vocabularyProfile`: `'business-native'` opts the domain into the
     no-apocalypse-vocabulary lint on all scenario output; `'post-apocalyptic'`
     is reserved for the canonical game domain.
2. Register it in `src/domain/registry.ts` with `registerDomain(...)` — or, for
   a business niche, just add a vocabulary pack to
   `src/domain/business/niches.ts`: packs are expanded into complete
   business-native domains automatically (`biz-<pack-id>`), and the test suite
   validates and lints every pack.

**Native Translation rule** (spec): never drop apocalypse flavor into a business
domain. Translate the *mechanic* — an ambient pressure with spawn/growth/threat
behavior — into the niche's own ambient pressure ("booking droughts",
"supermarket squeeze"), with the numbers left 1:1.

## Layout

```
assets/<theme>/           theme.json + icons/ per theme (after-inc, clean-slate)
docs/ADR-001.md           framework decision record
docs/research/            Phase 1 wiki research: 11 editors, concepts, GAPS.md
examples/                 generated niche-native scenario JSON (round-trip tested)
scripts/generate-example.ts   Phase 3 generator (random niche from 50-item seed list)
src/engine/               blueprint, Zod schema builder, IO, vocabulary lint
src/domain/               domain contract, canonical domain, business generator
src/theme/                theme contract, registry, React context
src/components/           blueprint-driven editor UI + live preview
tests/                    schema, round-trip, themes, structure, vocab, example
```
