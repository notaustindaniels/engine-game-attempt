/**
 * Writes the authored Clear View Window Co. scenario to
 * /scenarios/clear-view-window-co.json via the app's own schema and export
 * code path, re-imports it through the real validation gate, and runs the
 * no-apocalypse-vocabulary lint before writing anything.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildClearViewScenario } from '../src/scenarios/clearViewWindowCo.ts';
import { lintVocabulary } from '../src/engine/vocabLint.ts';
import { importScenario } from '../src/engine/scenario.ts';
import { blueprint } from '../src/engine/blueprint.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const { domain, json } = buildClearViewScenario();

importScenario(json, blueprint, domain);

const violations = lintVocabulary(JSON.parse(json));
if (violations.length > 0) {
  for (const v of violations) {
    console.error(`VOCAB VIOLATION at ${v.path}: "${v.term}" in: ${v.text}`);
  }
  process.exit(1);
}

const outDir = join(repoRoot, 'scenarios');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'clear-view-window-co.json');
writeFileSync(outFile, json);
console.log(`Wrote ${outFile} (${json.length} bytes); vocabulary lint clean.`);
