import { themeManifestSchema, type ResolvedTheme, type ThemeManifest } from './types.ts';

/**
 * The single theme registry. Every theme lives in /assets/<theme-id>/ as
 * theme.json plus an icons/ folder of SVG files. Nothing outside this module
 * reads theme files; components consume only the ResolvedTheme interface.
 *
 * Adding a theme = adding a folder. No component code changes.
 */

const manifestModules = import.meta.glob('/assets/*/theme.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const iconModules = import.meta.glob('/assets/*/icons/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function folderIdFromPath(path: string): string {
  const match = /^\/assets\/([^/]+)\//.exec(path);
  if (!match || match[1] === undefined) {
    throw new Error(`Unexpected theme asset path: ${path}`);
  }
  return match[1];
}

function buildResolvedTheme(folderId: string, raw: unknown): ResolvedTheme {
  const manifest: ThemeManifest = themeManifestSchema.parse(raw);
  if (manifest.id !== folderId) {
    throw new Error(
      `Theme folder "${folderId}" declares mismatched id "${manifest.id}"`,
    );
  }

  const icons: Record<string, string> = {};
  for (const [path, svg] of Object.entries(iconModules)) {
    if (folderIdFromPath(path) === folderId) {
      const file = path.split('/').at(-1) ?? '';
      icons[file] = svg;
    }
  }

  const fallbackFile = manifest.icons['fallback'];
  const fallbackSvg = fallbackFile !== undefined ? icons[fallbackFile] : undefined;
  if (fallbackSvg === undefined) {
    throw new Error(`Theme "${folderId}" is missing its fallback icon file`);
  }

  return {
    manifest,
    string(id: string): string {
      return manifest.strings[id] ?? id;
    },
    iconSvg(id: string): string {
      const file = manifest.icons[id];
      const svg = file !== undefined ? icons[file] : undefined;
      return svg ?? fallbackSvg;
    },
    cssVariables(): Record<string, string> {
      const vars: Record<string, string> = {};
      for (const [key, value] of Object.entries(manifest.tokens.color)) {
        vars[`--color-${key}`] = value;
      }
      vars['--font-body'] = manifest.tokens.font.body;
      vars['--font-heading'] = manifest.tokens.font.heading;
      vars['--font-mono'] = manifest.tokens.font.mono;
      for (const [key, value] of Object.entries(manifest.tokens.radius)) {
        vars[`--radius-${key}`] = value;
      }
      for (const [key, value] of Object.entries(manifest.tokens.spacing)) {
        vars[`--spacing-${key}`] = value;
      }
      return vars;
    },
  };
}

const themes = new Map<string, ResolvedTheme>();
for (const [path, raw] of Object.entries(manifestModules)) {
  const folderId = folderIdFromPath(path);
  themes.set(folderId, buildResolvedTheme(folderId, raw));
}

export function listThemeIds(): string[] {
  return [...themes.keys()].sort();
}

export function getTheme(id: string): ResolvedTheme {
  const theme = themes.get(id);
  if (!theme) {
    throw new Error(
      `Unknown theme "${id}". Available: ${listThemeIds().join(', ')}`,
    );
  }
  return theme;
}
