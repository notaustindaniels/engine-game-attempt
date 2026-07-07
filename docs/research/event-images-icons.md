# Event Images and Icons Reference (After Inc: Revival — Custom Scenarios)

Target page: https://afterinc.wiki.gg/wiki/Custom_Scenarios/Event_Images_and_Icons_reference

## What is confirmed

- The page **exists** at the exact path above and is linked from the Custom Scenarios page as a
  reference alongside the Lua API reference (source: https://afterinc.wiki.gg/wiki/Custom_Scenarios).
- Its stated role: a reference of the event images and icons available to scenario events — i.e.
  events reference imagery from a predefined gallery rather than arbitrary uploads (this inference
  follows from the page being a "reference" list; marked **unconfirmed** as to whether custom
  uploads are also possible).
- The wiki maintains icon asset categories, e.g. "Category:Modifier icons"
  (https://afterinc.wiki.gg/wiki/Category:Modifier_icons surfaced as a real category page),
  confirming that game icons are organized by mechanic type.

## What could not be sourced

The actual list of image/icon identifiers, names, or naming conventions never appeared in any
indexed snippet. Queries tried (~6 distinct): exact page path in quotes; "event images and icons
reference list"; "image names icons" site-scoped; category-page probes. Only the reference's
existence and the Modifier-icons category surfaced.

**Consequence for the app** (decision, not wiki fact — cross-referenced in GAPS.md): event image
selection is modeled as a select field whose option pool (`eventImages`) is supplied by the active
domain schema, mirroring the game's pick-from-gallery pattern without fabricating the game's actual
gallery identifiers. Each domain ships its own domain-native gallery labels; themes supply the
renderable artwork.

## Unsourced / Gaps

1. The gallery's image/icon identifiers and display names — not indexed.
2. Gallery size, organization, and any naming convention — not indexed.
3. Whether events can use player-uploaded imagery vs gallery-only — not indexed.
