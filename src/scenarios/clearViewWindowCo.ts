import { blueprint } from '../engine/blueprint.ts';
import {
  createDefaultScenario,
  exportScenario,
  type Scenario,
} from '../engine/scenario.ts';
import type { AreaCell } from '../engine/areaMap.ts';
import type { DomainSchema } from '../domain/types.ts';
import { getDomain } from '../domain/registry.ts';

/**
 * The Clear View Window Co. — the authored scenario, built entirely through
 * the creator's own code paths: createDefaultScenario → editor values →
 * exportScenario (which validates against the same Zod schema the editor
 * UI and import gate use). Nothing here bypasses the Scenario Creator.
 *
 * Premise: a window installation and glazing business. Nothing but the
 * truck, a few basic tools, and two good hands. Climb from a first paying
 * job to a regional window empire while lead drought, cash burn, and
 * entrenched competitors erode every idle week.
 */

/** Hand-drawn service territory: 19 connected hex cells, the garage at center. */
function territoryMap(): AreaCell[] {
  const cell = (
    id: string,
    q: number,
    r: number,
    terrain: string,
    flags: { river?: boolean; infested?: boolean; start?: boolean } = {},
  ): AreaCell => ({
    id,
    q,
    r,
    terrain,
    river: flags.river ?? false,
    infested: flags.infested ?? false,
    start: flags.start ?? false,
  });

  return [
    // The home garage sits on the highway through town.
    cell('the-garage', 0, 0, 'residential-repairs', { river: true, start: true }),
    // Inner ring: the streets the truck already knows.
    cell('maple-rows', 1, 0, 'residential-repairs', { river: true }),
    cell('old-orchard-heights', 0, -1, 'residential-repairs'),
    cell('gable-court', 1, -1, 'new-construction'),
    cell('ninth-street', -1, 0, 'residential-repairs', { river: true }),
    cell('brickyard-flats', -1, 1, 'new-construction'),
    cell('saint-annes-row', 0, 1, 'heritage-restoration'),
    // Outer ring: richer, harder ground.
    cell('fairground-edge', 2, 0, 'residential-repairs', { river: true }),
    cell('quarry-gate', 2, -1, 'commercial-contracts'),
    cell('north-mall-strip', 2, -2, 'commercial-contracts', { infested: true }),
    cell('hilltop-terrace', 1, -2, 'residential-repairs'),
    cell('cathedral-quarter', 0, -2, 'heritage-restoration'),
    cell('depot-yards', -1, -1, 'new-construction'),
    cell('westbridge', -2, 0, 'downtown-bid-market', { river: true }),
    cell('silver-lake-shore', -2, 1, 'residential-repairs'),
    cell('glasshouse-lane', -2, 2, 'residential-repairs', { infested: true }),
    cell('southfield-plots', -1, 2, 'new-construction'),
    cell('harbor-row', 0, 2, 'commercial-contracts', { infested: true }),
    cell('midtown-parade', 1, 1, 'downtown-bid-market'),
  ];
}

