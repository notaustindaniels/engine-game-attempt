import {
  hexDistance,
  neighborsOf,
  type AreaCell,
} from '../engine/areaMap.ts';
import { conditionsHold, type ScriptEffect, type ScriptMetrics } from '../engine/scenarioScript.ts';
import { nextRandom } from './rng.ts';
import {
  RESOURCE_SLOTS,
  SEASON_SLOTS,
  TERRAIN_PRODUCES,
  TUNING,
  cleanseCostForTerrain,
  dealCostForSlot,
  seasonSlotForTurn,
  storageCap,
  type GameRules,
} from './rules.ts';
import { startAreaOf, type GameState, type LogCode } from './state.ts';

/**
 * The pure game reducer. Mechanics follow the sourced wiki behavior in
 * /docs/research/concepts.md; numeric tuning is engine rules (GAPS.md C5),
 * enumerated in docs/runtime.md. Leader/modifier/difficulty effects are
 * keyed by domain pool slot (GAPS.md C4).
 */

/** Leader pool slots (survivor..cub-scout / generalist..organic-discovery). */
const LEADER = {
  defenseFirst: 1,
  hustle: 2,
  fundraiseCycle: 3,
  opsAutomation: 4,
  countercyclical: 5,
  commandControl: 6,
  frontier: 7,
  blitzscale: 8,
  organicDiscovery: 9,
} as const;

/** Modifier pool slots: 0-4 combat edge per terrain slot; 5 logistics; 6 recovery. */
const MODIFIER = { leanLogistics: 5, fieldRecovery: 6 } as const;

export type GameAction =
  | { type: 'chooseLeader'; leaderIndex: number }
  | { type: 'acknowledge' }
  | { type: 'explore'; areaId: string }
  | { type: 'claim'; areaId: string }
  | { type: 'deal'; resourceId: string }
  | { type: 'move'; defenderId: string; areaId: string }
  | { type: 'cleanse'; defenderId: string }
  | { type: 'reinforce'; fromId: string; toId: string }
  | { type: 'provoke'; defenderId: string }
  | { type: 'festival' }
  | { type: 'train' }
  | { type: 'buildHousing' }
  | { type: 'expandStorage'; resourceId: string }
  | { type: 'research' }
  | { type: 'endTurn' };

export type ActionError =
  | 'wrong-phase'
  | 'popups-pending'
  | 'unknown-target'
  | 'not-allowed'
  | 'not-adjacent'
  | 'no-stamina'
  | 'no-resources'
  | 'at-capacity'
  | 'tech-locked';

export interface ActionResult {
  state: GameState;
  error?: ActionError;
}

function fail(state: GameState, error: ActionError): ActionResult {
  return { state, error };
}

function log(s: GameState, code: LogCode, subject?: string): void {
  s.log.push(subject === undefined ? { turn: s.turn, code } : { turn: s.turn, code, subject });
}

function cellById(rules: GameRules, id: string): AreaCell | undefined {
  return rules.areas.find((a) => a.id === id);
}

function terrainSlotOf(rules: GameRules, cell: AreaCell): number {
  return rules.terrainSlotById[cell.terrain] ?? 0;
}

function resourceIdForSlot(rules: GameRules, slot: number): string | undefined {
  return rules.resourceIds[slot];
}

function slotForResourceId(rules: GameRules, id: string): number {
  return rules.resourceIds.indexOf(id);
}

function staminaFloor(s: GameState): number {
  return s.leaderIndex === LEADER.hustle ? -3 : 0;
}

function spendStamina(s: GameState, cost: number): boolean {
  if (s.stamina - cost < staminaFloor(s)) return false;
  s.stamina -= cost;
  return true;
}

function capOf(s: GameState, resourceId: string): number {
  return storageCap(s.storageExpansions[resourceId] ?? 0);
}

function addResource(s: GameState, resourceId: string, amount: number): number {
  const current = s.resources[resourceId] ?? 0;
  const next = Math.min(capOf(s, resourceId), Math.max(0, current + amount));
  s.resources[resourceId] = next;
  return next - current;
}

function spendResource(s: GameState, resourceId: string, amount: number): boolean {
  const current = s.resources[resourceId] ?? 0;
  if (current < amount) return false;
  s.resources[resourceId] = current - amount;
  return true;
}

