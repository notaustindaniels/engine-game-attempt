import { useTheme } from '../../theme/ThemeContext.tsx';
import { IconGlyph } from '../../components/IconGlyph.tsx';
import { domainLabel, type DomainSchema } from '../../domain/types.ts';
import type { GameRules } from '../rules.ts';
import { TUNING, storageCap } from '../rules.ts';
import type { GameState, Popup } from '../state.ts';
import { goalProgress } from '../engine.ts';

/**
 * HUD, goals, log, leader select, and popup modal. All content language
 * resolves through the domain lexicon and pools; all chrome through the
 * theme — same contract as the editor components.
 */

export function GameHud(props: {
  rules: GameRules;
  game: GameState;
  domain: DomainSchema;
}) {
  const { game, domain } = props;
  const stats: { token: string; icon: string; value: string }[] = [
    {
      token: 'runtime.stat.morale',
      icon: 'mechanic.morale',
      value: `${Math.round(game.morale)}%`,
    },
    {
      token: 'runtime.stat.authority',
      icon: 'mechanic.authority',
      value: `${Math.round(game.authority)}%`,
    },
    {
      token: 'runtime.stat.stamina',
      icon: 'mechanic.leader',
      value: String(Math.floor(game.stamina)),
    },
    {
      token: 'runtime.stat.population',
      icon: 'mechanic.settings',
      value: `${game.population}/${game.housing}`,
    },
    {
      token: 'runtime.stat.pressure',
      icon: 'mechanic.pressure',
      value: `${Math.round(game.pressureIntensity)}%`,
    },
    {
      token: 'runtime.stat.tech',
      icon: 'mechanic.modifier',
      value:
        game.techCountdown === null ? String(game.tech) : `${game.tech}→${game.tech + 1}`,
    },
  ];
  return (
    <div className="game-hud">
      {stats.map((stat) => (
        <div className="game-stat" key={stat.token} title={domainLabel(domain, stat.token)}>
          <IconGlyph id={stat.icon} />
          <span className="game-stat-label">{domainLabel(domain, stat.token)}</span>
          <span className="game-stat-value">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ResourcePanel(props: {
  rules: GameRules;
  game: GameState;
  domain: DomainSchema;
  onDeal: (resourceId: string) => void;
  onExpand: (resourceId: string) => void;
}) {
  const { game, domain, onDeal, onExpand } = props;
  return (
    <div className="game-resources">
      <h3 className="game-panel-title">
        {domainLabel(domain, 'editor.resources')}
      </h3>
      {domain.pools.resources.map((resource) => {
        const value = game.resources[resource.id] ?? 0;
        const cap = storageCap(game.storageExpansions[resource.id] ?? 0);
        return (
          <div className="game-resource-row" key={resource.id}>
            <IconGlyph id={resource.icon ?? 'mechanic.resource'} />
            <span className="game-resource-name">{resource.label}</span>
            <span className="game-resource-value">
              {value.toFixed(0)}/{cap.toFixed(0)}
            </span>
            <button
              type="button"
              className="game-mini-action"
              title={domainLabel(domain, 'runtime.action.deal')}
              onClick={() => onDeal(resource.id)}
            >
              <IconGlyph id="action.import" />
            </button>
            <button
              type="button"
              className="game-mini-action"
              title={domainLabel(domain, 'runtime.action.storage')}
              onClick={() => onExpand(resource.id)}
            >
              <IconGlyph id="action.add" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function GoalsPanel(props: {
  rules: GameRules;
  game: GameState;
  domain: DomainSchema;
}) {
  const { rules, game, domain } = props;
  const goalLabel = (typeId: string): string =>
    domain.pools.goalTypes.find((g) => g.id === typeId)?.label ?? typeId;
  return (
    <div className="game-goals">
      <h3 className="game-panel-title">{domainLabel(domain, 'editor.goals')}</h3>
      <ol className="game-goal-list">
        {rules.goals.map((goal, index) => {
          const state = game.goals[index];
          if (!state) return null;
          const active = index === game.activeGoalIndex && !state.completed;
          const isMaintain = goal.typeIndex === 4 || goal.typeIndex === 8;
          const target = isMaintain ? TUNING.maintainTurns : goal.targetAmount;
          const progress = Math.min(target, goalProgress(rules, game, index));
          return (
            <li
              className="game-goal"
              key={index}
              data-active={active}
              data-completed={state.completed}
            >
              <span className="game-goal-name">
                {goalLabel(goal.typeId)} · {isMaintain ? `${goal.targetAmount}+` : goal.targetAmount}
              </span>
              <span className="game-goal-progress">
                {Math.floor(progress)}/{target}
              </span>
              {active && !goal.stable ? (
                <span
                  className="game-goal-patience"
                  data-overdue={state.patienceLeft < 0}
                >
                  ⏳ {Math.max(0, Math.ceil(state.patienceLeft + game.eventPatience))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function LogPanel(props: {
  game: GameState;
  domain: DomainSchema;
}) {
  const theme = useTheme();
  const { game, domain } = props;
  const entries = game.log.slice(-9).reverse();
  return (
    <div className="game-log">
      <h3 className="game-panel-title">{theme.string('game.log')}</h3>
      <ul className="game-log-list">
        {entries.map((entry, i) => (
          <li className="game-log-entry" key={`${game.log.length - i}`}>
            <span className="game-log-turn">
              {theme.string('game.day')} {entry.turn}
            </span>
            <span className="game-log-text">
              {domainLabel(domain, `runtime.log.${entry.code}`)}
              {entry.subject !== undefined && entry.code !== 'event'
                ? ` · ${entry.subject}`
                : entry.code === 'event'
                  ? ` · ${entry.subject ?? ''}`
                  : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LeaderSelect(props: {
  domain: DomainSchema;
  onChoose: (leaderIndex: number) => void;
}) {
  const { domain, onChoose } = props;
  return (
    <div className="game-leader-select">
      <h2 className="game-leader-title">
        <IconGlyph id="mechanic.leader" />
        <span>{domainLabel(domain, 'runtime.chooseLeader')}</span>
      </h2>
      <div className="game-leader-grid">
        {domain.pools.leaders.map((leader, index) => (
          <button
            type="button"
            className="game-leader-card"
            key={leader.id}
            onClick={() => onChoose(index)}
          >
            <span className="game-leader-name">{leader.label}</span>
            <span className="game-leader-desc">{leader.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function EventModal(props: {
  popup: Popup;
  domain: DomainSchema;
  onAcknowledge: () => void;
}) {
  const theme = useTheme();
  const { popup, domain, onAcknowledge } = props;
  const image = domain.pools.eventImages.find((img) => img.id === popup.image);
  return (
    <div className="game-modal-backdrop">
      <div className="game-modal" role="dialog">
        <div className="game-modal-image">
          <IconGlyph id={image?.icon ?? 'mechanic.event'} />
          <span className="game-modal-image-label">{image?.label ?? ''}</span>
        </div>
        <h2 className="game-modal-title">{popup.title}</h2>
        <p className="game-modal-body">{popup.body}</p>
        <button type="button" className="app-action game-modal-button" onClick={onAcknowledge}>
          {popup.button.length > 0 ? popup.button : theme.string('game.continue')}
        </button>
      </div>
    </div>
  );
}

export function OutcomeBanner(props: {
  outcome: 'won' | 'lost';
  domain: DomainSchema;
  onRestart: () => void;
}) {
  const theme = useTheme();
  const { outcome, domain, onRestart } = props;
  const token = outcome === 'won' ? 'runtime.outcome.won' : 'runtime.outcome.lost';
  const desc = domain.lexicon[`${token}.desc`]?.description ?? '';
  return (
    <div className="game-modal-backdrop">
      <div className="game-modal game-outcome" data-outcome={outcome}>
        <h2 className="game-modal-title">{domainLabel(domain, token)}</h2>
        <p className="game-modal-body">{desc}</p>
        <button type="button" className="app-action game-modal-button" onClick={onRestart}>
          {theme.string('game.restart')}
        </button>
      </div>
    </div>
  );
}
