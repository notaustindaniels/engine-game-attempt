import { useMemo } from 'react';
import { HEX_SIZE, hexBounds, hexCenter, hexPoints } from '../../components/hex.ts';
import type { DomainSchema } from '../../domain/types.ts';
import type { GameRules } from '../rules.ts';
import { TUNING } from '../rules.ts';
import type { GameState } from '../state.ts';

interface GameMapProps {
  rules: GameRules;
  game: GameState;
  domain: DomainSchema;
  selectedAreaId: string | null;
  onSelectArea: (areaId: string) => void;
}

/**
 * The playable region map. Unexplored cells render as fog; explored cells
 * show terrain; claimed cells are emphasized and carry a health bar while
 * damaged. Threat totals, producer markers, and defender tokens overlay
 * each cell. Pure presentation — every click routes back to the shell.
 */
export function GameMap(props: GameMapProps) {
  const { rules, game, domain, selectedAreaId, onSelectArea } = props;

  const terrainIndex = useMemo(
    () => new Map(domain.pools.terrains.map((t, i) => [t.id, i])),
    [domain],
  );
  const bounds = useMemo(() => hexBounds(rules.areas), [rules.areas]);
  const defendersByArea = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of game.defenders) {
      map.set(d.areaId, (map.get(d.areaId) ?? 0) + 1);
    }
    return map;
  }, [game.defenders]);

  return (
    <svg
      className="game-map"
      viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
      role="group"
    >
      {rules.areas.map((cell) => {
        const area = game.areas[cell.id];
        if (!area) return null;
        const { x, y } = hexCenter(cell.q, cell.r);
        const threats = Math.round(area.threats * 10) / 10;
        const defenders = defendersByArea.get(cell.id) ?? 0;
        const hexClass = area.explored
          ? `game-hex game-hex-terrain area-map-terrain-${terrainIndex.get(cell.terrain) ?? 0}`
          : 'game-hex game-hex-fog';
        return (
          <g
            className="game-cell"
            key={cell.id}
            data-claimed={area.claimed}
            data-explored={area.explored}
            data-selected={cell.id === selectedAreaId}
            onClick={() => onSelectArea(cell.id)}
          >
            <polygon className={hexClass} points={hexPoints(x, y, HEX_SIZE - 1.5)} />
            {area.explored && cell.river ? (
              <circle className="area-map-river" cx={x - 8} cy={y + 9} r={3} />
            ) : null}
            {area.explored && area.infested ? (
              <circle className="area-map-infested" cx={x + 8} cy={y + 9} r={3.5} />
            ) : null}
            {cell.start ? (
              <circle className="area-map-start" cx={x} cy={y - 7} r={5} />
            ) : null}
            {area.explored && threats >= 0.5 ? (
              <g className="game-threat">
                <circle className="game-threat-badge" cx={x + 9} cy={y - 8} r={7} />
                <text className="game-threat-count" x={x + 9} y={y - 5}>
                  {Math.round(threats)}
                </text>
              </g>
            ) : null}
            {defenders > 0 ? (
              <g className="game-defender">
                <circle className="game-defender-badge" cx={x - 9} cy={y - 8} r={7} />
                <text className="game-defender-count" x={x - 9} y={y - 5}>
                  {defenders}
                </text>
              </g>
            ) : null}
            {area.claimed && area.health < TUNING.areaHealthMax ? (
              <g className="game-health">
                <rect className="game-health-track" x={x - 14} y={y + 13} width={28} height={3} />
                <rect
                  className="game-health-fill"
                  x={x - 14}
                  y={y + 13}
                  width={(28 * area.health) / TUNING.areaHealthMax}
                  height={3}
                />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
