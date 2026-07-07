/** Shared flat-top hex geometry for the editor map and the runtime map. */

export const HEX_SIZE = 22;

export function hexCenter(q: number, r: number): { x: number; y: number } {
  return {
    x: HEX_SIZE * 1.5 * q,
    y: HEX_SIZE * (Math.sqrt(3) / 2) * q + HEX_SIZE * Math.sqrt(3) * r,
  };
}

export function hexPoints(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(
      `${(cx + size * Math.cos(angle)).toFixed(2)},${(cy + size * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(' ');
}

export interface HexBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export function hexBounds(
  coords: readonly { q: number; r: number }[],
  padFactor = 1.4,
): HexBounds {
  const centers = coords.map((c) => hexCenter(c.q, c.r));
  const pad = HEX_SIZE * padFactor;
  const xs = centers.map((c) => c.x);
  const ys = centers.map((c) => c.y);
  const minX = Math.min(...xs, 0) - pad;
  const minY = Math.min(...ys, 0) - pad;
  const maxX = Math.max(...xs, 0) + pad;
  const maxY = Math.max(...ys, 0) + pad;
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}
