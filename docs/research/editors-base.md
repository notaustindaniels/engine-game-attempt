# Base Category Editors (After Inc: Revival — Custom Scenarios)

Research target: the BASE category of the Custom Scenarios / Scenario Creator editor, as documented on the
official wiki (https://afterinc.wiki.gg/wiki/Custom_Scenarios). All facts below were extracted via search-result
snippets of that page (direct fetching was unavailable). The wiki page is explicitly marked as a **stub**, so
several editor sections currently carry only a one-line description and no field breakdown — those limits are
recorded honestly rather than filled in with guesses.

Feature context (confirmed via search snippets of the same page):

- Custom Scenarios were introduced in **Update 13** and are exclusive to **After Inc: Revival**; scenarios are
  built in the **Scenario Creator** and can be published to the **Steam Workshop**.
- The editor is split into two categories: a **base category with six editors** and an **advanced category with
  five editors** (advanced is out of scope for this document).
- Page-wide notation convention stated by the wiki: values listed in brackets, e.g. `[0-100]`, denote the
  allowed value range for that field.

## Editor inventory

The six base-category editors (all sourced from https://afterinc.wiki.gg/wiki/Custom_Scenarios):

1. **Basic Details** — basic metadata about the scenario; used when players search for scenarios.
2. **Area Layout** — picks the area layout used for the scenario's region.
3. **Starting Events** — the popup event(s) shown when the scenario starts; extra events can be added, all sharing one fixed layout.
4. **Starting Values** — the values the game starts with when the scenario is first loaded.
5. **Resources** — adds to, or sets/overrides, the default starting values of resources.
6. **Seasons** — customises the default weather/seasons of the settlement, month by month.

Note on editor #6: search snippets confirm this weather/seasons editor is one of the six base editors, and one
search summary of the wiki page named it the "Seasons" editor. The literal section-heading text was never shown
verbatim in a snippet, so treat the exact name "Seasons" as very likely but not letter-perfect confirmed.

---

## 1. Basic Details  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): basic details about your scenario; this information is used when searching
(i.e. it is the metadata other players search against).

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| — (none listed on wiki) | — | — | The wiki section is a one-liner; no individual fields are enumerated. | Section purpose confirmed; fields not documented on wiki |
| Scenario name / description | text (presumed) | not stated | Search summaries *suggested* name and description are the searchable metadata, but no snippet showed these as actual labelled fields. | **Unconfirmed — inference only** |

## 2. Area Layout  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): lets you pick the area layout for the region. On the wiki page this
single sentence is immediately followed by the Starting Events section — i.e. no field list is published.

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| Area layout | picker (presumed) | options not stated | Chooses which area layout the scenario's region uses. Number/names of available layouts not visible in any snippet. | Purpose confirmed; field type and options **unconfirmed** |

## 3. Starting Events  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): a popup event that appears when the scenario starts. Additional events can be
added, but every event uses the same layout. The wiki text ends with "…all of them have the same layout:"
followed by a list, but the list items themselves never appeared in any search snippet (the indexed excerpt is
cut off at exactly that point).

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| (event list) | list (add-more) | — | One popup event exists by default at scenario start; more can be added. | Confirmed |
| (per-event layout fields) | unknown | unknown | A fixed shared layout exists for every event; its fields (e.g. title/text/image) could not be surfaced. Probed with "Title", "Description", "Headline", "Body", "Button Text", "Image", "Icon" — no snippet confirmed any of them. | **Not confirmed — gap** |

Related: search summaries indicate the Custom Scenarios page references a subpage about writing your own events
(reported as "Custom Scenarios/Writing Events"); its content was not retrievable, and the exact URL is unconfirmed.

## 4. Starting Values  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): the starting values in effect when the game is first loaded. A snippet probe
confirmed that on the page, this sentence is immediately followed by the Resources section's description —
so the wiki currently lists **no individual fields** for Starting Values.

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| — (none listed on wiki) | — | — | Section is a one-line stub. Probes for candidate fields ("day", "survivors", "population", "morale", "scouts", "fighters") returned nothing attributable to this section. | Section purpose confirmed; fields not documented on wiki |

Note: one search summary paraphrased the ADD/SET resource controls as belonging to "Starting Values"; a
follow-up sequence probe ("what text follows 'when you load the game at first'") showed those controls actually
sit under the **Resources** section — the earlier attribution was summarizer conflation.

## 5. Resources  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): lets you add to, or set (override), the default values of your resources.
This is the only base section with a confirmed field-by-field breakdown, recovered in page order via
sequential snippet probes.

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| Resource Type | enum/dropdown (type inferred) | resource list not stated | Selects which resource the entry modifies. Switching to a different resource type **preserves values previously set** (they persist rather than being cleared). | Name + semantics confirmed; widget type unconfirmed; option list not shown |
| ADD / SET mode | enum with 2 modes | ADD, SET | Changes the entry's default type: **ADD adds the amount to the existing/default value; SET overrides the existing value**. This ADD-vs-SET semantic is documented only in this Resources editor among the base six. | Semantics + both options confirmed; the field's on-screen label was never shown (unconfirmed) |
| Amount | number | [-9999 – 9999] | The amount to add (ADD mode) or to set the resource to (SET mode). Negative values are allowed. | Confirmed (range stated verbatim: "Ranges from -9999 to 9999") |

Confirmed page order of the three controls: Resource Type -> ADD/SET -> Amount.

## 6. Seasons  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios)

Wiki description (paraphrased): customises the default weather and seasons experienced by the settlement.
You set the season for each month individually.

| Field | Type | Range/Options | Semantics / Notes | Confirmed |
|---|---|---|---|---|
| Season (one value per month) | enum per month | Winter, Summer, Drought | The season assigned to each calendar month; the value can be changed month by month between the three listed options. | Confirmed (options stated verbatim; only these three were named — a possible "normal/default" option was never mentioned) |
| Month selector | per-month control (12 entries presumed) | not stated | "Set the season each month" implies one entry per month; the wiki never states how many months or how they are presented. | Semantics confirmed; structure/count **unconfirmed** |

---

## Unsourced / Gaps

Roughly 39 distinct WebSearch queries were run against afterinc.wiki.gg (section-name queries, quoted field
names, quoted sentence-fragment "what comes before/after X" probes, range probes, TOC/heading probes). The wiki
page itself is a declared stub, which is the root cause of most gaps.

1. **Basic Details — field list.** Missing entirely. Queries tried: "Basic Details editor fields", "name
   description author image", quoted "used when searching" + what-follows probe, "Name Description bullet list",
   "Difficulty Random Seed Leader Music". Result: only the one-line section description is indexed; no field
   names, types, limits, or defaults are published on the wiki.
2. **Area Layout — layout options.** Missing. Queries tried: "region size options", "preset layouts",
   what-follows probe on "pick the area layout for the region" (which proved the section has no body beyond one
   sentence). No count or names of layouts confirmed.
3. **Starting Events — the shared event layout's fields.** Missing. The page literally ends the indexed excerpt
   at "…all of them have the same layout:". Queries tried: bullet-list probe, quoted candidates ("Headline",
   "Event Title", "Body", "Button Text", "title text image icon"). None confirmed.
4. **Starting Values — field list and ranges.** Missing. The section body is a single sentence (proven by a
   sequence probe). Candidate-field queries (day/survivors/morale/population/scouts/fighters) confirmed nothing.
5. **Three unattributed range statements.** The page contains the standalone sentences "All values range from
   0 to 100.", "All values range from 0 to 14.", and "All values range from 1 to 7." — indexed *after* the
   Resources "Ranges from -9999 to 9999" text. Which editor sections they head could not be pinned down
   (before/after and heading probes all returned truncated context). The 1–7 sentence repeatedly co-occurred
   with the weather/seasons description, so it plausibly borders the Seasons section, but no snippet showed the
   attachment explicitly. They may belong to advanced-category editors (out of scope). Do not assign these
   ranges to any base field without further confirmation.
6. **Exact heading text of editor #6 ("Seasons").** Functionality and base-category membership confirmed; the
   literal heading string was never displayed in a snippet.
7. **On-screen label of the ADD/SET control in Resources.** Semantics fully confirmed; the field's actual label
   (e.g. "Type", "Mode") was not shown.
8. **Resource Type option list.** The set of selectable resources in the Resources editor is not stated on the
   Custom Scenarios page (the separate https://afterinc.wiki.gg/wiki/Resources page exists but no snippet tied
   its list to the editor's dropdown, so it is not reproduced here).
9. **Default values.** No default value for any base-editor field is stated anywhere in the retrieved content.
10. **"Writing Events" subpage.** Referenced by the Custom Scenarios page per one search summary (reported path
    "Custom Scenarios/Writing Events"); content and exact URL unconfirmed.
11. **Advanced category editor names** (out of scope, noted for completeness): never enumerated in any snippet.
    A marketing blurb (Steam store page, not the wiki) mentions tweaking "Morale, Authority, Seasons, Zombies,
    Fighters and more", and one snippet mentioned an advanced editor for custom events triggered "via the API",
    but no wiki-sourced list of the five advanced editors was obtainable.
