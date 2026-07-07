/**
 * "No apocalypse vocabulary" lint.
 *
 * Domains whose vocabularyProfile is "business-native" must never leak
 * post-apocalyptic language into any exported scenario text. The mechanic
 * (a pressure value with spawn/growth/threat behavior identical to the
 * game's) is preserved 1:1; the language must be 100% niche-native.
 */

export const APOCALYPSE_TERMS: readonly string[] = [
  'zombie',
  'zombies',
  'undead',
  'infected',
  'infection',
  'infestation',
  'infest',
  'apocalypse',
  'apocalyptic',
  'post-apocalyptic',
  'horde',
  'hordes',
  'outbreak',
  'bunker',
  'bunkers',
  'survivor',
  'survivors',
  'plague',
  'corpse',
  'corpses',
  'walker',
  'walkers',
  'wasteland',
  'mutant',
  'mutants',
  'quarantine',
  'biohazard',
  'contagion',
  'pandemic',
  'fallout',
  'irradiated',
  'raider',
  'raiders',
  'scavenge',
  'scavenger',
  'scavengers',
  'looter',
  'looters',
  'militia',
  'barricade',
  'barricades',
  'ruins',
  'doomsday',
  'end times',
  'the fall',
  'zed',
];

export interface VocabViolation {
  /** JSON path to the offending string, e.g. "editors.events.items[0].title" */
  path: string;
  /** The forbidden term that matched. */
  term: string;
  /** The full string value that contained it. */
  text: string;
}

const matchers = APOCALYPSE_TERMS.map((term) => ({
  term,
  // Word-boundary match so e.g. "planned" never matches "plan".
  regex: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(term)}(?![\\p{L}\\p{N}])`, 'iu'),
}));

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Walks every string in a JSON-like value and reports each forbidden term.
 * Returns an empty array when the value is clean.
 */
export function lintVocabulary(value: unknown, path = '$'): VocabViolation[] {
  const violations: VocabViolation[] = [];
  visit(value, path, violations);
  return violations;
}

function visit(value: unknown, path: string, out: VocabViolation[]): void {
  if (typeof value === 'string') {
    for (const { term, regex } of matchers) {
      if (regex.test(value)) {
        out.push({ path, term, text: value });
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => visit(item, `${path}[${i}]`, out));
    return;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Keys are part of the output too — lint them as strings.
      for (const { term, regex } of matchers) {
        if (regex.test(key)) {
          out.push({ path: `${path}.${key}`, term, text: `(key) ${key}` });
        }
      }
      visit(val, `${path}.${key}`, out);
    }
  }
}
