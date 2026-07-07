import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/components/App.tsx';
import { getTheme } from '../src/theme/registry.ts';
import { getDomain } from '../src/domain/registry.ts';
import { blueprint } from '../src/engine/blueprint.ts';
import { createDefaultScenario } from '../src/engine/scenario.ts';

/**
 * Theme-swap structural equivalence: rendering the entire app under each
 * theme must produce the same DOM structure — same elements, same order,
 * same class names — differing only in text, asset payloads (icon SVG
 * innards) and attribute values (colors, urls). If a component branched on
 * the theme, this test fails.
 */

function normalize(html: string): string {
  return (
    html
      // Icon artwork is theme data, not component structure.
      .replace(/(<span class="icon-glyph[^"]*")[\s\S]*?(<\/span>)/g, '$1>$2')
      // Blank every attribute value except class (classes are structural).
      .replace(/\s([a-zA-Z-]+)="[^"]*"/g, (match, name: string) =>
        name === 'class' ? match : ` ${name}=""`,
      )
      // Drop all text nodes.
      .replace(/>[^<]+</g, '><')
  );
}

describe('theme-swap structural equivalence', () => {
  it('renders an identical structure under after-inc and clean-slate', () => {
    const domain = getDomain('after-inc');
    const scenario = createDefaultScenario(blueprint, domain);

    const renderWith = (themeId: string) =>
      renderToStaticMarkup(
        <App
          theme={getTheme(themeId)}
          domain={domain}
          blueprint={blueprint}
          initialScenario={scenario}
        />,
      );

    const afterInc = renderWith('after-inc');
    const cleanSlate = renderWith('clean-slate');

    // Sanity: the raw renders DO differ (different skins)...
    expect(afterInc).not.toBe(cleanSlate);
    // ...but the structure is identical.
    expect(normalize(afterInc)).toBe(normalize(cleanSlate));
  });

  it('keeps structural equivalence for a business domain too', () => {
    const domain = getDomain('biz-wedding-photography');
    const scenario = createDefaultScenario(blueprint, domain);

    const renderWith = (themeId: string) =>
      renderToStaticMarkup(
        <App
          theme={getTheme(themeId)}
          domain={domain}
          blueprint={blueprint}
          initialScenario={scenario}
        />,
      );

    expect(normalize(renderWith('after-inc'))).toBe(
      normalize(renderWith('clean-slate')),
    );
  });
});
