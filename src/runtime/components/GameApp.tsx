import { useMemo, useState, type CSSProperties } from 'react';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext.tsx';
import type { ResolvedTheme } from '../../theme/types.ts';
import { IconGlyph } from '../../components/IconGlyph.tsx';
import { domainLabel, type DomainSchema } from '../../domain/types.ts';
import type { Scenario } from '../../engine/scenario.ts';
import { neighborsOf } from '../../engine/areaMap.ts';
import { deriveRules, seasonSlotForTurn } from '../rules.ts';
import { createGame, type GameState } from '../state.ts';
import { applyAction, type ActionError, type GameAction } from '../engine.ts';
import { GameMap } from './GameMap.tsx';
import {
  EventModal,
  GameHud,
  GoalsPanel,
  LeaderSelect,
  LogPanel,
  OutcomeBanner,
  ResourcePanel,
} from './GamePanels.tsx';

export interface GameAppProps {
  theme: ResolvedTheme;
  domain: DomainSchema;
  /** The exported scenario — the runtime's sole content source. */
  scenario: Scenario;
  seed?: number;
  /** Test hook: start from a prepared state instead of a fresh game. */
  initialState?: GameState;
  /** When provided, the header offers loading a different scenario file. */
  onLoadScenario?: (file: File) => void;
}

/**
 * The playable game. Mirrors the editor's architecture contract: theme and
 * domain arrive as data; nothing below this point branches on either. The
 * engine is pure — this component only holds the current state and routes
 * actions into the reducer.
 */
export function GameApp(props: GameAppProps) {
  return (
    <ThemeProvider theme={props.theme}>
      <GameShell {...props} />
    </ThemeProvider>
  );
}