function random(s: GameState): number {
  const { value, state } = nextRandom(s.rng);
  s.rng = state;
  return value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isAdjacentTo(
  rules: GameRules,
  areaId: string,
  predicate: (neighbor: AreaCell) => boolean,
): boolean {
  const cell = cellById(rules, areaId);
  if (!cell) return false;
  return neighborsOf(cell, rules.areas).some(predicate);
}

function seasonSlot(rules: GameRules, s: GameState): number {
  return seasonSlotForTurn(rules, s.turn);
}

function underAttack(rules: GameRules, s: GameState): boolean {
  const start = startAreaOf(rules);
  return (s.areas[start.id]?.threats ?? 0) > 0;
}

function garrisoned(rules: GameRules, s: GameState): boolean {
  const start = startAreaOf(rules);
  return s.defenders.some((d) => d.areaId === start.id && d.health > 0);
}

function defenderStrength(rules: GameRules, s: GameState, terrainSlot: number): number {
  let strength = TUNING.defenderBaseStrength;
  if (rules.activeModifierSlots.includes(terrainSlot)) strength += 1;
  if (s.leaderIndex === LEADER.defenseFirst) strength += 1;
  return strength;
}

export function applyScriptEffects(
  s: GameState,
  effects: readonly ScriptEffect[],
): void {
  for (const effect of effects) {
    switch (effect.target) {
      case 'morale':
        s.morale = effect.mode === 'set' ? effect.amount : s.morale + effect.amount;
        s.morale = clamp(s.morale, 0, 100);
        break;
      case 'authority':
        s.authority = effect.mode === 'set' ? effect.amount : s.authority + effect.amount;
        s.authority = clamp(s.authority, 0, 100);
        break;
      case 'stamina':
        s.stamina = effect.mode === 'set' ? effect.amount : s.stamina + effect.amount;
        s.stamina = clamp(s.stamina, staminaFloor(s), TUNING.staminaHardCap);
        break;
      case 'population':
        s.population = Math.max(
          0,
          Math.round(effect.mode === 'set' ? effect.amount : s.population + effect.amount),
        );
        break;
      case 'pressure':
        s.pressureIntensity =
          effect.mode === 'set' ? effect.amount : s.pressureIntensity + effect.amount;
        s.pressureIntensity = clamp(s.pressureIntensity, 0, 100);
        break;
      case 'patience':
        s.eventPatience = Math.max(
          0,
          effect.mode === 'set' ? effect.amount : s.eventPatience + effect.amount,
        );
        break;
      case 'tech':
        s.tech = clamp(
          Math.round(effect.mode === 'set' ? effect.amount : s.tech + effect.amount),
          1,
          TUNING.techMax,
        );
        break;
      case 'resource': {
        if (effect.mode === 'set') {
          s.resources[effect.resourceId] = clamp(
            effect.amount,
            0,
            capOf(s, effect.resourceId),
          );
        } else {
          addResource(s, effect.resourceId, effect.amount);
        }
        break;
      }
    }
  }
}

// ————— per-turn steps (each mutates the cloned state) —————

function stepStamina(rules: GameRules, s: GameState): void {
  void rules;
  if (s.leaderIndex === LEADER.fundraiseCycle) {
    if (s.turn > 0 && s.turn % (TUNING.turnsPerMonth * 12) === 0) {
      s.stamina = Math.min(TUNING.staminaYearLumpCap, s.stamina + TUNING.staminaYearLump);
    }
    return;
  }
  if (s.turn % TUNING.staminaRegenInterval !== 0) return;
  let gain = 1 + Math.floor(s.tech / 3) + Math.floor(s.population / 8);
  if (s.stamina > TUNING.staminaSoftCap) gain = Math.floor(gain / 2);
  s.stamina = Math.min(TUNING.staminaHardCap, s.stamina + gain);
}

function stepAutoExplore(rules: GameRules, s: GameState): void {
  if (s.leaderIndex !== LEADER.organicDiscovery) return;
  if (s.turn === 0 || s.turn % 15 !== 0) return;
  const start = startAreaOf(rules);
  const frontier = rules.areas
    .filter((cell) => {
      const area = s.areas[cell.id];
      return (
        area !== undefined &&
        !area.explored &&
        isAdjacentTo(rules, cell.id, (n) => s.areas[n.id]?.explored === true)
      );
    })
    .sort((a, b) => hexDistance(a, start) - hexDistance(b, start) || a.id.localeCompare(b.id));
  const next = frontier[0];
  if (next) {
    const area = s.areas[next.id];
    if (area) {
      area.explored = true;
      s.counters.explored += 1;
      log(s, 'explored', next.id);
    }
  }
}

function stepProduction(rules: GameRules, s: GameState): void {
  const season = seasonSlot(rules, s);

  const produce = (resourceSlot: number, amount: number): void => {
    const id = resourceIdForSlot(rules, resourceSlot);
    if (id === undefined || amount <= 0) return;
    const added = addResource(s, id, amount);
    if (added > 0) s.counters.cumulativeProduction += added;
  };

  // The start area generates demand/water — halted during the crunch (sourced).
  if (season !== SEASON_SLOTS.crunch) {
    produce(RESOURCE_SLOTS.demand, TUNING.produceDemandStart);
  }

  for (const cell of rules.areas) {
    const area = s.areas[cell.id];
    if (!area || !area.claimed || cell.start) continue;

    let factor = 1;
    if (s.leaderIndex === LEADER.frontier) {
      const nearFrontier = isAdjacentTo(rules, cell.id, (n) => s.areas[n.id]?.explored !== true);
      factor = nearFrontier ? 1.5 : 0.75;
    }

    // Corridor-adjacent claimed areas also feed demand (halted in crunch).
    if (cell.river && season !== SEASON_SLOTS.crunch) {
      produce(RESOURCE_SLOTS.demand, TUNING.produceDemandRiver * factor);
    }

    const terrain = terrainSlotOf(rules, cell);
    const producedSlot = TERRAIN_PRODUCES[terrain];
    if (producedSlot === null || producedSlot === undefined) continue;

    let rate: number =
      producedSlot === RESOURCE_SLOTS.staple
        ? TUNING.produceStaple
        : producedSlot === RESOURCE_SLOTS.construction
          ? TUNING.produceConstruction
          : producedSlot === RESOURCE_SLOTS.recovery
            ? TUNING.produceRecovery
            : TUNING.produceHeavy;

    if (producedSlot === RESOURCE_SLOTS.staple) {
      // Sourced: staple lines halt in the lean season; in the crunch only
      // corridor-adjacent areas keep producing, at 75%.
      if (season === SEASON_SLOTS.lean) rate = 0;
      if (season === SEASON_SLOTS.crunch) {
        rate = cell.river ? rate * TUNING.crunchRiverFactor : 0;
      }
    }
    produce(producedSlot, rate * factor);

    // Forests (terrain slot 1) also yield the seasonal resource (sourced).
    if (terrain === 1) {
      produce(RESOURCE_SLOTS.seasonal, TUNING.produceFuelSecondary * factor);
    }
  }

  // Ops-automation leader: reactive storage expansion when a stockpile fills.
  if (s.leaderIndex === LEADER.opsAutomation && s.counters.autoExpansions < 3) {
    for (const id of rules.resourceIds) {
      if (s.counters.autoExpansions >= 3) break;
      if ((s.resources[id] ?? 0) >= capOf(s, id)) {
        s.storageExpansions[id] = (s.storageExpansions[id] ?? 0) + 1;
        s.counters.autoExpansions += 1;
        s.counters.storageBuilt += 1;
      }
    }
  }
}

interface Deficits {
  staple: boolean;
  demand: boolean;
  seasonal: boolean;
}

function stepConsumption(rules: GameRules, s: GameState): Deficits {
  const season = seasonSlot(rules, s);
  const deficits: Deficits = { staple: false, demand: false, seasonal: false };

  const consume = (slot: number, amount: number): boolean => {
    const id = resourceIdForSlot(rules, slot);
    if (id === undefined || amount <= 0) return true;
    const current = s.resources[id] ?? 0;
    if (current >= amount) {
      s.resources[id] = current - amount;
      return true;
    }
    s.resources[id] = 0;
    return false;
  };

  const hustleFactor = s.leaderIndex === LEADER.hustle ? 1.25 : 1;
  if (!consume(RESOURCE_SLOTS.staple, s.population * TUNING.consumeStaple * hustleFactor)) {
    deficits.staple = true;
  }
  if (!consume(RESOURCE_SLOTS.demand, s.population * TUNING.consumeDemand)) {
    deficits.demand = true;
  }
  if (season === SEASON_SLOTS.lean) {
    if (!consume(RESOURCE_SLOTS.seasonal, s.population * TUNING.consumeSeasonal)) {
      deficits.seasonal = true;
    }
  }

  // Defender upkeep, waived by the lean-logistics modifier.
  const liveDefenders = s.defenders.filter((d) => d.health > 0).length;
  if (!rules.activeModifierSlots.includes(MODIFIER.leanLogistics) && liveDefenders > 0) {
    consume(RESOURCE_SLOTS.staple, liveDefenders * 0.02);
  }

  // Sourced: supply shortages damage defenders outside claimed ground.
  if (rules.defense.supplyAttrition && (deficits.staple || deficits.demand)) {
    for (const defender of s.defenders) {
      if (defender.health <= 0) continue;
      const area = s.areas[defender.areaId];
      if (area && !area.claimed) {
        defender.health = Math.max(0, defender.health - TUNING.defenderFieldAttrition);
      }
    }
  }

  return deficits;
}

function stepMorale(rules: GameRules, s: GameState, deficits: Deficits): void {
  const season = seasonSlot(rules, s);
  let delta = 0;
  if (deficits.staple) delta -= TUNING.deficitMoraleStaple;
  if (deficits.demand) delta -= TUNING.deficitMoraleDemand;
  if (deficits.seasonal) delta -= TUNING.deficitMoraleSeasonal;
  if (s.population > s.housing) {
    delta -=
      TUNING.overcrowdMorale * (season === SEASON_SLOTS.lean ? TUNING.overcrowdLeanFactor : 1);
  }
  if (underAttack(rules, s)) delta -= TUNING.settlementAttackMorale;
  if (s.leaderIndex === LEADER.hustle && s.stamina < 0) delta -= 0.3;

  const anyDeficit = deficits.staple || deficits.demand || deficits.seasonal;
  if (delta === 0 && !anyDeficit && s.morale < TUNING.moraleRecoveryCeiling) {
    delta = TUNING.moraleRecovery * (s.leaderIndex === LEADER.defenseFirst ? 0.5 : 1);
  }
  s.morale = clamp(s.morale + delta, 0, 100);
}

function stepPopulation(rules: GameRules, s: GameState): void {
  const threshold = rules.difficulty.lowMoraleThreshold;
  const shielded = s.leaderIndex === LEADER.commandControl && garrisoned(rules, s);

  if (
    s.morale >= TUNING.growthMoraleGate &&
    (s.population < s.housing || s.leaderIndex === LEADER.blitzscale)
  ) {
    s.growthProgress +=
      TUNING.growthPerTurn + (s.morale - TUNING.growthMoraleGate) * TUNING.growthMoraleBonus;
    if (s.growthProgress >= 1) {
      s.growthProgress = 0;
      s.population += 1;
      if (s.leaderIndex === LEADER.blitzscale) {
        s.authority = clamp(s.authority + 2, 0, 100);
        s.stamina = Math.min(TUNING.staminaHardCap, s.stamina + 1);
      }
      log(s, 'growth');
    }
  } else if (s.growthProgress > 0) {
    s.growthProgress = Math.max(0, s.growthProgress - TUNING.growthPerTurn);
  }

  if (s.morale < threshold) {
    if (!shielded) {
      s.authority -= TUNING.lowMoraleAuthorityBleed;
      s.abandonProgress +=
        TUNING.abandonPerTurn * (s.leaderIndex === LEADER.blitzscale ? 2 : 1);
      if (s.abandonProgress >= 1 && s.population > 0) {
        s.abandonProgress = 0;
        s.population -= 1;
        s.authority -= TUNING.abandonAuthorityCost;
        log(s, 'abandonment');
      }
    }
  } else if (s.abandonProgress > 0) {
    s.abandonProgress = Math.max(0, s.abandonProgress - TUNING.abandonPerTurn);
  }

  if (s.leaderIndex === LEADER.commandControl && !garrisoned(rules, s)) {
    s.authority -= 0.05;
  }
  s.authority = clamp(s.authority, 0, 100);
}

function stepPressure(rules: GameRules, s: GameState): void {
  const mult = rules.difficulty.pressureMultiplier;
  const start = startAreaOf(rules);

  s.pressureIntensity = clamp(
    s.pressureIntensity + rules.pressure.growthRate * TUNING.intensityGrowthFactor * mult,
    0,
    100,
  );

  const spawnRate =
    (TUNING.spawnBase +
      rules.pressure.growthRate * TUNING.spawnPerGrowthRate +
      s.pressureIntensity * TUNING.spawnPerIntensity) *
    mult;

  for (const cell of rules.areas) {
    const area = s.areas[cell.id];
    if (!area || !area.infested) continue;
    area.threats = Math.min(TUNING.areaThreatCap, area.threats + spawnRate);
  }

  // Threat migration toward the settlement (every N turns).
  if (s.turn > 0 && s.turn % TUNING.migrateEveryTurns === 0) {
    for (const cell of rules.areas) {
      const area = s.areas[cell.id];
      if (!area || !area.infested || area.threats < TUNING.migrateMinThreats) continue;
      const towardStart = neighborsOf(cell, rules.areas)
        .slice()
        .sort(
          (a, b) => hexDistance(a, start) - hexDistance(b, start) || a.id.localeCompare(b.id),
        )[0];
      if (!towardStart) continue;
      const target = s.areas[towardStart.id];
      if (!target) continue;
      area.threats -= 1;
      target.threats = Math.min(TUNING.areaThreatCap, target.threats + 1);
      if (towardStart.id === start.id) log(s, 'attack', start.id);
    }
  }

  // Threats erode claimed-area integrity; at 0 the area is lost (sourced).
  for (const cell of rules.areas) {
    const area = s.areas[cell.id];
    if (!area || !area.claimed) continue;
    const defended = s.defenders.some((d) => d.areaId === cell.id && d.health > 0);
    if (area.threats > 0 && !defended) {
      area.health -= area.threats * TUNING.threatAreaDamage;
      if (area.health <= 0) {
        if (cell.start) {
          s.outcome = 'lost';
          return;
        }
        area.claimed = false;
        area.health = 0;
        s.counters.claimed = Math.max(0, s.counters.claimed - 1);
        s.population = Math.max(0, s.population - 1);
        s.authority = clamp(s.authority - TUNING.areaLossAuthority, 0, 100);
        log(s, 'areaLost', cell.id);
      }
    } else if (area.threats === 0 && area.health < TUNING.areaHealthMax) {
      area.health = Math.min(TUNING.areaHealthMax, area.health + 1);
    }
  }

  if (underAttack(rules, s)) {
    s.authority = clamp(s.authority - TUNING.settlementAttackAuthority, 0, 100);
  }
}

function stepCombat(rules: GameRules, s: GameState): void {
  for (const defender of s.defenders) {
    if (defender.health <= 0 || defender.moved) continue;
    const cell = cellById(rules, defender.areaId);
    const area = s.areas[defender.areaId];
    if (!cell || !area || area.threats <= 0) continue;

    const strength = defenderStrength(rules, s, terrainSlotOf(rules, cell));
    const kills = Math.min(strength, area.threats);
    area.threats -= kills;
    s.counters.kills += kills;

    if (area.threats > 0.01) {
      const surprise =
        rules.pressure.surpriseThreats &&
        isAdjacentTo(rules, cell.id, (n) => s.areas[n.id]?.explored !== true);
      let damage =
        (TUNING.combatDamageBase + TUNING.combatDamagePerThreat * area.threats) *
        (surprise ? TUNING.surpriseDamageFactor : 1) *
        (1 - defender.damageReduction);
      damage = Math.max(1, damage);
      defender.health -= damage;
      if (defender.health <= 0) {
        defender.health = 0;
        s.population = Math.max(0, s.population - 1);
        s.pressureIntensity = clamp(s.pressureIntensity + 3, 0, 100);
        log(s, 'defenderDown', defender.id);
      }
    } else {
      area.threats = 0;
    }

    if (area.cleansing && area.threats === 0) {
      area.cleansing = false;
      if (area.infested) {
        area.infested = false;
        s.counters.cleansed += 1;
        s.pressureIntensity = clamp(
          s.pressureIntensity - TUNING.cleanseIntensityDrop,
          0,
          100,
        );
        log(s, 'cleansed', cell.id);
      }
    }
  }
  s.defenders = s.defenders.filter((d) => d.health > 0);
}

function stepHealing(rules: GameRules, s: GameState): void {
  const start = startAreaOf(rules);
  const recoveryId = resourceIdForSlot(rules, RESOURCE_SLOTS.recovery);
  for (const defender of s.defenders) {
    if (defender.health >= TUNING.defenderHealthMax) continue;
    const area = s.areas[defender.areaId];
    if (!area || !area.claimed || area.threats > 0) continue;

    let rate = rules.defense.healingRatePct;
    if (recoveryId !== undefined && (s.resources[recoveryId] ?? 0) > 0) {
      rate *= TUNING.healingRecoveryBoost;
      s.resources[recoveryId] = Math.max(
        0,
        (s.resources[recoveryId] ?? 0) - TUNING.healingRecoveryUpkeep,
      );
    }
    if (rules.activeModifierSlots.includes(MODIFIER.fieldRecovery)) rate *= 1.5;
    if (defender.areaId === start.id && s.tech >= TUNING.healingSettlementTech) {
      rate = Math.min(TUNING.healingSettlementCapPct, rate * TUNING.healingSettlementFactor);
    }
    defender.health = Math.min(TUNING.defenderHealthMax, defender.health + rate);
  }
}

function stepTech(s: GameState): void {
  if (s.techCountdown === null) return;
  s.techCountdown -= 1;
  if (s.techCountdown <= 0) {
    s.techCountdown = null;
    s.tech = Math.min(TUNING.techMax, s.tech + 1);
    log(s, 'techUp');
  }
}

function goalMetric(rules: GameRules, s: GameState, typeIndex: number): number {
  switch (typeIndex) {
    case 0:
      return s.counters.explored;
    case 1:
      return s.counters.claimed;
    case 2:
      return s.counters.cumulativeProduction;
    case 3:
      return s.resources[resourceIdForSlot(rules, RESOURCE_SLOTS.staple) ?? ''] ?? 0;
    case 5:
      return s.counters.storageBuilt;
    case 6:
      return s.population;
    case 7:
      return s.tech;
    case 9:
      return s.counters.cleansed;
    case 10:
      return s.counters.kills;
    default:
      return 0;
  }
}

function stepGoals(rules: GameRules, s: GameState): void {
  const active = s.goals[s.activeGoalIndex];
  const rule = rules.goals[s.activeGoalIndex];
  if (!active || !rule || active.completed) return;

  // Maintain-type goals (resource slot 4, morale slot 8) hold for a month.
  let completed = false;
  if (rule.typeIndex === 4 || rule.typeIndex === 8) {
    const level =
      rule.typeIndex === 4
        ? (s.resources[resourceIdForSlot(rules, RESOURCE_SLOTS.staple) ?? ''] ?? 0)
        : s.morale;
    if (level >= rule.targetAmount) {
      active.maintainTicks += 1;
      if (active.maintainTicks >= TUNING.maintainTurns) completed = true;
    } else {
      active.maintainTicks = 0;
    }
  } else if (goalMetric(rules, s, rule.typeIndex) >= rule.targetAmount) {
    completed = true;
  }

  if (completed) {
    active.completed = true;
    s.authority = clamp(s.authority + TUNING.goalCompleteAuthority, 0, 100);
    log(s, 'goalComplete', String(s.activeGoalIndex));
    s.activeGoalIndex += 1;
    return;
  }

  // Patience: stable goals pause their own clock (sourced); attacks and the
  // crunch season stop the timer (sourced).
  if (rule.stable) return;
  if (underAttack(rules, s)) return;
  if (seasonSlot(rules, s) === SEASON_SLOTS.crunch) return;

  const tick = 1 + rules.difficulty.patienceTickPenalty;
  // Event-sourced patience is consumed before the goal's own (sourced).
  if (s.eventPatience > 0) {
    const consumed = Math.min(s.eventPatience, tick);
    s.eventPatience -= consumed;
    const rest = tick - consumed;
    if (rest > 0) active.patienceLeft -= rest;
  } else {
    active.patienceLeft -= tick;
  }

  if (active.patienceLeft < 0) {
    // Impatience bleed, damped when authority is already low (sourced tiers).
    const damped =
      s.authority < TUNING.impatienceDampingAuthority
        ? 1 - rules.difficulty.impatienceDamping
        : 1;
    s.authority -= TUNING.impatienceBleed * damped;
    s.authority = clamp(s.authority, 0, 100);
    if (Math.floor(-active.patienceLeft) % 30 === 1) log(s, 'goalOverdue', String(s.activeGoalIndex));
  }
}

function stepMilestones(rules: GameRules, s: GameState): void {
  const total = rules.areas.length;
  const explored = rules.areas.filter((c) => s.areas[c.id]?.explored).length;
  const claimed = rules.areas.filter((c) => s.areas[c.id]?.claimed).length;

  const grant = (flag: keyof GameState['milestones'], bonus: number): void => {
    if (s.milestones[flag]) return;
    s.milestones[flag] = true;
    s.authority = clamp(s.authority + bonus, 0, 100);
    log(s, 'milestone', flag);
  };

  if (explored >= total / 2) grant('exploreHalf', TUNING.exploreHalfBonus);
  if (explored === total) grant('exploreAll', TUNING.exploreAllBonus);
  if (claimed >= total * 0.4) grant('claim40', TUNING.claim40Bonus);
  if (claimed >= total * 0.8) grant('claim80', TUNING.claim80Bonus);
  if (claimed === total) grant('claimAll', TUNING.claimAllBonus);
}

function buildMetrics(rules: GameRules, s: GameState): ScriptMetrics {
  const seasonIndex = seasonSlot(rules, s);
  return {
    numeric: {
      turn: s.turn,
      month: (Math.floor(s.turn / TUNING.turnsPerMonth) % 12) + 1,
      morale: s.morale,
      authority: s.authority,
      stamina: s.stamina,
      population: s.population,
      pressure: s.pressureIntensity,
      explored: s.counters.explored,
      claimed: s.counters.claimed,
      cleansed: s.counters.cleansed,
      tech: s.tech,
    },
    resources: s.resources,
    seasonId: rules.seasonIds[seasonIndex] ?? '',
  };
}

function stepEvents(rules: GameRules, s: GameState): void {
  const metrics = buildMetrics(rules, s);
  rules.events.forEach((event, index) => {
    const eventState = s.events[index];
    if (!eventState) return;
    if (eventState.fired && !event.script.repeat) return;
    const hold = conditionsHold(event.script, metrics);
    if (hold && eventState.armed) {
      eventState.fired = true;
      eventState.armed = false;
      s.pendingPopups.push({
        title: event.title,
        body: event.script.text.join('\n'),
        button: event.script.button ?? '',
        image: event.image,
        effects: event.script.effects,
      });
      log(s, 'event', event.title);
    } else if (!hold) {
      eventState.armed = true;
    }
  });
}

function checkOutcome(rules: GameRules, s: GameState): void {
  if (s.outcome !== 'ongoing') return;
  if (s.authority <= 0 || s.population <= 0) {
    s.outcome = 'lost';
    return;
  }
  if (rules.goals.length > 0 && s.goals.every((g) => g.completed)) {
    s.outcome = 'won';
  }
}

// ————— the reducer —————

export function applyAction(
  rules: GameRules,
  state: GameState,
  action: GameAction,
): ActionResult {
  if (action.type === 'chooseLeader') {
    if (state.outcome !== 'setup') return fail(state, 'wrong-phase');
    const s = structuredClone(state);
    s.leaderIndex = action.leaderIndex;
    s.outcome = 'ongoing';
    return { state: s };
  }

  if (action.type === 'acknowledge') {
    if (state.pendingPopups.length === 0) return fail(state, 'unknown-target');
    const s = structuredClone(state);
    const popup = s.pendingPopups.shift();
    if (popup) applyScriptEffects(s, popup.effects);
    checkOutcome(rules, s);
    return { state: s };
  }

  if (state.outcome !== 'ongoing') return fail(state, 'wrong-phase');

  const s = structuredClone(state);
  const season = seasonSlot(rules, s);

  switch (action.type) {
    case 'explore': {
      const area = s.areas[action.areaId];
      if (!area) return fail(state, 'unknown-target');
      if (area.explored) return fail(state, 'not-allowed');
      if (!isAdjacentTo(rules, action.areaId, (n) => s.areas[n.id]?.explored === true)) {
        return fail(state, 'not-adjacent');
      }
      let cost: number = TUNING.exploreCost;
      if (s.leaderIndex === LEADER.countercyclical) {
        cost = season === SEASON_SLOTS.lean ? 0 : season === SEASON_SLOTS.normal ? cost + 1 : cost;
      }
      if (s.leaderIndex === LEADER.organicDiscovery) cost += 1;
      if (!spendStamina(s, cost)) return fail(state, 'no-stamina');
      area.explored = true;
      s.counters.explored += 1;
      log(s, 'explored', action.areaId);
      stepMilestones(rules, s);
      return { state: s };
    }

    case 'claim': {
      const area = s.areas[action.areaId];
      const cell = cellById(rules, action.areaId);
      if (!area || !cell) return fail(state, 'unknown-target');
      if (!area.explored || area.claimed) return fail(state, 'not-allowed');
      if (area.infested || area.threats > 0) return fail(state, 'not-allowed');
      if (!isAdjacentTo(rules, action.areaId, (n) => s.areas[n.id]?.claimed === true)) {
        return fail(state, 'not-adjacent');
      }
      let cost: number = TUNING.claimCost;
      if (s.leaderIndex === LEADER.countercyclical) {
        cost = season === SEASON_SLOTS.lean ? 0 : season === SEASON_SLOTS.normal ? cost + 1 : cost;
      }
      if (!spendStamina(s, cost)) return fail(state, 'no-stamina');
      area.claimed = true;
      area.health = TUNING.areaHealthMax;
      s.counters.claimed += 1;
      s.counters.claimsSinceWake += 1;
      // Sourced: expansion raises awareness; enough of it wakes dormant threats.
      if (s.counters.claimsSinceWake >= TUNING.awarenessClaimsPerWake) {
        s.counters.claimsSinceWake = 0;
        for (const c of rules.areas) {
          const a = s.areas[c.id];
          if (a?.infested) a.threats = Math.min(TUNING.areaThreatCap, a.threats + 1);
        }
      }
      log(s, 'claimed', action.areaId);
      stepMilestones(rules, s);
      return { state: s };
    }

    case 'deal': {
      const slot = slotForResourceId(rules, action.resourceId);
      if (slot < 0) return fail(state, 'unknown-target');
      if (slot === RESOURCE_SLOTS.advanced && s.tech < TUNING.advancedDealTech) {
        return fail(state, 'tech-locked');
      }
      let cost = dealCostForSlot(slot, season);
      // Sourced: cities make one-off sourcing cheaper once claimed.
      const hasMetro = rules.areas.some(
        (c) => terrainSlotOf(rules, c) === 4 && s.areas[c.id]?.claimed === true,
      );
      if (hasMetro) cost = Math.max(1, cost - 1);
      if (!spendStamina(s, cost)) return fail(state, 'no-stamina');
      let amount = TUNING.dealYieldMin + random(s) * TUNING.dealYieldSpread;
      if (
        (slot === RESOURCE_SLOTS.staple || slot === RESOURCE_SLOTS.demand) &&
        season !== SEASON_SLOTS.normal
      ) {
        amount *= TUNING.dealOffSeasonFactor;
      }
      const added = addResource(s, action.resourceId, amount);
      s.counters.cumulativeProduction += added;
      return { state: s };
    }

    case 'move': {
      const defender = s.defenders.find((d) => d.id === action.defenderId);
      const area = s.areas[action.areaId];
      if (!defender || !area) return fail(state, 'unknown-target');
      if (!area.explored) return fail(state, 'not-allowed');
      defender.areaId = action.areaId;
      defender.moved = true;
      return { state: s };
    }

    case 'cleanse': {
      const defender = s.defenders.find((d) => d.id === action.defenderId);
      if (!defender) return fail(state, 'unknown-target');
      const area = s.areas[defender.areaId];
      const cell = cellById(rules, defender.areaId);
      if (!area || !cell) return fail(state, 'unknown-target');
      if (!area.infested || area.cleansing) return fail(state, 'not-allowed');
      const cost = cleanseCostForTerrain(terrainSlotOf(rules, cell), season);
      if (!spendStamina(s, cost)) return fail(state, 'no-stamina');
      area.cleansing = true;
      // Sourced backlash: initiating a cleanse spawns threats here and in
      // nearby producer areas.
      if (rules.pressure.cleanseBacklash) {
        area.threats = Math.min(
          TUNING.areaThreatCap,
          area.threats + TUNING.cleanseBacklashLocal,
        );
        for (const n of neighborsOf(cell, rules.areas)) {
          const nearby = s.areas[n.id];
          if (nearby?.infested) {
            nearby.threats = Math.min(
              TUNING.areaThreatCap,
              nearby.threats + TUNING.cleanseBacklashAdjacent,
            );
          }
        }
      }
      return { state: s };
    }

    case 'reinforce': {
      if (!rules.defense.reinforcement) return fail(state, 'not-allowed');
      const from = s.defenders.find((d) => d.id === action.fromId);
      const to = s.defenders.find((d) => d.id === action.toId);
      if (!from || !to || from.id === to.id) return fail(state, 'unknown-target');
      const fromCell = cellById(rules, from.areaId);
      const sameOrAdjacent =
        from.areaId === to.areaId ||
        (fromCell !== undefined &&
          neighborsOf(fromCell, rules.areas).some((n) => n.id === to.areaId));
      if (!sameOrAdjacent) return fail(state, 'not-adjacent');
      if (from.health <= TUNING.reinforceHealthTransfer) return fail(state, 'no-resources');
      if (!spendStamina(s, 1)) return fail(state, 'no-stamina');
      from.health -= TUNING.reinforceHealthTransfer;
      to.health = Math.min(
        TUNING.defenderHealthMax,
        to.health + TUNING.reinforceHealthTransfer,
      );
      to.damageReduction = Math.min(0.8, to.damageReduction + TUNING.reinforceReductionStack);
      return { state: s };
    }

    case 'provoke': {
      const defender = s.defenders.find((d) => d.id === action.defenderId);
      if (!defender) return fail(state, 'unknown-target');
      const cell = cellById(rules, defender.areaId);
      if (!cell) return fail(state, 'unknown-target');
      const donors = neighborsOf(cell, rules.areas)
        .map((n) => s.areas[n.id])
        .filter((a): a is NonNullable<typeof a> => a !== undefined && a.threats >= 1)
        .sort((a, b) => b.threats - a.threats);
      const donor = donors[0];
      if (!donor) return fail(state, 'not-allowed');
      const cost = season === SEASON_SLOTS.lean ? 2 : TUNING.provokeCost;
      if (!spendStamina(s, cost)) return fail(state, 'no-stamina');
      donor.threats -= 1;
      const target = s.areas[defender.areaId];
      if (target) target.threats = Math.min(TUNING.areaThreatCap, target.threats + 1);
      return { state: s };
    }

    case 'festival': {
      const stapleId = resourceIdForSlot(rules, RESOURCE_SLOTS.staple);
      if (stapleId === undefined) return fail(state, 'unknown-target');
      if ((s.resources[stapleId] ?? 0) < TUNING.festivalStaple) {
        return fail(state, 'no-resources');
      }
      if (!spendStamina(s, TUNING.festivalStamina)) return fail(state, 'no-stamina');
      spendResource(s, stapleId, TUNING.festivalStaple);
      const bonus =
        TUNING.festivalMoraleMin +
        random(s) * (TUNING.festivalMoraleMax - TUNING.festivalMoraleMin);
      s.morale = clamp(s.morale + bonus, 0, 100);
      // Sourced: up to +10 authority when well below starting authority.
      const gain =
        s.authority < s.startAuthority - 10
          ? TUNING.festivalAuthorityLow
          : TUNING.festivalAuthorityHigh;
      s.authority = clamp(s.authority + gain, 0, 100);
      s.eventPatience += TUNING.festivalPatience;
      log(s, 'festival');
      return { state: s };
    }

    case 'train': {
      const cap = 1 + Math.floor(s.population / 3);
      if (s.defenders.length >= cap) return fail(state, 'at-capacity');
      const stapleId = resourceIdForSlot(rules, RESOURCE_SLOTS.staple);
      if (stapleId === undefined) return fail(state, 'unknown-target');
      if ((s.resources[stapleId] ?? 0) < TUNING.trainStaple) {
        return fail(state, 'no-resources');
      }
      if (!spendStamina(s, TUNING.trainStamina)) return fail(state, 'no-stamina');
      spendResource(s, stapleId, TUNING.trainStaple);
      const start = startAreaOf(rules);
      s.defenders.push({
        id: `unit-${s.nextDefenderId}`,
        areaId: start.id,
        health: TUNING.defenderHealthMax,
        damageReduction: 0,
        moved: false,
      });
      s.nextDefenderId += 1;
      log(s, 'defenderTrained');
      return { state: s };
    }

    case 'buildHousing': {
      const constructionId = resourceIdForSlot(rules, RESOURCE_SLOTS.construction);
      const heavyId = resourceIdForSlot(rules, RESOURCE_SLOTS.heavy);
      if (constructionId === undefined || heavyId === undefined) {
        return fail(state, 'unknown-target');
      }
      if (
        (s.resources[constructionId] ?? 0) < TUNING.housingConstruction ||
        (s.resources[heavyId] ?? 0) < TUNING.housingHeavy
      ) {
        return fail(state, 'no-resources');
      }
      if (!spendStamina(s, TUNING.housingStamina)) return fail(state, 'no-stamina');
      spendResource(s, constructionId, TUNING.housingConstruction);
      spendResource(s, heavyId, TUNING.housingHeavy);
      s.housing += TUNING.housingGain;
      return { state: s };
    }

    case 'expandStorage': {
      const slot = slotForResourceId(rules, action.resourceId);
      if (slot < 0) return fail(state, 'unknown-target');
      const constructionId = resourceIdForSlot(rules, RESOURCE_SLOTS.construction);
      const heavyId = resourceIdForSlot(rules, RESOURCE_SLOTS.heavy);
      if (constructionId === undefined || heavyId === undefined) {
        return fail(state, 'unknown-target');
      }
      if (
        (s.resources[constructionId] ?? 0) < TUNING.storageConstruction ||
        (s.resources[heavyId] ?? 0) < TUNING.storageHeavy
      ) {
        return fail(state, 'no-resources');
      }
      if (!spendStamina(s, TUNING.storageStamina)) return fail(state, 'no-stamina');
      spendResource(s, constructionId, TUNING.storageConstruction);
      spendResource(s, heavyId, TUNING.storageHeavy);
      s.storageExpansions[action.resourceId] =
        (s.storageExpansions[action.resourceId] ?? 0) + 1;
      s.counters.storageBuilt += 1;
      return { state: s };
    }

    case 'research': {
      if (s.techCountdown !== null) return fail(state, 'not-allowed');
      if (s.tech >= TUNING.techMax) return fail(state, 'at-capacity');
      const stapleId = resourceIdForSlot(rules, RESOURCE_SLOTS.staple);
      const constructionId = resourceIdForSlot(rules, RESOURCE_SLOTS.construction);
      if (stapleId === undefined || constructionId === undefined) {
        return fail(state, 'unknown-target');
      }
      if (
        (s.resources[stapleId] ?? 0) < TUNING.techStaple ||
        (s.resources[constructionId] ?? 0) < TUNING.techConstruction
      ) {
        return fail(state, 'no-resources');
      }
      if (!spendStamina(s, TUNING.techStamina)) return fail(state, 'no-stamina');
      spendResource(s, stapleId, TUNING.techStaple);
      spendResource(s, constructionId, TUNING.techConstruction);
      s.techCountdown = TUNING.techTurns;
      return { state: s };
    }

    case 'endTurn': {
      if (s.pendingPopups.length > 0) return fail(state, 'popups-pending');
      s.turn += 1;
      for (const defender of s.defenders) defender.moved = false;
      stepStamina(rules, s);
      stepAutoExplore(rules, s);
      stepProduction(rules, s);
      const deficits = stepConsumption(rules, s);
      stepMorale(rules, s, deficits);
      stepPopulation(rules, s);
      stepPressure(rules, s);
      if (s.outcome !== 'ongoing') return { state: s };
      stepCombat(rules, s);
      stepHealing(rules, s);
      stepTech(s);
      stepGoals(rules, s);
      stepMilestones(rules, s);
      stepEvents(rules, s);
      checkOutcome(rules, s);
      return { state: s };
    }
  }
}
