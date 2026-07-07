import type { DomainSchema } from '../domain/types.ts';
import type { Scenario, ResourceOp } from '../engine/scenario.ts';
import type { AreaCell } from '../engine/areaMap.ts';
import {
  parseScenarioScript,
  type ScenarioScript,
} from '../engine/scenarioScript.ts';

/**
 * GameRules: everything the engine needs to play, derived ONCE from the
 * exported scenario JSON plus the domain's option pools. The scenario is
 * the sole content source; the domain supplies pool ORDER (the slot
 * convention, GAPS.md C4) and, at the UI layer only, language. Numeric
 * tuning constants are engine rules (GAPS.md C5), scaled by sourced wiki
 * values wherever one exists — each is annotated below.
 */

/** Mechanic roles carried by pool positions — identical in every domain. */
export const RESOURCE_SLOTS = {
  /** Consumed by the population every turn ("food"). */
  staple: 0,
  /** Consumed every turn; produced by the start area + corridors ("water"). */
  demand: 1,
  /** Construction input ("wood"). */
  construction: 2,
  /** Consumed during the lean season ("fuel"). */
  seasonal: 3,
  /** Speeds defender recovery ("medicine"). */
  recovery: 4,
  /** Heavy construction input ("stone"). */
  heavy: 5,
  /** Advanced input; deals unlock at tech 5 ("material"). */
  advanced: 6,
} as const;

/** Terrain slot k produces resource PRODUCTION_BY_TERRAIN[k] (null = none). */
export const TERRAIN_PRODUCES: readonly (number | null)[] = [
  RESOURCE_SLOTS.staple, // grasslands → food (sourced)
  RESOURCE_SLOTS.construction, // forests → wood (sourced; fuel secondary below)
  RESOURCE_SLOTS.recovery, // swamps → medicine (sourced)
  RESOURCE_SLOTS.heavy, // mountains → stone (sourced)
  null, // cities → no default production (sourced)
];

export const SEASON_SLOTS = { normal: 0, lean: 1, crunch: 2 } as const;

export interface DifficultyTier {
  /** Impatience authority bleed reduction at low authority (sourced 99/90/80%). */
  impatienceDamping: number;
  /** Extra patience ticks per turn (sourced +0.44 Brutal, +0.528 Mega Brutal). */
  patienceTickPenalty: number;
  /** Scales pressure spawn and growth. */
  pressureMultiplier: number;
  /** Morale threshold below which authority bleeds (casual grace sourced). */
  lowMoraleThreshold: number;
}

/** Difficulty pool slots 0..3. */
export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  { impatienceDamping: 0.99, patienceTickPenalty: 0, pressureMultiplier: 0.75, lowMoraleThreshold: 10 },
  { impatienceDamping: 0.9, patienceTickPenalty: 0, pressureMultiplier: 1, lowMoraleThreshold: 20 },
  { impatienceDamping: 0.8, patienceTickPenalty: 0.44, pressureMultiplier: 1.25, lowMoraleThreshold: 20 },
  { impatienceDamping: 0.8, patienceTickPenalty: 0.528, pressureMultiplier: 1.5, lowMoraleThreshold: 20 },
];

/**
 * Engine tuning constants (GAPS.md C5). Time: 1 turn = 1 day, 30 turns per
 * month (sourced arithmetic), 12 months per year (seasons editor).
 */
