/**
 * Round-trip-safe JSON serialization. Export always emits keys in sorted
 * order with fixed indentation, so export(import(x)) === normalize(x) and
 * repeated exports are byte-identical.
 */

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value), null, 2) + '\n';
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const out: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      out[key] = sortKeysDeep(val);
    }
    return out;
  }
  return value;
}

export class ScenarioParseError extends Error {
  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
    this.name = 'ScenarioParseError';
  }
}