export function buildClearViewScenario(): {
  domain: DomainSchema;
  scenario: Scenario;
  json: string;
} {
  const domain = getDomain('clear-view-window-co');
  const scenario = createDefaultScenario(blueprint, domain);

  scenario.editors['basicDetails'] = {
    name: 'The Clear View Window Co.',
    description:
      'You are starting a window installation and glazing business with nothing but your truck, a few basic tools, and your own two hands. Bootstrap from a first paying job to a regional window empire while lead drought, cash burn, and entrenched competitors erode every idle week.',
  };

  scenario.editors['areaLayout'] = {
    layout: 'home-town',
    areas: territoryMap(),
  };

  scenario.editors['startingEvents'] = {
    events: [
      {
        title: 'The first paying job',
        description:
          'A neighbor two streets over lost a bay window to last night’s storm. You have the truck, a glass cutter, a caulking gun, and two good hands. She is standing in her doorway, waiting for a yes.',
        buttonText: 'Take the job',
        image: 'first-install',
      },
      {
        title: 'Three names on every van',
        description:
          'Pane & Simple, Glasshouse Bros., and Harbor Glazing split this town years ago. Their yards are full, their crews are settled, and none of them know your name yet. That is the one advantage you have.',
        buttonText: 'Get to work',
        image: 'truck-loaded',
      },
    ],
  };

  scenario.editors['startingValues'] = {
    morale: 62,
    authority: 50,
    population: 2,
    stamina: 4,
  };

  scenario.editors['resources'] = {
    stockpiles: {
      'operating-cash': { op: 'SET', amount: 40 },
      'lead-pipeline': { op: 'SET', amount: 6 },
      'glass-stock': { op: 'SET', amount: 8 },
      'weatherization-kits': { op: 'SET', amount: 0 },
      'crew-welfare': { op: 'SET', amount: 0 },
      'tools-equipment': { op: 'SET', amount: 12 },
      'fabrication-line': { op: 'SET', amount: 0 },
    },
  };

  scenario.editors['seasons'] = {
    month1: 'winter-slowdown',
    month2: 'install-season',
    month3: 'install-season',
    month4: 'install-season',
    month5: 'install-season',
    month6: 'install-season',
    month7: 'lead-drought',
    month8: 'install-season',
    month9: 'install-season',
    month10: 'install-season',
    month11: 'winter-slowdown',
    month12: 'winter-slowdown',
  };

  scenario.editors['customEvents'] = {
    events: [
      {
        title: 'Word of mouth',
        scriptFileName: 'word-of-mouth.lua',
        scriptBody: [
          '-- Fires once the company holds ground in two neighborhoods.',
          'ON claimed >= 2',
          'TEXT The first two neighborhoods talk. A month of clean installs lands three referral quotes in one week.',
          'BUTTON Answer every call',
          'EFFECT resource:lead-pipeline +20',
          'EFFECT authority +4',
        ].join('\n'),
        image: 'first-install',
      },
      {
        title: 'Undercut on Storm Row',
        scriptFileName: 'rival-underbid.lua',
        scriptBody: [
          '-- The incumbents notice the new truck.',
          'ON turn >= 45',
          'TEXT Pane & Simple undercuts you on a whole block of storm-window installs. The crew hears about it at the supply counter before you do.',
          'BUTTON Sharpen the next bid',
          'EFFECT pressure +8',
          'EFFECT morale -4',
        ].join('\n'),
        image: 'cracked-pane',
      },
      {
        title: 'Cold-snap board-ups',
        scriptFileName: 'board-up-contract.lua',
        scriptBody: [
          '-- Winter work: pays well, comes back every year.',
          'ON season = winter-slowdown',
          'ON turn >= 60',
          'TEXT A cold snap cracks panes across the county. Emergency board-up work pays double for a crew that answers the phone at night.',
          'BUTTON Roll the truck',
          'EFFECT resource:operating-cash +30',
          'EFFECT stamina +2',
          'REPEAT',
        ].join('\n'),
        image: 'winter-boardup',
      },
      {
        title: 'The big-box window aisle',
        scriptFileName: 'big-box-outlet.lua',
        scriptBody: [
          '-- Mid-game escalation.',
          'ON turn >= 150',
          'TEXT A big-box home center opens a window department off the interstate: glossy flyers, teaser pricing, subcontracted installers.',
          'BUTTON We out-craft them',
          'EFFECT pressure +10',
          'EFFECT morale -5',
        ].join('\n'),
        image: 'cracked-pane',
      },
      {
        title: 'Net-sixty terms',
        scriptFileName: 'net-sixty-terms.lua',
        scriptBody: [
          '-- Reward for a healthy balance sheet.',
          'ON resource:operating-cash >= 120',
          'TEXT The glass supplier has watched your balance grow all season. He offers net-sixty terms and a pallet discount with a handshake.',
          'BUTTON Sign the terms',
          'EFFECT resource:glass-stock +25',
          'EFFECT patience +30',
        ].join('\n'),
        image: 'contract-signing',
      },
      {
        title: 'The poaching call',
        scriptFileName: 'poaching-call.lua',
        scriptBody: [
          '-- The grind bites back once the company is worth raiding.',
          'ON pressure >= 50',
          'ON population >= 4',
          'TEXT A rival owner calls your best installer at home with a signing bonus and a newer truck.',
          'BUTTON Wish him well, mean it',
          'EFFECT population -1',
          'EFFECT morale -6',
        ].join('\n'),
        image: 'tailgate-huddle',
      },
    ],
  };

  scenario.editors['goals'] = {
    goals: [
      { type: 'survey-territories', targetAmount: 3, patience: 120, stable: false },
      { type: 'open-service-areas', targetAmount: 2, patience: 200, stable: false },
      { type: 'book-revenue', targetAmount: 60, patience: 260, stable: false },
      { type: 'grow-the-crew', targetAmount: 3, patience: 330, stable: false },
      { type: 'shut-down-undercutters', targetAmount: 2, patience: 400, stable: false },
      { type: 'open-service-areas', targetAmount: 6, patience: 420, stable: false },
      { type: 'build-cash-reserves', targetAmount: 150, patience: 450, stable: false },
    ],
  };

  scenario.editors['pressure'] = {
    startingIntensity: 22,
    growthRate: 16,
    infestedAreas: 3,
    surpriseThreats: true,
    cleanseBacklash: true,
  };

  scenario.editors['defense'] = {
    startingUnits: 1,
    healingRatePct: 1,
    reinforcement: true,
    supplyAttrition: true,
  };

  scenario.editors['modifiers'] = {
    difficulty: 'entrenched-competition',
    active: [
      { modifier: 'residential-referrals', patiencePoints: 2 },
      { modifier: 'crew-recovery-program', patiencePoints: 1 },
    ],
  };

  const json = exportScenario(scenario, blueprint, domain);
  return { domain, scenario, json };
}