export const TUNING = {
  turnsPerMonth: 30,
  /** Default stockpile before the Resources editor's ADD/SET ops apply. */
  resourceBaseline: 10,
  /** Base storage cap per resource; each expansion adds +60% of base (sourced %). */
  storageBaseCap: 100,
  storageExpansionPct: 0.6,
  /** Stamina: +1 every 6 turns (sourced cadence); soft cap slows hoarding (sourced). */
  staminaRegenInterval: 6,
  staminaSoftCap: 8,
  staminaHardCap: 24,
  /** Fundraise-cycle leader: one annual lump instead of the 6-turn drip. */
  staminaYearLump: 60,
  staminaYearLumpCap: 60,
  /** Per-person per-turn consumption (scaled from sourced 2.25 food/mo : 2.38 settlers). */
  consumeStaple: 0.032,
  consumeDemand: 0.024,
  consumeSeasonal: 0.03,
  /** Per-turn production (sourced monthly rates / 30). */
  produceStaple: 0.075, // crop farm 2.25/month
  produceConstruction: 0.04, // lumberyard 1.2/month
  produceRecovery: 0.02,
  produceHeavy: 0.02,
  produceFuelSecondary: 0.02, // forests also yield fuel (sourced)
  produceDemandStart: 0.1, // start area generates demand/water
  produceDemandRiver: 0.02, // corridor-adjacent claimed areas
  /** Drought mercy: river-adjacent staple production runs at 75% (sourced). */
  crunchRiverFactor: 0.75,
  /** Deficit morale damage per turn. */
  deficitMoraleStaple: 0.8,
  deficitMoraleDemand: 0.5,
  deficitMoraleSeasonal: 0.6,
  moraleRecovery: 0.15,
  moraleRecoveryCeiling: 70,
  overcrowdMorale: 0.3,
  overcrowdLeanFactor: 1.5,
  /** Festival (sourced: +6.5–7.5% morale, +10 authority when low, +50 patience). */
  festivalMoraleMin: 6.5,
  festivalMoraleMax: 7.5,
  festivalAuthorityLow: 10,
  festivalAuthorityHigh: 2,
  festivalPatience: 50,
  festivalStamina: 2,
  festivalStaple: 5,
  /** Population growth/abandonment. */
  growthPerTurn: 0.004,
  growthMoraleBonus: 0.0004,
  growthMoraleGate: 60,
  abandonPerTurn: 0.006,
  abandonAuthorityCost: 8, // sourced: abandonment completing = −8 authority
  lowMoraleAuthorityBleed: 0.05,
  /** Goal economy. */
  goalCompleteAuthority: 8,
  impatienceBleed: 0.15,
  impatienceDampingAuthority: 30,
  maintainTurns: 30, // "for up to one month" (sourced)
  /** Map-completion authority bonuses (sourced). */
  exploreHalfBonus: 6,
  exploreAllBonus: 6,
  claim40Bonus: 6,
  claim80Bonus: 6,
  claimAllBonus: 10,
  /** Pressure. */
  spawnBase: 0.02,
  spawnPerGrowthRate: 0.001,
  spawnPerIntensity: 0.0005,
  intensityGrowthFactor: 0.002,
  areaThreatCap: 10,
  migrateEveryTurns: 10,
  migrateMinThreats: 3,
  areaHealthMax: 100,
  threatAreaDamage: 2,
  areaLossAuthority: 4,
  settlementAttackMorale: 0.2,
  settlementAttackAuthority: 0.1,
  cleanseIntensityDrop: 5,
  cleanseBacklashLocal: 2,
  cleanseBacklashAdjacent: 1,
  awarenessClaimsPerWake: 3,
  /** Combat. */
  defenderHealthMax: 100,
  defenderBaseStrength: 1,
  combatDamageBase: 5,
  combatDamagePerThreat: 3,
  surpriseDamageFactor: 1.5, // sourced mechanic; factor reconstructed
  reinforceHealthTransfer: 20,
  reinforceReductionStack: 0.1,
  defenderFieldAttrition: 2,
  healingRecoveryBoost: 2,
  healingRecoveryUpkeep: 0.02,
  healingSettlementFactor: 5,
  healingSettlementCapPct: 10, // sourced: up to 10%/turn at the settlement
  healingSettlementTech: 2,
  /** Actions. */
  exploreCost: 1, // sourced: "usually costs at least 1 stamina"
  claimCost: 1,
  dealYieldMin: 6,
  dealYieldSpread: 6,
  dealOffSeasonFactor: 0.8, // sourced −20%
  dealCrunchDemandCost: 10, // sourced: drought water up to 10 stamina
  trainStamina: 2,
  trainStaple: 3,
  housingStamina: 1,
  housingConstruction: 5,
  housingHeavy: 2,
  housingGain: 2,
  storageStamina: 1,
  storageConstruction: 4,
  storageHeavy: 4,
  provokeCost: 1, // sourced (2 in lean season)
  /** Technology (sourced: stamina+food+wood, 25 turns; Material at tech 5). */
  techStamina: 2,
  techStaple: 10,
  techConstruction: 5,
  techTurns: 25,
  techMax: 6,
  advancedDealTech: 5,
  /** Pressure floor: minimum count of producer areas at start (editor field). */
} as const;

/** Deal (scavenge) stamina cost per resource slot (sourced tiers 1/2/4). */
export function dealCostForSlot(slot: number, seasonSlot: number): number {
  if (slot === RESOURCE_SLOTS.demand && seasonSlot === SEASON_SLOTS.crunch) {
    return TUNING.dealCrunchDemandCost;
  }
  if (slot === RESOURCE_SLOTS.recovery || slot === RESOURCE_SLOTS.advanced) return 2;
  if (slot === RESOURCE_SLOTS.heavy) return 4;
  return 1;
}

/** Cleanse stamina cost per terrain slot (sourced range 1–3; lean −1, min 1). */
export function cleanseCostForTerrain(terrainSlot: number, seasonSlot: number): number {
  const base = [1, 2, 3, 2, 2][terrainSlot] ?? 2;
  return Math.max(1, seasonSlot === SEASON_SLOTS.lean ? base - 1 : base);
}

