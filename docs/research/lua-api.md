# Lua API Reference (After Inc: Revival — Custom Scenarios)

Target page: https://afterinc.wiki.gg/wiki/Custom_Scenarios/Lua_API_reference

## What is confirmed

- The page **exists** and is linked from the Custom Scenarios page as the API reference
  (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios, which points readers to
  "Custom Scenarios/Lua API reference" alongside the "Event Images and Icons reference").
- The API's role (source: the Custom Scenarios page's custom-events section): custom events
  created in the advanced events editor "trigger multiple things via the API"; event scripts are
  uploaded as **text or Lua files**.
- Scripting is therefore event-driven: a scenario bundles Lua scripts that the game invokes for
  custom events. A "Custom Scenarios/Writing Events" authoring guide is referenced from the page.

## What could not be sourced

The page's actual content — function names, callback signatures, readable/writable game state —
never appeared in any indexed snippet. Queries tried (~8 distinct): the exact page path in quotes;
"Lua API reference functions"; Get/Set/Trigger + mechanic-name combinations (zombies, morale,
authority, resources, events); "callbacks list"; site-scoped variants. Search results returned the
parent page reference only, or unrelated games' Lua wikis.

**Consequence for the app** (decision, not wiki fact — cross-referenced in GAPS.md): the Custom
Events editor models a script attachment as a file name plus inline script text, with no
function-level validation, because no function list exists to validate against. No Lua function
names are fabricated anywhere in the app or docs.

## Unsourced / Gaps

1. Complete function/callback inventory of the Lua API — not indexed.
2. Which game state is readable vs writable from scripts — not indexed.
3. Event trigger conditions and lifecycle hooks — not indexed.
4. Relationship between the Lua API and non-event editors (whether scripts can alter resources,
   goals, seasons, etc. at runtime) — only the generic "trigger multiple things" claim is sourced.
