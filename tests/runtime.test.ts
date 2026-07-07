import { describe, expect, it } from 'vitest';
import { blueprint } from '../src/engine/blueprint.ts';
import {
  createDefaultScenario,
  exportScenario,
  importScenario,
  type Scenario,
} from '../src/engine/scenario.ts';
import type { AreaCell } from '../src/engine/areaMap.ts';
import { afterIncDomain } from '../src/domain/afterInc.ts';
import { getDomain, listDomainIds } from '../src/domain/registry.ts';
import {
  deriveRules,
  RESOURCE_SLOTS,
  TUNING,
  type GameRules,
} from '../src/runtime/rules.ts';
import { createGame, type GameState } from '../src/runtime/state.ts';
import { applyAction, type GameAction } from '../src/runtime/engine.ts';

function makeRules(mutate?: (scenario: Scenario) => void): GameRules {
  const scenario = createDefaultScenario(blueprint, afterIncDomain);
  mutate?.(scenario);
  // Through the real export/import gates: the runtime consumes only what a
  // scenario file can carry.
  const json = exportScenario(scenario, blueprint, afterIncDomain);
  return deriveRules(importScenario(json, blueprint, afterIncDomain), afterIncDomain);
}

function play(rules: GameRules, state: GameState, actions: GameAction[]): GameState {
  let s = state;
  for (const action of actions) {
    const result = applyAction(rules, s, action);
    if (result.error !== undefined) {
      throw new Error(`Action ${action.type} failed: ${result.error}`);
    }
    s = result.state;
  }
  return s;
}

function ackAll(rules: GameRules, state: GameState): GameState {
  let s = state;
  while (s.pendingPopups.length > 0) {
    s = play(rules, s, [{ type: 'acknowledge' }]);
  }
  return s;
}

function boot(rules: GameRules, leaderIndex = 0, seed = 7): GameState {
  let s = createGame(rules, seed);
  s = play(rules, s, [{ type: 'chooseLeader', leaderIndex }]);
  return ackAll(rules, s);
}

function endTurns(rules: GameRules, state: GameState, n: number): GameState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = play(rules, s, [{ type: 'endTurn' }]);
    s = ackAll(rules, s);
  }
  return s;
}

describe('slot convention across every domain (GAPS.md C4)', () => {
  it('all domains carry identical pool sizes so slots line up', () => {
    const reference = getDomain('after-inc').pools;
    for (const id of listDomainIds()) {
      const pools = getDomain(id).pools;
      expect(pools.resources, id).toHaveLength(reference.resources.length);
      expect(pools.terrains, id).toHaveLength(reference.terrains.length);
      expect(pools.seasons, id).toHaveLength(reference.seasons.length);
      expect(pools.leaders, id).toHaveLength(reference.leaders.length);
      expect(pools.modifiers, id).toHaveLength(reference.modifiers.length);
      expect(pools.goalTypes, id).toHaveLength(reference.goalTypes.length);
      expect(pools.difficulties, id).toHaveLength(reference.difficulties.length);
    }
  });
});

describe('deriveRules (scenario JSON is the sole content source)', () => {
  it('applies ADD/SET semantics against the engine baseline', () => {
    const rules = makeRules((sc) => {
      const stockpiles = sc.editors['resources']?.['stockpiles'] as Record<
        string,
        { op: string; amount: number }
      >;
      stockpiles['food'] = { op: 'SET', amount: 50 };
      stockpiles['water'] = { op: 'ADD', amount: -4 };
      stockpiles['wood'] = { op: 'ADD', amount: 15 };
    });
    expect(rules.startingResources['food']).toBe(50);
    expect(rules.startingResources['water']).toBe(TUNING.resourceBaseline - 4);
    expect(rules.startingResources['wood']).toBe(TUNING.resourceBaseline + 15);
    expect(rules.startingResources['fuel']).toBe(TUNING.resourceBaseline);
  });

  it('adjusts goal patience by the sourced modifier patience-point economy', () => {
    const harder = makeRules((sc) => {
      sc.editors['modifiers'] = {
        difficulty: 'normal',
        active: [{ modifier: 'combat-grassland', patiencePoints: -5 }],
      };
    });
    const easier = makeRules((sc) => {
      sc.editors['modifiers'] = {
        difficulty: 'normal',
        active: [{ modifier: 'combat-grassland', patiencePoints: 5 }],
      };
    });
    const base = makeRules();
    const basePatience = base.goals[0]?.patience ?? 0;
    expect(harder.goals[0]?.patience).toBe(Math.round(basePatience * 1.1));
    expect(easier.goals[0]?.patience).toBe(Math.round(basePatience * 0.95));
  });

  it('honors the producer floor from the pressure editor', () => {
    const rules = makeRules((sc) => {
      const pressure = sc.editors['pressure'];
      if (pressure) pressure['infestedAreas'] = 6;
    });
    const state = createGame(rules, 1);
    const producers = Object.values(state.areas).filter((a) => a.infested);
    expect(producers).toHaveLength(6);
  });
});

