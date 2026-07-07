# Runtime engine — how exported scenario JSON becomes a playable game

The runtime (`src/runtime/`) is a pure, deterministic turn engine plus a themed
React shell (`play.html` → `src/play.tsx`). Its **sole content source is an
exported scenario file**: `deriveRules(scenario, domain)` reads everything —
map geometry, starting values, balances, calendar, events, goals, pressure,
defense, difficulty, modifiers — from the JSON the Scenario Creator emits. The
active `DomainSchema` contributes two things only: **pool order** (the slot
convention below) and, at the UI layer, **language** (lexicon + pool labels).
The engine core never sees a display string.

Provenance discipline is the same as the editor's: mechanics follow the
sourced wiki behavior catalogued in [research/concepts.md](research/concepts.md);
everything numeric or structural the wiki does not state is a flagged
reconstruction — see [research/GAPS.md](research/GAPS.md) rows **C1–C5**.

## Time

1 turn = 1 day; 30 turns = 1 month (sourced arithmetic); 12 months = 1 year.
The month indexes the seasons editor's calendar.

## The slot convention (GAPS.md C4)

Domain pools have fixed sizes and **positions carry mechanic roles**, so the
engine is domain-agnostic while every domain keeps its own vocabulary. The
registry enforces pool sizes and full lexicon coverage (blueprint + runtime
tokens) for every registered domain.

| Pool | Slots (canonical / business reading) |
|---|---|
| resources (7) | 0 staple (food / operating cash) · 1 demand (water / lead pipeline) · 2 construction (wood / stock) · 3 seasonal (fuel / winter kits) · 4 recovery (medicine / crew welfare) · 5 heavy (stone / tools & rigging) · 6 advanced (material / fabrication line, deals unlock at tech 5 — sourced) |
| terrains (5) | produce, per claimed area: 0→staple, 1→construction (+seasonal secondary — sourced "wood and fuel"), 2→recovery, 3→heavy, 4→nothing but cheaper one-off deals (sourced city behavior) |
| seasons (3) | 0 normal · 1 lean (staple lines halt; seasonal resource consumed; overcrowding bites harder — all sourced) · 2 crunch (demand production stops; staple only on corridor-adjacent areas at 75%; demand deals cost up to 10; goal clocks pause — all sourced) |
| leaders (10) | archetype effects by slot, from the sourced leader pages (Survivor → Cub Scout order) |
| modifiers (7) | 0–4 crew strength +1 in terrain slot k · 5 defenders cost no upkeep · 6 recovery ×1.5 (families sourced; effects reconstructed) |
| goalTypes (11) | 0 explore · 1 claim (net) · 2 cumulative production+deals · 3 staple stockpile · 4 hold staple a month · 5 storage expansions · 6 population · 7 tech level · 8 hold morale a month · 9 producers resolved · 10 threat points destroyed (the 11 sourced types, in order) |
| difficulties (4) | see tiers below |

## Difficulty tiers (slots 0–3)

| Tier | impatience damping (sourced) | patience tick penalty (sourced) | pressure × | low-morale threshold |
|---|---|---|---|---|
| 0 | 99% | +0 | 0.75 | 10 (sourced casual grace) |
| 1 | 90% | +0 | 1.0 | 20 |
| 2 | 80% | +0.44 | 1.25 | 20 |
| 3 | 80% | +0.528 | 1.5 | 20 |

## Turn sequence (endTurn)

stamina regen → auto-explore (leader 9) → production → consumption/deficits →
morale → population growth/abandonment → pressure (spawn, migration, area
erosion) → combat → healing → tech countdown → goals/patience → map milestones
→ script events → outcome check.

Highlights, with sourced anchors:

- **Stamina**: +1 every 6 turns (sourced cadence), scaled by tech and
  population; regen halves above the soft cap (sourced slowdown). Leader 3
  gets one annual lump instead.
- **Resources**: the Resources editor's ADD/SET ops apply against an engine
  baseline of 10 per resource; storage caps start at 100 and each expansion
  adds +60% (sourced percentage). Overflow is wasted.
