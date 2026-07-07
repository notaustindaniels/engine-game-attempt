import { describe, expect, it } from 'vitest';
import { blueprint } from '../src/engine/blueprint.ts';
import {
  buildScenarioSchema,
  createDefaultScenario,
} from '../src/engine/scenario.ts';
import { afterIncDomain } from '../src/domain/afterInc.ts';

const schema = buildScenarioSchema(blueprint, afterIncDomain);

function validScenario() {
  return createDefaultScenario(blueprint, afterIncDomain);
}

describe('scenario schema validation (wiki-documented ranges)', () => {
  it('accepts a default scenario', () => {
    const result = schema.safeParse(validScenario());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it('enforces the sourced resource amount range [-9999, 9999]', () => {
    const scenario = validScenario();
    const stockpiles = scenario.editors['resources']?.['stockpiles'] as Record<
      string,
      { op: string; amount: number }
    >;
    stockpiles['food'] = { op: 'ADD', amount: 10000 };
    expect(schema.safeParse(scenario).success).toBe(false);

    stockpiles['food'] = { op: 'ADD', amount: -10000 };
    expect(schema.safeParse(scenario).success).toBe(false);

    stockpiles['food'] = { op: 'SET', amount: -9999 };
    expect(schema.safeParse(scenario).success).toBe(true);

    stockpiles['food'] = { op: 'SET', amount: 9999 };
    expect(schema.safeParse(scenario).success).toBe(true);
  });

  it('enforces ADD/SET as the only resource op modes', () => {
    const scenario = validScenario();
    const stockpiles = scenario.editors['resources']?.['stockpiles'] as Record<
      string,
      { op: string; amount: number }
    >;
    stockpiles['food'] = { op: 'MULTIPLY', amount: 1 };
    expect(schema.safeParse(scenario).success).toBe(false);
  });

  it('rejects unknown resource ids (strict objects everywhere)', () => {
    const scenario = validScenario();
    const stockpiles = scenario.editors['resources']?.['stockpiles'] as Record<
      string,
      { op: string; amount: number }
    >;
    stockpiles['plutonium'] = { op: 'ADD', amount: 1 };
    expect(schema.safeParse(scenario).success).toBe(false);
  });

  it('enforces the season enum from the domain pool (sourced: 3 seasons)', () => {
    const scenario = validScenario();
    const seasons = scenario.editors['seasons'] as Record<string, string>;
    seasons['month1'] = 'monsoon';
    expect(schema.safeParse(scenario).success).toBe(false);
    seasons['month1'] = 'drought';
    expect(schema.safeParse(scenario).success).toBe(true);
  });

  it('enforces slider ranges on starting values', () => {
    const scenario = validScenario();
    const values = scenario.editors['startingValues'] as Record<string, number>;
    values['morale'] = 101;
    expect(schema.safeParse(scenario).success).toBe(false);
    values['morale'] = -1;
    expect(schema.safeParse(scenario).success).toBe(false);
    values['morale'] = 100;
    expect(schema.safeParse(scenario).success).toBe(true);
  });

  it('enforces list bounds on starting events (min 1)', () => {
    const scenario = validScenario();
    const editor = scenario.editors['startingEvents'] as { events: unknown[] };
    editor.events = [];
    expect(schema.safeParse(scenario).success).toBe(false);
  });

  it('rejects unknown editors and unknown fields', () => {
    const scenario = validScenario() as unknown as {
      editors: Record<string, unknown>;
    };
    scenario.editors['cheats'] = {};
    expect(schema.safeParse(scenario).success).toBe(false);
    delete scenario.editors['cheats'];
    (scenario.editors['basicDetails'] as Record<string, unknown>)['secret'] = 1;
    expect(schema.safeParse(scenario).success).toBe(false);
  });

  it('rejects a scenario claiming a different domain', () => {
    const scenario = validScenario();
    (scenario as { domainId: string }).domainId = 'someone-else';
    expect(schema.safeParse(scenario).success).toBe(false);
  });
});

describe('blueprint structure (research contract)', () => {
  it('has exactly 11 editors: 6 base + 5 advanced', () => {
    expect(blueprint).toHaveLength(11);
    expect(blueprint.filter((e) => e.category === 'base')).toHaveLength(6);
    expect(blueprint.filter((e) => e.category === 'advanced')).toHaveLength(5);
  });

  it('gives every editor, field, AND list-item field a source (wiki URL or GAP marker)', () => {
    const isTraceable = (source: string) =>
      source.includes('afterinc.wiki.gg') || source.includes('GAP:');
    for (const editor of blueprint) {
      expect(isTraceable(editor.source), `${editor.id}: ${editor.source}`).toBe(
        true,
      );
      for (const field of editor.fields) {
        expect(
          isTraceable(field.source),
          `${editor.id}.${field.id}: ${field.source}`,
        ).toBe(true);
        if (field.kind === 'list') {
          for (const item of field.item) {
            expect(
              isTraceable(item.source),
              `${editor.id}.${field.id}.${item.id}: ${item.source}`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it('enforces the sourced .lua/.txt constraint on custom event scripts', () => {
    const scenario = validScenario();
    const editor = scenario.editors['customEvents'] as {
      events: Record<string, unknown>[];
    };
    const validEvent = {
      title: 'Supply run',
      scriptFileName: 'supply-run.lua',
      scriptBody: '',
      image: afterIncDomain.pools.eventImages[0]?.id ?? '',
    };
    editor.events = [validEvent];
    expect(schema.safeParse(scenario).success).toBe(true);

    editor.events = [{ ...validEvent, scriptFileName: 'supply-run.txt' }];
    expect(schema.safeParse(scenario).success).toBe(true);

    editor.events = [{ ...validEvent, scriptFileName: 'virus.exe' }];
    expect(schema.safeParse(scenario).success).toBe(false);

    editor.events = [{ ...validEvent, scriptFileName: 'no-extension' }];
    expect(schema.safeParse(scenario).success).toBe(false);
  });
});
