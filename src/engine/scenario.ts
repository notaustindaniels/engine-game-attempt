import { z } from 'zod';
import type {
  Blueprint,
  EditorSpec,
  FieldSpec,
  ScalarFieldSpec,
  SelectFieldSpec,
} from './fieldSpec.ts';
import type { DomainSchema } from '../domain/types.ts';
import { ScenarioParseError, stableStringify } from './io.ts';

export const SCENARIO_FORMAT_VERSION = 1;

export const resourceOpSchema = z.enum(['ADD', 'SET']);
export type ResourceOp = z.infer<typeof resourceOpSchema>;

export type ScalarValue = string | number | boolean;
export type FieldValue =
  | ScalarValue
  | Record<string, ScalarValue>[]
  | Record<string, { op: ResourceOp; amount: number }>;

export interface Scenario {
  formatVersion: number;
  domainId: string;
  editors: Record<string, Record<string, FieldValue>>;
}

function selectValues(field: SelectFieldSpec, domain: DomainSchema): string[] {
  if (field.options.from === 'static') {
    return field.options.options.map((o) => o.value);
  }
  return domain.pools[field.options.pool].map((item) => item.id);
}

function scalarZod(field: ScalarFieldSpec, domain: DomainSchema): z.ZodType {
  switch (field.kind) {
    case 'text':
    case 'longtext':
      return z.string().min(field.minLength).max(field.maxLength);
    case 'number':
    case 'slider': {
      let schema = z.number().min(field.min).max(field.max);
      if (field.integer) schema = schema.int();
      return schema;
    }
    case 'select': {
      const values = selectValues(field, domain);
      if (values.length === 0) {
        throw new Error(`Select field "${field.id}" has an empty option pool`);
      }
      return z.enum(values as [string, ...string[]]);
    }
    case 'toggle':
      return z.boolean();
  }
}

function fieldZod(field: FieldSpec, domain: DomainSchema): z.ZodType {
  switch (field.kind) {
    case 'list': {
      const shape: Record<string, z.ZodType> = {};
      for (const item of field.item) {
        shape[item.id] = scalarZod(item, domain);
      }
      return z
        .array(z.strictObject(shape))
        .min(field.minItems)
        .max(field.maxItems);
    }
    case 'resourceOps': {
      const shape: Record<string, z.ZodType> = {};
      for (const resource of domain.pools.resources) {
        shape[resource.id] = z.strictObject({
          op: resourceOpSchema,
          amount: z.number().min(field.min).max(field.max),
        });
      }
      return z.strictObject(shape);
    }
    default:
      return scalarZod(field, domain);
  }
}

/**
 * Builds the full Zod schema for a scenario of the given domain. Ranges and
 * enums come from the blueprint (wiki-sourced); option pools come from the
 * domain schema. strictObject everywhere: unknown keys fail import.
 */
export function buildScenarioSchema(blueprint: Blueprint, domain: DomainSchema) {
  const editorsShape: Record<string, z.ZodType> = {};
  for (const editor of blueprint) {
    const fieldsShape: Record<string, z.ZodType> = {};
    for (const field of editor.fields) {
      fieldsShape[field.id] = fieldZod(field, domain);
    }
    editorsShape[editor.id] = z.strictObject(fieldsShape);
  }
  return z.strictObject({
    formatVersion: z.literal(SCENARIO_FORMAT_VERSION),
    domainId: z.literal(domain.id),
    editors: z.strictObject(editorsShape),
  });
}

function defaultScalar(field: ScalarFieldSpec, domain: DomainSchema): ScalarValue {
  switch (field.kind) {
    case 'text':
    case 'longtext':
      return field.defaultValue;
    case 'number':
    case 'slider':
      return field.defaultValue;
    case 'select': {
      const values = selectValues(field, domain);
      const fallback = values[0];
      if (fallback === undefined) {
        throw new Error(`Select field "${field.id}" has an empty option pool`);
      }
      return field.defaultValue ?? fallback;
    }
    case 'toggle':
      return field.defaultValue;
  }
}

function defaultField(field: FieldSpec, domain: DomainSchema): FieldValue {
  switch (field.kind) {
    case 'list': {
      const rows: Record<string, ScalarValue>[] = [];
      for (let i = 0; i < field.minItems; i++) {
        const row: Record<string, ScalarValue> = {};
        for (const item of field.item) {
          row[item.id] = defaultScalar(item, domain);
        }
        rows.push(row);
      }
      return rows;
    }
    case 'resourceOps': {
      const rows: Record<string, { op: ResourceOp; amount: number }> = {};
      for (const resource of domain.pools.resources) {
        rows[resource.id] = { op: 'ADD', amount: 0 };
      }
      return rows;
    }
    default:
      return defaultScalar(field, domain);
  }
}

export function createDefaultScenario(
  blueprint: Blueprint,
  domain: DomainSchema,
): Scenario {
  const editors: Scenario['editors'] = {};
  for (const editor of blueprint) {
    const values: Record<string, FieldValue> = {};
    for (const field of editor.fields) {
      values[field.id] = defaultField(field, domain);
    }
    editors[editor.id] = values;
  }
  return {
    formatVersion: SCENARIO_FORMAT_VERSION,
    domainId: domain.id,
    editors,
  };
}

/** Validates then serializes with stable key order — repeat exports are byte-identical. */
export function exportScenario(
  scenario: Scenario,
  blueprint: Blueprint,
  domain: DomainSchema,
): string {
  const schema = buildScenarioSchema(blueprint, domain);
  const parsed = schema.safeParse(scenario);
  if (!parsed.success) {
    throw new ScenarioParseError(
      'Scenario failed validation on export',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    );
  }
  return stableStringify(parsed.data);
}

/** Parses and validates JSON text into a Scenario; throws ScenarioParseError with issues. */
export function importScenario(
  json: string,
  blueprint: Blueprint,
  domain: DomainSchema,
): Scenario {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (err) {
    throw new ScenarioParseError('Scenario file is not valid JSON', [
      err instanceof Error ? err.message : String(err),
    ]);
  }
  const schema = buildScenarioSchema(blueprint, domain);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ScenarioParseError(
      'Scenario failed validation on import',
      parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    );
  }
  return parsed.data as Scenario;
}

export function findEditor(blueprint: Blueprint, id: string): EditorSpec {
  const editor = blueprint.find((e) => e.id === id);
  if (!editor) throw new Error(`Unknown editor "${id}"`);
  return editor;
}