- **Morale/authority coupling**: deficits and overcrowding drag morale;
  morale below the tier threshold bleeds authority and advances an
  abandonment meter whose completion costs 1 member and −8 authority
  (sourced values). Festivals: +6.5–7.5% morale, up to +10 authority when
  well below starting authority, +50 event patience (all sourced).
- **Pressure**: producer areas spawn threat points continuously (rate from
  the pressure editor's intensity/growth); every 10 turns producers emit and
  loose threats march one step toward the start area. Threats erode claimed
  area health (loss at 0: area, 1 member, −4 authority — mechanic sourced);
  threats at the start area drain morale/authority and pause goal clocks
  (sourced). Claiming raises awareness — every 3rd claim wakes +1 threat at
  every producer (sourced mechanic).
- **Cleansing**: costs 1–3 stamina by terrain, −1 in the lean season
  (sourced); initiating it spawns an immediate backlash locally and in
  adjacent producers (sourced); it resolves when the area is clear with a
  crew present.
- **Combat**: crews kill up to `strength` threat points per turn and take
  damage while threats remain; threats arriving beside unexplored ground hit
  ×1.5 (sourced surprise mechanic). A crew death costs 1 member and raises
  pressure (sourced double penalty). Reinforcement transfers 20 health and
  stacks 10% damage reduction (sourced mechanic). Healing runs at the
  defense editor's rate, ×2 with recovery stock, ×5 at the settlement with
  tech ≥ 2 capped at 10%/turn (sourced 0.2–10% spread).
- **Goals**: sequential; completing one grants +8 authority. Patience ticks
  1/turn + tier penalty; event-sourced patience is consumed first (sourced);
  stable goals, attacks, and the crunch season pause the clock (sourced).
  Overdue goals bleed authority, damped by the tier when authority is
  already low (sourced anti-death-spiral). Modifier patience points adjust
  authored patience: negative net → +2%/pt, positive → −1%/pt (sourced).
- **Milestones**: +6 authority at half/all explored, +6 at 40%/80% claimed,
  +10 at all claimed (sourced).
- **Technology**: upgrade costs stamina + staple + construction and takes
  25 turns (sourced); advanced-resource deals unlock at tech 5 (sourced).
- **Win/lose**: all goals complete → won. Authority ≤ 0 (sourced lose
  condition), population 0, or the start area falling → lost.

Every unlabeled number above is engine tuning (GAPS.md C5), chosen for
playability and exercised by `tests/runtime.test.ts` and the
`tests/clearView.test.ts` win/lose playthroughs.

## The scenario script API (GAPS.md C3)

Custom-event scripts (.lua/.txt) are interpreted line by line; unknown lines
are inert, so Lua comments and code pass through. Directives:

```
ON <metric> <op> <number>     turn, month, morale, authority, stamina,
ON season = <seasonId>        population, pressure, explored, claimed,
ON resource:<id> <op> <n>     cleansed, tech; ops = > < >= <= =
TEXT <line>                   popup body (TEXT lines concatenate)
BUTTON <label>                acknowledge-button label
EFFECT <target> +N|-N|=N      morale, authority, stamina, population,
EFFECT resource:<id> +N|-N|=N pressure, patience, tech
REPEAT                        re-arm after conditions go false
```

Multiple `ON` lines AND together; a script with none fires on day 1. Events
are edge-triggered and fire at most once without `REPEAT`. Effects apply when
the popup is acknowledged; the turn cannot end while popups are pending
(the sourced answer-or-stall rule).

## Playing

```bash
npm run dev              # then open /play.html
```

- `/play.html?domain=<id>&theme=<id>` plays that domain's default scenario.
- The **Playtest** action in the editor hands the current scenario to the
  player via localStorage.
- The player's load control accepts any exported scenario JSON — e.g.
  [/scenarios/clear-view-window-co.json](../scenarios/clear-view-window-co.json),
  the authored Clear View Window Co. campaign (regenerate with
  `npm run generate:clear-view`).

Setup: pick a leader (the sourced play-time choice the editor deliberately
does not configure — GAPS.md B15), answer the opening events, then play:
explore/claim, chase one-off deals, hold festivals, train/deploy/reinforce
crews, cleanse producers, expand storage and housing, research — one day at
a time.
