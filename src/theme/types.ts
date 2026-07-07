import { z } from 'zod';

/**
 * A theme is pure presentation: color tokens, typography, UI chrome strings,
 * and icon assets. Themes carry ZERO domain/mechanic semantics — swapping the
 * theme folder must reskin the app 1:1 with no component-code changes. Chrome
 * strings may be flavored to the theme's aesthetic (the after-inc skin words
 * its buttons in-world); scenario CONTENT language always comes from the
 * domain schema, so the vocabulary lint on business scenario output is
 * unaffected by theme choice.
 */

export const themeTokensSchema = z.object({
  color: z.record(z.string(), z.string()),
  font: z.object({
    body: z.string(),
    heading: z.string(),
    mono: z.string(),
  }),
  radius: z.object({
    small: z.string(),
    medium: z.string(),
    large: z.string(),
  }),
  spacing: z.object({
    xs: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
  }),
});

export const themeManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  tokens: themeTokensSchema,
  /** UI chrome strings, keyed by stable string ids used in components. */
  strings: z.record(z.string(), z.string()),
  /**
   * Icon map: stable icon id -> file name inside this theme's icons/ folder.
   * Must include a "fallback" entry; any unknown icon id resolves to it.
   */
  icons: z.record(z.string(), z.string()).refine((m) => 'fallback' in m, {
    message: 'theme.icons must include a "fallback" entry',
  }),
});

export type ThemeManifest = z.infer<typeof themeManifestSchema>;
export type ThemeTokens = z.infer<typeof themeTokensSchema>;

export interface ResolvedTheme {
  manifest: ThemeManifest;
  /** Returns the UI string for a stable id; falls back to the id itself so
   * a missing string is visible (and testable) rather than a crash. */
  string(id: string): string;
  /** Returns inline SVG markup for a stable icon id (fallback icon if unknown). */
  iconSvg(id: string): string;
  /** Flat CSS custom-property map derived from tokens, e.g. "--color-surface". */
  cssVariables(): Record<string, string>;
}
