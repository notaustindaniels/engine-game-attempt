import { domainSchemaZ, type DomainSchema } from './types.ts';
import { afterIncDomain } from './afterInc.ts';
import { clearViewDomain } from './clearView.ts';
import { blueprintTokens } from '../engine/blueprint.ts';
import { runtimeTokens } from '../runtime/tokens.ts';
import { nichePacks } from './business/niches.ts';
import { buildNicheDomain, businessDomainId } from './business/generator.ts';

/**
 * The single domain registry. Every registered domain is validated against
 * the domain contract AND checked for full lexicon coverage of the blueprint,
 * so a domain that would leave any editor label unresolved fails fast.
 */

const domains = new Map<string, DomainSchema>();

export function registerDomain(domain: DomainSchema): DomainSchema {
  const parsed = domainSchemaZ.parse(domain);
  const required = [...blueprintTokens(), ...runtimeTokens()];
  const missing = required.filter((t) => parsed.lexicon[t] === undefined);
  if (missing.length > 0) {
    throw new Error(
      `Domain "${parsed.id}" is missing lexicon tokens: ${missing.join(', ')}`,
    );
  }
  domains.set(parsed.id, parsed);
  return parsed;
}

registerDomain(afterIncDomain);
registerDomain(clearViewDomain);

/** Every resolvable domain id: the canonical domain + one per business niche. */
export function listDomainIds(): string[] {
  const ids = new Set<string>(domains.keys());
  for (const pack of nichePacks) ids.add(businessDomainId(pack.id));
  return [...ids].sort();
}

export function getDomain(id: string): DomainSchema {
  const existing = domains.get(id);
  if (existing) return existing;
  // Business-niche domains are generated on demand from their vocabulary
  // packs, then validated through the same registration gate as any domain.
  const pack = nichePacks.find((p) => businessDomainId(p.id) === id);
  if (pack) return registerDomain(buildNicheDomain(pack));
  throw new Error(
    `Unknown domain "${id}". Available: ${listDomainIds().join(', ')}`,
  );
}
