import { useMemo, useState } from 'react';
import { useTheme } from '../theme/ThemeContext.tsx';
import type { AreaMapFieldSpec } from '../engine/fieldSpec.ts';
import {
  HEX_DIRECTIONS,
  coordKey,
  generateAreaMapPreset,
  type AreaCell,
} from '../engine/areaMap.ts';
import { domainLabel, poolItems, type DomainSchema } from '../domain/types.ts';
import { IconGlyph } from './IconGlyph.tsx';

interface AreaMapInputProps {
  field: AreaMapFieldSpec;
  value: AreaCell[];
  domain: DomainSchema;
  onChange: (value: AreaCell[]) => void;
}

const HEX_SIZE = 22;

/** Flat-top axial → pixel. */
function hexCenter(q: number, r: number): { x: number; y: number } {
  return {
    x: HEX_SIZE * 1.5 * q,
    y: HEX_SIZE * (Math.sqrt(3) / 2) * q + HEX_SIZE * Math.sqrt(3) * r,
  };
}

function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(
      `${(cx + size * Math.cos(angle)).toFixed(2)},${(cy + size * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(' ');
}

function nextAreaId(areas: readonly AreaCell[]): string {
  const taken = new Set(areas.map((a) => a.id));
  let n = areas.length + 1;
  while (taken.has(`area-${n}`)) n += 1;
  return `area-${n}`;
}

/**
 * Geometry editor for the areaMap field kind: an SVG hex map with a cell
 * inspector. All content language resolves through the domain lexicon and
 * pools; all chrome through the theme. No mechanics live here — the value
 * is plain AreaCell[] data validated by the scenario schema.
 */
export function AreaMapInput(props: AreaMapInputProps) {
  const theme = useTheme();
  const { field, value, domain, onChange } = props;
  const areas = value;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = areas.find((a) => a.id === selectedId) ?? null;
  const terrains = poolItems(domain, 'terrains');
  const terrainIndex = useMemo(
    () => new Map(terrains.map((t, i) => [t.id, i])),
    [terrains],
  );

  const byCoord = useMemo(
    () => new Map(areas.map((a) => [coordKey(a.q, a.r), a])),
    [areas],
  );

  // Empty neighbor slots of the selected cell (click to add an area).
  const ghosts = useMemo(() => {
    if (!selected || areas.length >= field.maxAreas) return [];
    return HEX_DIRECTIONS.map(([dq, dr]) => ({
      q: selected.q + dq,
      r: selected.r + dr,
    })).filter((c) => !byCoord.has(coordKey(c.q, c.r)));
  }, [selected, areas.length, field.maxAreas, byCoord]);

  const bounds = useMemo(() => {
    const centers = [
      ...areas.map((a) => hexCenter(a.q, a.r)),
      ...ghosts.map((g) => hexCenter(g.q, g.r)),
    ];
    const pad = HEX_SIZE * 1.4;
    const xs = centers.map((c) => c.x);
    const ys = centers.map((c) => c.y);
    const minX = Math.min(...xs, 0) - pad;
    const minY = Math.min(...ys, 0) - pad;
    const maxX = Math.max(...xs, 0) + pad;
    const maxY = Math.max(...ys, 0) + pad;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [areas, ghosts]);

  const updateCell = (id: string, patch: Partial<AreaCell>) => {
    onChange(
      areas.map((a) => {
        if (a.id === id) return { ...a, ...patch };
        // Exactly one start area: granting start clears it elsewhere.
        if (patch.start === true && a.start) return { ...a, start: false };
        return a;
      }),
    );
  };

  const addCell = (q: number, r: number) => {
    const id = nextAreaId(areas);
    const terrain = terrains[0]?.id ?? '';
    onChange([
      ...areas,
      { id, q, r, terrain, river: false, infested: false, start: false },
    ]);
    setSelectedId(id);
  };

  const removeCell = (id: string) => {
    onChange(areas.filter((a) => a.id !== id));
    setSelectedId(null);
  };

  return (
    <div className="area-map">
      <div className="area-map-presets">
        <span className="area-map-presets-label">
          {theme.string('map.seedLabel')}
        </span>
        {poolItems(domain, 'areaLayouts').map((layout, index) => (
          <button
            type="button"
            className="area-map-preset"
            key={layout.id}
            onClick={() => {
              onChange(generateAreaMapPreset(domain, index));
              setSelectedId(null);
            }}
          >
            <IconGlyph id="mechanic.region" />
            <span>{layout.label}</span>
          </button>
        ))}
      </div>
      <svg
        className="area-map-canvas"
        viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
        role="group"
      >
        {areas.map((area) => {
          const { x, y } = hexCenter(area.q, area.r);
          return (
            <g
              className="area-map-cell"
              key={area.id}
              data-terrain-slot={terrainIndex.get(area.terrain) ?? 0}
              data-selected={area.id === selectedId}
              onClick={() => setSelectedId(area.id)}
            >
              <polygon
                className={`area-map-hex area-map-terrain-${terrainIndex.get(area.terrain) ?? 0}`}
                points={hexPoints(x, y, HEX_SIZE - 1.5)}
              />
              {area.river ? (
                <circle className="area-map-river" cx={x - 7} cy={y + 8} r={3.5} />
              ) : null}
              {area.infested ? (
                <circle className="area-map-infested" cx={x + 7} cy={y + 8} r={3.5} />
              ) : null}
              {area.start ? (
                <circle className="area-map-start" cx={x} cy={y - 6} r={5} />
              ) : null}
            </g>
          );
        })}
        {ghosts.map((ghost) => {
          const { x, y } = hexCenter(ghost.q, ghost.r);
          return (
            <polygon
              className="area-map-ghost"
              key={coordKey(ghost.q, ghost.r)}
              points={hexPoints(x, y, HEX_SIZE - 4)}
              onClick={() => addCell(ghost.q, ghost.r)}
            />
          );
        })}
      </svg>
      {selected ? (
        <div className="area-map-inspector">
          <span className="area-map-cell-id">{selected.id}</span>
          <label className="area-map-control">
            <span>{domainLabel(domain, field.areaTokens.terrain)}</span>
            <select
              className="field-input field-select"
              value={selected.terrain}
              onChange={(e) => updateCell(selected.id, { terrain: e.target.value })}
            >
              {terrains.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="area-map-control">
            <span>{domainLabel(domain, field.areaTokens.river)}</span>
            <input
              className="field-input field-toggle"
              type="checkbox"
              checked={selected.river}
              onChange={(e) => updateCell(selected.id, { river: e.target.checked })}
            />
          </label>
          <label className="area-map-control">
            <span>{domainLabel(domain, field.areaTokens.infested)}</span>
            <input
              className="field-input field-toggle"
              type="checkbox"
              checked={selected.infested}
              onChange={(e) =>
                updateCell(selected.id, { infested: e.target.checked })
              }
            />
          </label>
          <label className="area-map-control">
            <span>{domainLabel(domain, field.areaTokens.start)}</span>
            <input
              className="field-input field-toggle"
              type="checkbox"
              checked={selected.start}
              onChange={(e) => updateCell(selected.id, { start: e.target.checked })}
            />
          </label>
          <button
            type="button"
            className="field-list-remove"
            disabled={areas.length <= field.minAreas}
            onClick={() => removeCell(selected.id)}
          >
            <IconGlyph id="action.remove" />
            <span>{theme.string('action.remove')}</span>
          </button>
        </div>
      ) : (
        <p className="area-map-hint">{theme.string('map.selectHint')}</p>
      )}
    </div>
  );
}
