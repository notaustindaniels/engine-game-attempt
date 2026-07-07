import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { GameApp } from './runtime/components/GameApp.tsx';
import { getTheme } from './theme/registry.ts';
import { getDomain, listDomainIds } from './domain/registry.ts';
import { blueprint } from './engine/blueprint.ts';
import {
  createDefaultScenario,
  importScenario,
  type Scenario,
} from './engine/scenario.ts';
import type { DomainSchema } from './domain/types.ts';

/**
 * Play entry point. The scenario comes from (in priority order): the
 * editor's Playtest hand-off in localStorage, or a fresh default scenario
 * for ?domain=<id>. The header's load control accepts any exported
 * scenario JSON and switches to its domain.
 */

const PLAYTEST_KEY = 'scenario-playtest';

interface Loaded {
  domain: DomainSchema;
  scenario: Scenario;
}

function fromJson(text: string): Loaded {
  const raw = JSON.parse(text) as { domainId?: string };
  if (typeof raw.domainId !== 'string') {
    throw new Error('Scenario file has no domainId');
  }
  const domain = getDomain(raw.domainId);
  return { domain, scenario: importScenario(text, blueprint, domain) };
}

function initialLoad(): Loaded {
  const stashed = window.localStorage.getItem(PLAYTEST_KEY);
  if (stashed !== null) {
    try {
      return fromJson(stashed);
    } catch {
      window.localStorage.removeItem(PLAYTEST_KEY);
    }
  }
  const params = new URLSearchParams(window.location.search);
  const domainId = params.get('domain') ?? listDomainIds()[0] ?? 'after-inc';
  const domain = getDomain(domainId);
  return { domain, scenario: createDefaultScenario(blueprint, domain) };
}

function PlayShell() {
  const params = new URLSearchParams(window.location.search);
  const themeId = params.get('theme') ?? 'after-inc';
  const [loaded, setLoaded] = useState<Loaded>(() => initialLoad());
  const [generation, setGeneration] = useState(0);

  const onLoadScenario = (file: File): void => {
    void file.text().then((text) => {
      setLoaded(fromJson(text));
      setGeneration((g) => g + 1);
    });
  };

  return (
    <GameApp
      key={generation}
      theme={getTheme(themeId)}
      domain={loaded.domain}
      scenario={loaded.scenario}
      onLoadScenario={onLoadScenario}
    />
  );
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element');
}

createRoot(container).render(
  <StrictMode>
    <PlayShell />
  </StrictMode>,
);
