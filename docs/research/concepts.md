# Game Concepts (After Inc: Revival)

Research notes compiled 2026-07-06 from the official wiki (afterinc.wiki.gg) via server-side web search.
Method note: direct page fetches are blocked in this environment; every fact below was surfaced through
search-result summaries of wiki pages. Facts seen only once in an AI-generated search summary (and not
corroborated by a second query or by a dedicated wiki page) are marked **[single-source]**. Anything I
could not confirm at all is in "Unsourced / Gaps". No values are invented; inferences are marked.

Game framing (source: https://afterinc.wiki.gg/wiki/After_Inc.): strategy game by Ndemic Creations
(mobile release Dec 2024; PC version "After Inc: Revived/Revival" released 2025-06-17), set decades
after Plague Inc.'s Necroa Virus outbreak. Survivors emerge from a failing bunker with their families;
the objective is to complete settlement goals while fighting zombies and keeping Authority above zero.
Time advances in turns; 1 turn = 1 day (inferred from "three to five months (90 to 150 turns)" on the
Settlement page — i.e. ~30 turns/month; inference, but arithmetic is direct).

---

## Regions (wiki page is titled "Areas") (source: https://afterinc.wiki.gg/wiki/Areas)

- No wiki page named "Regions" was found; the map-subdivision concept is documented at `wiki/Areas`.
  "Region" is used informally for the whole map (e.g. the Cub Scout leader "slowly explores the region").
- Area knowledge states: **unexplored** (settlement has no information), **explored** (information
  visible), **claimed** (blue tint; allows building resource-production buildings on the area).
- Additional area state: **infested** (red tint) — produces zombies over time (see Zombies).
- Terrain/area types and default production:
  - Grasslands — most allow Food production
  - Forests — Wood and Fuel production
  - Swamps — most allow Medicine production
  - Mountains — most allow Stone production
  - Cities — do not produce a default resource; when explored there is a 50% chance (100% if claimed)
    of a reduced stamina cost when scavenging resources there
  - All areas except the settlement area and cities produce their default resource per classification.
- River adjacency is tracked per area and affects certain situations; during Drought, food buildings
  adjacent to a river keep producing at 75% of normal rate (others stop).
- Exploration usually costs at least 1 stamina. An area can be claimed for free by having a Fighter
  nearby with the "Pathfinders" reward.
- Map-completion Authority bonuses: exploring at least half (or 100%) of all areas grants +6 Authority;
  claiming 40% or 80% of areas grants +6 Authority; claiming ALL areas grants +10 Authority.
- Claimed areas have **area health**: when it reaches 0 (zombie pressure), the settlement loses control
  of the area and settlers die.
- Example map "A New Dawn" (source: https://afterinc.wiki.gg/wiki/A_New_Dawn): 28 areas total —
  12 grasslands, 7 mountains, 5 cities, 2 swamps, 2 forests **[single-source; the summary wording was
  partially garbled ("two cities" appeared twice), forests count unconfirmed]**; mostly flat, one river
  crossing north to south-west with two crossings.
- Custom Scenarios exposure: the editor has an "area layout" editor to pick the area layout for the
  region (one of the base-category editors).

## Resources (source: https://afterinc.wiki.gg/wiki/Resources)

- Definition: essential items the settlement needs to survive; consumed mainly by the settlement
  population and services; produced by dedicated production buildings and by scavenging.
- Primary resource list: **Food, Water, Wood, Fuel, Medicine, Stone**.
- Additional resource: **Material** — enables more advanced buildings/services; unlocks at
  Technology level 5.
- Production values seen (per month; sources: https://afterinc.wiki.gg/wiki/Food ,
  https://afterinc.wiki.gg/wiki/Wood ):
  - Crop Farm: 2.25 Food/month, satisfies 2.38 settlers
  - Meat Ranch: 1.5 Food/month, satisfies 1.58 settlers
  - Lumberyard: 1.2 Wood/month
  - Fuel is processed from Wood (Fuel is essential in Winter)
- Storage: each additional storage building increases the available stockpile of that resource by +60%.
- Scavenging: map-wide search for a specific resource, collected as "bubbles". Base cost 1 stamina;
  2 stamina for Medicine and Material; 4 stamina for Stone. During Drought, scavenging Water can cost
  up to 10 stamina. Scavenging stops yielding bubble resources once the stockpile is full (>= 110%),
  unless the current goal is to produce or maintain that resource.
- Deficits: shortages hit Morale (severity depends on resource type). Lack of Food, Water, or Fuel also
  reduces the health of Fighters while they are outside a claimed area.
- Artifacts can grant new production buildings and resource bonuses **[single-source]**.
- Related meta-resource — Stamina (source: https://afterinc.wiki.gg/wiki/Stamina): the action currency
  spent on exploring, claiming, scavenging, cleansing, provoking zombie attacks, tech upgrades.
  Generated by the settlement over time — baseline every 6 turns (the Economist leader instead receives
  it only at the start of each year); generation rate rises with Population and Technology; production
  slows once held stamina exceeds a threshold (shown as a blue gauge filling behind the stamina count).
- Custom Scenarios exposure: a Resources editor sets starting stockpiles — choose resource type and
  ADD (adds to existing value) or SET (overrides), amount range [-9999 to 9999].

## Morale (source: https://afterinc.wiki.gg/wiki/Morale)

- Definition: how happy the settlement population is; shown as an emoticon; a percentage value
  (internally stored as decimals).
- Population coupling: high morale accelerates population growth (higher = faster). When morale is
  negative, growth slows and settlers may start abandoning the settlement. Population growth also
  requires current population < current housing, and slows after population reaches 5.
- Authority coupling: when Morale goes negative (threshold relaxed to below -10% on Casual difficulty),
  the player starts losing Authority from "Low Morale" and the abandonment process begins.
- "Historical" penalty: after resolving factors that caused morale loss, a penalty reflecting the
  historical loss applies and slows the rate of morale recovery.
- Housing: "Out of Houses" morale penalty applies when population exceeds housing; insufficient Rooms
  cause multiple morale penalties, and the penalty grows during Winter.
- Water: the morale penalty for having no water increases significantly during Drought.
- Festivals: raise morale by a random 6.5% to 7.5% (and also raise Authority — see Authority).
- Situations: when a situation decision pops up, current morale is reduced and immigration is blocked
  until the player answers (source: https://afterinc.wiki.gg/wiki/Situations).
- Observed thresholds referenced by other mechanics: 20%, 60%, and 100% morale gate various mechanics;
  "celebrations" reference 100+ morale **[single-source; exact effects not confirmed]**. Exact min/max
  bounds of the morale scale not confirmed.

## Authority (source: https://afterinc.wiki.gg/wiki/Authority)

- Definition: the settlement's trust in / perception of the player. **Authority = 0 is the lose
  condition.** Starting Authority depends on the chosen difficulty (numeric values not surfaced).
- Gains:
  - Achieving settlement milestones and completing settlement goals.
  - Festivals: up to +10 Authority when current authority is below (starting authority − 10); also
    extends the goal patience timer by +50 turns.
  - Settlement growth bubble: when the settlement-growth progress reaches 100%, a bubble appears in the
    settlement zone lasting 80 turns; clicking grants +1 stamina, +2 authority, +1 population (settler).
  - Map-completion bonuses: +6 (explore half/all), +6 (claim 40%/80%), +10 (claim all) — see Regions.
  - Decisions and pop-ups can also grant Authority.
- Losses (listed causes): Low Morale; Production destroyed (from the Maintenance situation);
  Abandonment; Death; Decisions; Traits (mainly "Make Promises" from resource security); and
  Impatience from slow goal progress.
  - Failing to click the settlement bubble in time drives people away: Abandoned Housing, reduced
    Authority, slowed population growth.
  - Abandonment process completing (reaching 100%) = −1 settler, −8 Authority, housing becomes Abandoned.
- Impatience damping: Authority loss from impatience is reduced when current Authority is low —
  reduction up to 99% on Casual, 90% on Normal, 80% on Brutal and above.

## Seasons (no dedicated wiki page surfaced; sourced from https://afterinc.wiki.gg/wiki/Settlement , https://afterinc.wiki.gg/wiki/Situations , https://afterinc.wiki.gg/wiki/Custom_Scenarios , https://afterinc.wiki.gg/wiki/Water )

- Season set: **Winter, Summer, Drought** (these three are the options in the Custom Scenarios seasons
  editor, settable per month). **Rain** occurs as a random weather event. No Spring/Autumn mechanics
  were surfaced anywhere.
- Winter:
  - Usually at the end of the year; lasts ~3–5 months (90–150 turns) depending on selected level.
  - Grain Fields, Vegetable Farms, and Fruit Orchards stop producing Food entirely.
  - Settlers demand much more Fuel and Fire Pits; insufficient fuel/fire pits significantly decreases
    Morale; the room/housing morale penalty also increases in Winter.
  - Provoking zombies to attack costs 2 stamina instead of 1.
  - Cleansing stamina costs are reduced by 1 (never below 1).
  - Some situations are Winter-only and auto-resolve when the season leaves Winter.
  - Arctic Explorer leader inverts seasonal exploration economics (cheaper in Winter, dearer in Summer).
- Summer: the default season; settlement functions normally. Rain can randomly occur in Summer (or
  after a Drought): the fire situation auto-resolves at rain start, settler water consumption −40%,
  and any water deficit is reduced by 10% per day while raining.
- Drought:
  - All Water production ceases; the no-water morale penalty increases significantly.
  - Food production ceases except buildings adjacent to a river, which produce at 75% rate.
  - Scavenging Water can temporarily cost up to 10 stamina.
  - The goal patience timer pauses during drought (see Goals).
- All non-Summer seasons: scavenging speed for Food or Water −20%, and a higher chance of getting
  fewer bubbles.
- Custom Scenarios exposure: Seasons editor sets the season for each month (Winter/Summer/Drought),
  customizing default weather.

## Zombies (no standalone "Zombies" page surfaced; sourced from https://afterinc.wiki.gg/wiki/Areas , https://afterinc.wiki.gg/wiki/Fighters , https://afterinc.wiki.gg/wiki/Situations , https://afterinc.wiki.gg/wiki/Difficulty )

- Spawning: **infested areas** (red tint) produce zombies over time. Cleansing an infested area stops
  it from spawning zombies. (Numeric spawn rates/caps not surfaced.)
- Cleansing: performed by Fighters; costs 1–3 stamina depending on area type and current season
  (Winter: −1 cost, min 1). Cleansing an area immediately spawns zombies in that area AND in nearby
  infested areas (whether or not a fighter occupies them), and awakens all dormant zombies in nearby
  areas — a deliberate risk/backlash mechanic. If the fighters defeat the spawned zombies, the area is
  cleansed and stops producing zombies.
- Dormant zombies & awareness: claiming an area raises "zombie awareness"; if raised enough, all nearby
  dormant zombies wake and attack. Zombies awakened this way temporarily move faster — except zombies
  in swamp areas, which get no speed boost.
- Surprise attacks: zombies attacking a Fighter from an unexplored area have a very high chance of a
  Surprise attack, applying a Negative Strength penalty to the fighter.
- Herds: some locations hold large zombie herds needing multiple fighters — e.g. Z Com Fortress
  (Ancient Treasures map): 2 fighters recommended on Casual/Normal, 3 on Brutal
  (source: https://afterinc.wiki.gg/wiki/Z_Com_Fortress).
- Consequences: a Fighter dying causes a settler death and increases the number of zombies. A claimed
  area's health reaching 0 loses the area and causes settler death. Zombie attacks on the settlement
  pause the goal timer while they last.
- Difficulty flavor text implies zombie capability scaling: Casual "Zombies can't run", Normal "Zombies
  have no teeth", Brutal "Zombies are hungry" (source: https://afterinc.wiki.gg/wiki/Difficulty —
  exact stat deltas not surfaced).
- Provoked attacks: with fighters near a zombie area, the player can spend 1 stamina (2 in Winter) to
  make the zombies attack (fight on the player's terms).

## Fighters (source: https://afterinc.wiki.gg/wiki/Fighters)

- Role: the settlement's military units — fight zombies and defend the Settlement. Combat starts when a
  Fighter enters an area with zombies, or zombies enter an area holding a Fighter.
- Combat UI/stats: during a fight the bottom edge shows Fighter health, Fighter defence, and the
  zombies' defence.
- Damage model: fighters take damage while fighting; the frequency of damage ticks increases as they
  lean toward losing. At 0 health the Fighter dies → causes a settler death and increases zombie count.
- Reinforcement: with supporting Fighters nearby, spend stamina to reinforce the active Fighter —
  transfers health from supporters to the active fighter and grants stacking damage-taken reduction
  (increases each time reinforced).
- Healing: drag a hurt fighter onto a claimed area; base recovery 0.2% health per turn, modified by
  conditions; Medicine increases healing speed; with "Combat Treatment", healing in the Settlement
  reaches up to 10% health per turn.
- Experience: fighters gain small experience for zombie kills and area cleanses (progression details
  not surfaced).
- Training: "Train Fighter" button in the settlement overview; larger population increases how many
  fighters can be trained (Beginner Tips: Technology 2 + Population 3 before Year 2 yields two
  fighters); training time can be modified by decisions and upgrades; the "Children and Conflict in
  Settlement" situation can add child soldiers to fighter squads.
- Attrition: lack of Food, Water, or Fuel damages Fighters while outside claimed areas.
- Equipment upgrade example: looting Z Com Fortress arms all Fighters with firearms and quad bikes,
  significantly increasing strength and movement speed.

## Leaders (source: https://afterinc.wiki.gg/wiki/Leaders + individual leader pages)

- Leaders are the people who manage the whole settlement — a chosen archetype with a passive
  trade-off. In After Inc: Revived (PC) all leaders are unlocked by default.
- Confirmed leaders and abilities (individual pages confirmed for Tyrant, Hermit, Slumlord, Cub Scout,
  Soldier, Personal Trainer):
  - **Survivor** — default leader, no special bonuses.
  - **Soldier** (https://afterinc.wiki.gg/wiki/Soldier) — grants special abilities to Fighters; cost:
    Morale is harder to maintain.
  - **Personal Trainer** (https://afterinc.wiki.gg/wiki/Personal_Trainer) — enables deficit (negative)
    stamina at the expense of Morale; population consumes more food.
  - **Economist** — receives Stamina very infrequently (at the start of each year) instead of every
    6 turns (i.e. large lump-sum stamina income).
  - **Hoarder** — automatically builds more storage when a resource stockpile is full.
  - **Arctic Explorer** — explores and claims areas more cheaply/faster during Winter; more expensive
    during Summer.
  - **Tyrant** (https://afterinc.wiki.gg/wiki/Tyrant) — prevents people leaving the settlement and
    stops Authority loss from low Morale while a Fighter is in the settlement area; increased Authority
    loss if no Fighter is in the settlement area.
  - **Hermit** (https://afterinc.wiki.gg/wiki/Hermit) — production buildings with an unexplored area
    nearby produce more; buildings without one produce less.
  - **Slumlord** (https://afterinc.wiki.gg/wiki/Slumlord) — settlement can grow without housing; gains
    more stamina and authority when population increases. (One summary added "increased authority loss
    if people leave" — **[single-source]**.)
  - **Cub Scout** (https://afterinc.wiki.gg/wiki/Cub_Scout) — slowly explores the whole region for
    free, but increases the cost of manually exploring a specific area.
- Naming caution: one search summary listed the same abilities under different names (Prospector,
  Quartermaster, Navigator, Populist, Scout, Fighter). Individual wiki pages confirm the names above;
  the alternate set is treated as a misattributed summary (see Gaps).

## Modifiers (source: https://afterinc.wiki.gg/wiki/Modifiers)

- Exclusive to **Beyond the Bunkers expeditions**: modifications applied to a map that grant bonuses or
  disadvantages. Like population traits, modifiers are map-specific. They also give bonuses similar to
  Rewards.
- Availability gating by expedition parameters (Settlers Ambition, Danger):
  - Modifiers that change Medicine resource production only appear when Ambition >= 8.
  - All zombie- or soldier-related modifiers never appear when Danger is "none".
- Patience-point system: each modifier carries patience points; the expedition's TOTAL is summed —
  if the total is negative, +2% goal patience timer per negative point; if positive, −1% patience timer
  per positive point (harder maps get more time, easier maps get less).
- Modifier families observed (names/values not fully surfaced): soldier combat boosts per terrain type
  (forest, grassland, mountain, swamp, urban), soldier consumption, soldier healing
  **[single-source for the family list]**.
- Icon category exists at https://afterinc.wiki.gg/wiki/Category:Modifier_icons (full list not surfaced).

## Goals (source: https://afterinc.wiki.gg/wiki/Goals)

- Goals are the settlement's assigned objectives; goal types observed:
  - Exploring new areas; Claiming areas; Producing resources (bubble-collected resources count);
    Stockpiling resources (reach a required amount); Maintaining resources (for up to one month);
    Increasing storage capacity; Reaching population milestones; Researching new technology;
    Maintaining morale (for up to one month); Cleansing infested areas; Killing zombies.
  - "Training fighters" goals appear only in map campaigns, not expeditions.
  - Map-specific goal lists live on the Campaign page (https://afterinc.wiki.gg/wiki/Campaign).
- Patience timer: each goal has a max patience value; the timer decreases 1 per day, plus a
  difficulty-scaled penalty (base 0; +0.44 on Brutal; +0.528 on Mega Brutal). Goal patience is viewable
  via the information button in the settlement area.
- Overdue goals: the player slowly loses Authority to settler Impatience (with the low-authority
  damping described under Authority).
- Timer pauses/extensions:
  - "Stable" goals do not incur impatience — they extend and temporarily pause the goal timer until the
    stable goal completes.
  - The timer stops while the settlement is under zombie attack or during Drought.
  - Festivals and Celebration pop-ups add patience; event-sourced patience is consumed before the
    goal's own patience (so a goal can survive even at negative own-patience). Festival = +50 turns.
- Unlock coupling: goals to collect/maintain a resource temporarily unlock that resource even below the
  required Technology level; storage-capacity goals always unlock the ability to build extra storage.

## Starting Events (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios — Custom Scenarios feature; no standalone page found)

- The **starting event** is a popup event that appears when a custom scenario starts. Additional events
  can be added; all events share the same layout (fields include title, description, choice buttons,
  and images — **[single-source for the exact field list]**).
- The advanced Events editor lets creators build custom events that trigger multiple things via the
  game's API: upload a text or Lua file containing the script; changing behavior requires uploading a
  new script. The wiki references separate documentation for writing events plus an event images/icons
  reference.
- Context — Custom Scenarios (introduced in Update 13, exclusive to After Inc: Revival): players build
  scenarios in the Scenario Creator and publish to Steam Workshop. The editor has two categories: a
  base category with six editors and an advanced category with five editors (individual editor names
  only partially surfaced: scenario details/basic search metadata, area layout for the region, starting
  resource values with ADD/SET semantics [-9999..9999], seasons per month, events). All editor values
  shown in brackets (e.g. [0-100]) are allowed-value ranges.

---

## Unsourced / Gaps

Things looked for but not confirmed by any search result (queries tried in parentheses):

- **Numeric zombie parameters**: spawn rate of infested areas, zombie counts per area, zombie
  strength/defence values, awareness thresholds ("infested area produces zombies rate maximum",
  "zombie types speed", "zombie awareness swamp slower movement"). Only qualitative behavior surfaced.
- **A standalone "Zombies" wiki page**: never appeared in results; zombie mechanics are distributed
  across Areas/Fighters/Situations/Difficulty. Same for a standalone "Seasons" page.
- **A wiki page literally titled "Regions"**: the concept page is "Areas".
- **Morale scale bounds** (exact min/max) and the exact effects at the referenced 20%/60%/100%
  thresholds ("Morale percentage maximum minimum value range emoticon").
- **Starting Authority numeric values per difficulty** and any Authority cap
  ("Difficulty starting authority casual normal brutal mega brutal values", "Authority maximum cap").
- **Names of the six base editors and five advanced editors** in the Custom Scenarios creator — only
  five editors were identifiable from summaries ("Custom Scenarios base editors advanced editors",
  "editor sections map goals seasons resources technology", "scenario details name description
  starting conditions leader difficulty").
- **Complete named Modifiers list with per-modifier values/patience points** ("Modifiers examples
  zombie soldier medicine production ambition danger", "Beyond the Bunkers expedition patience points").
- **Fighter experience/level progression** (XP thresholds, level bonuses) ("Fighters training recruit
  heal experience level up").
- **Leader name discrepancy**: one summary named leaders Prospector/Quartermaster/Navigator/Populist/
  Scout/Fighter with abilities identical to Economist/Hoarder/Arctic Explorer/Slumlord/Cub Scout/Tyrant.
  Individual pages exist for the latter set, so the former is presumed a summary error — but whether the
  full roster is exactly the 10 leaders listed is unconfirmed, as is any per-leader unlock cost in the
  mobile version.
- **A New Dawn terrain census**: the "2 forests" figure is a best reading of a garbled summary
  ("A New Dawn areas grasslands forests mountains cities swamps river").
- **Whether "Starting Events" exists as its own wiki page/section title** ("After Inc wiki \"Starting
  Events\"") — only the Custom Scenarios starting-event popup was found.
- **Technology tree specifics** beyond: upgrades cost stamina+food+wood, take 25 turns, Material at
  Tech 5, basic production rewards at Tech 2 (https://afterinc.wiki.gg/wiki/Technology, partial).

---

## Concept → Business mapping table

Framing (from the project spec): the post-apocalyptic settlement sim is re-skinned as company-building.
Settlement-from-bunker = founder launching with limited runway; zombies = ambient business pressure;
resources = capital/inventory/time/attention; morale = team culture; authority = founder credibility;
areas/exploration = market segments; seasons = market cycles; fighters = retention/moats; leaders &
modifiers = founder archetypes and strategic bets; goals = business milestones.

**Everything in the "Business-native equivalent" and "Notes" columns below is my own analytical
mapping (invention expected here), distinct from the sourced facts above and in column 2.**

| Game mechanic | Behavior (as sourced) | Business-native equivalent | Notes on 1:1 mechanical preservation |
|---|---|---|---|
| Bunker emergence / game start | Survivors leave a failing bunker Year 1; small starting population, difficulty sets starting Authority | Founder leaves stable job/incubator to launch with limited runway and a founding team | Preserve exactly: fixed starting team size, credibility set by "market harshness" difficulty, clock starts Day 1 |
| Areas: unexplored state | No information available; zombies attacking from unexplored areas get Surprise bonus | Unresearched market segment: no data; threats from it blindside you | Keep fog-of-war 1:1 — unresearched segments hide both opportunity size and competitor strength; unresearched-origin shocks hit harder (surprise = no early-warning) |
| Areas: explored state | Information revealed; costs >=1 stamina to explore | Market research completed: segment size/difficulty visible, not yet entered | Exploration = spending founder attention on research; keep the "≥1 attention" floor |
| Areas: claimed state | Blue tint; enables building production buildings; claim can be free via Pathfinders reward | Entered market/channel: can now deploy revenue-generating operations | Claiming = market entry; "free claim via nearby Fighter reward" = warm intro/partnership channel entry at zero cost |
| Terrain types → default resources | Grasslands=Food, Forests=Wood+Fuel, Swamps=Medicine, Mountains=Stone; cities produce nothing by default | Segment archetypes with natural yields: e.g. SMB=cash flow, enterprise=contracts/IP, regulated niches=defensibility, hard-tech=infrastructure | Keep the "each terrain yields one resource class" constraint so portfolio balance forces multi-segment expansion |
| Cities (special terrain) | No default production; 50% (100% if claimed) chance of cheaper scavenging | Dense metro/marketplace channels: no recurring yield, but cheap one-off deal sourcing | Preserve the scavenge-discount RNG: crowded markets are for opportunistic wins, not steady revenue |
| River adjacency | Tracked per area; river-adjacent food buildings run at 75% during Drought | Infrastructure adjacency (platform ecosystems, logistics corridors): partial insulation from capital crunches | Keep as binary adjacency flag that only matters during the crunch season |
| Area health / losing control | Claimed area health hits 0 → lose the area + settler death | Churn collapse of a market: entrenched pressure unwinds your position and costs you people | Preserve: entered markets are not safe-forever; ignoring pressure loses the segment AND staff |
| Map-completion Authority bonuses | +6 at explore half/all; +6 at claim 40%/80%; +10 claim all | Category-leadership credibility: press/analyst recognition at coverage milestones | Keep the stepped thresholds — credibility jumps at visible market-share milestones, not linearly |
| Resources (Food, Water, Wood, Fuel, Medicine, Stone, Material) | Six primaries + Material (Tech 5); consumed by population & services; produced by buildings + scavenging | Capital/inventory classes: payroll cash, opex cash, raw inventory, seasonal reserves, employee wellbeing budget, capex, advanced tooling (unlocks at platform maturity) | Keep distinct non-fungible pools with per-pool storage caps and per-pool consumers; Material→Tech-5 = advanced tooling gated on platform maturity |
| Production buildings (monthly rates) | Crop Farm 2.25 Food/mo (feeds 2.38), Meat Ranch 1.5 (1.58), Lumberyard 1.2 Wood/mo; Fuel refined from Wood | Recurring revenue engines with concrete unit economics (e.g. product line yields X/mo covering Y headcount) | Preserve exact ratio design: each engine's output is stated in "people it sustains" — a legible runway metric |
| Storage buildings | Each adds +60% stockpile cap for one resource; goal type can unlock building more | Balance-sheet/warehouse capacity; credit lines | Keep the +60% multiplicative cap and the "full stockpile wastes further income" pressure |
| Scavenging + bubbles | One-off resource hunts: 1 stamina (2 med/material, 4 stone; drought water up to 10); stops at ≥110% full; bubbles must be clicked | One-off deals: grants, consulting gigs, asset sales; require active founder attention to close (click) or they expire | Preserve cost tiers per resource class and the ≥110% waste rule; bubbles-expire = deals have closing windows |
| Stamina (action economy) | Regenerates every 6 turns; rate scales with Population+Technology; regen slows above a held threshold (blue gauge) | Founder attention/decision bandwidth; grows with team and systems; hoarding attention has diminishing returns | Keep the soft-cap regen curve exactly — banked attention decays in value, forcing continuous decision-making |
| Morale (core stat) | % value; high → faster population growth; negative → slowed growth, abandonment, Authority bleed (−10% grace on Casual) | Team/community morale: high → hiring flywheel; negative → attrition and reputation damage | Preserve the growth-rate coupling and the negative-threshold regime change (not a linear slider) |
| Out of Houses penalty | Population > housing → morale penalty; worse in Winter | Overhiring beyond org infrastructure (management, onboarding, office): culture strain, worse in downturns | Keep housing as a hard org-capacity stat that must lead headcount |
| Historical morale penalty | Fixing a morale problem still leaves a drag that slows morale recovery | Culture scar tissue: layoffs/crunch are remembered; trust rebuilds slower than it broke | This asymmetric-recovery term is the mechanic most worth preserving verbatim |
| Festivals | +6.5–7.5% morale (random); up to +10 Authority when authority low; +50 turns goal patience | Offsites/launch parties/PR wins: morale bump, credibility bump biggest when struggling, buys board patience | Keep all three coupled effects on one action — that's what makes it a strategic lever, not a toy |
| Abandonment process | Progress bar → at 100%: −1 settler, −8 Authority, housing becomes Abandoned; blocked/slowed by fixing morale | Regrettable attrition spiral: each completed departure costs credibility and leaves a dead seat that deters rehiring | Preserve the visible progress bar (attrition is forecastable) and the Abandoned-housing scar |
| Authority (core stat) | Trust in the player; 0 = game over; gains from milestones/goals/festivals/bubbles/decisions; losses from low morale, destroyed production, abandonment, death, decisions, promises, impatience | Founder credibility / brand trust; 0 = board ousts founder / company folds | Keep as the single lose-condition currency into which every failure ultimately drains |
| Settlement growth bubble | At 100% growth progress a bubble appears (80-turn lifespan): click → +1 stamina/+2 authority/+1 settler; miss → abandoned housing, authority loss | Inbound star hire / viral moment: seize it for compounding gains, ignore it and it turns into a negative story | Preserve the timed-window claim with a penalty (not merely forgone gain) for missing it |
| Impatience + low-authority damping | Overdue goals bleed Authority daily; bleed reduced up to 99%/90%/80% (Casual/Normal/Brutal+) when Authority already low | Stakeholder pressure on missed milestones; investors show forbearance to a founder already on the ropes | The damping curve is a deliberate anti-death-spiral valve — port it exactly |
| Seasons: Winter | 90–150 turns near year-end; 3 food buildings halt; fuel/fire-pit demand spikes; morale hit if short; provoke-attack cost doubles; cleanse cost −1 | Annual slow season/downturn: revenue lines pause, burn spikes (retention spend), aggressive moves cost more, defensive cleanup is cheaper | Keep the dual nature: downturns raise burn but discount fixing internal debt |
| Seasons: Summer + Rain | Default normal ops; random rain: fire crisis auto-resolves, water use −40%, deficit −10%/day | Normal market + tailwind events (bull PR cycle, cheap capital window) easing an ongoing burn line | Keep tailwinds random and temporary — never plannable |
| Seasons: Drought | Water production stops; water-shortage morale penalty spikes; food stops except river-adjacent at 75%; water scavenge up to 10 stamina; goal timer pauses | Funding winter / supply crunch: a whole capital class dries up, emergency sourcing is exorbitant, but the board pauses milestone clocks | Preserve the paired mercy rule (timer pause) with the resource chokehold |
| Non-summer scavenge penalty | Food/Water scavenging speed −20%, fewer bubbles | Off-cycle deal flow: one-off opportunities scarcer outside peak season | Small global modifier; keep as flat % |
| Infested areas | Red tint; passively produce zombies over time until cleansed | Churn/competitor strongholds: segments that continuously generate pressure (negative reviews, poaching, price wars) until actively addressed | Preserve "producer node" model: pressure has mappable sources, not just a global rate |
| Cleansing + backlash | Fighter action, 1–3 stamina by terrain+season; instantly spawns zombies there and in nearby infested areas and wakes nearby dormant zombies; success stops production | Turnaround initiative / competitive counter-offensive: attacking a churn source provokes an immediate flare-up before it resolves | The spawn-on-cleanse backlash is the key preserved beat: fixing root causes gets worse before it gets better |
| Dormant zombies + awareness | Claiming raises awareness; enough → nearby dormant zombies wake and attack, temporarily faster (except swamps) | Sleeping incumbents: loud market entry wakes competitors who respond fast; slow-moving niches (swamps) respond sluggishly | Keep awareness as a hidden meter raised by expansion, with terrain-dependent response speed |
| Surprise attacks from unexplored | Very high chance; Negative Strength penalty on the fighter | Blindside disruption from unresearched spaces hits harder than known threats | Preserve as a flat combat malus tied to origin-tile fog |
| Zombie herds | Large herds need 2 fighters (3 on Brutal) at marked sites | Entrenched dominant competitor accounts: need multiple retention/legal resources committed simultaneously | Keep the multi-unit commitment requirement scaling with difficulty |
| Provoked attacks | 1 stamina (2 in Winter) to force zombies to attack your fighter | Choosing the battlefield: preemptive litigation/price war on your terms | Keep as attention-priced initiative option with seasonal surcharge |
| Fighters (units) | Defend settlement; fight by entering/being entered; health/defence stats; XP from kills and cleanses | Retention & defense capability: CS/legal/security teams; gain institutional expertise from each crisis handled | Preserve unit-based (not abstract %) defense — capacity is discrete people |
| Fighter reinforcement | Spend stamina; supporters transfer health to active fighter; stacking damage reduction | Surge staffing a crisis: pulling other teams' capacity to back the lead team, with compounding protection | Keep the health-transfer cost (backup teams degrade) — surge support isn't free |
| Fighter healing | Base 0.2%/turn on claimed ground; Medicine speeds it; Combat Treatment up to 10%/turn at settlement | Team recovery: burnout heals slowly in the field, fast at HQ with wellbeing investment | Preserve the 50x home-vs-field recovery spread — it forces rotation decisions |
| Fighter death | Settler death + zombie count increases | Losing a key defender: headcount loss AND the pressure they contained is released | Keep the double penalty; it's why you retreat rather than fight to zero |
| Fighter training | Button in settlement; max count scales with population; time modified by decisions/upgrades; child-soldier situation as dark shortcut | Building retention teams: hiring capacity scales with org size; ethically-dubious shortcuts exist with morale/brand costs | Keep pop-gated unit cap; keep morally-costly fast-hire events as Situations |
| Fighter attrition (supply) | Food/Water/Fuel shortage damages fighters outside claimed areas | Under-resourced field teams burn out when deployed beyond supported markets | Preserve the "outside claimed area" condition — home-market ops are insulated |
| Leaders (system) | Chosen archetype; passive global trade-off; all unlocked in Revival | Founder archetype selection at company creation — a permanent strategic identity | Keep single-pick, run-long, trade-off-shaped (every buff has a tax) |
| Leader: Survivor | No bonuses | Generalist founder — baseline balanced play | Baseline row for tuning all others against |
| Leader: Soldier | Fighter abilities; morale harder to maintain | Wartime/defense-first founder: strong moats, culture strain | Preserve buff+tax pairing |
| Leader: Personal Trainer | Deficit stamina allowed at morale cost; higher food consumption | Hustle-culture founder: can overdraw attention (sprints/crunch) at culture and burn cost | The negative-stamina overdraft is a distinctive mechanic — keep exact |
| Leader: Economist | Stamina arrives annually in a lump instead of every 6 turns | Fundraise-cycle founder: attention/capital arrives in big rounds, not steady cash flow | Keep total income equal, cadence lumpy — pure cash-flow-shape gameplay |
| Leader: Hoarder | Auto-builds storage when a stockpile fills | Ops-automation founder: infrastructure scales itself reactively | Keep reactive (post-full) trigger, not predictive |
| Leader: Arctic Explorer | Cheap/fast explore+claim in Winter, expensive in Summer | Countercyclical founder: expands during downturns, overpays in booms | Season-inverted cost curve preserved 1:1 |
| Leader: Tyrant | Blocks leaving + low-morale authority loss while a Fighter garrisons HQ; worse authority loss without one | Command-and-control founder: retention by lock-in (non-competes, vesting cliffs) requiring enforcement presence | Keep the garrison condition — control costs standing enforcement capacity |
| Leader: Hermit | Buildings near unexplored areas produce more; away from frontier produce less | Frontier-niche founder: thrives on unexplored edges, decays in mapped mainstream markets | Keep spatial adjacency rule to force frontier-hugging layouts |
| Leader: Slumlord | Growth without housing; extra stamina+authority per population gain | Blitzscaling founder: hires past infrastructure, each hire pumps credibility and bandwidth | Pair with (unconfirmed) higher exit penalty: growth-at-all-costs fragility |
| Leader: Cub Scout | Free slow global exploration; higher targeted-explore cost | Organic-discovery founder: passive inbound market intel, expensive directed research | Keep the passive-vs-directed cost inversion |
| Modifiers (system) | Beyond-the-Bunkers expedition, map-specific buffs/debuffs; gated by Ambition/Danger; summed patience points adjust goal timers (+2%/neg pt, −1%/pos pt) | Market-entry conditions per venture: each new venture rolls condition cards; harsher condition sets earn longer board runway | Preserve the self-balancing patience math — difficulty buys time, advantages cost time |
| Modifier gating (Ambition/Danger) | Medicine-production modifiers need Ambition >=8; zombie/soldier modifiers need Danger > none | Deal parameters: high-ambition ventures unlock exotic terms; safe ventures never see threat clauses | Keep parameter-gated card pools |
| Goals (system) | Assigned objectives (11 types incl. explore/claim/produce/stockpile/maintain/storage/population/tech/morale/cleanse/kill; train-fighters campaign-only) | Board milestones/OKRs: research segment, enter market, hit revenue, hold KPI a quarter, headcount, ship platform, culture score, eliminate churn source | Map each goal type to one KPI genre 1:1; keep "maintain for a month" duration goals distinct from threshold goals |
| Goal patience timer | −1/day plus difficulty penalty (+0.44 Brutal, +0.528 Mega Brutal); overdue → impatience authority bleed | Board patience: milestone clocks tick faster in harsh macro; slippage erodes credibility gradually, not cliff-edge | Preserve gradual-bleed (never instant fail) and difficulty-scaled tick |
| Stable goals + timer pauses | Stable goals pause/extend the timer; timer stops during settlement attacks and droughts | Maintenance-mode KPIs pause the clock; boards stop counting during acknowledged crises (breach, funding winter) | Keep crisis-clemency automatic, not negotiated |
| Patience from events | Festival/Celebration patience is consumed before goal patience; goal can survive at negative own-patience | Goodwill banking: PR wins create a buffer spent before core credibility | Preserve the two-bucket consumption order |
| Goal-driven unlocks | Resource goals temp-unlock the resource below tech level; storage goals always unlock storage builds | Milestones come with enablement: the board opens doors (intros, tooling budget) needed to hit the target | Keep unlock-with-assignment coupling |
| Starting Events | Popup event at scenario start; same layout as other events (title/description/choices/images); advanced editor scripts events via Lua/text API | Founding-moment choice: opening scenario card (co-founder split, seed offer, pivot fork) that sets initial conditions; scenario author scripts them | Preserve as authored branching cards with immediate stat effects at Day 1 |
| Custom Scenarios editor | Update 13, Revival-exclusive; Steam Workshop publishing; 6 base + 5 advanced editors; scenario metadata, area layout, resource ADD/SET [-9999..9999], per-month seasons, scripted events | Scenario/campaign authoring for the business sim: community-built "industries" with custom maps, starting balance sheets, market cycles, event scripts | Keep ADD vs SET semantics and bracketed value ranges as the editor contract |
| Technology (adjacent mechanic) | Upgrades cost stamina+food+wood, take 25 turns; Tech 2 unlocks basic production rewards; Tech 5 unlocks Material; raises stamina generation | Product/platform maturity ladder: upgrades consume cash+attention over fixed lead time; unlock advanced tooling and raise decision bandwidth | Keep fixed 25-turn lead time — maturity can't be bought instantly |
| Situations (adjacent mechanic) | Pop-up dilemmas; reduce morale and block immigration until answered; some Winter-only, auto-resolve on season change | Crises/dilemmas that freeze the hiring pipeline until leadership decides; some are downturn-specific and evaporate with recovery | Preserve the answer-or-stall pipeline block — indecision has a concrete cost |
| Difficulty (meta) | Casual→Mega Brutal; sets starting authority, morale grace (−10% casual), impatience damping tiers, goal-timer penalty, zombie capability; Mega Brutal has multiple stacking levels | Macro-environment harshness setting: starting credibility, stakeholder tolerance, milestone clocks, competitive intensity | Keep as a bundle of the exact per-system knobs listed, incl. stacking "nightmare macro" tiers |

---

*Sources (all afterinc.wiki.gg): [Areas](https://afterinc.wiki.gg/wiki/Areas), [Resources](https://afterinc.wiki.gg/wiki/Resources), [Food](https://afterinc.wiki.gg/wiki/Food), [Wood](https://afterinc.wiki.gg/wiki/Wood), [Water](https://afterinc.wiki.gg/wiki/Water), [Medicine](https://afterinc.wiki.gg/wiki/Medicine), [Stamina](https://afterinc.wiki.gg/wiki/Stamina), [Morale](https://afterinc.wiki.gg/wiki/Morale), [Authority](https://afterinc.wiki.gg/wiki/Authority), [Settlement](https://afterinc.wiki.gg/wiki/Settlement), [Situations](https://afterinc.wiki.gg/wiki/Situations), [Fighters](https://afterinc.wiki.gg/wiki/Fighters), [Leaders](https://afterinc.wiki.gg/wiki/Leaders), [Soldier](https://afterinc.wiki.gg/wiki/Soldier), [Personal Trainer](https://afterinc.wiki.gg/wiki/Personal_Trainer), [Tyrant](https://afterinc.wiki.gg/wiki/Tyrant), [Hermit](https://afterinc.wiki.gg/wiki/Hermit), [Slumlord](https://afterinc.wiki.gg/wiki/Slumlord), [Cub Scout](https://afterinc.wiki.gg/wiki/Cub_Scout), [Modifiers](https://afterinc.wiki.gg/wiki/Modifiers), [Goals](https://afterinc.wiki.gg/wiki/Goals), [Custom Scenarios](https://afterinc.wiki.gg/wiki/Custom_Scenarios), [Difficulty](https://afterinc.wiki.gg/wiki/Difficulty), [Technology](https://afterinc.wiki.gg/wiki/Technology), [Campaign](https://afterinc.wiki.gg/wiki/Campaign), [A New Dawn](https://afterinc.wiki.gg/wiki/A_New_Dawn), [Z Com Fortress](https://afterinc.wiki.gg/wiki/Z_Com_Fortress), [Beginner Tips](https://afterinc.wiki.gg/wiki/Beginner_Tips), [Rewards](https://afterinc.wiki.gg/wiki/Rewards), [After Inc.](https://afterinc.wiki.gg/wiki/After_Inc.), [After Inc: Revived](https://afterinc.wiki.gg/wiki/After_Inc:_Revived)*
