import type { DomainSchema } from '../domain/types.ts';

/**
 * Area-map geometry: the scenario's region as a set of hex cells on an
 * axial (q, r) grid. The wiki documents WHAT an area is (terrain classes,
 * river adjacency, infested producer areas, a settlement start area —
 * https://afterinc.wiki.gg/wiki/Areas) but not the map data model, so the
 * hex-grid representation is a flagged reconstruction (GAPS.md C1). The
 * scenario JSON carries the full geometry: the runtime engine reads nothing
 * about the map from anywhere else.
 */

export interface AreaCell {
  /** Stable author-chosen id, unique within the map. */
  id: string;
  /** Axial hex column. */
  q: number;
  /** Axial hex row. */
  r: number;
  /** Terrain id from the domain's `terrains` pool (slot semantics apply). */
  terrain: string;
  /** River / infrastructure-corridor adjacency (matters during the crunch season). */
  river: boolean;
  /** Pressure producer node ("infested area" in the canonical domain). */
  infested: boolean;
  /** The settlement / home-base area. Exactly one per map. */
  start: boolean;
}

export const AREA_COORD_MIN = -12;
export const AREA_COORD_MAX = 12;
export const AREA_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,23}$/;

/** The six axial hex neighbor offsets. */
export const HEX_DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

export function coordKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function areAdjacent(a: AreaCell, b: AreaCell): boolean {
  return HEX_DIRECTIONS.some(([dq, dr]) => a.q + dq === b.q && a.r + dr === b.r);
}

export function neighborsOf(
  cell: Pick<AreaCell, 'q' | 'r'>,
  areas: readonly AreaCell[],
): AreaCell[] {
  const byCoord = new Map(areas.map((a) => [coordKey(a.q, a.r), a]));
  const found: AreaCell[] = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const hit = byCoord.get(coordKey(cell.q + dq, cell.r + dr));
    if (hit) found.push(hit);
  }
  return found;
}

/** Axial hex distance. */
export function hexDistance(
  a: Pick<AreaCell, 'q' | 'r'>,
  b: Pick<AreaCell, 'q' | 'r'>,
): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function startArea(areas: readonly AreaCell[]): AreaCell | undefined {
  return areas.find((a) => a.start);
}

/**
 * Structural problems beyond per-cell shape validation. Returned as plain
 * strings so both the Zod schema (superRefine) and any caller can surface
 * them verbatim.
 */
export function areaMapProblems(areas: readonly AreaCell[]): string[] {
  const problems: string[] = [];

  const ids = new Set<string>();
  const coords = new Set<string>();
  for (const area of areas) {
    if (ids.has(area.id)) problems.push(`Duplicate area id "${area.id}"`);
    ids.add(area.id);
    const key = coordKey(area.q, area.r);
    if (coords.has(key)) problems.push(`Two areas share the cell (${key})`);
    coords.add(key);
  }

  const starts = areas.filter((a) => a.start);
  if (starts.length !== 1) {
    problems.push(`The map must have exactly one start area (found ${starts.length})`);
  }
  const start = starts[0];
  if (start !== undefined && start.infested) {
    problems.push(`The start area "${start.id}" cannot be a pressure producer`);
  }

  // Every area must be reachable from the start area over hex adjacency.
  if (start !== undefined && problems.length === 0) {
    const byCoord = new Map(areas.map((a) => [coordKey(a.q, a.r), a]));
    const seen = new Set<string>([start.id]);
    const queue: AreaCell[] = [start];
    while (queue.length > 0) {
      const current = queue.pop();
      if (current === undefined) break;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const next = byCoord.get(coordKey(current.q + dq, current.r + dr));
        if (next !== undefined && !seen.has(next.id)) {
          seen.add(next.id);
          queue.push(next);
        }
      }
    }
    for (const area of areas) {
      if (!seen.has(area.id)) {
        problems.push(`Area "${area.id}" is not connected to the start area`);
      }
    }
  }

  return problems;
}

/**
 * Deterministic preset generator: expands a named layout from the domain's
 * `areaLayouts` pool into concrete geometry. Sizes and terrain mix follow
 * the sourced "A New Dawn" census shape (28 areas, grassland-heavy, one
 * river crossing) as closely as the reconstruction allows (GAPS.md C1).
 */
export function generateAreaMapPreset(
  domain: DomainSchema,
  presetIndex: number,
): AreaCell[] {
  const terrains = domain.pools.terrains;
  const primary = terrains[0]?.id;
  if (primary === undefined) throw new Error('Domain has no terrains');
  const terrainId = (slot: number): string =>
    terrains[slot]?.id ?? primary;

  // Grassland-heavy mix echoing the sourced A New Dawn census
  // (12 grasslands, 7 mountains, 5 cities, 2 swamps, 2 forests / 28).
  const mix = [0, 3, 0, 4, 0, 1, 0, 3, 0, 4, 2, 0, 3, 0, 4, 0, 3, 0, 1, 0, 3, 0, 4, 2, 0, 3, 0];

  const size = Math.min(12 + presetIndex * 12, 28);
  const cells: AreaCell[] = [];
  // Hex spiral outward from the origin: center, then ring 1, ring 2, ...
  // walked contiguously, so every prefix of the spiral is connected.
  const ringWalk: readonly (readonly [number, number])[] = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1],
  ];
  const spiral: [number, number][] = [[0, 0]];
  for (let ring = 1; spiral.length < size; ring++) {
    let q = -ring;
    let r = ring;
    for (const [dq, dr] of ringWalk) {
      for (let step = 0; step < ring; step++) {
        spiral.push([q, r]);
        q += dq;
        r += dr;
      }
    }
  }

  for (let i = 0; i < size; i++) {
    const coord = spiral[i];
    if (coord === undefined) break;
    const [q, r] = coord;
    cells.push({
      id: `area-${i + 1}`,
      q,
      r,
      terrain: i === 0 ? primary : terrainId(mix[(i - 1) % mix.length] ?? 0),
      // One river crossing the map: the r = 0 row.
      river: r === 0,
      infested: false,
      start: i === 0,
    });
  }

  // Producer nodes at launch: the three cells farthest from the start.
  const start = cells[0];
  if (start !== undefined) {
    [...cells]
      .filter((c) => !c.start)
      .sort(
        (a, b) =>
          hexDistance(b, start) - hexDistance(a, start) ||
          a.id.localeCompare(b.id),
      )
      .slice(0, 3)
      .forEach((c) => {
        c.infested = true;
      });
  }

  return cells;
}
