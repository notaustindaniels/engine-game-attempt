import { describe, expect, it } from 'vitest';
import {
  conditionsHold,
  parseScenarioScript,
  type ScriptMetrics,
} from '../src/engine/scenarioScript.ts';

function metrics(overrides: Partial<ScriptMetrics['numeric']> = {}, extra?: {
  resources?: Record<string, number>;
  seasonId?: string;
}): ScriptMetrics {
  return {
    numeric: {
      turn: 1,
      month: 1,
      morale: 50,
      authority: 50,
      stamina: 3,
      population: 5,
      pressure: 20,
      explored: 0,
      claimed: 0,
      cleansed: 0,
      tech: 1,
      ...overrides,
    },
    resources: extra?.resources ?? {},
    seasonId: extra?.seasonId ?? 'summer',
  };
}

describe('scenario script API (GAPS.md C3)', () => {
  it('parses a full Lua-comment-friendly script', () => {
    const { script, warnings } = parseScenarioScript(
      [
        '-- A rival crew undercuts your quotes for a month.',
        'ON turn >= 30',
        'ON season = slow',
        'ON resource:payroll-fund < 500',
        'TEXT A rival crew is undercutting every quote in town.',
        'TEXT Your crew wants an answer.',
        'BUTTON Match their prices',
        'EFFECT morale -5',
        'EFFECT resource:payroll-fund +150',
        'EFFECT patience +20',
        'EFFECT pressure =35',
      ].join('\n'),
    );
    expect(warnings).toEqual([]);
    expect(script.conditions).toHaveLength(3);
    expect(script.text).toHaveLength(2);
    expect(script.button).toBe('Match their prices');
    expect(script.effects).toEqual([
      { target: 'morale', mode: 'add', amount: -5 },
      { target: 'resource', resourceId: 'payroll-fund', mode: 'add', amount: 150 },
      { target: 'patience', mode: 'add', amount: 20 },
      { target: 'pressure', mode: 'set', amount: 35 },
    ]);
    expect(script.repeat).toBe(false);
  });

  it('treats unknown lines as inert and flags malformed directives', () => {
    const { script, warnings } = parseScenarioScript(
      [
        'function on_event() -- real lua is inert',
        '  local x = 1',
        'end',
        'ON gibberish !! 4',
        'EFFECT morale ++ 5',
        'EFFECT karma +5',
        'BUTTON',
      ].join('\n'),
    );
    expect(script.conditions).toEqual([]);
    expect(script.effects).toEqual([]);
    expect(warnings).toHaveLength(4);
  });

  it('is case-insensitive on keywords and metrics', () => {
    const { script, warnings } = parseScenarioScript(
      'on Morale <= 20\neffect Authority +5\nrepeat',
    );
    expect(warnings).toEqual([]);
    expect(script.conditions).toEqual([
      { kind: 'numeric', metric: 'morale', op: '<=', value: 20 },
    ]);
    expect(script.repeat).toBe(true);
  });

  it('evaluates AND-ed conditions against supplied metrics', () => {
    const { script } = parseScenarioScript(
      'ON turn >= 10\nON season = winter\nON resource:food < 5',
    );
    expect(
      conditionsHold(script, metrics({ turn: 12 }, { seasonId: 'winter', resources: { food: 2 } })),
    ).toBe(true);
    expect(
      conditionsHold(script, metrics({ turn: 12 }, { seasonId: 'summer', resources: { food: 2 } })),
    ).toBe(false);
    expect(
      conditionsHold(script, metrics({ turn: 9 }, { seasonId: 'winter', resources: { food: 2 } })),
    ).toBe(false);
    expect(
      conditionsHold(script, metrics({ turn: 12 }, { seasonId: 'winter', resources: { food: 5 } })),
    ).toBe(false);
  });

  it('a script with no ON lines holds immediately', () => {
    const { script } = parseScenarioScript('TEXT Hello');
    expect(conditionsHold(script, metrics())).toBe(true);
  });
});
