import type { Blueprint, ScalarFieldSpec, SelectFieldSpec } from './fieldSpec.ts';

/**
 * The 11-editor blueprint: 6 base + 5 advanced, per the wiki research in
 * /docs/research. This is DATA — components render whatever is declared here.
 *
 * Source markers: a wiki URL means the editor/field/range is documented there;
 * "GAP:Bn" points at the reconstruction decision row in
 * /docs/research/GAPS.md. No unsourced value is presented as a wiki fact.
 */

const CS = 'https://afterinc.wiki.gg/wiki/Custom_Scenarios';

function eventImageField(id: string, labelToken: string): SelectFieldSpec {
  return {
    id,
    labelToken,
    kind: 'select',
    options: { from: 'domain', pool: 'eventImages' },
    source: 'GAP:B13',
  };
}

const monthFields: ScalarFieldSpec[] = Array.from({ length: 12 }, (_, i) => ({
  id: `month${i + 1}`,
  labelToken: `field.seasons.month${i + 1}`,
  kind: 'select' as const,
  options: { from: 'domain' as const, pool: 'seasons' as const },
  source: `${CS} (per-month season; 12-month count GAP:B6)`,
}));

export const blueprint: Blueprint = [
  // ————— base category (6 editors) —————
  {
    id: 'basicDetails',
    labelToken: 'editor.basicDetails',
    descriptionToken: 'editor.basicDetails.desc',
    category: 'base',
    icon: 'mechanic.settings',
    source: CS,
    fields: [
      {
        id: 'name',
        labelToken: 'field.basicDetails.name',
        kind: 'text',
        minLength: 1,
        maxLength: 80,
        defaultValue: 'Untitled Scenario',
        source: 'GAP:B1',
      },
      {
        id: 'description',
        labelToken: 'field.basicDetails.description',
        kind: 'longtext',
        minLength: 0,
        maxLength: 500,
        defaultValue: '',
        source: 'GAP:B1',
      },
    ],
  },
  {
    id: 'areaLayout',
    labelToken: 'editor.areaLayout',
    descriptionToken: 'editor.areaLayout.desc',
    category: 'base',
    icon: 'mechanic.region',
    source: CS,
    fields: [
      {
        id: 'layout',
        labelToken: 'field.areaLayout.layout',
        kind: 'select',
        options: { from: 'domain', pool: 'areaLayouts' },
        source: 'GAP:B2',
      },
    ],
  },
  {
    id: 'startingEvents',
    labelToken: 'editor.startingEvents',
    descriptionToken: 'editor.startingEvents.desc',
    category: 'base',
    icon: 'mechanic.event',
    source: CS,
    fields: [
      {
        id: 'events',
        labelToken: 'field.startingEvents.events',
        kind: 'list',
        minItems: 1,
        maxItems: 10,
        source: `${CS} (list confirmed; item shape GAP:B3; caps GAP:B16)`,
        item: [
          {
            id: 'title',
            labelToken: 'field.event.title',
            kind: 'text',
            minLength: 1,
            maxLength: 80,
            defaultValue: 'New event',
            source: 'GAP:B3',
          },
          {
            id: 'description',
            labelToken: 'field.event.description',
            kind: 'longtext',
            minLength: 0,
            maxLength: 500,
            defaultValue: '',
            source: 'GAP:B3',
          },
          {
            id: 'buttonText',
            labelToken: 'field.event.buttonText',
            kind: 'text',
            minLength: 1,
            maxLength: 40,
            defaultValue: 'Continue',
            source: 'GAP:B3',
          },
          eventImageField('image', 'field.event.image'),
        ],
      },
    ],
  },
  {
    id: 'startingValues',
    labelToken: 'editor.startingValues',
    descriptionToken: 'editor.startingValues.desc',
    category: 'base',
    icon: 'mechanic.authority',
    source: CS,
    fields: [
      {
        id: 'morale',
        labelToken: 'field.startingValues.morale',
        kind: 'slider',
        min: 0,
        max: 100,
        integer: true,
        defaultValue: 50,
        source: 'GAP:B4',
      },
      {
        id: 'authority',
        labelToken: 'field.startingValues.authority',
        kind: 'slider',
        min: 0,
        max: 100,
        integer: true,
        defaultValue: 50,
        source: 'GAP:B4',
      },
      {
        id: 'population',
        labelToken: 'field.startingValues.population',
        kind: 'number',
        min: 0,
        max: 100,
        integer: true,
        defaultValue: 5,
        source: 'GAP:B4',
      },
    ],
  },
  {
    id: 'resources',
    labelToken: 'editor.resources',
    descriptionToken: 'editor.resources.desc',
    category: 'base',
    icon: 'mechanic.resource',
    source: CS,
    fields: [
      {
        id: 'stockpiles',
        labelToken: 'field.resources.stockpiles',
        kind: 'resourceOps',
        min: -9999,
        max: 9999,
        source: `${CS} (ADD/SET semantics + [-9999..9999] sourced; pool linkage GAP:B5)`,
      },
    ],
  },
  {
    id: 'seasons',
    labelToken: 'editor.seasons',
    descriptionToken: 'editor.seasons.desc',
    category: 'base',
    icon: 'mechanic.season',
    source: CS,
    fields: monthFields,
  },

  // ————— advanced category (5 editors; only customEvents' identity is wiki-sourced) —————
  {
    id: 'customEvents',
    labelToken: 'editor.customEvents',
    descriptionToken: 'editor.customEvents.desc',
    category: 'advanced',
    icon: 'mechanic.event',
    source: CS,
    fields: [
      {
        id: 'events',
        labelToken: 'field.customEvents.events',
        kind: 'list',
        minItems: 0,
        maxItems: 20,
        source: `${CS} (script upload .txt/.lua sourced; item shape GAP:B8; caps GAP:B16)`,
        item: [
          {
            id: 'title',
            labelToken: 'field.event.title',
            kind: 'text',
            minLength: 1,
            maxLength: 80,
            defaultValue: 'New event',
            source: 'GAP:B8',
          },
          {
            id: 'scriptFileName',
            labelToken: 'field.customEvents.scriptFileName',
            kind: 'text',
            minLength: 1,
            maxLength: 120,
            defaultValue: 'event.lua',
            pattern: {
              regex: '\\.(lua|txt)$',
              flags: 'i',
              description: 'Script files must be .lua or .txt',
            },
            source: `${CS} (text or lua file kinds sourced and enforced; field itself GAP:B8)`,
          },
          {
            id: 'scriptBody',
            labelToken: 'field.customEvents.scriptBody',
            kind: 'longtext',
            minLength: 0,
            maxLength: 20000,
            defaultValue: '',
            source: 'GAP:B8 (no API function list exists to validate against, GAP:A9)',
          },
          eventImageField('image', 'field.event.image'),
        ],
      },
    ],
  },
  {
    id: 'goals',
    labelToken: 'editor.goals',
    descriptionToken: 'editor.goals.desc',
    category: 'advanced',
    icon: 'mechanic.goal',
    source: 'GAP:B7 (mechanics: https://afterinc.wiki.gg/wiki/Goals)',
    fields: [
      {
        id: 'goals',
        labelToken: 'field.goals.goals',
        kind: 'list',
        minItems: 1,
        maxItems: 20,
        source: 'GAP:B9,B16',
        item: [
          {
            id: 'type',
            labelToken: 'field.goals.type',
            kind: 'select',
            options: { from: 'domain', pool: 'goalTypes' },
            source:
              'https://afterinc.wiki.gg/wiki/Goals (11 goal types sourced; field placement GAP:B9)',
          },
          {
            id: 'targetAmount',
            labelToken: 'field.goals.targetAmount',
            kind: 'number',
            min: 0,
            max: 9999,
            integer: true,
            defaultValue: 1,
            source: 'GAP:B9',
          },
          {
            id: 'patience',
            labelToken: 'field.goals.patience',
            kind: 'number',
            min: 0,
            max: 999,
            integer: true,
            defaultValue: 100,
            source: 'https://afterinc.wiki.gg/wiki/Goals (patience mechanic; range GAP:B9)',
          },
          {
            id: 'stable',
            labelToken: 'field.goals.stable',
            kind: 'toggle',
            defaultValue: false,
            source:
              'https://afterinc.wiki.gg/wiki/Goals (stable-goal mechanic sourced; field GAP:B9)',
          },
        ],
      },
    ],
  },
  {
    id: 'pressure',
    labelToken: 'editor.pressure',
    descriptionToken: 'editor.pressure.desc',
    category: 'advanced',
    icon: 'mechanic.pressure',
    source: 'GAP:B7 (mechanics: https://afterinc.wiki.gg/wiki/Areas)',
    fields: [
      {
        id: 'startingIntensity',
        labelToken: 'field.pressure.startingIntensity',
        kind: 'slider',
        min: 0,
        max: 100,
        integer: true,
        defaultValue: 20,
        source: 'GAP:B10',
      },
      {
        id: 'growthRate',
        labelToken: 'field.pressure.growthRate',
        kind: 'slider',
        min: 0,
        max: 100,
        integer: true,
        defaultValue: 10,
        source: 'GAP:B10',
      },
      {
        id: 'infestedAreas',
        labelToken: 'field.pressure.infestedAreas',
        kind: 'number',
        min: 0,
        max: 50,
        integer: true,
        defaultValue: 3,
        source:
          'https://afterinc.wiki.gg/wiki/Areas (producer-node mechanic sourced; range GAP:B10)',
      },
      {
        id: 'surpriseThreats',
        labelToken: 'field.pressure.surpriseThreats',
        kind: 'toggle',
        defaultValue: true,
        source:
          'https://afterinc.wiki.gg/wiki/Areas + /wiki/Fighters (surprise-attack mechanic sourced; field GAP:B10)',
      },
      {
        id: 'cleanseBacklash',
        labelToken: 'field.pressure.cleanseBacklash',
        kind: 'toggle',
        defaultValue: true,
        source:
          'https://afterinc.wiki.gg/wiki/Areas (cleanse-backlash mechanic sourced; field GAP:B10)',
      },
    ],
  },
  {
    id: 'defense',
    labelToken: 'editor.defense',
    descriptionToken: 'editor.defense.desc',
    category: 'advanced',
    icon: 'mechanic.defense',
    source: 'GAP:B7 (mechanics: https://afterinc.wiki.gg/wiki/Fighters)',
    fields: [
      {
        id: 'startingUnits',
        labelToken: 'field.defense.startingUnits',
        kind: 'number',
        min: 0,
        max: 10,
        integer: true,
        defaultValue: 1,
        source: 'GAP:B11',
      },
      {
        id: 'healingRatePct',
        labelToken: 'field.defense.healingRatePct',
        kind: 'number',
        min: 0,
        max: 10,
        step: 0.1,
        integer: false,
        defaultValue: 0.2,
        source:
          'https://afterinc.wiki.gg/wiki/Fighters (0.2–10 %/turn healing spread sourced; field + [0,10] range GAP:B11)',
      },
      {
        id: 'reinforcement',
        labelToken: 'field.defense.reinforcement',
        kind: 'toggle',
        defaultValue: true,
        source:
          'https://afterinc.wiki.gg/wiki/Fighters (reinforcement mechanic sourced; field GAP:B11)',
      },
      {
        id: 'supplyAttrition',
        labelToken: 'field.defense.supplyAttrition',
        kind: 'toggle',
        defaultValue: true,
        source:
          'https://afterinc.wiki.gg/wiki/Fighters (supply-attrition mechanic sourced; field GAP:B11)',
      },
    ],
  },
  {
    id: 'modifiers',
    labelToken: 'editor.modifiers',
    descriptionToken: 'editor.modifiers.desc',
    category: 'advanced',
    icon: 'mechanic.modifier',
    source: 'GAP:B7 (mechanics: https://afterinc.wiki.gg/wiki/Modifiers)',
    fields: [
      {
        id: 'difficulty',
        labelToken: 'field.modifiers.difficulty',
        kind: 'select',
        options: { from: 'domain', pool: 'difficulties' },
        source:
          'https://afterinc.wiki.gg/wiki/Difficulty (4 tiers sourced; placement GAP:B12)',
      },
      {
        id: 'active',
        labelToken: 'field.modifiers.active',
        kind: 'list',
        minItems: 0,
        maxItems: 10,
        source: 'GAP:B12,B16',
        item: [
          {
            id: 'modifier',
            labelToken: 'field.modifiers.modifier',
            kind: 'select',
            options: { from: 'domain', pool: 'modifiers' },
            source:
              'https://afterinc.wiki.gg/wiki/Modifiers (family list single-source, GAP:A14)',
          },
          {
            id: 'patiencePoints',
            labelToken: 'field.modifiers.patiencePoints',
            kind: 'number',
            min: -10,
            max: 10,
            integer: true,
            defaultValue: 0,
            source:
              'https://afterinc.wiki.gg/wiki/Modifiers (patience economy sourced; range GAP:B12)',
          },
        ],
      },
    ],
  },
];

/** Every lexicon token the blueprint references — domains must cover all of them. */
export function blueprintTokens(): string[] {
  const tokens = new Set<string>();
  for (const editor of blueprint) {
    tokens.add(editor.labelToken);
    if (editor.descriptionToken !== undefined) tokens.add(editor.descriptionToken);
    for (const field of editor.fields) {
      tokens.add(field.labelToken);
      if (field.helpToken !== undefined) tokens.add(field.helpToken);
      if (field.kind === 'list') {
        for (const item of field.item) {
          tokens.add(item.labelToken);
          if (item.helpToken !== undefined) tokens.add(item.helpToken);
          if (item.kind === 'select' && item.options.from === 'static') {
            for (const opt of item.options.options) tokens.add(opt.labelToken);
          }
        }
      }
      if (field.kind === 'select' && field.options.from === 'static') {
        for (const opt of field.options.options) tokens.add(opt.labelToken);
      }
    }
  }
  return [...tokens].sort();
}
