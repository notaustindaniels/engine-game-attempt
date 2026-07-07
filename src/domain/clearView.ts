import type { DomainSchema } from './types.ts';

/**
 * The Clear View Window Co. — a hand-authored business-native domain for a
 * window installation & glazing trade, built per the README's "add a domain
 * schema" path (registerDomain, not a niche pack). Mechanics are untouched;
 * every string is the trade's own language (Native Translation rule). The
 * ambient pressure is lead drought, cash burn, and entrenched competitors —
 * never anything else.
 *
 * Slot conventions (GAPS.md C4) — pool ORDER carries mechanic roles:
 * resources: staple/demand/construction/seasonal/recovery/heavy/advanced;
 * terrains 0-4 produce resources 0/2/4/5/none; seasons normal/lean/crunch;
 * leaders, modifiers, goal types, difficulties by index.
 */

function monthLabels(): Record<string, { label: string }> {
  const lexicon: Record<string, { label: string }> = {};
  const names = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  names.forEach((name, i) => {
    lexicon[`field.seasons.month${i + 1}`] = { label: name };
  });
  return lexicon;
}

export const clearViewDomain: DomainSchema = {
  id: 'clear-view-window-co',
  name: 'The Clear View Window Co.',
  description:
    'A window installation and glazing trade: one truck, a few basic tools, two good hands — and a town full of entrenched competitors.',
  vocabularyProfile: 'business-native',
  lexicon: {
    'editor.basicDetails': { label: 'Business Plan Details' },
    'editor.basicDetails.desc': {
      label: 'Business Plan Details',
      description: 'Basic details about this venture, used when others search for it.',
    },
    'field.basicDetails.name': { label: 'Scenario name' },
    'field.basicDetails.description': { label: 'Scenario description' },

    'editor.areaLayout': { label: 'Service Territory' },
    'editor.areaLayout.desc': {
      label: 'Service Territory',
      description: 'The town and its surroundings: every neighborhood the truck could reach.',
    },
    'field.areaLayout.layout': { label: 'Territory layout' },
    'field.areaLayout.areas': { label: 'Territory map' },
    'field.area.terrain': { label: 'Neighborhood type' },
    'field.area.river': { label: 'On the highway corridor' },
    'field.area.infested': { label: 'Entrenched competitor stronghold' },
    'field.area.start': { label: 'The home garage' },

    'editor.startingEvents': { label: 'Opening Week' },
    'editor.startingEvents.desc': {
      label: 'Opening Week',
      description: 'What lands on the windshield the week the business opens.',
    },
    'field.startingEvents.events': { label: 'Opening developments' },
    'field.event.title': { label: 'Headline' },
    'field.event.description': { label: 'What happened' },
    'field.event.buttonText': { label: 'Your response' },
    'field.event.image': { label: 'Picture' },

    'editor.startingValues': { label: 'Day-One Position' },
    'editor.startingValues.desc': {
      label: 'Day-One Position',
      description: 'What the company amounts to on the morning it opens.',
    },
    'field.startingValues.morale': { label: 'Crew spirits' },
    'field.startingValues.authority': { label: 'Reputation' },
    'field.startingValues.population': { label: 'Crew size' },
    'field.startingValues.stamina': { label: 'Owner hustle' },

    'editor.resources': { label: 'The Books' },
    'editor.resources.desc': {
      label: 'The Books',
      description: 'Add to, or set (override), the opening balance of each line on the books.',
    },
    'field.resources.stockpiles': { label: 'Opening balances' },

    'editor.seasons': { label: 'The Trade Calendar' },
    'editor.seasons.desc': {
      label: 'The Trade Calendar',
      description: 'Install seasons, winter slowdowns, and lead droughts, month by month.',
    },
    ...monthLabels(),

    'editor.customEvents': { label: 'Market Developments' },
    'editor.customEvents.desc': {
      label: 'Market Developments',
      description: 'Scripted developments that hit the business mid-run. Scripts are text or Lua files.',
    },
    'field.customEvents.events': { label: 'Developments' },
    'field.customEvents.scriptFileName': { label: 'Script file (.lua/.txt)' },
    'field.customEvents.scriptBody': { label: 'Script body' },

    'editor.goals': { label: 'The Ladder' },
    'editor.goals.desc': {
      label: 'The Ladder',
      description: 'Each rung between a first paying job and a regional window empire.',
    },
    'field.goals.goals': { label: 'Rungs' },
    'field.goals.type': { label: 'Rung type' },
    'field.goals.targetAmount': { label: 'Target' },
    'field.goals.patience': { label: 'Patience (days)' },
    'field.goals.stable': { label: 'Steady-state rung (pauses the clock)' },

    'editor.pressure': { label: 'The Grind' },
    'editor.pressure.desc': {
      label: 'The Grind',
      description:
        'Lead drought, cash burn, and entrenched competitors erode an idle window business; strongholds keep the pressure coming until they are outworked.',
    },
    'field.pressure.startingIntensity': { label: 'Opening market pressure' },
    'field.pressure.growthRate': { label: 'How fast the grind compounds' },
    'field.pressure.infestedAreas': { label: 'Competitor strongholds at open' },
    'field.pressure.surpriseThreats': { label: 'Blindside bids from unsurveyed territory' },
    'field.pressure.cleanseBacklash': { label: 'Price wars flare when you push back' },

    'editor.defense': { label: 'Service & Warranty' },
    'editor.defense.desc': {
      label: 'Service & Warranty',
      description: 'The crews that keep customers: callbacks answered, warranties honored, ground held.',
    },
    'field.defense.startingUnits': { label: 'Service crews on day one' },
    'field.defense.healingRatePct': { label: 'Crew recovery rate (% per day)' },
    'field.defense.reinforcement': { label: 'Allow pulling crews onto a hot job' },
    'field.defense.supplyAttrition': { label: 'Underfunded road crews wear out' },

    'editor.modifiers': { label: 'Local Conditions' },
    'editor.modifiers.desc': {
      label: 'Local Conditions',
      description: 'Standing facts of this town; net patience points stretch or shrink the ladder clocks.',
    },
    'field.modifiers.difficulty': { label: 'Market climate' },
    'field.modifiers.active': { label: 'Active conditions' },
    'field.modifiers.modifier': { label: 'Condition' },
    'field.modifiers.patiencePoints': { label: 'Patience points' },

    // Runtime language — the game speaks glazing.
    'runtime.chooseLeader': { label: 'What kind of owner are you?' },
    'runtime.defenders': { label: 'Service crews' },
    'runtime.stat.morale': { label: 'Crew spirits' },
    'runtime.stat.authority': { label: 'Reputation' },
    'runtime.stat.stamina': { label: 'Owner hustle' },
    'runtime.stat.population': { label: 'Crew' },
    'runtime.stat.housing': { label: 'Shop capacity' },
    'runtime.stat.pressure': { label: 'The grind' },
    'runtime.stat.tech': { label: 'Shop upgrades' },
    'runtime.action.explore': { label: 'Survey the neighborhood' },
    'runtime.action.claim': { label: 'Open a service area' },
    'runtime.action.deal': { label: 'Chase a one-off job' },
    'runtime.action.move': { label: 'Send the crew' },
    'runtime.action.cleanse': { label: 'Outwork the incumbent' },
    'runtime.action.provoke': { label: 'Pick the fight' },
    'runtime.action.festival': { label: 'Crew cookout' },
    'runtime.action.train': { label: 'Hire a service crew' },
    'runtime.action.housing': { label: 'Extend the shop' },
    'runtime.action.storage': { label: 'Add yard capacity' },
    'runtime.action.research': { label: 'Upgrade the shop' },
    'runtime.log.explored': { label: 'Neighborhood surveyed' },
    'runtime.log.claimed': { label: 'Service area opened' },
    'runtime.log.areaLost': { label: 'Service area lost to the competition' },
    'runtime.log.cleansed': { label: 'Incumbent outworked — stronghold broken' },
    'runtime.log.defenderDown': { label: 'A crew quits, burned out' },
    'runtime.log.defenderTrained': { label: 'New service crew hired' },
    'runtime.log.goalComplete': { label: 'Rung of the ladder climbed' },
    'runtime.log.goalOverdue': { label: 'The ladder stalls — word gets around' },
    'runtime.log.festival': { label: 'Cookout behind the shop' },
    'runtime.log.growth': { label: 'A new installer joins the crew' },
    'runtime.log.abandonment': { label: 'An installer walks off the job' },
    'runtime.log.attack': { label: 'Competitors are working your home turf' },
    'runtime.log.techUp': { label: 'Shop upgraded' },
    'runtime.log.milestone': { label: 'The town takes notice' },
    'runtime.log.event': { label: 'A development lands' },
    'runtime.outcome.won': { label: 'A regional window empire' },
    'runtime.outcome.won.desc': {
      label: 'A regional window empire',
      description:
        'Every rung climbed. The truck that started it sits polished by the door of a company nobody in three counties builds around.',
    },
    'runtime.outcome.lost': { label: 'The shop goes dark' },
    'runtime.outcome.lost.desc': {
      label: 'The shop goes dark',
      description:
        'The reputation is spent, the phone has stopped ringing, and the truck is worth more than the business.',
    },
  },
  pools: {
    // Slot roles: staple, demand, construction, seasonal, recovery, heavy, advanced.
    resources: [
      { id: 'operating-cash', label: 'Operating cash', description: 'Payroll, fuel, insurance — burned every single day.', icon: 'mechanic.resource' },
      { id: 'lead-pipeline', label: 'Lead pipeline', description: 'Quote requests and callbacks; the first thing a drought kills.', icon: 'mechanic.resource' },
      { id: 'glass-stock', label: 'Glass & frame stock', description: 'Panes, frames, sealant — what jobs are built from.', icon: 'mechanic.resource' },
      { id: 'weatherization-kits', label: 'Weatherization kits', description: 'Storm windows and insulation stock; winter eats them.', icon: 'mechanic.resource' },
      { id: 'crew-welfare', label: 'Crew welfare fund', description: 'Good coffee, fair overtime, gear that fits. Keeps crews on their feet.', icon: 'mechanic.resource' },
      { id: 'tools-equipment', label: 'Tools & rigging', description: 'Ladders, lifts, cutting tables — heavy kit for bigger jobs.', icon: 'mechanic.resource' },
      { id: 'fabrication-line', label: 'Custom fabrication line', description: 'In-house custom units; only a mature shop can run one.', icon: 'mechanic.resource' },
    ],
    // Terrain slots 0-4 → produce resources 0/2/4/5/none.
    terrains: [
      { id: 'residential-repairs', label: 'Residential repair streets', description: 'Broken sashes and fogged panes — steady cash work.' },
      { id: 'new-construction', label: 'New-construction sites', description: 'Builder contracts; feed the stock room and the kit shelf.' },
      { id: 'heritage-restoration', label: 'Heritage restoration blocks', description: 'Slow, careful work that pays the crew back in pride.' },
      { id: 'commercial-contracts', label: 'Commercial glazing corridors', description: 'Storefronts and curtain walls; they fund the heavy kit.' },
      { id: 'downtown-bid-market', label: 'Downtown bid market', description: 'No steady yield — but one-off jobs come cheap here.' },
    ],
    areaLayouts: [
      { id: 'home-town', label: 'Home town', description: 'The streets the truck already knows.' },
      { id: 'tri-county', label: 'Tri-county sprawl', description: 'A wider map with richer, farther territory.' },
    ],
    // Season slots: normal / lean / crunch.
    seasons: [
      { id: 'install-season', label: 'Install season', description: 'Ladders out at dawn; the trade at full swing.' },
      { id: 'winter-slowdown', label: 'Winter slowdown', description: 'Repairs pause; weatherization kits fly off the shelf.' },
      { id: 'lead-drought', label: 'Lead drought', description: 'The phone goes quiet; every job must be hunted. Ladder clocks pause.' },
    ],
    // Leader slots follow the archetype order (GAPS.md C4).
    leaders: [
      { id: 'steady-hands', label: 'Steady-Hands Owner', description: 'No edge, no tax. Just good work.' },
      { id: 'warranty-first', label: 'Warranty-First Owner', description: 'Crews defend ground fiercely; spirits are harder to lift.' },
      { id: 'overtime', label: 'Overtime Owner', description: 'Can overdraw own hustle — the crew feels every late night.' },
      { id: 'line-of-credit', label: 'Line-of-Credit Owner', description: 'Hustle arrives once a year in one big draw.' },
      { id: 'systems', label: 'Systems Owner', description: 'Yard capacity extends itself when the racks fill.' },
      { id: 'off-season', label: 'Off-Season Owner', description: 'Expands cheap in the slowdown; overpays in high season.' },
      { id: 'contract-lock', label: 'Contract-Lock Owner', description: 'Nobody walks while a crew holds the shop — costly when none does.' },
      { id: 'edge-of-town', label: 'Edge-of-Town Owner', description: 'Areas beside unsurveyed streets produce more; settled ones less.' },
      { id: 'crew-stacking', label: 'Crew-Stacking Owner', description: 'Hires past shop capacity; every hire pumps reputation.' },
      { id: 'word-of-mouth', label: 'Word-of-Mouth Owner', description: 'The town surveys itself, slowly; directed surveys cost more.' },
    ],
    // Modifier slots: 0-4 terrain edges; 5 lean logistics; 6 crew recovery.
    modifiers: [
      { id: 'residential-referrals', label: 'Residential referral network', description: 'Crews hold residential streets better.' },
      { id: 'builder-network', label: 'Builder network', description: 'Crews hold construction sites better.' },
      { id: 'preservation-guild', label: 'Preservation guild ties', description: 'Crews hold restoration blocks better.' },
      { id: 'facilities-rolodex', label: 'Facilities-manager rolodex', description: 'Crews hold commercial corridors better.' },
      { id: 'downtown-standing', label: 'Downtown standing', description: 'Crews hold the bid market better.' },
      { id: 'lean-crews', label: 'Lean crew logistics', description: 'Road crews run without draining the books.' },
      { id: 'crew-recovery-program', label: 'Crew recovery program', description: 'Worn-out crews come back faster.' },
    ],
    // Goal-type slots 0-10 (explore/claim/produce/stockpile/maintain/storage/
    // population/tech/morale/cleanse/kill).
    goalTypes: [
      { id: 'survey-territories', label: 'Survey territories', description: 'Walk new neighborhoods and price their windows.' },
      { id: 'open-service-areas', label: 'Open service areas', description: 'Put the company name on new ground.' },
      { id: 'book-revenue', label: 'Book revenue', description: 'Bank income from steady work and one-off jobs alike.' },
      { id: 'build-cash-reserves', label: 'Build cash reserves', description: 'Hold a required balance on the books.' },
      { id: 'hold-cash-buffer', label: 'Hold a cash buffer', description: 'Keep the balance above the line for a month.' },
      { id: 'expand-yard-capacity', label: 'Expand yard capacity', description: 'Add racks and storage to the yard.' },
      { id: 'grow-the-crew', label: 'Grow the crew', description: 'Reach a crew-size milestone.' },
      { id: 'upgrade-the-shop', label: 'Upgrade the shop', description: 'Reach a shop-upgrade milestone.' },
      { id: 'keep-crew-spirits', label: 'Keep crew spirits high', description: 'Hold spirits above the line for a month.' },
      { id: 'shut-down-undercutters', label: 'Break competitor strongholds', description: 'Outwork entrenched rivals until they stop bleeding you.' },
      { id: 'win-bid-battles', label: 'Win bid battles', description: 'Beat rival crews head-to-head on contested jobs.' },
    ],
    eventImages: [
      { id: 'first-install', label: 'The first install', description: 'A new pane, a clean bead of sealant, a paying customer.', icon: 'mechanic.event' },
      { id: 'truck-loaded', label: 'The truck, loaded', description: 'Ladders lashed, glass racked, coffee in the cupholder.', icon: 'mechanic.resource' },
      { id: 'cracked-pane', label: 'A cracked pane', description: 'Somebody’s bad night is your next job.', icon: 'mechanic.pressure' },
      { id: 'winter-boardup', label: 'Winter board-up', description: 'Plywood and storm kits against the season.', icon: 'mechanic.season' },
      { id: 'tailgate-huddle', label: 'Tailgate huddle', description: 'The crew plans the day off the back of the truck.', icon: 'mechanic.morale' },
      { id: 'contract-signing', label: 'The contract signing', description: 'A commercial job big enough to change the year.', icon: 'mechanic.goal' },
    ],
    difficulties: [
      { id: 'friendly-town', label: 'Friendly town', description: 'Patient customers, sleepy rivals.' },
      { id: 'fair-market', label: 'Fair market', description: 'A normal town with normal sharks.' },
      { id: 'entrenched-competition', label: 'Entrenched competition', description: 'The incumbents are dug in and the clocks run fast.' },
      { id: 'race-to-the-bottom', label: 'Race to the bottom', description: 'Everyone undercuts everyone; the grind compounds viciously.' },
    ],
  },
};
