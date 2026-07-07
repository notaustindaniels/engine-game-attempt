/**
 * Lexicon tokens the runtime UI resolves through the active domain — the
 * game speaks each world's own language, per the Native Translation rule.
 * Every registered domain must cover these (enforced by the registry gate,
 * exactly like the editor blueprint's tokens).
 */

export const RUNTIME_STAT_TOKENS = [
  'runtime.stat.morale',
  'runtime.stat.authority',
  'runtime.stat.stamina',
  'runtime.stat.population',
  'runtime.stat.housing',
  'runtime.stat.pressure',
  'runtime.stat.tech',
] as const;

export const RUNTIME_ACTION_TOKENS = [
  'runtime.action.explore',
  'runtime.action.claim',
  'runtime.action.deal',
  'runtime.action.move',
  'runtime.action.cleanse',
  'runtime.action.provoke',
  'runtime.action.festival',
  'runtime.action.train',
  'runtime.action.housing',
  'runtime.action.storage',
  'runtime.action.research',
] as const;

export const RUNTIME_LOG_TOKENS = [
  'runtime.log.explored',
  'runtime.log.claimed',
  'runtime.log.areaLost',
  'runtime.log.cleansed',
  'runtime.log.defenderDown',
  'runtime.log.defenderTrained',
  'runtime.log.goalComplete',
  'runtime.log.goalOverdue',
  'runtime.log.festival',
  'runtime.log.growth',
  'runtime.log.abandonment',
  'runtime.log.attack',
  'runtime.log.techUp',
  'runtime.log.milestone',
  'runtime.log.event',
] as const;

export const RUNTIME_MISC_TOKENS = [
  'runtime.chooseLeader',
  'runtime.defenders',
  'runtime.outcome.won',
  'runtime.outcome.won.desc',
  'runtime.outcome.lost',
  'runtime.outcome.lost.desc',
] as const;

export function runtimeTokens(): string[] {
  return [
    ...RUNTIME_STAT_TOKENS,
    ...RUNTIME_ACTION_TOKENS,
    ...RUNTIME_LOG_TOKENS,
    ...RUNTIME_MISC_TOKENS,
  ].sort();
}
