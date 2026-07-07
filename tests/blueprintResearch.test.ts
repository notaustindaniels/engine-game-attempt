import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { blueprint, blueprintTokens } from '../src/engine/blueprint.ts';
import { getDomain, listDomainIds } from '../src/domain/registry.ts';

/**
 * Adversarial cross-check: the app may only contain fields that are either
 * wiki-sourced or explicitly declared as reconstructions in GAPS.md. This
 * test mechanically enforces the traceability contract.
 */

const gapsText = readFileSync(
  join(process.cwd(), 'docs/research/GAPS.md'),
  'utf8',
);

function gapRefs(source: string): string[] {
  const match = /GAP:([A-Z0-9,]+)/.exec(source);
  if (!match || match[1] === undefined) return [];
  return match[1].split(',');
}

describe('blueprint ↔ research traceability', () => {
  it('every GAP marker in the blueprint has a matching row in GAPS.md', () => {
    for (const editor of blueprint) {
      for (const ref of gapRefs(editor.source)) {
        expect(gapsText, `${editor.id} → ${ref}`).toContain(`| ${ref} |`);
      }
      for (const field of editor.fields) {
        const sources = [field.source];
        if (field.kind === 'list') {
          for (const item of field.item) sources.push(item.source);
        }
        for (const source of sources) {
          for (const ref of gapRefs(source)) {
            expect(gapsText, `${editor.id}.${field.id} → ${ref}`).toContain(
              `| ${ref} |`,
            );
          }
        }
      }
    }
  });

  it('the sourced Resources editor carries the verbatim wiki range', () => {
    const resources = blueprint.find((e) => e.id === 'resources');
    const field = resources?.fields[0];
    expect(field?.kind).toBe('resourceOps');
    if (field?.kind === 'resourceOps') {
      expect(field.min).toBe(-9999);
      expect(field.max).toBe(9999);
    }
  });

  it('the sourced season options exist in the canonical domain pool', () => {
    const domain = getDomain('after-inc');
    const ids = domain.pools.seasons.map((s) => s.id).sort();
    expect(ids).toEqual(['drought', 'summer', 'winter']);
  });

  it('the canonical domain ships the 11 sourced goal types and 7 sourced resources', () => {
    const domain = getDomain('after-inc');
    expect(domain.pools.goalTypes).toHaveLength(11);
    expect(domain.pools.resources.map((r) => r.id)).toEqual([
      'food',
      'water',
      'wood',
      'fuel',
      'medicine',
      'stone',
      'material',
    ]);
  });

  it('every registered domain covers every blueprint lexicon token', () => {
    // Sample: canonical + three business domains (all 50 are validated
    // exhaustively in vocab.test.ts through the same registration gate).
    const sample = [
      'after-inc',
      'biz-wedding-photography',
      'biz-craft-brewery',
      'biz-kayak-tour-operator',
    ];
    for (const id of sample) {
      const domain = getDomain(id);
      const missing = blueprintTokens().filter(
        (t) => domain.lexicon[t] === undefined,
      );
      expect(missing, `${id} missing: ${missing.join(', ')}`).toHaveLength(0);
    }
    expect(listDomainIds()).toContain('after-inc');
    expect(listDomainIds().filter((d) => d.startsWith('biz-'))).toHaveLength(50);
  });
});