describe('game flow', () => {
  it('starts in setup, blocks play until a leader is chosen and popups are answered', () => {
    const rules = makeRules();
    const s0 = createGame(rules, 1);
    expect(s0.outcome).toBe('setup');
    expect(s0.pendingPopups.length).toBeGreaterThan(0);
    expect(applyAction(rules, s0, { type: 'explore', areaId: 'area-2' }).error).toBe(
      'wrong-phase',
    );
    let s = play(rules, s0, [{ type: 'chooseLeader', leaderIndex: 0 }]);
    expect(s.outcome).toBe('ongoing');
    expect(applyAction(rules, s, { type: 'endTurn' }).error).toBe('popups-pending');
    s = ackAll(rules, s);
    expect(applyAction(rules, s, { type: 'endTurn' }).error).toBeUndefined();
  });

  it('explore/claim respect adjacency, stamina, and feed production', () => {
    const rules = makeRules((sc) => {
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 999, stable: false }],
      };
    });
    let s = boot(rules);
    // Ring-2 cell is not adjacent to the explored start.
    expect(applyAction(rules, s, { type: 'explore', areaId: 'area-8' }).error).toBe(
      'not-adjacent',
    );
    s = play(rules, s, [
      { type: 'explore', areaId: 'area-2' },
      { type: 'claim', areaId: 'area-2' },
    ]);
    expect(s.stamina).toBe(rules.startingStamina - 2);
    expect(s.counters.explored).toBe(1);
    expect(s.counters.claimed).toBe(1);

    s = endTurns(rules, s, 10);
    expect(s.counters.cumulativeProduction).toBeGreaterThan(0);
  });

  it('one-off deals cost stamina and add stock', () => {
    const rules = makeRules();
    let s = boot(rules);
    const before = s.resources['food'] ?? 0;
    s = play(rules, s, [{ type: 'deal', resourceId: 'food' }]);
    expect(s.stamina).toBe(rules.startingStamina - 1);
    expect(s.resources['food'] ?? 0).toBeGreaterThan(before);
    // Advanced resource locked below tech 5 (sourced).
    expect(applyAction(rules, s, { type: 'deal', resourceId: 'material' }).error).toBe(
      'tech-locked',
    );
  });

  it('resource deficits drag morale down', () => {
    const rules = makeRules((sc) => {
      const stockpiles = sc.editors['resources']?.['stockpiles'] as Record<
        string,
        { op: string; amount: number }
      >;
      stockpiles['food'] = { op: 'SET', amount: 0 };
      stockpiles['water'] = { op: 'SET', amount: 0 };
    });
    let s = boot(rules);
    const before = s.morale;
    s = endTurns(rules, s, 10);
    expect(s.morale).toBeLessThan(before - 5);
  });

  it('completing every goal wins and grants authority', () => {
    const rules = makeRules(); // default: one explore-1-area goal
    let s = boot(rules);
    const before = s.authority;
    s = play(rules, s, [{ type: 'explore', areaId: 'area-2' }, { type: 'endTurn' }]);
    expect(s.goals[0]?.completed).toBe(true);
    expect(s.outcome).toBe('won');
    expect(s.authority).toBe(before + TUNING.goalCompleteAuthority);
  });

  it('overdue goals bleed authority (impatience)', () => {
    const rules = makeRules((sc) => {
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 0, stable: false }],
      };
    });
    let s = boot(rules);
    const before = s.authority;
    s = endTurns(rules, s, 10);
    expect(s.authority).toBeLessThan(before);
    expect(s.outcome).toBe('ongoing');
  });

  it('the crunch season pauses the goal clock (sourced mercy rule)', () => {
    const rules = makeRules((sc) => {
      const seasons = sc.editors['seasons'] as Record<string, string>;
      seasons['month1'] = 'drought';
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 50, stable: false }],
      };
    });
    let s = boot(rules);
    s = endTurns(rules, s, 5);
    expect(s.goals[0]?.patienceLeft).toBe(rules.goals[0]?.patience);
  });

  it('producers spawn threats; defenders fight, cleanse, and can die', () => {
    const rules = makeRules((sc) => {
      const areas = sc.editors['areaLayout']?.['areas'] as AreaCell[];
      const ringOne = areas.find((a) => a.id === 'area-2');
      if (ringOne) ringOne.infested = true;
      sc.editors['goals'] = {
        goals: [{ type: 'kill-zombies', targetAmount: 9999, patience: 999, stable: false }],
      };
    });
    let s = boot(rules);
    s = play(rules, s, [
      { type: 'explore', areaId: 'area-2' },
      { type: 'move', defenderId: 'unit-1', areaId: 'area-2' },
      { type: 'cleanse', defenderId: 'unit-1' },
    ]);
    // Backlash spawned threats immediately (sourced mechanic).
    expect(s.areas['area-2']?.threats).toBeGreaterThanOrEqual(2);
    s = endTurns(rules, s, 6);
    expect(s.counters.kills).toBeGreaterThan(0);
    expect(s.counters.cleansed).toBe(1);
    expect(s.areas['area-2']?.infested).toBe(false);
    const unit = s.defenders.find((d) => d.id === 'unit-1');
    expect(unit).toBeDefined();
    expect(unit?.health).toBeLessThan(TUNING.defenderHealthMax);
  });

  it('festivals trade staples for morale, authority, and board patience', () => {
    const rules = makeRules();
    let s = boot(rules);
    const morale = s.morale;
    s = play(rules, s, [{ type: 'festival' }]);
    expect(s.morale).toBeGreaterThanOrEqual(morale + TUNING.festivalMoraleMin);
    expect(s.eventPatience).toBe(TUNING.festivalPatience);
    expect(s.resources['food']).toBe(10 - TUNING.festivalStaple);
  });

  it('script events fire edge-triggered, block the turn, and apply effects', () => {
    const rules = makeRules((sc) => {
      sc.editors['customEvents'] = {
        events: [
          {
            title: 'Trouble',
            scriptFileName: 'trouble.lua',
            scriptBody:
              '-- flavor comment\nON turn >= 2\nTEXT Bad news.\nBUTTON Deal with it\nEFFECT morale -10\nEFFECT resource:food +20',
            image: 'settlement-dawn',
          },
        ],
      };
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 999, stable: false }],
      };
    });
    let s = boot(rules);
    s = play(rules, s, [{ type: 'endTurn' }]);
    expect(s.pendingPopups).toHaveLength(0);
    s = play(rules, s, [{ type: 'endTurn' }]);
    expect(s.pendingPopups).toHaveLength(1);
    expect(applyAction(rules, s, { type: 'endTurn' }).error).toBe('popups-pending');
    const morale = s.morale;
    const food = s.resources['food'] ?? 0;
    s = play(rules, s, [{ type: 'acknowledge' }]);
    expect(s.morale).toBe(morale - 10);
    expect(s.resources['food']).toBe(food + 20);
    // Fired once; does not re-fire without REPEAT.
    s = endTurns(rules, s, 3);
    expect(s.pendingPopups).toHaveLength(0);
  });

  it('losing is reachable: a collapse event can end the run', () => {
    const rules = makeRules((sc) => {
      sc.editors['customEvents'] = {
        events: [
          {
            title: 'Collapse',
            scriptFileName: 'collapse.lua',
            scriptBody: 'ON turn >= 1\nEFFECT population -99',
            image: 'settlement-dawn',
          },
        ],
      };
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 999, stable: false }],
      };
    });
    let s = boot(rules);
    s = play(rules, s, [{ type: 'endTurn' }, { type: 'acknowledge' }]);
    expect(s.population).toBe(0);
    expect(s.outcome).toBe('lost');
    expect(applyAction(rules, s, { type: 'endTurn' }).error).toBe('wrong-phase');
  });

  it('is deterministic for a fixed seed and action sequence', () => {
    const rules = makeRules((sc) => {
      sc.editors['goals'] = {
        goals: [{ type: 'reach-population', targetAmount: 99, patience: 999, stable: false }],
      };
    });
    const run = () => {
      let s = boot(rules, 0, 42);
      s = play(rules, s, [
        { type: 'explore', areaId: 'area-3' },
        { type: 'deal', resourceId: 'wood' },
      ]);
      return endTurns(rules, s, 25);
    };
    expect(run()).toEqual(run());
  });

  it('slot roles resolve the same way in a business domain', () => {
    const domain = getDomain('biz-wedding-photography');
    const scenario = createDefaultScenario(blueprint, domain);
    const json = exportScenario(scenario, blueprint, domain);
    const rules = deriveRules(importScenario(json, blueprint, domain), domain);
    expect(rules.resourceIds[RESOURCE_SLOTS.staple]).toBe('payroll-fund');
    expect(rules.resourceIds[RESOURCE_SLOTS.demand]).toBe('demand-pipeline');
    let s = createGame(rules, 3);
    s = play(rules, s, [{ type: 'chooseLeader', leaderIndex: 0 }]);
    s = ackAll(rules, s);
    s = endTurns(rules, s, 5);
    expect(s.outcome).toBe('ongoing');
    expect(s.counters.cumulativeProduction).toBeGreaterThan(0);
  });
});
