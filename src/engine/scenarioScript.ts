/**
 * The scenario script API (GAPS.md C3).
 *
 * The wiki confirms custom events are scripted via uploaded .lua/.txt files
 * that "trigger multiple things via the game's API", but the game's API is
 * unindexed (GAPS.md A9) — so this project defines its own, documented in
 * docs/runtime.md, rather than fabricating the game's.
 *
 * The API is line-based and Lua-comment-friendly: a script is scanned line
 * by line; lines starting with a directive keyword are parsed, every other
 * line (Lua comments, blank lines, real Lua code) is inert. Directives:
 *
 *   ON <metric> <op> <number>       trigger condition; multiple ON lines AND
 *   ON season = <seasonId>          season condition (equality only)
 *   ON resource:<id> <op> <number>  stockpile condition
 *   TEXT <line>                     popup body (TEXT lines concatenate)
 *   BUTTON <label>                  popup acknowledge-button label
 *   EFFECT <target> +N | -N | =N    applied when the popup is acknowledged
 *   EFFECT resource:<id> +N|-N|=N   stockpile effect
 *   REPEAT                          re-arm after the condition goes false
 *
 * Metrics: turn, month, morale, authority, stamina, population, pressure,
 * explored, claimed, cleansed, tech, resource:<id>, season.
 * Effect targets: morale, authority, stamina, population, pressure,
 * patience (event-sourced goal patience), tech, resource:<id>.
 * A script with no ON lines fires on the first turn. Events are
 * edge-triggered: they fire when their conditions BECOME true; without
 * REPEAT they fire at most once.
 */

export const SCRIPT_NUMERIC_METRICS = [
  'turn',
  'month',
  'morale',
  'authority',
  'stamina',
  'population',
  'pressure',
  'explored',
  'claimed',
  'cleansed',
  'tech',
] as const;
export type ScriptNumericMetric = (typeof SCRIPT_NUMERIC_METRICS)[number];

export type ScriptOp = '=' | '>=' | '<=' | '>' | '<';

export type ScriptCondition =
  | { kind: 'numeric'; metric: ScriptNumericMetric; op: ScriptOp; value: number }
  | { kind: 'resource'; resourceId: string; op: ScriptOp; value: number }
  | { kind: 'season'; seasonId: string };

export const SCRIPT_EFFECT_TARGETS = [
  'morale',
  'authority',
  'stamina',
  'population',
  'pressure',
  'patience',
  'tech',
] as const;
export type ScriptEffectTarget = (typeof SCRIPT_EFFECT_TARGETS)[number];

export type ScriptEffect =
  | { target: ScriptEffectTarget; mode: 'add' | 'set'; amount: number }
  | { target: 'resource'; resourceId: string; mode: 'add' | 'set'; amount: number };

export interface ScenarioScript {
  conditions: ScriptCondition[];
  text: string[];
  button?: string;
  effects: ScriptEffect[];
  repeat: boolean;
}

export interface ScriptParseResult {
  script: ScenarioScript;
  /** Lines that start like a directive but could not be parsed. */
  warnings: string[];
}

const OPS: readonly ScriptOp[] = ['>=', '<=', '=', '>', '<'];

function parseOpExpr(expr: string): { op: ScriptOp; rest: string } | null {
  const trimmed = expr.trim();
  for (const op of OPS) {
    if (trimmed.startsWith(op)) {
      return { op, rest: trimmed.slice(op.length).trim() };
    }
  }
  return null;
}

function parseNumber(text: string): number | null {
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  return Number(text);
}

function parseCondition(body: string): ScriptCondition | null {
  const match = /^(\S+)\s*(.*)$/.exec(body.trim());
  if (!match) return null;
  const subject = (match[1] ?? '').toLowerCase();
  const rest = match[2] ?? '';

  if (subject === 'season') {
    const opExpr = parseOpExpr(rest);
    if (!opExpr || opExpr.op !== '=' || opExpr.rest.length === 0) return null;
    return { kind: 'season', seasonId: opExpr.rest };
  }

  const opExpr = parseOpExpr(rest);
  if (!opExpr) return null;
  const value = parseNumber(opExpr.rest);
  if (value === null) return null;

  if (subject.startsWith('resource:')) {
    const resourceId = subject.slice('resource:'.length);
    if (resourceId.length === 0) return null;
    return { kind: 'resource', resourceId, op: opExpr.op, value };
  }
  if ((SCRIPT_NUMERIC_METRICS as readonly string[]).includes(subject)) {
    return {
      kind: 'numeric',
      metric: subject as ScriptNumericMetric,
      op: opExpr.op,
      value,
    };
  }
  return null;
}

function parseEffect(body: string): ScriptEffect | null {
  const match = /^(\S+)\s+([+\-=])\s*(-?\d+(?:\.\d+)?)$/.exec(body.trim());
  if (!match) return null;
  const subject = (match[1] ?? '').toLowerCase();
  const sign = match[2] ?? '+';
  const magnitude = Number(match[3]);
  const mode = sign === '=' ? 'set' : 'add';
  const amount = sign === '-' ? -magnitude : magnitude;

  if (subject.startsWith('resource:')) {
    const resourceId = subject.slice('resource:'.length);
    if (resourceId.length === 0) return null;
    return { target: 'resource', resourceId, mode, amount };
  }
  if ((SCRIPT_EFFECT_TARGETS as readonly string[]).includes(subject)) {
    return { target: subject as ScriptEffectTarget, mode, amount };
  }
  return null;
}

export function parseScenarioScript(source: string): ScriptParseResult {
  const script: ScenarioScript = {
    conditions: [],
    text: [],
    effects: [],
    repeat: false,
  };
  const warnings: string[] = [];

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const keywordMatch = /^([A-Za-z]+)\b\s*(.*)$/.exec(line);
    if (!keywordMatch) continue;
    const keyword = (keywordMatch[1] ?? '').toUpperCase();
    const body = keywordMatch[2] ?? '';

    switch (keyword) {
      case 'ON': {
        const condition = parseCondition(body);
        if (condition) script.conditions.push(condition);
        else warnings.push(`Unparseable ON condition: "${line}"`);
        break;
      }
      case 'TEXT':
        script.text.push(body);
        break;
      case 'BUTTON':
        if (body.length > 0) script.button = body;
        else warnings.push('BUTTON directive without a label');
        break;
      case 'EFFECT': {
        const effect = parseEffect(body);
        if (effect) script.effects.push(effect);
        else warnings.push(`Unparseable EFFECT: "${line}"`);
        break;
      }
      case 'REPEAT':
        script.repeat = true;
        break;
      default:
        // Any other line is inert by design (Lua comments, code, prose).
        break;
    }
  }

  return { script, warnings };
}

/** Evaluation context: the runtime supplies current metric values. */
export interface ScriptMetrics {
  numeric: Record<ScriptNumericMetric, number>;
  resources: Record<string, number>;
  seasonId: string;
}

function compare(op: ScriptOp, left: number, right: number): boolean {
  switch (op) {
    case '=':
      return left === right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '<':
      return left < right;
  }
}

export function conditionsHold(
  script: ScenarioScript,
  metrics: ScriptMetrics,
): boolean {
  return script.conditions.every((condition) => {
    switch (condition.kind) {
      case 'numeric':
        return compare(
          condition.op,
          metrics.numeric[condition.metric],
          condition.value,
        );
      case 'resource':
        return compare(
          condition.op,
          metrics.resources[condition.resourceId] ?? 0,
          condition.value,
        );
      case 'season':
        return metrics.seasonId === condition.seasonId;
    }
  });
}