export interface GoalRule {
  /** Slot index into the domain goalTypes pool (0..10). */
  typeIndex: number;
  typeId: string;
  targetAmount: number;
  /** Patience after the modifier patience-point adjustment (sourced math). */
  patience: number;
  stable: boolean;
}

export interface EventRule {
  index: number;
  title: string;
  image: string;
  script: ScenarioScript;
}

export interface StartingEventRule {
  title: string;
  description: string;
  buttonText: string;
  image: string;
}

export interface GameRules {
  domainId: string;
  scenarioName: string;
  areas: readonly AreaCell[];
  resourceIds: readonly string[];
  /** Domain season ids by slot (scripts compare seasons by id). */
  seasonIds: readonly string[];
  seasonByMonth: readonly number[]; // 12 season slots
  startingMorale: number;
  startingAuthority: number;
  startingPopulation: number;
  startingStamina: number;
  startingResources: Readonly<Record<string, number>>;
  startingEvents: readonly StartingEventRule[];
  events: readonly EventRule[];
  goals: readonly GoalRule[];
  pressure: {
    startingIntensity: number;
    growthRate: number;
    minProducers: number;
    surpriseThreats: boolean;
    cleanseBacklash: boolean;
  };
  defense: {
    startingUnits: number;
    healingRatePct: number;
    reinforcement: boolean;
    supplyAttrition: boolean;
  };
  difficultyIndex: number;
  difficulty: DifficultyTier;
  /** Modifier pool slots active on this map (effects by slot, GAPS.md C4). */
  activeModifierSlots: readonly number[];
  terrainSlotById: Readonly<Record<string, number>>;
}

function num(value: unknown, name: string): number {
  if (typeof value !== 'number') throw new Error(`Scenario field ${name} is not a number`);
  return value;
}

function bool(value: unknown, name: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`Scenario field ${name} is not a boolean`);
  return value;
}

function str(value: unknown, name: string): string {
  if (typeof value !== 'string') throw new Error(`Scenario field ${name} is not a string`);
  return value;
}

/**
 * Derives the complete rule set from a validated scenario. Callers should
 * import the scenario through `importScenario` first — this function trusts
 * the schema and only re-checks shapes it destructures.
 */
