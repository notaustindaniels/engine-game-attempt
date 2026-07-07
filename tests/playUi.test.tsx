import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameApp } from '../src/runtime/components/GameApp.tsx';
import { getTheme } from '../src/theme/registry.ts';
import { getDomain } from '../src/domain/registry.ts';
import { blueprint } from '../src/engine/blueprint.ts';
import { createDefaultScenario } from '../src/engine/scenario.ts';
import { deriveRules } from '../src/runtime/rules.ts';
import { createGame, type GameState } from '../src/runtime/state.ts';
import { applyAction, type GameAction } from '../src/runtime/engine.ts';
import { runtimeTokens } from '../src/runtime/tokens.ts';

/**
 * The game UI honors the same two contracts as the editor:
 * theme swap changes zero structure, and every content string resolves
 * through the domain lexicon (runtime tokens are registry-enforced).
 */

function normalize(html: string): string {
  return html
    .replace(/(<span class="icon-glyph[^"]*")[\s\S]*?(<\/span>)/g, '$1>$2')
    .replace(/\s([a-zA-Z-]+)="[^"]*"/g, (match, name: string) =>
      name === 'class' ? match : ` ${name}=""`,
    )
    .replace(/>[^<]+</g, '><');
}

function bootedState(domainId: string): GameState {
  const domain = getDomain(domainId);
  const scenario = createDefaultScenario(blueprint, domain);
  const rules = deriveRules(scenario, domain);
  let s = createGame(rules, 11);
  const actions: GameAction[] = [{ type: 'chooseLeader', leaderIndex: 0 }];
  for (const action of actions) {
    const result = applyAction(rules, s, action);
    if (result.error) throw new Error(result.error);
    s = result.state;
  }
  while (s.pendingPopups.length > 0) {
    const result = applyAction(rules, s, { type: 'acknowledge' });
    if (result.error) throw new Error(result.error);
    s = result.state;
  }
  const turn = applyAction(rules, s, { type: 'endTurn' });
  if (turn.error) throw new Error(turn.error);
  return turn.state;
}

describe('game UI theme-swap structural equivalence', () => {
  for (const domainId of ['after-inc', 'biz-wedding-photography']) {
    it(`renders identical structure under both themes (${domainId})`, () => {
      const domain = getDomain(domainId);
      const scenario = createDefaultScenario(blueprint, domain);
      const state = bootedState(domainId);

      const renderWith = (themeId: string) =>
        renderToStaticMarkup(
          <GameApp
            theme={getTheme(themeId)}
            domain={domain}
            scenario={scenario}
            initialState={state}
            onLoadScenario={() => undefined}
          />,
        );

      const a = renderWith('after-inc');
      const b = renderWith('clean-slate');
      expect(a).not.toBe(b);
      expect(normalize(a)).toBe(normalize(b));
    });
  }

  it('renders the setup (leader choice) screen identically too', () => {
    const domain = getDomain('after-inc');
    const scenario = createDefaultScenario(blueprint, domain);
    const renderWith = (themeId: string) =>
      renderToStaticMarkup(
        <GameApp theme={getTheme(themeId)} domain={domain} scenario={scenario} />,
      );
    expect(normalize(renderWith('after-inc'))).toBe(
      normalize(renderWith('clean-slate')),
    );
  });
});

describe('runtime lexicon coverage', () => {
  it('every runtime token resolves in the canonical and business domains', () => {
    for (const domainId of ['after-inc', 'biz-craft-brewery']) {
      const domain = getDomain(domainId);
      const missing = runtimeTokens().filter(
        (token) => domain.lexicon[token] === undefined,
      );
      expect(missing, `${domainId} missing: ${missing.join(', ')}`).toHaveLength(0);
    }
  });
});
