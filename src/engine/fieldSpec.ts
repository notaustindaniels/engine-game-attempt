import type { DomainPoolName } from '../domain/types.ts';

/**
 * The editor blueprint type system. The 11-editor structure, field types,
 * ranges, and ADD/SET semantics are DATA (instances of these types built
 * from the wiki research in /docs/research), never hardcoded components.
 *
 * Every field instance carries a `source`: the wiki URL it was documented
 * from, or a "GAP:<note>" marker cross-referenced in /docs/research/GAPS.md.
 */

export interface StaticOption {
  value: string;
  /** Lexicon token — resolved through the active domain. */
  labelToken: string;
}

export type OptionSource =
  | { from: 'static'; options: readonly StaticOption[] }
  | { from: 'domain'; pool: DomainPoolName };

interface FieldBase {
  id: string;
  /** Lexicon token for the field label — domains own all content language. */
  labelToken: string;
  helpToken?: string;
  /** Wiki source URL, or "GAP:<note>" (must appear in docs/research/GAPS.md). */
  source: string;
}

export interface TextFieldSpec extends FieldBase {
  kind: 'text' | 'longtext';
  minLength: number;
  maxLength: number;
  defaultValue: string;
}

export interface NumberFieldSpec extends FieldBase {
  kind: 'number' | 'slider';
  min: number;
  max: number;
  step?: number;
  integer: boolean;
  defaultValue: number;
}

export interface SelectFieldSpec extends FieldBase {
  kind: 'select';
  options: OptionSource;
  /** Omitted = first available option. */
  defaultValue?: string;
}

export interface ToggleFieldSpec extends FieldBase {
  kind: 'toggle';
  defaultValue: boolean;
}

/** Repeating group (events, goals, ...). Items share one row shape. */
export interface ListFieldSpec extends FieldBase {
  kind: 'list';
  item: readonly ScalarFieldSpec[];
  minItems: number;
  maxItems: number;
}

/**
 * One row per domain resource with the wiki's ADD-vs-SET semantics:
 * ADD adds the amount to the resource's default value; SET overrides it.
 */
export interface ResourceOpsFieldSpec extends FieldBase {
  kind: 'resourceOps';
  min: number;
  max: number;
}

export type ScalarFieldSpec =
  | TextFieldSpec
  | NumberFieldSpec
  | SelectFieldSpec
  | ToggleFieldSpec;

export type FieldSpec = ScalarFieldSpec | ListFieldSpec | ResourceOpsFieldSpec;

export interface EditorSpec {
  id: string;
  /** Lexicon token for the editor's title (domain-native). */
  labelToken: string;
  descriptionToken?: string;
  category: 'base' | 'advanced';
  /** Theme icon id for the nav entry. */
  icon: string;
  /** Wiki source URL for the editor as a whole. */
  source: string;
  fields: readonly FieldSpec[];
}

export type Blueprint = readonly EditorSpec[];
