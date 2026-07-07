import type { EditorSpec } from '../engine/fieldSpec.ts';
import type { FieldValue, Scenario } from '../engine/scenario.ts';
import {
  domainDescription,
  domainLabel,
  type DomainSchema,
} from '../domain/types.ts';
import { FieldInput } from './FieldInput.tsx';
import { IconGlyph } from './IconGlyph.tsx';

interface EditorPanelProps {
  editor: EditorSpec;
  scenario: Scenario;
  domain: DomainSchema;
  onFieldChange: (editorId: string, fieldId: string, value: FieldValue) => void;
}

/** Renders any editor from its blueprint spec. One component for all 11 editors. */
export function EditorPanel(props: EditorPanelProps) {
  const { editor, scenario, domain, onFieldChange } = props;
  const values = scenario.editors[editor.id] ?? {};
  const description =
    editor.descriptionToken !== undefined
      ? domainDescription(domain, editor.descriptionToken)
      : undefined;

  return (
    <section className="editor-panel" data-editor={editor.id}>
      <header className="editor-panel-header">
        <IconGlyph id={editor.icon} className="editor-panel-icon" />
        <h2 className="editor-panel-title">
          {domainLabel(domain, editor.labelToken)}
        </h2>
      </header>
      {description !== undefined ? (
        <p className="editor-panel-description">{description}</p>
      ) : null}
      <div className="editor-panel-fields">
        {editor.fields.map((field) => (
          <div className="editor-field" key={field.id} data-field={field.id}>
            <label className="editor-field-label">
              {domainLabel(domain, field.labelToken)}
            </label>
            {field.helpToken !== undefined ? (
              <p className="editor-field-help">
                {domainLabel(domain, field.helpToken)}
              </p>
            ) : null}
            <FieldInput
              field={field}
              value={values[field.id] as FieldValue}
              domain={domain}
              onChange={(value) => onFieldChange(editor.id, field.id, value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
