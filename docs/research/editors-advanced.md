# Advanced Category Editors (After Inc: Revival — Custom Scenarios)

Research target: the ADVANCED category of the Custom Scenarios / Scenario Creator editor
(https://afterinc.wiki.gg/wiki/Custom_Scenarios). Direct page fetches are blocked in this environment;
facts were surfaced through server-side search snippets. The wiki page is a declared stub, and the
advanced category is even thinner than the base category: only ONE of the five advanced editors could
be positively identified. Everything else is recorded as a gap, per the no-invention rule.

## Editor inventory

Confirmed structural fact (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios): the editor has a
base category with six editors and an **advanced category with five editors**.

| # | Editor | Status |
|---|--------|--------|
| 1 | Custom Events | **Confirmed** — identified by a sequence probe: the section directly following the base Seasons section describes it |
| 2–5 | (names unknown) | **Unsourceable** — see Unsourced / Gaps and /docs/research/GAPS.md |

## 1. Custom Events  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): an editor for creating your own custom events; these events can
trigger multiple things via the API. Scripts are uploaded as text or Lua files. The page points to a
"Custom Scenarios/Writing Events" subpage for authoring guidance.

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| (event list) | list (add-more) | — | Multiple custom events can be created. | Confirmed (plural "events") |
| Script upload | file upload | `.txt` or `.lua` | Uploads the text or Lua file containing the event's script; the script triggers effects through the game's API. | Confirmed (file kinds stated) |
| (per-event metadata fields) | unknown | unknown | Any name/description/trigger-condition fields the editor shows are not documented in any indexed snippet. | **Not confirmed — gap** |

Related pages confirmed to exist (contents not indexed — see lua-api.md and event-images-icons.md):
- https://afterinc.wiki.gg/wiki/Custom_Scenarios/Lua_API_reference
- https://afterinc.wiki.gg/wiki/Custom_Scenarios/Event_Images_and_Icons_reference
- "Custom Scenarios/Writing Events" (linked from the page; exact URL unverified)

## Editors 2–5 — names unsourceable

Roughly 12 further targeted queries (heading probes, before/after sequence probes, candidate-name
probes for Goals / Zombies / Fighters / Morale / Authority / Buildings / Modifiers / Difficulty,
range-sentence attribution probes) could not surface the remaining advanced editor names. What IS
sourced, from marketing copy and adjacent wiki pages, constrains what they cover:

- The Steam store page (https://steamcommunity.com/app/3337140 — **not wiki**, flagged) says players
  can tweak "Morale, Authority, Seasons, Zombies, Fighters and more" and, per-area, "specify
  resources, terrain type, exploration status, zombie numbers, infestations and more".
- The Custom Scenarios page contains three orphaned range sentences — values [0-100], [0-14], and
  [1-7] — indexed after the Resources section's [-9999–9999] text, whose section attribution could
  not be pinned down (also recorded by editors-base.md). They plausibly belong to advanced editors.
- Concept pages with strong coverage that an advanced editor would configure: Goals
  (https://afterinc.wiki.gg/wiki/Goals — 11 goal types), Modifiers
  (https://afterinc.wiki.gg/wiki/Modifiers — patience economy), Fighters
  (https://afterinc.wiki.gg/wiki/Fighters), zombie behavior (via
  https://afterinc.wiki.gg/wiki/Areas — infested areas produce zombies over time).

**App reconstruction decision** (documented, not asserted as wiki fact): the app ships five advanced
editors — Custom Events (confirmed) plus Goals, Pressure/Zombies, Defense/Fighters, and Modifiers —
whose names and fields are reconstructions grounded in the sourced concept-page mechanics above.
Every reconstructed editor/field carries a `GAP:` source marker in the blueprint and a corresponding
entry in GAPS.md.

## Unsourced / Gaps

1. **Names of advanced editors 2–5.** Queries tried: "advanced category five editors" (multiple
   phrasings), section-heading TOC probes, before/after sequence probes anchored on the Seasons and
   Custom Events section texts, candidate names ("Goals editor", "Zombies editor", "Fighters",
   "Morale", "Authority", "Buildings", "Modifiers", "Difficulty"). Result: no snippet ever showed a
   second advanced-editor heading.
2. **Custom Events editor's non-script fields.** Only the script upload (text/lua) is documented.
3. **Attribution of the [0-100], [0-14], [1-7] range sentences.** Present on the page, section
   unknown; deliberately unattributed (also gap #5 in editors-base.md).
4. **"Custom Scenarios/Writing Events" subpage content and URL.** Referenced; not indexed.
5. **Any defaults for advanced-editor fields.** None stated anywhere in retrieved content.
