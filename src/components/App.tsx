import { useMemo, useState, type CSSProperties } from 'react';
import { ThemeProvider, useTheme } from '../theme/ThemeContext.tsx';
import type { ResolvedTheme } from '../theme/types.ts';
import type { Blueprint } from '../engine/fieldSpec.ts';
import {
  buildScenarioSchema,
  createDefaultScenario,
  exportScenario,
  importScenario,
  type FieldValue,
  type Scenario,
} from '../engine/scenario.ts';
import { ScenarioParseError } from '../engine/io.ts';
import { domainLabel, type DomainSchema } from '../domain/types.ts';
import { EditorPanel } from './EditorPanel.tsx';
import { PreviewPanel } from './PreviewPanel.tsx';
import { ValidationPanel } from './ValidationPanel.tsx';
import { IconGlyph } from './IconGlyph.tsx';

export interface AppProps {
  theme: ResolvedTheme;
  domain: DomainSchema;
  blueprint: Blueprint;
  /** Optional initial scenario (defaults are created from the blueprint). */
  initialScenario?: Scenario;
}

/**
 * Root component. Theme and domain arrive as data; nothing below this point
 * knows which theme or domain is active. Swapping either is a props change.
 */
export function App(props: AppProps) {
  return (
    <ThemeProvider theme={props.theme}>
      <AppShell {...props} />
    </ThemeProvider>
  );
}

function AppShell(props: AppProps) {
  const theme = useTheme();
  const { blueprint, domain } = props;
  const [scenario, setScenario] = useState<Scenario>(
    () => props.initialScenario ?? createDefaultScenario(blueprint, domain),
  );
  const firstEditorId = blueprint[0]?.id ?? '';
  const [activeEditorId, setActiveEditorId] = useState(firstEditorId);
  const [importIssues, setImportIssues] = useState<readonly string[]>([]);

  const schema = useMemo(
    () => buildScenarioSchema(blueprint, domain),
    [blueprint, domain],
  );
  const validation = useMemo(() => {
    const result = schema.safeParse(scenario);
    return result.success
      ? []
      : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  }, [schema, scenario]);

  const activeEditor = blueprint.find((e) => e.id === activeEditorId);

  const onFieldChange = (
    editorId: string,
    fieldId: string,
    value: FieldValue,
  ) => {
    setScenario((prev) => ({
      ...prev,
      editors: {
        ...prev.editors,
        [editorId]: { ...prev.editors[editorId], [fieldId]: value },
      },
    }));
  };

  const onExport = () => {
    const json = exportScenario(scenario, blueprint, domain);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scenario.domainId}-scenario.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      setScenario(importScenario(text, blueprint, domain));
      setImportIssues([]);
    } catch (err) {
      setImportIssues(
        err instanceof ScenarioParseError ? err.issues : [String(err)],
      );
    }
  };

  const cssVars = theme.cssVariables() as CSSProperties;

  return (
    <div className="app-root" style={cssVars} data-domain={domain.id}>
      <header className="app-header">
        <h1 className="app-title">{theme.string('app.title')}</h1>
        <p className="app-tagline">{theme.string('app.tagline')}</p>
        <div className="app-actions">
          <button type="button" className="app-action" onClick={onExport}>
            <IconGlyph id="action.export" />
            <span>{theme.string('action.export')}</span>
          </button>
          <label className="app-action">
            <IconGlyph id="action.import" />
            <span>{theme.string('action.import')}</span>
            <input
              type="file"
              accept="application/json"
              className="app-import-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
              }}
            />
          </label>
          <button
            type="button"
            className="app-action"
            onClick={() =>
              setScenario(createDefaultScenario(blueprint, domain))
            }
          >
            <IconGlyph id="action.add" />
            <span>{theme.string('action.newScenario')}</span>
          </button>
        </div>
      </header>
      <div className="app-body">
        <nav className="editor-nav">
          {(['base', 'advanced'] as const).map((category) => (
            <div className="editor-nav-group" key={category}>
              <h2 className="editor-nav-category">
                {theme.string(`nav.category.${category}`)}
              </h2>
              <ul className="editor-nav-list">
                {blueprint
                  .filter((editor) => editor.category === category)
                  .map((editor) => (
                    <li key={editor.id}>
                      <button
                        type="button"
                        className="editor-nav-item"
                        data-active={editor.id === activeEditorId}
                        onClick={() => setActiveEditorId(editor.id)}
                      >
                        <IconGlyph id={editor.icon} />
                        <span>{domainLabel(domain, editor.labelToken)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
        <main className="editor-main">
          {importIssues.length > 0 ? (
            <ValidationPanel issues={importIssues} />
          ) : null}
          {activeEditor ? (
            <EditorPanel
              editor={activeEditor}
              scenario={scenario}
              domain={domain}
              onFieldChange={onFieldChange}
            />
          ) : null}
          <ValidationPanel issues={validation} />
        </main>
        <PreviewPanel blueprint={blueprint} scenario={scenario} domain={domain} />
      </div>
    </div>
  );
}
