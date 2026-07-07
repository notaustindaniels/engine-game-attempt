# Draft Zod schemas — all 11 editors

Consolidated field-by-field spec for the Scenario Creator, merging editors-base.md,
editors-advanced.md, and concepts.md. Sourced facts carry their wiki URL; reconstructed
fields carry `GAP:` markers cross-referenced in GAPS.md (B-rows). These drafts are the
contract the app implements in `src/engine/blueprint.ts` + `src/engine/scenario.ts`
(the implementation builds these shapes programmatically from the blueprint so the UI,
defaults, and import validation cannot drift apart; option pools marked `domain.*`
are supplied by the active domain schema per the Native Translation rule).

Notation: `CS` = https://afterinc.wiki.gg/wiki/Custom_Scenarios

```ts
import { z } from 'zod';

// ——— shared mechanical pieces ———————————————————————————————

// ADD adds the amount to the default value; SET overrides it. (CS, Resources section)
const resourceOp = z.enum(['ADD', 'SET']);

// CS Resources section: "Ranges from -9999 to 9999" (sourced verbatim range)
const resourceAmount = z.number().min(-9999).max(9999);

// One entry per domain resource id (after-inc: the 7 sourced resource types,
// https://afterinc.wiki.gg/wiki/Resources; editor linkage GAP:B5)
const resourceOps = z.record(
  z.string(), // domain.resources item id
  z.strictObject({ op: resourceOp, amount: resourceAmount }),
);

// ——— base category (6 editors, CS) ——————————————————————————

// 1. Basic Details — purpose sourced ("used when searching"); fields GAP:B1
const basicDetails = z.strictObject({
  name: z.string().min(1).max(80),        // GAP:B1 (length caps reconstructed)
  description: z.string().max(500),       // GAP:B1
});

// 2. Area Layout — purpose sourced; option pool GAP:B2
const areaLayout = z.strictObject({
  layout: z.enum(domain.areaLayouts),     // after-inc pool: the two sourced map names
});

// 3. Starting Events — list sourced (CS); item shape GAP:B3 (single-source)
const startingEvents = z.strictObject({
  events: z.array(z.strictObject({
    title: z.string().min(1).max(80),
    description: z.string().max(500),
    buttonText: z.string().min(1).max(40),
    image: z.enum(domain.eventImages),    // gallery identifiers GAP:B13
  })).min(1).max(10),                     // "additional events can be added" (CS); cap GAP
});

// 4. Starting Values — purpose sourced; fields + ranges GAP:B4
const startingValues = z.strictObject({
  morale: z.number().int().min(0).max(100),
  authority: z.number().int().min(0).max(100),
  population: z.number().int().min(0).max(100),
});

// 5. Resources — fully sourced semantics (CS): type + ADD/SET + amount [-9999..9999]
const resources = z.strictObject({ stockpiles: resourceOps });

// 6. Seasons — per-month season sourced (CS: Winter/Summer/Drought); 12 months GAP:B6
const seasons = z.strictObject({
  month1: z.enum(domain.seasons), /* … */ month12: z.enum(domain.seasons),
});

// ——— advanced category (5 editors; only #7's identity is sourced) ————

// 7. Custom Events — editor sourced (CS): scripts uploaded as text/lua; item shape GAP:B8
const customEvents = z.strictObject({
  events: z.array(z.strictObject({
    title: z.string().min(1).max(80),
    scriptFileName: z.string().min(1).max(120), // .lua/.txt kinds sourced
    scriptBody: z.string().max(20000),          // inline body GAP:B8 (no API list exists, GAP:A9)
    image: z.enum(domain.eventImages),
  })).min(0).max(20),
});

// 8. Goals — editor name GAP:B7; content grounded in https://afterinc.wiki.gg/wiki/Goals
const goals = z.strictObject({
  goals: z.array(z.strictObject({
    type: z.enum(domain.goalTypes),       // the 11 sourced goal types
    targetAmount: z.number().int().min(0).max(9999), // range GAP:B9
    patience: z.number().int().min(0).max(999),      // mechanic sourced; range GAP:B9
    stable: z.boolean(),                  // stable goals sourced (Goals page)
  })).min(1).max(20),
});

// 9. Pressure — editor name GAP:B7; mechanics sourced from Areas/Fighters pages
const pressure = z.strictObject({
  startingIntensity: z.number().int().min(0).max(100), // GAP:B10
  growthRate: z.number().int().min(0).max(100),        // GAP:B10
  infestedAreas: z.number().int().min(0).max(50),      // producer nodes sourced; range GAP:B10
  surpriseThreats: z.boolean(),                        // surprise-attack mechanic sourced
  cleanseBacklash: z.boolean(),                        // cleanse-backlash mechanic sourced
});

// 10. Defense — editor name GAP:B7; mechanics sourced from Fighters page
const defense = z.strictObject({
  startingUnits: z.number().int().min(0).max(10),      // GAP:B11
  healingRatePct: z.number().min(0).max(10),           // 0.2–10 %/turn spread sourced
  reinforcement: z.boolean(),                          // reinforcement mechanic sourced
  supplyAttrition: z.boolean(),                        // supply-attrition mechanic sourced
});

// 11. Modifiers — editor name GAP:B7; grounded in Modifiers + Difficulty pages
const modifiers = z.strictObject({
  difficulty: z.enum(domain.difficulties), // 4 sourced tiers; placement GAP:B12
  active: z.array(z.strictObject({
    modifier: z.enum(domain.modifiers),    // family list single-source, GAP:A14
    patiencePoints: z.number().int().min(-10).max(10), // economy sourced; range GAP:B12
  })).min(0).max(10),
});

// ——— document envelope ———————————————————————————————————————
const scenario = z.strictObject({
  formatVersion: z.literal(1),
  domainId: z.string(),
  editors: z.strictObject({
    basicDetails, areaLayout, startingEvents, startingValues, resources, seasons,
    customEvents, goals, pressure, defense, modifiers,
  }),
});
```

Domain pools referenced above (`domain.*`) are validated separately by
`src/domain/types.ts` (`domainSchemaZ`); after-inc pool contents and their sources are
listed in `src/domain/afterInc.ts`.
