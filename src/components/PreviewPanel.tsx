import { useTheme } from '../theme/ThemeContext.tsx';
import type { Blueprint, FieldSpec } from '../engine/fieldSpec.ts';
import type {
  FieldValue,
  ResourceOp,
  Scenario,
  ScalarValue,
} from '../engine/scenario.ts';
import {
  domainLabel,
  poolItems,
  type DomainSchema,
} from '../domain/types.ts';
import { IconGlyph } from './IconGlyph.tsx';

interface PreviewPanelProps {
  blueprint: Blueprint;
  scenario: Scenario;
  domain: DomainSchema;
}

function scalarDisplay(
  field: FieldSpec,
  value: ScalarValue,
  domain: DomainSchema,
): string {
  if (field.kind === 'select') {
    if (field.options.from === 'domain') {
      const item = poolItems(domain, field.options.pool).find(
        (i) => i.id === value,
      );
      if (item) return item.label;
    } else {
      const opt = field.options.options.find((o) => o.value === value);
      if (opt) return domainLabel(domain, opt.labelToken);
    }
  }
  return String(value);
}

function summarize(
  field: FieldSpec,
  value: FieldValue,
  domain: DomainSchema,
  unset: string,
): string {
  if (field.kind === 'list') {
    const rows = value as Record<string, ScalarValue>[];
    return String(rows.length);
  }
  if (field.kind === 'resourceOps') {
    const table = value as Record<string, { op: ResourceOp; amount: number }>;
    const touched = poolItems(domain, 'resources').filter((r) => {
      const row = table[r.id];
      return row !== undefined && (row.op === 'SET' || row.amount !== 0);
    });
    if (touched.length === 0) return unset;
    return touched
      .map((r) => {
        const row = table[r.id];
        if (row === undefined) return r.label;
        return `${r.label} ${row.op === 'SET' ? '=' : '+'}${row.amount}`;
      })
      .join(', ');
  }
  const text = scalarDisplay(field, value as ScalarValue, domain);
  return text === '' ? unset : text;
}

/** Live summary of the scenario as edited, in the active domain's language. */
export function PreviewPanel(props: PreviewPanelProps) {
  const theme = useTheme();
  const { blueprint, scenario, domain } = props;
  const unset = theme.string('field.unset');

  return (
    <aside className="preview-panel">
      <header className="preview-panel-header">
        <IconGlyph id="panel.preview" />
        <h2 className="preview-panel-title">{theme.string('preview.title')}</h2>
      </header>
      {blueprint.map((editor) => (
        <div className="preview-editor" key={editor.id} data-editor={editor.id}>
          <h3 className="preview-editor-title">
            {domainLabel(domain, editor.labelToken)}
          </h3>
          <dl className="preview-fields">
            {editor.fields.map((field) => (
              <div className="preview-field" key={field.id}>
                <dt className="preview-field-label">
                  {domainLabel(domain, field.labelToken)}
                </dt>
                <dd className="preview-field-value">
                  {summarize(
                    field,
                    scenario.editors[editor.id]?.[field.id] as FieldValue,
                    domain,
                    unset,
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </aside>
  );
}
