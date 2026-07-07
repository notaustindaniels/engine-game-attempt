import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blueprint } from '../src/engine/blueprint.ts';
import { exportScenario, importScenario } from '../src/engine/scenario.ts';
import { lintVocabulary } from '../src/engine/vocabLint.ts';
import { areaMapProblems, hexDistance, neighborsOf, type AreaCell } from '../src/engine/areaMap.ts';
import { buildClearViewScenario } from '../src/scenarios/clearViewWindowCo.ts';
import {
  deriveRules,
  RESOURCE_SLOTS,
  storageCap,
  type GameRules,
} from '../src/runtime/rules.ts';
import { createGame, type GameState } from '../src/runtime/state.ts';
import { applyAction, type GameAction } from '../src/runtime/engine.ts';

/**
 * The authored scenario: valid through the real gates, byte-stable,
 * 100% window-trade language — and genuinely playable: a deterministic
 * scripted owner wins it; a negligent one loses it.
 */

const { domain, scenario, json } = buildClearViewScenario();
const rules = deriveRules(scenario, domain);

describe('The Clear View Window Co. — authored artifact', () => {
  it('is business-native and lint-clean', () => {
    expect(domain.vocabularyProfile).toBe('business-native');
    const violations = lintVocabulary(JSON.parse(json));
    expect(
      violations,
      violations.map((v) => `${v.term}@${v.path}`).join(', '),
    ).toHaveLength(0);
  });

  it('re-imports through the real validation gate and round-trips byte-identically', () => {
    const back = importScenario(json, blueprint, domain);
    expect(back).toEqual(scenario);
    expect(exportScenario(back, blueprint, domain)).toBe(json);
  });

  it('matches the committed /scenarios file byte-for-byte', () => {
    const committed = readFileSync(
      join(process.cwd(), 'scenarios/clear-view-window-co.json'),
      'utf8',
    );
    expect(committed).toBe(json);
  });

  it('carries a structurally sound hand-drawn territory', () => {
    const areas = scenario.editors['areaLayout']?.['areas'] as AreaCell[];
    expect(areas).toHaveLength(19);
    expect(areaMapProblems(areas)).toEqual([]);
    expect(areas.filter((a) => a.infested)).toHaveLength(3);
  });
});

// ————— the scripted owner —————

function act(s: GameState, action: GameAction): GameState {
  const result = applyAction(rules, s, action);
  return result.error === undefined ? result.state : s;
}

function tryAct(s: GameState, action: GameAction): { s: GameState; ok: boolean } {
  const result = applyAction(rules, s, action);
  return result.error === undefined
    ? { s: result.state, ok: true }
    : { s, ok: false };
}

function ackAll(s: GameState): GameState {
  while (s.pendingPopups.length > 0) {
    const next = act(s, { type: 'acknowledge' });
    if (next === s) break;
    s = next;
  }
  return s;
}

function frontier(s: GameState): AreaCell[] {
  return rules.areas.filter((cell) => {
    const area = s.areas[cell.id];
    return (
      area !== undefined &&
      !area.explored &&
      neighborsOf(cell, rules.areas).some((n) => s.areas[n.id]?.explored === true)
    );
  });
}

function claimable(s: GameState): AreaCell[] {
  return rules.areas.filter((cell) => {
    const area = s.areas[cell.id];
    return (
      area !== undefined &&
      area.explored &&
      !area.claimed &&
      !area.infested &&
      area.threats < 0.5 &&
      neighborsOf(cell, rules.areas).some((n) => s.areas[n.id]?.claimed === true)
    );
  });
}

const CASH = rules.resourceIds[RESOURCE_SLOTS.staple] ?? '';
const KITS = rules.resourceIds[RESOURCE_SLOTS.seasonal] ?? '';
const GLASS = rules.resourceIds[RESOURCE_SLOTS.construction] ?? '';
const TOOLS = rules.resourceIds[RESOURCE_SLOTS.heavy] ?? '';

