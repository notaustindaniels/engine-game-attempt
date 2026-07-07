/**
 * A compact, fully-authored vocabulary pack for one business niche.
 * The generator expands a pack into a complete niche-native DomainSchema:
 * mechanics stay identical to the game blueprint; every visible string is
 * the niche's own language (Native Translation rule — no apocalypse flavor).
 */
export interface NichePack {
  /** Kebab-case niche id, e.g. "wedding-photography". */
  id: string;
  /** Display name of the niche business, e.g. "Wedding Photography Studio". */
  label: string;
  /** What the business calls itself: "studio", "bakery", "clinic"... */
  venture: string;
  /** What the staff are called: "crew", "stylists", "instructors"... */
  team: string;
  /** What the customers are called: "couples", "members", "diners"... */
  customers: string;
  /** The zombie-analog: the niche's ambient, compounding business pressure. */
  pressureLabel: string;
  pressureDesc: string;
  /** What the pressure's producer nodes are called (infested-area analog). */
  pressureSources: string;
  /** Niche-native label for capital equipment (the "stone" slot). */
  gearTerm: string;
  /** Niche-native label for incoming demand (the "water" slot). */
  inquiriesTerm: string;
  /** The three market-cycle names (summer/winter/drought analogs). */
  peakSeason: string;
  slowSeason: string;
  crunchSeason: string;
  /** A signature niche scene for the event-image gallery. */
  scene: string;
}
