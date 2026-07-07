import type { DomainSchema } from '../types.ts';
import type { NichePack } from './nichePack.ts';
import { nichePacks } from './niches.ts';
import { blueprint } from '../../engine/blueprint.ts';
import {
  createDefaultScenario,
  exportScenario,
  type Scenario,
} from '../../engine/scenario.ts';

/**
 * Expands a niche vocabulary pack into a complete business-native domain
 * schema. Mechanics mirror the game blueprint 1:1 (same pools, same editor
 * structure, same ranges); every visible string is the niche's own business
 * language per the Native Translation rule. vocabularyProfile is
 * 'business-native', so all scenario output is subject to the
 * no-apocalypse-vocabulary lint.
 */

export function businessDomainId(nicheId: string): string {
  return `biz-${nicheId}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function cycleMonths(pack: NichePack): Record<string, { label: string }> {
  const lexicon: Record<string, { label: string }> = {};
  for (let i = 1; i <= 12; i++) {
    lexicon[`field.seasons.month${i}`] = { label: `Month ${i}` };
  }
  void pack;
  return lexicon;
}

export function buildNicheDomain(pack: NichePack): DomainSchema {
  const venture = pack.venture;
  const team = pack.team;
  const customers = pack.customers;

  return {
    id: businessDomainId(pack.id),
    name: pack.label,
    description: `A ${pack.label.toLowerCase()} growing from a first lease and a small founding team into a durable local institution.`,
    vocabularyProfile: 'business-native',
    lexicon: {
      'editor.basicDetails': { label: 'Business Plan Details' },
      'editor.basicDetails.desc': {
        label: 'Business Plan Details',
        description: `Basic details about this ${venture} scenario, used when others search for it.`,
      },
      'field.basicDetails.name': { label: 'Scenario name' },
      'field.basicDetails.description': { label: 'Scenario description' },

      'editor.areaLayout': { label: 'Market Map' },
      'editor.areaLayout.desc': {
        label: 'Market Map',
        description: `Pick the market landscape the ${venture} launches into.`,
      },
      'field.areaLayout.layout': { label: 'Market landscape' },
      'field.areaLayout.areas': { label: 'Segment map' },
      'field.area.terrain': { label: 'Segment type' },
      'field.area.river': { label: 'Infrastructure corridor' },
      'field.area.infested': { label: 'Active pressure source' },
      'field.area.start': { label: 'Home base' },

      'editor.startingEvents': { label: 'Opening Announcements' },
      'editor.startingEvents.desc': {
        label: 'Opening Announcements',
        description:
          'The launch-day developments shown when the scenario starts. Add more; all share one layout.',
      },
      'field.startingEvents.events': { label: 'Announcements' },
      'field.event.title': { label: 'Headline' },
      'field.event.description': { label: 'Announcement text' },
      'field.event.buttonText': { label: 'Response label' },
      'field.event.image': { label: 'Announcement image' },

      'editor.startingValues': { label: 'Opening Position' },
      'editor.startingValues.desc': {
        label: 'Opening Position',
        description: `The ${venture}'s position on day one.`,
      },
      'field.startingValues.morale': { label: `${capitalize(team)} morale` },
      'field.startingValues.authority': { label: 'Founder credibility' },
      'field.startingValues.population': { label: 'Headcount' },
      'field.startingValues.stamina': { label: 'Founder attention' },

      'editor.resources': { label: 'Capital & Inventory' },
      'editor.resources.desc': {
        label: 'Capital & Inventory',
        description:
          'Add to, or set (override), the default opening balances of each capital class.',
      },
      'field.resources.stockpiles': { label: 'Opening balances' },

      'editor.seasons': { label: 'Market Cycles' },
      'editor.seasons.desc': {
        label: 'Market Cycles',
        description: `Set the market climate for each month of the ${venture}'s year.`,
      },
      ...cycleMonths(pack),

      'editor.customEvents': { label: 'Scripted Developments' },
      'editor.customEvents.desc': {
        label: 'Scripted Developments',
        description:
          'Author your own market developments that trigger effects through the scenario API. Scripts are text or Lua files.',
      },
      'field.customEvents.events': { label: 'Scripted developments' },
      'field.customEvents.scriptFileName': { label: 'Script file (.lua/.txt)' },
      'field.customEvents.scriptBody': { label: 'Script body' },

      'editor.goals': { label: 'Milestones' },
      'editor.goals.desc': {
        label: 'Milestones',
        description:
          'The milestones the board expects, each with a patience clock.',
      },
      'field.goals.goals': { label: 'Milestone list' },
      'field.goals.type': { label: 'Milestone type' },
      'field.goals.targetAmount': { label: 'Target amount' },
      'field.goals.patience': { label: 'Board patience (days)' },
      'field.goals.stable': { label: 'Maintenance milestone (pauses the clock)' },

      'editor.pressure': { label: capitalize(pack.pressureLabel) },
      'editor.pressure.desc': {
        label: capitalize(pack.pressureLabel),
        description: pack.pressureDesc,
      },
      'field.pressure.startingIntensity': { label: 'Initial market pressure' },
      'field.pressure.growthRate': { label: 'Pressure escalation rate' },
      'field.pressure.infestedAreas': {
        label: `${capitalize(pack.pressureSources)} at launch`,
      },
      'field.pressure.surpriseThreats': {
        label: 'Blindside shocks from unresearched segments',
      },
      'field.pressure.cleanseBacklash': {
        label: 'Turnaround pushes provoke short-term flare-ups',
      },

      'editor.defense': { label: 'Retention & Safeguards' },
      'editor.defense.desc': {
        label: 'Retention & Safeguards',
        description: `The ${venture}'s dedicated retention capacity: the people who hold ${customers} and defend hard-won ground.`,
      },
      'field.defense.startingUnits': { label: 'Retention specialists on day one' },
      'field.defense.healingRatePct': { label: 'Team recovery rate (% per day)' },
      'field.defense.reinforcement': { label: 'Allow surge staffing during a crisis' },
      'field.defense.supplyAttrition': {
        label: 'Underfunded field teams burn out faster',
      },

      'editor.modifiers': { label: 'Market Conditions' },
      'editor.modifiers.desc': {
        label: 'Market Conditions',
        description:
          'Standing conditions of this market; net patience points stretch or shrink milestone clocks.',
      },
      'field.modifiers.difficulty': { label: 'Market climate' },
      'field.modifiers.active': { label: 'Active conditions' },
      'field.modifiers.modifier': { label: 'Condition' },
      'field.modifiers.patiencePoints': { label: 'Patience points' },
    },
    pools: {
      resources: [
        { id: 'payroll-fund', label: 'Payroll fund', description: `Cash that keeps the ${team} paid.`, icon: 'mechanic.resource' },
        { id: 'demand-pipeline', label: capitalize(pack.inquiriesTerm), description: `Incoming ${customers} demand; dries up in a crunch.`, icon: 'mechanic.resource' },
        { id: 'supplies', label: 'Working supplies', description: 'Day-to-day consumables and stock.', icon: 'mechanic.resource' },
        { id: 'marketing-budget', label: 'Marketing budget', description: 'Visibility spend; vital in the slow season.', icon: 'mechanic.resource' },
        { id: 'wellbeing-fund', label: 'Team development fund', description: `Training and recovery budget for the ${team}.`, icon: 'mechanic.resource' },
        { id: 'capital-equipment', label: pack.gearTerm, description: 'Heavy capital assets of the business.', icon: 'mechanic.resource' },
        { id: 'automation-systems', label: 'Automation systems', description: 'Advanced tooling; unlocks at operational maturity.', icon: 'mechanic.resource' },
      ],
      terrains: [
        { id: 'steady-volume', label: 'Steady-volume segment', description: 'Reliable everyday demand.' },
        { id: 'contract-rich', label: 'Contract-rich segment', description: 'Fewer, larger recurring deals.' },
        { id: 'specialist-niche', label: 'Specialist niche', description: 'Slow-moving but defensible demand.' },
        { id: 'infrastructure-heavy', label: 'Infrastructure-heavy segment', description: 'High setup cost, durable yield.' },
        { id: 'crowded-metro', label: 'Crowded metro marketplace', description: 'No steady yield; opportunistic wins.' },
      ],
      areaLayouts: [
        { id: 'local-market', label: `Local ${venture} market`, description: 'A compact home-town landscape of nearby segments.' },
        { id: 'regional-market', label: 'Regional expansion map', description: 'A wider landscape with distant, richer segments.' },
      ],
      seasons: [
        { id: 'peak', label: pack.peakSeason, description: 'Demand at full strength.' },
        { id: 'slow', label: pack.slowSeason, description: 'Demand thins; visibility spend matters most.' },
        { id: 'crunch', label: pack.crunchSeason, description: 'A capital class dries up; milestone clocks pause.' },
      ],
      leaders: [
        { id: 'generalist', label: 'Generalist founder', description: 'Balanced instincts, no edge.' },
        { id: 'defense-first', label: 'Defense-first founder', description: 'Strong retention; culture strain.' },
        { id: 'hustle', label: 'Hustle-culture founder', description: 'Can overdraw attention at morale cost.' },
        { id: 'fundraise-cycle', label: 'Fundraise-cycle founder', description: 'Attention arrives in big rounds.' },
        { id: 'ops-automation', label: 'Ops-automation founder', description: 'Capacity scales itself reactively.' },
        { id: 'countercyclical', label: 'Countercyclical founder', description: 'Expands in downturns, overpays in booms.' },
        { id: 'command-control', label: 'Command-and-control founder', description: 'Retention by lock-in; needs enforcement presence.' },
        { id: 'frontier', label: 'Frontier-niche founder', description: 'Thrives at unexplored edges.' },
        { id: 'blitzscale', label: 'Blitzscaling founder', description: 'Hires past infrastructure for compounding credibility.' },
        { id: 'organic-discovery', label: 'Organic-discovery founder', description: 'Passive market intel; dear directed research.' },
      ],
      modifiers: [
        { id: 'edge-steady-volume', label: 'Steady-volume channel edge', description: 'Retention bonus in steady-volume segments.' },
        { id: 'edge-contract-rich', label: 'Contract-rich channel edge', description: 'Retention bonus in contract-rich segments.' },
        { id: 'edge-specialist', label: 'Specialist-niche edge', description: 'Retention bonus in specialist niches.' },
        { id: 'edge-infrastructure', label: 'Infrastructure-market edge', description: 'Retention bonus in infrastructure-heavy segments.' },
        { id: 'edge-metro', label: 'Metro-marketplace edge', description: 'Retention bonus in crowded metros.' },
        { id: 'field-overhead', label: 'Field-team overhead', description: 'Changes field-team resource consumption.' },
        { id: 'field-recovery', label: 'Field-team recovery', description: 'Changes field-team recovery speed.' },
      ],
      goalTypes: [
        { id: 'research-segments', label: 'Research new segments', description: 'Complete market research on segments.' },
        { id: 'enter-markets', label: 'Enter markets', description: 'Establish presence in segments.' },
        { id: 'generate-revenue', label: 'Generate revenue', description: 'Produce an amount (one-off deals count).' },
        { id: 'build-reserves', label: 'Build reserves', description: 'Reach a required stored balance.' },
        { id: 'maintain-service', label: 'Maintain service levels', description: 'Hold a level for up to one month.' },
        { id: 'expand-capacity', label: 'Expand capacity', description: 'Raise storage and throughput.' },
        { id: 'grow-headcount', label: 'Grow headcount', description: 'Reach a team-size milestone.' },
        { id: 'mature-platform', label: 'Mature the platform', description: 'Advance operational maturity.' },
        { id: 'sustain-culture', label: 'Sustain culture', description: 'Hold morale for up to one month.' },
        { id: 'resolve-churn-sources', label: `Resolve ${pack.pressureSources}`, description: 'Clear active pressure producers.' },
        { id: 'win-competitive-battles', label: 'Win competitive battles', description: 'Close out head-to-head threats.' },
      ],
      eventImages: [
        { id: 'grand-opening', label: 'Grand opening', description: 'Doors open for the first time.', icon: 'mechanic.event' },
        { id: 'first-customer', label: `First ${customers.replace(/s$/, '')} won`, description: 'The first name on the books.', icon: 'mechanic.event' },
        { id: 'crowded-calendar', label: 'A full calendar', description: 'Demand outrunning capacity.', icon: 'mechanic.resource' },
        { id: 'quiet-month', label: 'A quiet month', description: 'The slow season bites.', icon: 'mechanic.season' },
        { id: 'team-huddle', label: `${capitalize(team)} huddle`, description: 'The team plans the week.', icon: 'mechanic.morale' },
        { id: 'signature-scene', label: pack.scene, description: `A signature ${venture} moment.`, icon: 'mechanic.event' },
      ],
      difficulties: [
        { id: 'favorable', label: 'Favorable market', description: 'Tailwinds and patient stakeholders.' },
        { id: 'balanced', label: 'Balanced market', description: 'Standard conditions.' },
        { id: 'cutthroat', label: 'Cutthroat market', description: 'Aggressive competition, tight clocks.' },
        { id: 'generational-downturn', label: 'Generational downturn', description: 'The harshest climate; stacking pressure.' },
      ],
    },
  };
}

