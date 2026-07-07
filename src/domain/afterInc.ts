import type { DomainSchema } from './types.ts';

/**
 * The canonical post-apocalyptic domain: the game's own language, per the
 * wiki research (/docs/research). Pool contents cite their concept pages;
 * gallery labels are domain-authored because the game's identifiers are
 * unsourceable (GAPS.md A10/B13).
 */

function seasonMonths(): Record<string, { label: string; description?: string }> {
  const lexicon: Record<string, { label: string; description?: string }> = {};
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  names.forEach((name, i) => {
    lexicon[`field.seasons.month${i + 1}`] = { label: name };
  });
  return lexicon;
}

export const afterIncDomain: DomainSchema = {
  id: 'after-inc',
  name: 'After Inc.',
  description:
    'The canonical settlement-survival world: a community emerges from a failing shelter into contested ground.',
  vocabularyProfile: 'post-apocalyptic',
  lexicon: {
    'editor.basicDetails': { label: 'Basic Details' },
    'editor.basicDetails.desc': {
      description: 'Basic details about your scenario, used when players search for it.',
      label: 'Basic Details',
    },
    'field.basicDetails.name': { label: 'Scenario name' },
    'field.basicDetails.description': { label: 'Scenario description' },

    'editor.areaLayout': { label: 'Area Layout' },
    'editor.areaLayout.desc': {
      description: 'Pick the area layout used for the scenario region.',
      label: 'Area Layout',
    },
    'field.areaLayout.layout': { label: 'Area layout' },
    'field.areaLayout.areas': { label: 'Region map' },
    'field.area.terrain': { label: 'Terrain' },
    'field.area.river': { label: 'River adjacent' },
    'field.area.infested': { label: 'Infested area' },
    'field.area.start': { label: 'Settlement area' },

    'editor.startingEvents': { label: 'Starting Events' },
    'editor.startingEvents.desc': {
      description:
        'Popup events shown when the scenario starts. Add more events; all share one layout.',
      label: 'Starting Events',
    },
    'field.startingEvents.events': { label: 'Events' },
    'field.event.title': { label: 'Event title' },
    'field.event.description': { label: 'Event text' },
    'field.event.buttonText': { label: 'Button label' },
    'field.event.image': { label: 'Event image' },

    'editor.startingValues': { label: 'Starting Values' },
    'editor.startingValues.desc': {
      description: 'The values in effect when the scenario is first loaded.',
      label: 'Starting Values',
    },
    'field.startingValues.morale': { label: 'Starting morale' },
    'field.startingValues.authority': { label: 'Starting authority' },
    'field.startingValues.population': { label: 'Starting population' },
    'field.startingValues.stamina': { label: 'Starting stamina' },

    'editor.resources': { label: 'Resources' },
    'editor.resources.desc': {
      description:
        'Add to, or set (override), the default starting values of resources.',
      label: 'Resources',
    },
    'field.resources.stockpiles': { label: 'Starting stockpiles' },

    'editor.seasons': { label: 'Seasons' },
    'editor.seasons.desc': {
      description: 'Customise the default weather by setting the season for each month.',
      label: 'Seasons',
    },
    ...seasonMonths(),

    'editor.customEvents': { label: 'Custom Events' },
    'editor.customEvents.desc': {
      description:
        'Create your own events that trigger effects through the API. Scripts are text or Lua files.',
      label: 'Custom Events',
    },
    'field.customEvents.events': { label: 'Custom events' },
    'field.customEvents.scriptFileName': { label: 'Script file (.lua/.txt)' },
    'field.customEvents.scriptBody': { label: 'Script body' },

    'editor.goals': { label: 'Goals' },
    'editor.goals.desc': {
      description: 'The objectives the settlement must complete, each with a patience timer.',
      label: 'Goals',
    },
    'field.goals.goals': { label: 'Goal list' },
    'field.goals.type': { label: 'Goal type' },
    'field.goals.targetAmount': { label: 'Target amount' },
    'field.goals.patience': { label: 'Patience (turns)' },
    'field.goals.stable': { label: 'Stable goal (pauses the timer)' },

    'editor.pressure': { label: 'Zombies' },
    'editor.pressure.desc': {
      description:
        'The ambient threat: infested areas spawn zombies over time until cleansed.',
      label: 'Zombies',
    },
    'field.pressure.startingIntensity': { label: 'Starting zombie intensity' },
    'field.pressure.growthRate': { label: 'Infestation growth rate' },
    'field.pressure.infestedAreas': { label: 'Infested areas at start' },
    'field.pressure.surpriseThreats': {
      label: 'Surprise attacks from unexplored areas',
    },
    'field.pressure.cleanseBacklash': {
      label: 'Cleansing provokes an immediate backlash',
    },

    'editor.defense': { label: 'Fighters' },
    'editor.defense.desc': {
      description: 'The settlement’s defenders: units that fight zombies and hold ground.',
      label: 'Fighters',
    },
    'field.defense.startingUnits': { label: 'Starting fighters' },
    'field.defense.healingRatePct': { label: 'Base healing rate (% per turn)' },
    'field.defense.reinforcement': { label: 'Allow reinforcing an active fighter' },
    'field.defense.supplyAttrition': {
      label: 'Supply shortages damage fighters in the field',
    },

    'editor.modifiers': { label: 'Modifiers' },
    'editor.modifiers.desc': {
      description:
        'Map-wide bonuses and disadvantages; net patience points stretch or shrink goal timers.',
      label: 'Modifiers',
    },
    'field.modifiers.difficulty': { label: 'Difficulty' },
    'field.modifiers.active': { label: 'Active modifiers' },
    'field.modifiers.modifier': { label: 'Modifier' },
    'field.modifiers.patiencePoints': { label: 'Patience points' },
  },
  pools: {
    // https://afterinc.wiki.gg/wiki/Resources (7 sourced types)
    resources: [
      { id: 'food', label: 'Food', description: 'Feeds the settlement.', icon: 'mechanic.resource' },
      { id: 'water', label: 'Water', description: 'Drinking water; scarce in Drought.', icon: 'mechanic.resource' },
      { id: 'wood', label: 'Wood', description: 'Construction material; refined into Fuel.', icon: 'mechanic.resource' },
      { id: 'fuel', label: 'Fuel', description: 'Heating; essential in Winter.', icon: 'mechanic.resource' },
      { id: 'medicine', label: 'Medicine', description: 'Speeds fighter healing.', icon: 'mechanic.resource' },
      { id: 'stone', label: 'Stone', description: 'Heavy construction material.', icon: 'mechanic.resource' },
      { id: 'material', label: 'Material', description: 'Advanced component; unlocks at Technology 5.', icon: 'mechanic.resource' },
    ],
    // https://afterinc.wiki.gg/wiki/Areas (terrain classes sourced)
    terrains: [
      { id: 'grasslands', label: 'Grasslands', description: 'Most allow Food production.' },
      { id: 'forests', label: 'Forests', description: 'Wood and Fuel production.' },
      { id: 'swamps', label: 'Swamps', description: 'Most allow Medicine production.' },
      { id: 'mountains', label: 'Mountains', description: 'Most allow Stone production.' },
      { id: 'cities', label: 'Cities', description: 'No default production; cheaper scavenging chances.' },
    ],
    // The two sourced map names (A_New_Dawn page; Ancient Treasures via Z_Com_Fortress). GAP:B2
    areaLayouts: [
      { id: 'a-new-dawn', label: 'A New Dawn', description: '28 areas; mostly flat with one river.' },
      { id: 'ancient-treasures', label: 'Ancient Treasures', description: 'Holds the Z Com Fortress herd site.' },
    ],
    // https://afterinc.wiki.gg/wiki/Custom_Scenarios (Winter/Summer/Drought sourced)
    seasons: [
      { id: 'summer', label: 'Summer', description: 'Default season; normal operation.' },
      { id: 'winter', label: 'Winter', description: 'Food lines halt; fuel demand spikes.' },
      { id: 'drought', label: 'Drought', description: 'Water production stops; goal timers pause.' },
    ],
    // https://afterinc.wiki.gg/wiki/Leaders + individual pages (10 sourced archetypes).
    // Present per the domain contract; no editor field selects one (GAPS.md B15).
    leaders: [
      { id: 'survivor', label: 'Survivor', description: 'No special bonuses.' },
      { id: 'soldier', label: 'Soldier', description: 'Fighter abilities; morale harder to maintain.' },
      { id: 'personal-trainer', label: 'Personal Trainer', description: 'Deficit stamina at morale cost.' },
      { id: 'economist', label: 'Economist', description: 'Stamina arrives yearly in a lump.' },
      { id: 'hoarder', label: 'Hoarder', description: 'Auto-builds storage when stockpiles fill.' },
      { id: 'arctic-explorer', label: 'Arctic Explorer', description: 'Cheap Winter expansion; dear in Summer.' },
      { id: 'tyrant', label: 'Tyrant', description: 'Control via garrison; costly without one.' },
      { id: 'hermit', label: 'Hermit', description: 'Frontier-adjacent buildings produce more.' },
      { id: 'slumlord', label: 'Slumlord', description: 'Growth without housing; gains per settler.' },
      { id: 'cub-scout', label: 'Cub Scout', description: 'Free slow exploration; dear targeted scouting.' },
    ],
    // https://afterinc.wiki.gg/wiki/Modifiers (family list single-source; GAP:A14).
    // Slots 0-4 follow the terrains pool order (slot convention, GAPS.md C4).
    modifiers: [
      { id: 'combat-grassland', label: 'Grassland combat boost', description: 'Soldier combat bonus in grasslands.' },
      { id: 'combat-forest', label: 'Forest combat boost', description: 'Soldier combat bonus in forests.' },
      { id: 'combat-swamp', label: 'Swamp combat boost', description: 'Soldier combat bonus in swamps.' },
      { id: 'combat-mountain', label: 'Mountain combat boost', description: 'Soldier combat bonus in mountains.' },
      { id: 'combat-urban', label: 'Urban combat boost', description: 'Soldier combat bonus in cities.' },
      { id: 'soldier-consumption', label: 'Soldier consumption', description: 'Changes soldier resource consumption.' },
      { id: 'soldier-healing', label: 'Soldier healing', description: 'Changes soldier healing speed.' },
    ],
    // https://afterinc.wiki.gg/wiki/Goals (11 sourced goal types)
    goalTypes: [
      { id: 'explore-areas', label: 'Explore new areas', description: 'Reveal a number of areas.' },
      { id: 'claim-areas', label: 'Claim areas', description: 'Take control of a number of areas.' },
      { id: 'produce-resource', label: 'Produce resources', description: 'Produce a set amount (bubbles count).' },
      { id: 'stockpile-resource', label: 'Stockpile resources', description: 'Reach a required stored amount.' },
      { id: 'maintain-resource', label: 'Maintain resources', description: 'Hold a level for up to one month.' },
      { id: 'increase-storage', label: 'Increase storage', description: 'Raise storage capacity.' },
      { id: 'reach-population', label: 'Reach population', description: 'Hit a population milestone.' },
      { id: 'research-tech', label: 'Research technology', description: 'Advance the technology level.' },
      { id: 'maintain-morale', label: 'Maintain morale', description: 'Hold morale for up to one month.' },
      { id: 'cleanse-infested', label: 'Cleanse infested areas', description: 'Clear producer areas.' },
      { id: 'kill-zombies', label: 'Kill zombies', description: 'Destroy a number of zombies.' },
    ],
    // Gallery identifiers unsourceable (GAPS.md A10/B13): domain-authored labels.
    eventImages: [
      { id: 'settlement-dawn', label: 'Settlement at dawn', description: 'The camp as the sun rises.', icon: 'mechanic.event' },
      { id: 'crowded-shelter', label: 'Crowded shelter', description: 'Families packed underground.', icon: 'mechanic.event' },
      { id: 'overrun-road', label: 'Overrun road', description: 'A blocked route out.', icon: 'mechanic.pressure' },
      { id: 'watchtower', label: 'Watchtower', description: 'A lookout over the fence line.', icon: 'mechanic.defense' },
      { id: 'harvest', label: 'Harvest', description: 'A working field at last.', icon: 'mechanic.resource' },
      { id: 'long-winter', label: 'Long winter', description: 'Snow over the rooftops.', icon: 'mechanic.season' },
    ],
    // https://afterinc.wiki.gg/wiki/Difficulty (4 sourced tiers)
    difficulties: [
      { id: 'casual', label: 'Casual', description: 'Gentlest settings.' },
      { id: 'normal', label: 'Normal', description: 'Standard settings.' },
      { id: 'brutal', label: 'Brutal', description: 'Harsh settings.' },
      { id: 'mega-brutal', label: 'Mega Brutal', description: 'Harshest settings; stacking levels.' },
    ],
  },
};