export function deriveRules(scenario: Scenario, domain: DomainSchema): GameRules {
  if (scenario.domainId !== domain.id) {
    throw new Error(
      `Scenario belongs to domain "${scenario.domainId}", not "${domain.id}"`,
    );
  }
  const editors = scenario.editors;
  const basic = editors['basicDetails'] ?? {};
  const layout = editors['areaLayout'] ?? {};
  const startingValues = editors['startingValues'] ?? {};
  const resourcesEd = editors['resources'] ?? {};
  const seasonsEd = editors['seasons'] ?? {};
  const startingEventsEd = editors['startingEvents'] ?? {};
  const customEventsEd = editors['customEvents'] ?? {};
  const goalsEd = editors['goals'] ?? {};
  const pressureEd = editors['pressure'] ?? {};
  const defenseEd = editors['defense'] ?? {};
  const modifiersEd = editors['modifiers'] ?? {};

  const areas = layout['areas'] as AreaCell[];
  if (!Array.isArray(areas) || areas.length === 0) {
    throw new Error('Scenario has no area map');
  }

  const resourceIds = domain.pools.resources.map((r) => r.id);

  // ADD/SET semantics against the engine baseline (sourced semantics).
  const ops = resourcesEd['stockpiles'] as Record<
    string,
    { op: ResourceOp; amount: number }
  >;
  const startingResources: Record<string, number> = {};
  for (const id of resourceIds) {
    const row = ops[id];
    const base = TUNING.resourceBaseline;
    const value =
      row === undefined
        ? base
        : row.op === 'SET'
          ? row.amount
          : base + row.amount;
    startingResources[id] = Math.max(0, value);
  }

  const seasonSlotById = new Map(domain.pools.seasons.map((s, i) => [s.id, i]));
  const seasonByMonth: number[] = [];
  for (let month = 1; month <= 12; month++) {
    const id = str(seasonsEd[`month${month}`], `seasons.month${month}`);
    seasonByMonth.push(seasonSlotById.get(id) ?? SEASON_SLOTS.normal);
  }

  const goalSlotById = new Map(domain.pools.goalTypes.map((g, i) => [g.id, i]));
  const modifierSlotById = new Map(domain.pools.modifiers.map((m, i) => [m.id, i]));
  const difficultySlotById = new Map(
    domain.pools.difficulties.map((d, i) => [d.id, i]),
  );

  const activeModifiers = (modifiersEd['active'] ?? []) as Record<string, unknown>[];
  const activeModifierSlots = activeModifiers
    .map((row) => modifierSlotById.get(str(row['modifier'], 'modifiers.modifier')))
    .filter((slot): slot is number => slot !== undefined);
  // Sourced patience-point economy: negative total → +2% patience per point;
  // positive total → −1% per point.
  const netPatiencePoints = activeModifiers.reduce(
    (sum, row) => sum + num(row['patiencePoints'], 'modifiers.patiencePoints'),
    0,
  );
  const patienceFactor =
    netPatiencePoints < 0
      ? 1 + 0.02 * Math.abs(netPatiencePoints)
      : 1 - 0.01 * netPatiencePoints;

  const goals: GoalRule[] = ((goalsEd['goals'] ?? []) as Record<string, unknown>[]).map(
    (row) => {
      const typeId = str(row['type'], 'goals.type');
      return {
        typeIndex: goalSlotById.get(typeId) ?? 0,
        typeId,
        targetAmount: num(row['targetAmount'], 'goals.targetAmount'),
        patience: Math.round(num(row['patience'], 'goals.patience') * patienceFactor),
        stable: bool(row['stable'], 'goals.stable'),
      };
    },
  );

  const startingEvents: StartingEventRule[] = (
    (startingEventsEd['events'] ?? []) as Record<string, unknown>[]
  ).map((row) => ({
    title: str(row['title'], 'startingEvents.title'),
    description: str(row['description'], 'startingEvents.description'),
    buttonText: str(row['buttonText'], 'startingEvents.buttonText'),
    image: str(row['image'], 'startingEvents.image'),
  }));

  const events: EventRule[] = (
    (customEventsEd['events'] ?? []) as Record<string, unknown>[]
  ).map((row, index) => ({
    index,
    title: str(row['title'], 'customEvents.title'),
    image: str(row['image'], 'customEvents.image'),
    script: parseScenarioScript(str(row['scriptBody'], 'customEvents.scriptBody'))
      .script,
  }));

  const difficultyIndex =
    difficultySlotById.get(str(modifiersEd['difficulty'], 'modifiers.difficulty')) ?? 1;
  const difficulty = DIFFICULTY_TIERS[difficultyIndex] ?? DIFFICULTY_TIERS[1];
  if (difficulty === undefined) throw new Error('No difficulty tiers defined');

  const terrainSlotById: Record<string, number> = {};
  domain.pools.terrains.forEach((t, i) => {
    terrainSlotById[t.id] = i;
  });

  return {
    domainId: domain.id,
    scenarioName: str(basic['name'], 'basicDetails.name'),
    areas,
    resourceIds,
    seasonIds: domain.pools.seasons.map((season) => season.id),
    seasonByMonth,
    startingMorale: num(startingValues['morale'], 'startingValues.morale'),
    startingAuthority: num(startingValues['authority'], 'startingValues.authority'),
    startingPopulation: num(startingValues['population'], 'startingValues.population'),
    startingStamina: num(startingValues['stamina'], 'startingValues.stamina'),
    startingResources,
    startingEvents,
    events,
    goals,
    pressure: {
      startingIntensity: num(pressureEd['startingIntensity'], 'pressure.startingIntensity'),
      growthRate: num(pressureEd['growthRate'], 'pressure.growthRate'),
      minProducers: num(pressureEd['infestedAreas'], 'pressure.infestedAreas'),
      surpriseThreats: bool(pressureEd['surpriseThreats'], 'pressure.surpriseThreats'),
      cleanseBacklash: bool(pressureEd['cleanseBacklash'], 'pressure.cleanseBacklash'),
    },
    defense: {
      startingUnits: num(defenseEd['startingUnits'], 'defense.startingUnits'),
      healingRatePct: num(defenseEd['healingRatePct'], 'defense.healingRatePct'),
      reinforcement: bool(defenseEd['reinforcement'], 'defense.reinforcement'),
      supplyAttrition: bool(defenseEd['supplyAttrition'], 'defense.supplyAttrition'),
    },
    difficultyIndex,
    difficulty,
    activeModifierSlots,
    terrainSlotById,
  };
}

/** Season slot for a given turn (1 turn = 1 day, 30 per month). */
export function seasonSlotForTurn(rules: GameRules, turn: number): number {
  const month = Math.floor(turn / TUNING.turnsPerMonth) % 12;
  return rules.seasonByMonth[month] ?? SEASON_SLOTS.normal;
}

/** Storage cap for a resource given its expansion count. */
export function storageCap(expansions: number): number {
  return TUNING.storageBaseCap * (1 + TUNING.storageExpansionPct * expansions);
}