/**
 * Builds a complete, valid scenario for a niche through the app's own
 * default/export code path, filled with niche-native content.
 */
export function buildNicheScenario(pack: NichePack): {
  domain: DomainSchema;
  scenario: Scenario;
  json: string;
} {
  const domain = buildNicheDomain(pack);
  const scenario = createDefaultScenario(blueprint, domain);

  scenario.editors['basicDetails'] = {
    name: `${pack.label}: First Year on the Books`,
    description:
      `Grow a new ${pack.venture} from a signed lease and a small founding team into a durable local institution, while ${pack.pressureLabel.toLowerCase()} works against every idle week.`,
  };
  scenario.editors['areaLayout'] = {
    ...scenario.editors['areaLayout'],
    layout: 'local-market',
  };
  scenario.editors['startingEvents'] = {
    events: [
      {
        title: 'Opening day',
        description:
          `The lease is signed, and with the ${pack.gearTerm.toLowerCase()} in place, the first ${pack.inquiriesTerm.toLowerCase()} are trickling in. Runway is thin, and ${pack.pressureLabel.toLowerCase()} will not wait.`,
        buttonText: 'Open the doors',
        image: 'grand-opening',
      },
      {
        title: `${capitalize(pack.slowSeason)} is coming`,
        description:
          `Veterans of this market warn that the ${pack.slowSeason.toLowerCase()} thins demand every year. Reserves and visibility spend decide who is still trading in spring.`,
        buttonText: 'Plan ahead',
        image: 'quiet-month',
      },
    ],
  };
  scenario.editors['startingValues'] = {
    morale: 70,
    authority: 55,
    population: 4,
    stamina: 3,
  };
  scenario.editors['resources'] = {
    stockpiles: {
      'payroll-fund': { op: 'SET', amount: 1200 },
      'demand-pipeline': { op: 'ADD', amount: 150 },
      supplies: { op: 'ADD', amount: 300 },
      'marketing-budget': { op: 'SET', amount: 400 },
      'wellbeing-fund': { op: 'ADD', amount: 0 },
      'capital-equipment': { op: 'SET', amount: 250 },
      'automation-systems': { op: 'ADD', amount: 0 },
    },
  };
  scenario.editors['seasons'] = {
    month1: 'slow',
    month2: 'slow',
    month3: 'peak',
    month4: 'peak',
    month5: 'peak',
    month6: 'peak',
    month7: 'peak',
    month8: 'crunch',
    month9: 'peak',
    month10: 'slow',
    month11: 'slow',
    month12: 'peak',
  };
  scenario.editors['customEvents'] = {
    events: [
      {
        title: 'A rival opens across the street',
        scriptFileName: 'rival-opening.lua',
        scriptBody:
          '-- Raises market pressure in the home segment for one cycle\n-- and unlocks a counter-campaign development.',
        image: 'crowded-calendar',
      },
    ],
  };
  scenario.editors['goals'] = {
    goals: [
      { type: 'research-segments', targetAmount: 3, patience: 120, stable: false },
      { type: 'generate-revenue', targetAmount: 500, patience: 180, stable: false },
      { type: 'enter-markets', targetAmount: 2, patience: 200, stable: false },
      { type: 'sustain-culture', targetAmount: 60, patience: 90, stable: true },
      { type: 'resolve-churn-sources', targetAmount: 2, patience: 240, stable: false },
    ],
  };
  scenario.editors['pressure'] = {
    startingIntensity: 25,
    growthRate: 15,
    infestedAreas: 3,
    surpriseThreats: true,
    cleanseBacklash: true,
  };
  scenario.editors['defense'] = {
    startingUnits: 1,
    healingRatePct: 0.5,
    reinforcement: true,
    supplyAttrition: true,
  };
  scenario.editors['modifiers'] = {
    difficulty: 'balanced',
    active: [
      { modifier: 'edge-steady-volume', patiencePoints: -2 },
      { modifier: 'field-overhead', patiencePoints: 1 },
    ],
  };

  const json = exportScenario(scenario, blueprint, domain);
  return { domain, scenario, json };
}

export function getNichePack(id: string): NichePack {
  const pack = nichePacks.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown niche "${id}"`);
  return pack;
}

export function pickRandomNiche(random: () => number = Math.random): NichePack {
  const index = Math.floor(random() * nichePacks.length);
  const pack = nichePacks[index];
  if (!pack) throw new Error('Niche seed list is empty');
  return pack;
}
