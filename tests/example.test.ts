import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { blueprint } from '../src/engine/blueprint.ts';
import { exportScenario, importScenario } from '../src/engine/scenario.ts';
import { lintVocabulary } from '../src/engine/vocabLint.ts';
import { getDomain } from '../src/domain/registry.ts';
import { getTheme } from '../src/theme/registry.ts';
import { App } from '../src/components/App.tsx';

/**
 * Phase 3 proof: the committed /examples scenario (generated from a random
 * business niche via the app's own export path) re-imports cleanly, is
 * byte-stable, renders under the clean-slate theme, and contains zero
 * apocalypse vocabulary.
 */

const examplesDir = join(process.cwd(), 'examples');
const exampleFiles = readdirSync(examplesDir).filter((f) =>
  f.endsWith('-scenario.json'),
);

describe('committed example scenario (/examples)', () => {
  it('exists', () => {
    expect(exampleFiles.length).toBeGreaterThan(0);
  });

  for (const file of exampleFiles) {
    describe(file, () => {
      const raw = readFileSync(join(examplesDir, file), 'utf8');
      const parsed = JSON.parse(raw) as { domainId: string };

      it('belongs to a business-native domain', () => {
        expect(parsed.domainId.startsWith('biz-')).toBe(true);
        expect(getDomain(parsed.domainId).vocabularyProfile).toBe(
          'business-native',
        );
      });

      it('re-imports cleanly through the real validation gate', () => {
        const domain = getDomain(parsed.domainId);
        expect(() => importScenario(raw, blueprint, domain)).not.toThrow();
      });

      it('round-trips byte-identically', () => {
        const domain = getDomain(parsed.domainId);
        const scenario = importScenario(raw, blueprint, domain);
        expect(exportScenario(scenario, blueprint, domain)).toBe(raw);
      });

      it('contains zero apocalypse vocabulary', () => {
        const violations = lintVocabulary(JSON.parse(raw));
        expect(
          violations,
          violations.map((v) => `${v.term}@${v.path}`).join(', '),
        ).toHaveLength(0);
      });

      it('renders under the clean-slate theme', () => {
        const domain = getDomain(parsed.domainId);
        const scenario = importScenario(raw, blueprint, domain);
        const html = renderToStaticMarkup(
          createElement(App, {
            theme: getTheme('clean-slate'),
            domain,
            blueprint,
            initialScenario: scenario,
          }),
        );
        // The scenario's own (niche-native) name appears in the rendered app.
        const name = (
          scenario.editors['basicDetails'] as { name: string }
        ).name;
        expect(html).toContain('Scenario Studio'); // clean-slate chrome
        expect(html.includes(name)).toBe(true);
        // And the rendered page itself carries no apocalypse vocabulary.
        const textOnly = html
          .replace(/<span class="icon-glyph[^"]*"[\s\S]*?<\/span>/g, ' ')
          .replace(/<[^>]+>/g, ' ');
        expect(lintVocabulary({ page: textOnly })).toHaveLength(0);
      });
    });
  }
});
