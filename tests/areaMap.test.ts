import { describe, expect, it } from 'vitest';
import { blueprint } from '../src/engine/blueprint.ts';
import {
  buildScenarioSchema,
  createDefaultScenario,
} from '../src/engine/scenario.ts';
import {
  areaMapProblems,
  generateAreaMapPreset,
  hexDistance,
  neighborsOf,
  startArea,
  type AreaCell,
} from '../src/engine/areaMap.ts';
import { afterIncDomain } from '../src/domain/afterInc.ts';
import { getDomain } from '../src/domain/registry.ts';

const schema = buildScenarioSchema(blueprint, afterIncDomain);

function areasOf(scenario = createDefaultScenario(blueprint, afterIncDomain)) {
  return scenario.editors['areaLayout']?.['areas'] as AreaCell[];
}

describe('area map geometry (GAPS.md C1)', () => {
  it('default scenarios carry a structurally valid map', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const result = schema.safeParse(scenario);
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
    expect(areaMapProblems(areasOf(scenario))).toEqual([]);
  });

  it('presets are deterministic, connected, and single-start for every domain shape', () => {
    for (const domainId of ['after-inc', 'biz-wedding-photography']) {
      const domain = getDomain(domainId);
      for (const index of [0, 1]) {
        const a = generateAreaMapPreset(domain, index);
        const b = generateAreaMapPreset(domain, index);
        expect(b).toEqual(a);
        expect(areaMapProblems(a)).toEqual([]);
        expect(a.filter((c) => c.start)).toHaveLength(1);
        expect(a.filter((c) => c.infested).length).toBeGreaterThan(0);
        // Terrain ids are always drawn from the domain's own pool.
        const terrainIds = new Set(domain.pools.terrains.map((t) => t.id));
        for (const cell of a) expect(terrainIds.has(cell.terrain)).toBe(true);
      }
    }
  });

  it('rejects a map with zero or two start areas', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const areas = areasOf(scenario);
    const first = areas[0];
    const second = areas[1];
    if (!first || !second) throw new Error('preset too small');

    second.start = true;
    expect(schema.safeParse(scenario).success).toBe(false);

    first.start = false;
    second.start = false;
    expect(schema.safeParse(scenario).success).toBe(false);
  });

  it('rejects duplicate coordinates, duplicate ids, and unknown terrain', () => {
    const base = createDefaultScenario(blueprint, afterIncDomain);
    const areas = areasOf(base);
    const a1 = areas[1];
    const a2 = areas[2];
    if (!a1 || !a2) throw new Error('preset too small');

    const original = { q: a2.q, r: a2.r, id: a2.id, terrain: a2.terrain };
    a2.q = a1.q;
    a2.r = a1.r;
    expect(schema.safeParse(base).success).toBe(false);
    a2.q = original.q;
    a2.r = original.r;

    a2.id = a1.id;
    expect(schema.safeParse(base).success).toBe(false);
    a2.id = original.id;

    a2.terrain = 'lava-fields';
    expect(schema.safeParse(base).success).toBe(false);
    a2.terrain = original.terrain;

    expect(schema.safeParse(base).success).toBe(true);
  });

  it('rejects a disconnected map and an infested start area', () => {
    const scenario = createDefaultScenario(blueprint, afterIncDomain);
    const areas = areasOf(scenario);
    const last = areas[areas.length - 1];
    if (!last) throw new Error('preset too small');

    last.q = 10;
    last.r = 10;
    expect(
      areaMapProblems(areas).some((p) => p.includes('not connected')),
    ).toBe(true);
    expect(schema.safeParse(scenario).success).toBe(false);

    const fresh = areasOf();
    const start = startArea(fresh);
    if (!start) throw new Error('no start');
    start.infested = true;
    expect(
      areaMapProblems(fresh).some((p) => p.includes('pressure producer')),
    ).toBe(true);
  });

  it('hex adjacency and distance behave like an axial grid', () => {
    const areas = areasOf();
    const start = startArea(areas);
    if (!start) throw new Error('no start');
    expect(start.q).toBe(0);
    expect(start.r).toBe(0);
    const ringOne = neighborsOf(start, areas);
    expect(ringOne).toHaveLength(6);
    for (const cell of ringOne) expect(hexDistance(start, cell)).toBe(1);
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
  });
});