function GameShell(props: GameAppProps) {
  const theme = useTheme();
  const { domain, scenario } = props;
  const rules = useMemo(() => deriveRules(scenario, domain), [scenario, domain]);
  const [game, setGame] = useState<GameState>(
    () => props.initialState ?? createGame(rules, props.seed),
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [deployUnitId, setDeployUnitId] = useState<string | null>(null);
  const [lastError, setLastError] = useState<ActionError | null>(null);

  const dispatch = (action: GameAction): void => {
    const result = applyAction(rules, game, action);
    if (result.error !== undefined) {
      setLastError(result.error);
      return;
    }
    setLastError(null);
    setGame(result.state);
  };

  const restart = (): void => {
    setGame(createGame(rules, props.seed));
    setSelectedAreaId(null);
    setDeployUnitId(null);
    setLastError(null);
  };

  const onSelectArea = (areaId: string): void => {
    if (deployUnitId !== null) {
      dispatch({ type: 'move', defenderId: deployUnitId, areaId });
      setDeployUnitId(null);
      setSelectedAreaId(areaId);
      return;
    }
    setSelectedAreaId(areaId);
  };

  const seasonSlot = seasonSlotForTurn(rules, game.turn);
  const seasonId = rules.seasonIds[seasonSlot] ?? '';
  const seasonLabel =
    domain.pools.seasons.find((s) => s.id === seasonId)?.label ?? seasonId;

  const selectedArea = selectedAreaId !== null ? game.areas[selectedAreaId] : undefined;
  const selectedCell = rules.areas.find((c) => c.id === selectedAreaId);
  const defendersHere = game.defenders.filter((d) => d.areaId === selectedAreaId);
  const canExplore =
    selectedArea !== undefined &&
    !selectedArea.explored &&
    selectedCell !== undefined &&
    neighborsOf(selectedCell, rules.areas).some((n) => game.areas[n.id]?.explored);
  const canClaim =
    selectedArea !== undefined &&
    selectedArea.explored &&
    !selectedArea.claimed &&
    !selectedArea.infested &&
    selectedArea.threats < 0.5 &&
    selectedCell !== undefined &&
    neighborsOf(selectedCell, rules.areas).some((n) => game.areas[n.id]?.claimed);

  const popup = game.pendingPopups[0];
  const cssVars = theme.cssVariables() as CSSProperties;

  return (
    <div className="app-root game-root" style={cssVars} data-domain={domain.id}>
      <header className="app-header">
        <h1 className="app-title">{rules.scenarioName}</h1>
        <p className="app-tagline">
          {theme.string('game.day')} {game.turn} · {seasonLabel}
        </p>
        <div className="app-actions">
          {props.onLoadScenario ? (
            <label className="app-action">
              <IconGlyph id="action.import" />
              <span>{theme.string('game.loadScenario')}</span>
              <input
                type="file"
                accept="application/json"
                className="app-import-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) props.onLoadScenario?.(file);
                }}
              />
            </label>
          ) : null}
          <button type="button" className="app-action" onClick={restart}>
            <IconGlyph id="action.add" />
            <span>{theme.string('game.restart')}</span>
          </button>
        </div>
      </header>

      {game.outcome === 'setup' ? (
        <LeaderSelect
          domain={domain}
          onChoose={(leaderIndex) => dispatch({ type: 'chooseLeader', leaderIndex })}
        />
      ) : (
        <div className="game-body" data-deploying={deployUnitId !== null}>
          <main className="game-main">
            <GameHud rules={rules} game={game} domain={domain} />
            <GameMap
              rules={rules}
              game={game}
              domain={domain}
              selectedAreaId={selectedAreaId}
              onSelectArea={onSelectArea}
            />
            <div className="game-area-actions">
              {canExplore ? (
                <button
                  type="button"
                  className="app-action"
                  onClick={() =>
                    selectedAreaId !== null &&
                    dispatch({ type: 'explore', areaId: selectedAreaId })
                  }
                >
                  <IconGlyph id="mechanic.region" />
                  <span>{domainLabel(domain, 'runtime.action.explore')}</span>
                </button>
              ) : null}
              {canClaim ? (
                <button
                  type="button"
                  className="app-action"
                  onClick={() =>
                    selectedAreaId !== null &&
                    dispatch({ type: 'claim', areaId: selectedAreaId })
                  }
                >
                  <IconGlyph id="mechanic.authority" />
                  <span>{domainLabel(domain, 'runtime.action.claim')}</span>
                </button>
              ) : null}
              {defendersHere.map((defender) => (
                <span className="game-unit" key={defender.id}>
                  <IconGlyph id="mechanic.defense" />
                  <span className="game-unit-name">
                    {defender.id} · {Math.round(defender.health)}
                  </span>
                  <button
                    type="button"
                    className="game-mini-action"
                    title={domainLabel(domain, 'runtime.action.move')}
                    onClick={() => setDeployUnitId(defender.id)}
                  >
                    <IconGlyph id="action.export" />
                  </button>
                  {selectedArea?.infested ? (
                    <button
                      type="button"
                      className="game-mini-action"
                      title={domainLabel(domain, 'runtime.action.cleanse')}
                      onClick={() => dispatch({ type: 'cleanse', defenderId: defender.id })}
                    >
                      <IconGlyph id="mechanic.pressure" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="game-mini-action"
                    title={domainLabel(domain, 'runtime.action.provoke')}
                    onClick={() => dispatch({ type: 'provoke', defenderId: defender.id })}
                  >
                    <IconGlyph id="mechanic.defense" />
                  </button>
                </span>
              ))}
            </div>
            <div className="game-global-actions">
              <button type="button" className="app-action" onClick={() => dispatch({ type: 'festival' })}>
                <IconGlyph id="mechanic.morale" />
                <span>{domainLabel(domain, 'runtime.action.festival')}</span>
              </button>
              <button type="button" className="app-action" onClick={() => dispatch({ type: 'train' })}>
                <IconGlyph id="mechanic.defense" />
                <span>{domainLabel(domain, 'runtime.action.train')}</span>
              </button>
              <button type="button" className="app-action" onClick={() => dispatch({ type: 'buildHousing' })}>
                <IconGlyph id="mechanic.settings" />
                <span>{domainLabel(domain, 'runtime.action.housing')}</span>
              </button>
              <button type="button" className="app-action" onClick={() => dispatch({ type: 'research' })}>
                <IconGlyph id="mechanic.modifier" />
                <span>{domainLabel(domain, 'runtime.action.research')}</span>
              </button>
              <button
                type="button"
                className="app-action game-end-turn"
                onClick={() => dispatch({ type: 'endTurn' })}
              >
                <IconGlyph id="mechanic.season" />
                <span>{theme.string('game.endTurn')}</span>
              </button>
            </div>
            {lastError !== null ? (
              <p className="game-error">
                {theme.string('game.actionBlocked')}{' '}
                <code className="game-error-code">{lastError}</code>
              </p>
            ) : null}
          </main>
          <aside className="game-side">
            <GoalsPanel rules={rules} game={game} domain={domain} />
            <ResourcePanel
              rules={rules}
              game={game}
              domain={domain}
              onDeal={(resourceId) => dispatch({ type: 'deal', resourceId })}
              onExpand={(resourceId) => dispatch({ type: 'expandStorage', resourceId })}
            />
            <LogPanel game={game} domain={domain} />
          </aside>
        </div>
      )}

      {popup !== undefined ? (
        <EventModal
          popup={popup}
          domain={domain}
          onAcknowledge={() => dispatch({ type: 'acknowledge' })}
        />
      ) : null}
      {game.outcome === 'won' || game.outcome === 'lost' ? (
        <OutcomeBanner outcome={game.outcome} domain={domain} onRestart={restart} />
      ) : null}
    </div>
  );
}
