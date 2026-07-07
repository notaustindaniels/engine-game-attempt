import { describe, expect, it } from 'vitest';
import { APOCALYPSE_TERMS, lintVocabulary } from '../src/engine/vocabLint.ts';
import { nichePacks } from '../src/domain/business/niches.ts';
import { buildNicheScenario } from '../src/domain/business/generator.ts';
import { blueprint } from '../src/engine/blueprint.ts';
import { importScenario } from '../src/engine/scenario.ts';

describe('no-apocalypse-vocabulary lint', () => {
  it('detects forbidden terms anywhere in a JSON document', () => {
    const dirty = {
      title: 'A quiet morning',
      nested: { events: [{ text: 'The Zombies attack your studio!' }] },
    };
    const violations = lintVocabulary(dirty);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.term).toBe('zombies');
    expect(violations[0]?.path).toBe('$.nested.events[0].text');
  });

  it('matches whole words only (no false positives on substrings)', () => {
    // "zed" must not match inside "organized"; "horde" not inside "hoarders".
    const clean = {
      a: 'A well-organized calendar',
      b: 'Storage hoarders welcome',
      c: 'The plan is planned',
    };
    expect(lintVocabulary(clean)).toHaveLength(0);
  });

  it('flags forbidden terms used as object keys too', () => {
    const dirty = { zombies: 5 };
    expect(lintVocabulary(dirty).map((v) => v.term)).toContain('zombies');
  });

  it('keeps a meaningful forbidden-term list', () => {
    for (const core of ['zombie', 'apocalypse', 'undead', 'horde', 'bunker']) {
      expect(APOCALYPSE_TERMS).toContain(core);
    }
  });
});

describe('business-domain output is 100% niche-native', () => {
  it('has 50 niches in the seed list, all unique', () => {
    expect(nichePacks).toHaveLength(50);
    expect(new Set(nichePacks.map((p) => p.id)).size).toBe(50);
  });

  it('every one of the 50 niches generates a valid, lint-clean scenario', () => {
    for (const pack of nichePacks) {
      const { domain, json } = buildNicheScenario(pack);
      expect(domain.vocabularyProfile).toBe('business-native');

      // Valid through the real import gate.
      expect(() => importScenario(json, blueprint, domain)).not.toThrow();

      // Zero apocalypse vocabulary in the exported scenario.
      const violations = lintVocabulary(JSON.parse(json));
      expect(
        violations,
        `${pack.id}: ${violations.map((v) => `${v.term}@${v.path}`).join(', ')}`,
      ).toHaveLength(0);
    }
  });

  it('lints the full domain language layer of every niche, not just the scenario', () => {
    for (const pack of nichePacks) {
      const { domain } = buildNicheScenario(pack);
      const violations = lintVocabulary({
        lexicon: domain.lexicon,
        pools: domain.pools,
        name: domain.name,
        description: domain.description,
      });
      expect(
        violations,
        `${pack.id}: ${violations.map((v) => `${v.term}@${v.path}`).join(', ')}`,
      ).toHaveLength(0);
    }
  });
});
