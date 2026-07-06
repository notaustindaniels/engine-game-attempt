# Scenario Creator — Build Spec

## Framing: Civilization-Building IS Company-Building
After Inc. is, mechanically, a game about growing a fragile organization
under constant pressure — which is exactly what growing a company is.
The parallels are structural, not decorative:

- A settlement emerging from a bunker = a founder launching with limited
  runway into an uncertain market.
- Zombies/infestations = the ambient threat that erodes an unattended
  business — churn, cash burn, competitor pressure, market decay. It is
  ever-present, scales if ignored, and must be actively managed.
- Resources (food, wood, etc.) = capital, inventory, time, attention.
- Morale = team/community morale and culture.
- Authority = founder credibility and brand trust; losing it doesn't
  end the game but makes everything harder to govern.
- Regions & exploration = market segments and channels: fogged until
  researched, each with its own terrain (difficulty) and resources
  (opportunity).
- Seasons = market cycles, seasonality, economic climate.
- Fighters/defenses = retention systems, legal protection, moats.
- Leaders & modifiers = founder archetypes and strategic bets.
- Goals = milestones: first revenue, product launch, sustainability.

## CRITICAL DESIGN RULE — Native Translation, Not Drop-In
When the engine generates a scenario for a business niche, it must NOT
insert zombies (or any apocalypse flavor) into a business context. The
domain schema must translate EVERY concept into its native equivalent
for that niche. A wedding-photography scenario's "zombie" analog might
be "seasonal booking droughts and a saturated local market" — never
"zombies attack your studio." The mechanic (a pressure value with
spawn/growth/threat behavior identical to zombies) is preserved 1:1;
the language, events, icons, and flavor text are 100% niche-native.
Every generated scenario must read as if the Scenario Creator were
built for that industry from day one.

## Objective
A domain-agnostic Scenario Creator web app in TypeScript, modeled 1:1
on the Scenario Creator in Ndemic Creations' "After Inc: Revival."

## Phase 1 — Research (read-only)
Document the full editor structure from these sources before coding:
- https://afterinc.wiki.gg/wiki/Custom_Scenarios (base category: 6
  editors; advanced category: 5 editors; all fields, value ranges like
  [0-100], enums, ADD-vs-SET resource semantics)
- https://afterinc.wiki.gg/wiki/Custom_Scenarios/Lua_API_reference
- The Event Images and Icons reference page on the same wiki
- https://afterinc.wiki.gg concept pages: Regions, Resources, Morale,
  Authority, Seasons, Zombies, Fighters, Leaders, Modifiers, Goals,
  Starting Events
Output: /docs/research/ with a field-by-field Markdown spec + draft Zod
schemas for all 11 editors, PLUS a concept-mapping table extending the
Framing section above to every mechanic found. Flag any field that
cannot be sourced in GAPS.md (do NOT invent fields).

## Phase 2 — Architecture & Build
Hard requirement: TypeScript, strict mode. Framework: your choice for
a form-heavy multi-panel editor; justify in /docs/ADR-001.md.

### Non-negotiable architecture
1. THEME/ASSET ABSTRACTION: all UI assets, icons, color tokens, label
   strings, and styles resolve through one theme registry
   (theme.json + /assets/<theme>/). Swapping a theme folder reskins
   the app 1:1 with ZERO component code changes. Ship two themes:
   "after-inc" (post-apocalyptic) and "clean-slate" (neutral business).
2. DOMAIN ABSTRACTION: the 11-editor structure, field types, ranges,
   ADD/SET semantics, goals, and events are driven by a declarative
   domain schema — not hardcoded. A domain schema carries the full
   semantic layer: every mechanic's name, description, event text,
   and icon set for that domain, per the Native Translation rule.
   Mechanics are shared; language never leaks across domains.
3. Zod validation on every field using wiki-documented ranges.
4. Scenario import/export as JSON, round-trip safe.
5. Live preview panel summarizing the scenario as edited.
6. Vitest tests: schema validation, theme resolution, import/export
   round-trip, theme-swap structural equivalence, and a "no apocalypse
   vocabulary" lint that fails if zombie/apocalypse terms appear in
   any business-domain scenario output.

## Phase 3 — Verify by Creation
1. Programmatically pick a random business niche from a 50-item seed
   list.
2. Via the app's own schema/export code path, generate a complete
   valid scenario for that niche using a niche-native domain schema
   built per the Framing table — pressures, resources, regions,
   events, and goals all expressed in that industry's own language.
3. Save to /examples/<niche>-scenario.json; prove it re-imports
   cleanly in a test; render it under "clean-slate"; run the
   vocabulary lint against it.
4. Adversarial review: every sourced wiki field exists in the app;
   both themes render structurally identically; the example scenario
   contains zero apocalypse vocabulary; build + tests exit 0.

## Deliverables
Working app · /docs/research spec + concept-mapping table · ADR-001 ·
two themes · niche-native example scenario JSON · passing test suite ·
README with "add a theme" and "add a domain schema" guides.

## Constraints
- Do not weaken or delete tests to pass.
- No fabricated wiki fields; gaps go in /docs/research/GAPS.md.
- All work stays in this repo.