import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './components/App.tsx';
import { getTheme } from './theme/registry.ts';
import { getDomain, listDomainIds } from './domain/registry.ts';
import { blueprint } from './engine/blueprint.ts';

const params = new URLSearchParams(window.location.search);
const themeId = params.get('theme') ?? 'after-inc';
const domainId = params.get('domain') ?? listDomainIds()[0] ?? 'after-inc';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element');
}

createRoot(container).render(
  <StrictMode>
    <App
      theme={getTheme(themeId)}
      domain={getDomain(domainId)}
      blueprint={blueprint}
    />
  </StrictMode>,
);
