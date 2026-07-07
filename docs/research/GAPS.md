# GAPS — Unsourceable fields and documented reconstruction decisions

Rule applied throughout Phase 1 (spec: "Flag any field that cannot be sourced… do NOT invent
fields"): nothing below is asserted as a wiki fact. Where the app needs a field the wiki does not
document, the field is a **flagged reconstruction** — grounded in sourced concept-page mechanics,
marked in the blueprint with a `GAP:` source marker, and listed here. Companion docs:
editors-base.md, editors-advanced.md, lua-api.md, event-images-icons.md, concepts.md.

Root cause of most gaps: https://afterinc.wiki.gg/wiki/Custom_Scenarios is a declared stub, and in
this environment only search-snippet access to the wiki was possible (direct fetches are blocked by
network policy), so anything the page does not spell out in indexed text is unreachable.

## A. Wiki facts that could not be sourced

| # | Gap | Where it bites | Queries/technique tried |
|---|-----|----------------|--------------------------|
| A1 | Basic Details editor: field list | Editor 1 | Section probes; candidate fields (name/description/author/difficulty) — only the "used when searching" purpose line is indexed |
| A2 | Area Layout editor: layout options/count | Editor 2 | What-follows probes prove the section is one sentence |
| A3 | Starting Events: the shared per-event field layout | Editor 3 | Page text is cut at "…all of them have the same layout:"; candidate-field probes failed. One search summary (single-source) reported title/description/choice buttons/images |
| A4 | Starting Values editor: field list and ranges | Editor 4 | Sequence probe shows the section is one sentence |
| A5 | Resources editor: the selectable resource list | Editor 5 | Resource page list (Food/Water/Wood/Fuel/Medicine/Stone/Material) is sourced, but no snippet ties it to the editor dropdown |
| A6 | Seasons editor: literal heading text; month-entry count | Editor 6 | Options (Winter/Summer/Drought) and per-month semantics ARE sourced |
| A7 | Names of advanced editors 2–5 | Editors 8–11 | ~12 probes (headings, before/after anchors, candidate names) — only the Custom Events editor is identifiable |
| A8 | Custom Events editor: fields beyond script upload | Editor 7 | Only "text or lua" upload is sourced |
| A9 | Lua API: function/callback inventory | Custom Events | Exact-path and function-name probes return only the parent-page reference |
| A10 | Event Images and Icons reference: the identifier list | Event image pickers | Page existence confirmed; contents unindexed |
| A11 | Attribution of the three orphaned range sentences [0-100], [0-14], [1-7] on the Custom Scenarios page | Any numeric field they govern | Before/after and heading probes; deliberately left unattributed |
| A12 | Any default values, for any editor field | All editors | None stated anywhere in retrieved content |
| A13 | Numeric zombie parameters (spawn rates, strength, awareness thresholds); morale scale bounds; starting Authority per difficulty | Pressure/starting-value ranges | See concepts.md gaps |
| A14 | Full modifier list with per-modifier patience values (family list is single-source) | Modifiers editor pool | See concepts.md gaps |

## B. Reconstruction decisions in the app (each carries a `GAP:` marker in `src/engine/blueprint.ts`)

| # | Decision | Grounding (sourced) | Flag |
|---|----------|---------------------|------|
| B1 | Basic Details fields = name, description | Editor purpose: "used when searching" (Custom Scenarios page); search metadata implies name/description | `GAP:A1` |
| B2 | Area Layout = one select whose options come from the domain's `areaLayouts` pool; after-inc pool = "A New Dawn", "Ancient Treasures" (the two sourced map names) | Editor purpose sourced; map names sourced (A_New_Dawn page; Z_Com_Fortress page mentions the Ancient Treasures map) | `GAP:A2` |
| B3 | Starting Event item = title, description, buttonText, image | Single-source field list (title/description/choice buttons/images) in concepts.md | `GAP:A3` |
| B4 | Starting Values fields = morale [0-100], authority [0-100], population [0-100] | Mechanics sourced from Morale/Authority/Settlement pages; the specific fields, and all three ranges, are reconstructions (A4, A11–A13). Morale/authority modeled on the page-wide bracket notation with the unattributed [0-100] | `GAP:A4,A11,A13` |
| B5 | Resources editor option pool = the 7 sourced resource types | Resources concept page | `GAP:A5` (editor linkage) |
| B6 | Seasons editor = 12 per-month selects | Per-month semantics sourced; the count 12 is calendar-standard, not wiki-stated | `GAP:A6` |
| B7 | Advanced editor names 8–11 = Goals, Pressure, Defense, Modifiers | Advanced category has exactly five editors (sourced); mechanics grounded in Goals/Areas/Fighters/Modifiers/Difficulty concept pages | `GAP:A7` |
| B8 | Custom Events item = title, scriptFileName (.lua/.txt), scriptBody, image | Script upload kinds sourced; rest reconstructed (A8, A9) | `GAP:A8,A9` |
| B9 | Goals item = type (11 sourced goal types), targetAmount [0-9999], patience [0-999] turns, stable toggle | Goal types, patience mechanic, and stable goals sourced (Goals page); both ranges reconstructed | `GAP:A12` |
| B10 | Pressure fields = startingIntensity [0-100], growthRate [0-100], infestedAreas [0-50], surpriseThreats toggle, cleanseBacklash toggle | Infestation producers, surprise attacks, cleanse backlash all sourced (Areas/Fighters); every range reconstructed | `GAP:A13` |
| B11 | Defense fields = startingUnits [0-10], healingRatePct [0-10], reinforcement toggle, supplyAttrition toggle | Fighter mechanics sourced (Fighters page; 0.2–10 %/turn healing spread sourced); field set and unit range reconstructed | `GAP:A13` |
| B12 | Modifiers editor = difficulty select (4 sourced difficulties) + list of {modifier, patiencePoints [-10..10]} | Difficulty tiers and patience-point economy sourced (Difficulty/Modifiers pages); placement of difficulty here, and the ±10 range, reconstructed | `GAP:A7,A14` |
| B13 | Event-image galleries are domain-supplied option pools with domain-native labels | The game's gallery reference exists but its identifiers are unindexed (A10) | `GAP:A10` |
| B14 | The unattributed [0-14] and [1-7] ranges are NOT used anywhere | Refusing attribution is the honest reading of A11 | — |
| B15 | Leaders and terrains pools are carried by every domain schema (10 sourced archetypes, 5 sourced terrain classes in after-inc) but no editor field selects from them | Leaders are a play-time choice per the Leaders page; terrain classes are sourced concept data subsumed by the area-layout presets. No editor evidence ties either to the Scenario Creator | — |
| B16 | Micro-constraints invented for a workable editor and nowhere sourced: all text length caps (name 80, descriptions 500, button 40, file name 120, script body 20000), all list caps (starting events ≤10, custom events ≤20, goals ≤20, modifiers ≤10), and every defaultValue (A12: no defaults are sourced anywhere) | Practical editor limits only; never presented as wiki facts | `GAP:B16` / umbrella for A12 |

Every `GAP:` marker in the blueprint names the GAPS.md row(s) it depends on — usually a
B-row (reconstruction decision, which in turn cites its A-rows), occasionally an A-row
directly — so the adversarial verification lane can mechanically cross-check app fields
against this file.
