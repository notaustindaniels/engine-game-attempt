/**
 * Phase 3 generator (spec): programmatically picks a random business niche
 * from the 50-item seed list and writes a complete, valid, niche-native
 * scenario to /examples/<niche>-scenario.json via the app's own schema and
 * export code path. Pass a niche id as argv[2] to regenerate a specific one.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildNicheScenario,
  getNichePack,
  pickRandomNiche,
} from '../src/domain/business/generator.ts';
import { lintVocabulary } from '../src/engine/vocabLint.ts';
import { importScenario } from '../src/engine/scenario.ts';
import { blueprint } from '../src/engine/blueprint.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const requestedId = process.argv[2];
const pack = requestedId !== undefined ? getNichePack(requestedId) : pickRandomNiche();
console.log(`Picked niche: ${pack.id} (${pack.label})`);

const { domain, json } = buildNicheScenario(pack);

// Prove the export re-imports cleanly through the same validation gate.
importScenario(json, blueprint, domain);

// Run the no-apocalypse-vocabulary lint before writing anything.
const violations = lintVocabulary(JSON.parse(json));
if (violations.length > 0) {
  for (const v of violations) {
    console.error(`VOCAB VIOLATION at ${v.path}: "${v.term}" in: ${v.text}`);
  }
  process.exit(1);
}

const outDir = join(repoRoot, 'examples');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `${pack.id}-scenario.json`);
writeFileSync(outFile, json);
console.log(`Wrote ${outFile} (${json.length} bytes); vocabulary lint clean.`);
