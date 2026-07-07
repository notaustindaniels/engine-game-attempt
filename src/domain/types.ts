import { z } from 'zod';

/**
 * A domain schema is the full semantic layer for one "world": every
 * mechanic's name, description, option pools (resources, terrains, seasons,
 * leaders, ...), event text and icon references, per the Native Translation
 * rule. Mechanics (the editor blueprint, ranges, ADD/SET semantics) are
 * shared across domains; language never leaks across domains.
 */

export const domainItemSchema = z.object({
  /** Stable value stored in scenario JSON. */
  id: z.string().min(1),
  /** Domain-native display label. */
  label: z.string().min(1),
  description: z.string(),
  /** Theme icon id (e.g. "mechanic.resource"); themes decide the artwork. */
  icon: z.string().optional(),
});
export type DomainItem = z.infer<typeof domainItemSchema>;

/** Option pools a blueprint select-field may draw from. */
export const domainPoolNames = [
  'resources',
  'terrains',
  'areaLayouts',
  'seasons',
  'leaders',
  'modifiers',
  'goalTypes',
  'eventImages',
  'difficulties',
] as const;
export type DomainPoolName = (typeof domainPoolNames)[number];

export const lexiconEntrySchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
});
export type LexiconEntry = z.infer<typeof lexiconEntrySchema>;

export const domainSchemaZ = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  /**
   * business-native domains are subject to the no-apocalypse-vocabulary
   * lint on all scenario output; post-apocalyptic is the canonical game
   * language and exempt.
   */
  vocabularyProfile: z.enum(['post-apocalyptic', 'business-native']),
  /**
   * Content language, keyed by the stable tokens the editor blueprint uses
   * (editor titles, field labels, mechanic names). Domains must cover every
   * token the blueprint references — enforced by tests.
   */
  lexicon: z.record(z.string(), lexiconEntrySchema),
  pools: z.object({
    resources: z.array(domainItemSchema).min(1),
    terrains: z.array(domainItemSchema).min(1),
    areaLayouts: z.array(domainItemSchema).min(1),
    seasons: z.array(domainItemSchema).min(1),
    leaders: z.array(domainItemSchema).min(1),
    modifiers: z.array(domainItemSchema).min(1),
    goalTypes: z.array(domainItemSchema).min(1),
    eventImages: z.array(domainItemSchema).min(1),
    difficulties: z.array(domainItemSchema).min(1),
  }),
});
export type DomainSchema = z.infer<typeof domainSchemaZ>;

export function domainLabel(domain: DomainSchema, token: string): string {
  return domain.lexicon[token]?.label ?? token;
}

export function domainDescription(
  domain: DomainSchema,
  token: string,
): string | undefined {
  return domain.lexicon[token]?.description;
}

export function poolItems(
  domain: DomainSchema,
  pool: DomainPoolName,
): readonly DomainItem[] {
  return domain.pools[pool];
}
