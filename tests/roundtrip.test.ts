import { describe, expect, it } from 'vitest';
import { blueprint } from '../src/engine/blueprint.ts';
import {
  createDefaultScenario,
  exportScenario,
  importScenario,
} from '../src/engine/scenario.ts';
import { ScenarioParseError } from '../src/engine/io.ts';
import { afterIncDomain } from '../src/domain/afterInc.ts';
import { buildNicheScenario, getNichePack } from '../src/domain/business/generator.ts';

describe('import/export round-trip safety', () => {
  it('import(export(scenario)) deep-equals the scenario', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const json = exportScenario(scenario, blueprint, afterIncDomain);
    const back = importScenario(json, blueprint, afterIncDomain);
    expect(back).toEqual(scenario);
  });

  it('export is byte-stable across repeated round-trips', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const first = exportScenario(scenario, blueprint, afterIncDomain);
    const second = exportScenario(
      importScenario(first, blueprint, afterIncDomain),
      blueprint,
      afterIncDomain,
    );
    expect(second).toBe(first);
  });

  it('normalizes key order so equivalent documents export identically', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const json = exportScenario(scenario, blueprint, afterIncDomain);
    const shuffled = JSON.parse(json) as Record<string, unknown>;
    const reversed = Object.fromEntries(Object.entries(shuffled).reverse());
    const reimported = importScenario(
      JSON.stringify(reversed),
      blueprint,
      afterIncDomain,
    );
    expect(exportScenario(reimported, blueprint, afterIncDomain)).toBe(json);
  });

  it('round-trips a generated business scenario through its own domain', () => {
    const pack = getNichePack('wedding-photography');
    const { domain, scenario, json } = buildNicheScenario(pack);
    const back = importScenario(json, blueprint, domain);
    expect(back).toEqual(scenario);
    expect(exportScenario(back, blueprint, domain)).toBe(json);
  });

  it('rejects malformed JSON with a ScenarioParseError', () => {
    expect(() => importScenario('{not json', blueprint, afterIncDomain)).toThrow(
      ScenarioParseError,
    );
  });

  it('rejects out-of-range documents on import with issue details', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const raw = JSON.parse(
      exportScenario(scenario, blueprint, afterIncDomain),
    ) as {
      editors: { startingValues: { morale: number } };
    };
    raw.editors.startingValues.morale = 250;
    try {
      importScenario(JSON.stringify(raw), blueprint, afterIncDomain);
      expect.unreachable('import should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ScenarioParseError);
      const issues = (err as ScenarioParseError).issues.join('\n');
      expect(issues).toContain('morale');
    }
  });
});