/** Terrain preference when opening service areas: steady cash first. */
function claimScore(rules: GameRules, cell: AreaCell): number {
  return rules.terrainSlotById[cell.terrain] ?? 9;
}

/** One planning pass; returns the new state and whether anything was done. */
function policyStep(s: GameState): { s: GameState; acted: boolean } {
  const goalRule = rules.goals[s.activeGoalIndex];
  const month = (Math.floor(s.turn / 30) % 12) + 1;
  const monthSlot = (m: number) => rules.seasonByMonth[(m - 1) % 12] ?? 0;
  const winterSoon = monthSlot(month) === 1 || monthSlot(month + 1) === 1;

  // Keep the winter shelf stocked.
  if (winterSoon && (s.resources[KITS] ?? 0) < 3 && s.stamina >= 2) {
    const r = tryAct(s, { type: 'deal', resourceId: KITS });
    if (r.ok) return { s: r.s, acted: true };
  }

  // Keep spirits high enough for hiring and safety.
  if (s.morale < 58 && s.stamina >= 3 && (s.resources[CASH] ?? 0) >= 12) {
    const r = tryAct(s, { type: 'festival' });
    if (r.ok) return { s: r.s, acted: true };
  }

  if (!goalRule) return { s, acted: false };

  switch (goalRule.typeIndex) {
    case 0: {
      // Survey territories.
      const next = frontier(s)[0];
      if (next && s.stamina >= 1) {
        const r = tryAct(s, { type: 'explore', areaId: next.id });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    case 1: {
      // Open service areas (both rungs of this type).
      const targets = claimable(s).sort(
        (a, b) => claimScore(rules, a) - claimScore(rules, b) || a.id.localeCompare(b.id),
      );
      const target = targets[0];
      if (target && s.stamina >= 1) {
        const r = tryAct(s, { type: 'claim', areaId: target.id });
        if (r.ok) return { s: r.s, acted: true };
      }
      const next = frontier(s)[0];
      if (next && s.stamina >= 2) {
        const r = tryAct(s, { type: 'explore', areaId: next.id });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    case 2: {
      // Book revenue: chase one-off jobs.
      if (s.stamina >= 2) {
        const r = tryAct(s, { type: 'deal', resourceId: CASH });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    case 6: {
      // Grow the crew: room, spirits, patience.
      if (s.population >= s.housing) {
        if ((s.resources[GLASS] ?? 0) >= 5 && (s.resources[TOOLS] ?? 0) >= 2) {
          const r = tryAct(s, { type: 'buildHousing' });
          if (r.ok) return { s: r.s, acted: true };
        }
        if (s.stamina >= 2 && (s.resources[GLASS] ?? 0) < 5) {
          const r = tryAct(s, { type: 'deal', resourceId: GLASS });
          if (r.ok) return { s: r.s, acted: true };
        }
        if (s.stamina >= 2 && (s.resources[TOOLS] ?? 0) < 2) {
          const r = tryAct(s, { type: 'deal', resourceId: TOOLS });
          if (r.ok) return { s: r.s, acted: true };
        }
      }
      if (s.morale < 66 && s.stamina >= 3 && (s.resources[CASH] ?? 0) >= 12) {
        const r = tryAct(s, { type: 'festival' });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    case 9: {
      // Break strongholds.
      const strongholds = rules.areas
        .filter((c) => s.areas[c.id]?.infested)
        .sort((a, b) => hexDistance(a, { q: 0, r: 0 }) - hexDistance(b, { q: 0, r: 0 }) || a.id.localeCompare(b.id));
      const target = strongholds[0];
      if (!target) break;

      // A second crew keeps the garage safe while one goes hunting.
      if (s.defenders.length < 2 && s.population >= 3) {
        const r = tryAct(s, { type: 'train' });
        if (r.ok) return { s: r.s, acted: true };
      }

      const targetArea = s.areas[target.id];
      if (targetArea && !targetArea.explored) {
        const step = frontier(s).sort(
          (a, b) => hexDistance(a, target) - hexDistance(b, target) || a.id.localeCompare(b.id),
        )[0];
        if (step && s.stamina >= 1) {
          const r = tryAct(s, { type: 'explore', areaId: step.id });
          if (r.ok) return { s: r.s, acted: true };
        }
        break;
      }

      const hunter = s.defenders[s.defenders.length - 1];
      if (hunter && hunter.areaId !== target.id && !hunter.moved) {
        const r = tryAct(s, { type: 'move', defenderId: hunter.id, areaId: target.id });
        if (r.ok) return { s: r.s, acted: true };
      }
      if (
        hunter &&
        hunter.areaId === target.id &&
        targetArea &&
        !targetArea.cleansing &&
        s.stamina >= 3
      ) {
        const r = tryAct(s, { type: 'cleanse', defenderId: hunter.id });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    case 3: {
      // Build cash reserves: the yard must grow before the balance can.
      const cap = storageCap(s.storageExpansions[CASH] ?? 0);
      if (cap < goalRule.targetAmount + 10) {
        if ((s.resources[GLASS] ?? 0) >= 4 && (s.resources[TOOLS] ?? 0) >= 4) {
          const r = tryAct(s, { type: 'expandStorage', resourceId: CASH });
          if (r.ok) return { s: r.s, acted: true };
        }
        if (s.stamina >= 2 && (s.resources[GLASS] ?? 0) < 4) {
          const r = tryAct(s, { type: 'deal', resourceId: GLASS });
          if (r.ok) return { s: r.s, acted: true };
        }
        if (s.stamina >= 2 && (s.resources[TOOLS] ?? 0) < 4) {
          const r = tryAct(s, { type: 'deal', resourceId: TOOLS });
          if (r.ok) return { s: r.s, acted: true };
        }
        break;
      }
      if (s.stamina >= 2) {
        const r = tryAct(s, { type: 'deal', resourceId: CASH });
        if (r.ok) return { s: r.s, acted: true };
      }
      break;
    }
    default:
      break;
  }

  // Idle hustle is wasted hustle (the soft cap halves regen above 8).
  if (s.stamina >= 7) {
    const r = tryAct(s, { type: 'deal', resourceId: CASH });
    if (r.ok) return { s: r.s, acted: true };
  }
  return { s, acted: false };
}

describe('The Clear View Window Co. — playability', () => {
  it('a diligent owner reaches the regional window empire (win path)', () => {
    let s = createGame(rules, 2026);
    s = act(s, { type: 'chooseLeader', leaderIndex: 0 });
    s = ackAll(s);

    let turns = 0;
    while (s.outcome === 'ongoing' && turns < 900) {
      for (let i = 0; i < 12; i++) {
        const step = policyStep(s);
        s = step.s;
        if (!step.acted) break;
      }
      s = act(s, { type: 'endTurn' });
      s = ackAll(s);
      turns += 1;
    }

    expect(
      s.outcome,
      `after ${turns} turns: goal ${s.activeGoalIndex}/${rules.goals.length}, ` +
        `authority ${s.authority.toFixed(1)}, morale ${s.morale.toFixed(1)}, ` +
        `cash ${(s.resources[CASH] ?? 0).toFixed(0)}`,
    ).toBe('won');
    // The climb takes meaningful time — a degenerate instant win means the
    // goal ladder has collapsed.
    expect(turns).toBeGreaterThan(100);
  });

  it('a negligent owner loses the company (lose path)', () => {
    let s = createGame(rules, 2026);
    s = act(s, { type: 'chooseLeader', leaderIndex: 0 });
    s = ackAll(s);

    let turns = 0;
    while (s.outcome === 'ongoing' && turns < 2000) {
      s = act(s, { type: 'endTurn' });
      s = ackAll(s);
      turns += 1;
    }
    expect(
      s.outcome,
      `after ${turns} turns: authority ${s.authority.toFixed(1)}, ` +
        `population ${s.population}, morale ${s.morale.toFixed(1)}`,
    ).toBe('lost');
  });
});
