import type { AreaCell } from '../engine/areaMap.ts';
import { hexDistance, startArea } from '../engine/areaMap.ts';
import { hashSeed } from './rng.ts';
import type { GameRules } from './rules.ts';
import { TUNING } from './rules.ts';
import type { ScriptEffect } from '../engine/scenarioScript.ts';

/**
 * Runtime game state. Pure data — the engine reducer in engine.ts returns
 * new states; nothing here touches the DOM, the domain lexicon, or the
 * theme. All ids/indexes resolve to language only at the UI layer.
 */

export interface AreaState {
  id: string;
  explored: boolean;
  claimed: boolean;
  /** Claimed-area integrity; at 0 the area is lost (sourced mechanic). */
  health: number;
  /** Active pressure points in the area (fractional; UI rounds). */
  threats: number;
  /** Currently a producer node (starts from the map + pressure floor). */
  infested: boolean;
  /** A cleanse has been initiated; resolves when threats reach 0 with a defender present. */
  cleansing: boolean;
}

export interface DefenderState {
  id: string;
  areaId: string;
  health: number;
  /** Stacking damage reduction from reinforcement (0..0.8). */
  damageReduction: number;
  /** Moved this turn — cannot also fight until next turn. */
  moved: boolean;
}

export interface GoalState {
  completed: boolean;
  /** Remaining own patience (turns); event patience is a shared bucket. */
  patienceLeft: number;
  /** Consecutive turns the maintain-type condition has held. */
  maintainTicks: number;
}

export interface EventState {
  fired: boolean;
  /** Edge trigger: conditions were false on the previous check. */
  armed: boolean;
}

export interface Popup {
  title: string;
  body: string;
  button: string;
  image: string;
  effects: readonly ScriptEffect[];
}

export type LogCode =
  | 'explored'
  | 'claimed'
  | 'areaLost'
  | 'cleansed'
  | 'defenderDown'
  | 'defenderTrained'
  | 'goalComplete'
  | 'goalOverdue'
  | 'festival'
  | 'growth'
  | 'abandonment'
  | 'attack'
  | 'techUp'
  | 'milestone'
  | 'event';

export interface LogEntry {
  turn: number;
  code: LogCode;
  /** Optional subject: an area id, resource id, goal index, etc. */
  subject?: string;
}

export type Outcome = 'setup' | 'ongoing' | 'won' | 'lost';

export interface GameState {
  turn: number;
  outcome: Outcome;
  /** Chosen leader pool slot; null until setup completes. */
  leaderIndex: number | null;
  morale: number;
  authority: number;
  startAuthority: number;
  population: number;
  housing: number;
  stamina: number;
  tech: number;
  /** Turns until the running upgrade completes; null when idle. */
  techCountdown: number | null;
  pressureIntensity: number;
  resources: Record<string, number>;
  storageExpansions: Record<string, number>;
  areas: Record<string, AreaState>;
  defenders: DefenderState[];
  nextDefenderId: number;
  goals: GoalState[];
  activeGoalIndex: number;
  /** Event-sourced patience, consumed before goal patience (sourced). */
  eventPatience: number;
  events: EventState[];
  pendingPopups: Popup[];
  counters: {
    explored: number;
    claimed: number;
    cleansed: number;
    kills: number;
    cumulativeProduction: number;
    storageBuilt: number;
    autoExpansions: number;
    claimsSinceWake: number;
  };
  milestones: {
    exploreHalf: boolean;
    exploreAll: boolean;
    claim40: boolean;
    claim80: boolean;
    claimAll: boolean;
  };
  growthProgress: number;
  abandonProgress: number;
  rng: number;
  log: LogEntry[];
}

export function startAreaOf(rules: GameRules): AreaCell {
  const start = startArea(rules.areas);
  if (!start) throw new Error('Scenario map has no start area');
  return start;
}

/**
 * Builds the initial state from the derived rules. The pressure editor's
 * producer count is a floor: if the map marks fewer infested areas, the
 * cells farthest from the start are promoted until the floor is met.
 */
export function createGame(rules: GameRules, seed?: number): GameState {
  const start = startAreaOf(rules);

  const infestedIds = new Set(
    rules.areas.filter((a) => a.infested).map((a) => a.id),
  );
  if (infestedIds.size < rules.pressure.minProducers) {
    const candidates = [...rules.areas]
      .filter((a) => !a.start && !infestedIds.has(a.id))
      .sort(
        (a, b) =>
          hexDistance(b, start) - hexDistance(a, start) ||
          a.id.localeCompare(b.id),
      );
    for (const cell of candidates) {
      if (infestedIds.size >= rules.pressure.minProducers) break;
      infestedIds.add(cell.id);
    }
  }

  const areas: Record<string, AreaState> = {};
  for (const cell of rules.areas) {
    areas[cell.id] = {
      id: cell.id,
      explored: cell.start,
      claimed: cell.start,
      health: TUNING.areaHealthMax,
      threats: 0,
      infested: infestedIds.has(cell.id),
      cleansing: false,
    };
  }

  const defenders: DefenderState[] = [];
  for (let i = 0; i < rules.defense.startingUnits; i++) {
    defenders.push({
      id: `unit-${i + 1}`,
      areaId: start.id,
      health: TUNING.defenderHealthMax,
      damageReduction: 0,
      moved: false,
    });
  }

  const resources: Record<string, number> = {};
  const storageExpansions: Record<string, number> = {};
  for (const id of rules.resourceIds) {
    resources[id] = rules.startingResources[id] ?? TUNING.resourceBaseline;
    storageExpansions[id] = 0;
  }

  return {
    turn: 0,
    outcome: 'setup',
    leaderIndex: null,
    morale: rules.startingMorale,
    authority: rules.startingAuthority,
    startAuthority: rules.startingAuthority,
    population: rules.startingPopulation,
    housing: rules.startingPopulation + 1,
    stamina: rules.startingStamina,
    tech: 1,
    techCountdown: null,
    pressureIntensity: rules.pressure.startingIntensity,
    resources,
    storageExpansions,
    areas,
    defenders,
    nextDefenderId: rules.defense.startingUnits + 1,
    goals: rules.goals.map((g) => ({
      completed: false,
      patienceLeft: g.patience,
      maintainTicks: 0,
    })),
    activeGoalIndex: 0,
    eventPatience: 0,
    events: rules.events.map(() => ({ fired: false, armed: true })),
    pendingPopups: rules.startingEvents.map((e) => ({
      title: e.title,
      body: e.description,
      button: e.buttonText,
      image: e.image,
      effects: [],
    })),
    counters: {
      explored: 0,
      claimed: 0,
      cleansed: 0,
      kills: 0,
      cumulativeProduction: 0,
      storageBuilt: 0,
      autoExpansions: 0,
      claimsSinceWake: 0,
    },
    milestones: {
      exploreHalf: false,
      exploreAll: false,
      claim40: false,
      claim80: false,
      claimAll: false,
    },
    growthProgress: 0,
    abandonProgress: 0,
    rng: seed ?? hashSeed(`${rules.domainId}:${rules.scenarioName}`),
    log: [],
  };
}
