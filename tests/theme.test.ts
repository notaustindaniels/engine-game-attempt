import { describe, expect, it } from 'vitest';
import { getTheme, listThemeIds } from '../src/theme/registry.ts';

describe('theme registry resolution', () => {
  it('discovers both shipped themes from /assets', () => {
    expect(listThemeIds()).toEqual(['after-inc', 'clean-slate']);
  });

  it('resolves strings, icons and tokens for each theme', () => {
    for (const id of listThemeIds()) {
      const theme = getTheme(id);
      expect(theme.manifest.id).toBe(id);
      expect(theme.string('app.title').length).toBeGreaterThan(0);
      expect(theme.iconSvg('action.export')).toContain('<svg');
      const vars = theme.cssVariables();
      expect(vars['--color-background']).toMatch(/^#/);
      expect(vars['--font-body']?.length).toBeGreaterThan(0);
      expect(vars['--radius-small']).toBeDefined();
      expect(vars['--spacing-md']).toBeDefined();
    }
  });

  it('falls back to the fallback icon for unknown icon ids', () => {
    const theme = getTheme('clean-slate');
    expect(theme.iconSvg('does-not-exist')).toBe(theme.iconSvg('fallback'));
  });

  it('falls back to the string id for unknown string ids (visible, not crash)', () => {
    const theme = getTheme('after-inc');
    expect(theme.string('nonexistent.key')).toBe('nonexistent.key');
  });

  it('throws a helpful error for unknown themes', () => {
    expect(() => getTheme('vaporwave')).toThrow(/Available: after-inc, clean-slate/);
  });
});

describe('theme parity (swap requires zero component changes)', () => {
  it('both themes define the exact same string keys', () => {
    const a = Object.keys(getTheme('after-inc').manifest.strings).sort();
    const b = Object.keys(getTheme('clean-slate').manifest.strings).sort();
    expect(a).toEqual(b);
  });

  it('both themes define the exact same icon keys', () => {
    const a = Object.keys(getTheme('after-inc').manifest.icons).sort();
    const b = Object.keys(getTheme('clean-slate').manifest.icons).sort();
    expect(a).toEqual(b);
  });

  it('both themes define the exact same color token keys', () => {
    const a = Object.keys(getTheme('after-inc').manifest.tokens.color).sort();
    const b = Object.keys(getTheme('clean-slate').manifest.tokens.color).sort();
    expect(a).toEqual(b);
  });
});
