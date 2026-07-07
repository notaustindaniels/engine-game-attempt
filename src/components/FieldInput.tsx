import { useTheme } from '../theme/ThemeContext.tsx';
import type {
  FieldSpec,
  ScalarFieldSpec,
  SelectFieldSpec,
} from '../engine/fieldSpec.ts';
import type { FieldValue, ResourceOp, ScalarValue } from '../engine/scenario.ts';
import type { AreaCell } from '../engine/areaMap.ts';
import {
  domainLabel,
  poolItems,
  type DomainSchema,
} from '../domain/types.ts';
import { IconGlyph } from './IconGlyph.tsx';
import { AreaMapInput } from './AreaMapInput.tsx';

interface FieldInputProps {
  field: FieldSpec;
  value: FieldValue;
  domain: DomainSchema;
  onChange: (value: FieldValue) => void;
}

function selectOptionEntries(
  field: SelectFieldSpec,
  domain: DomainSchema,
): { value: string; label: string }[] {
  if (field.options.from === 'static') {
    return field.options.options.map((o) => ({
      value: o.value,
      label: domainLabel(domain, o.labelToken),
    }));
  }
  return poolItems(domain, field.options.pool).map((item) => ({
    value: item.id,
    label: item.label,
  }));
}

function ScalarInput(props: {
  field: ScalarFieldSpec;
  value: ScalarValue;
  domain: DomainSchema;
  onChange: (value: ScalarValue) => void;
}) {
  const { field, value, domain, onChange } = props;
  switch (field.kind) {
    case 'text':
      return (
        <input
          className="field-input field-text"
          type="text"
          maxLength={field.maxLength}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'longtext':
      return (
        <textarea
          className="field-input field-longtext"
          maxLength={field.maxLength}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <input
          className="field-input field-number"
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? (field.integer ? 1 : 'any')}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );
    case 'slider':
      return (
        <span className="field-slider-wrap">
          <input
            className="field-input field-slider"
            type="range"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <output className="field-slider-value">{String(value)}</output>
        </span>
      );
    case 'select':
      return (
        <select
          className="field-input field-select"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {selectOptionEntries(field, domain).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case 'toggle':
      return (
        <input
          className="field-input field-toggle"
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
  }
}

export function FieldInput(props: FieldInputProps) {
  const theme = useTheme();
  const { field, value, domain, onChange } = props;

  if (field.kind === 'list') {
    const rows = value as Record<string, ScalarValue>[];
    return (
      <div className="field-list">
        {rows.map((row, index) => (
          <div className="field-list-row" key={index}>
            {field.item.map((itemField) => (
              <label className="field-list-cell" key={itemField.id}>
                <span className="field-list-cell-label">
                  {domainLabel(domain, itemField.labelToken)}
                </span>
                <ScalarInput
                  field={itemField}
                  value={row[itemField.id] as ScalarValue}
                  domain={domain}
                  onChange={(next) => {
                    const nextRows = rows.map((r, i) =>
                      i === index ? { ...r, [itemField.id]: next } : r,
                    );
                    onChange(nextRows);
                  }}
                />
              </label>
            ))}
            <button
              type="button"
              className="field-list-remove"
              disabled={rows.length <= field.minItems}
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
            >
              <IconGlyph id="action.remove" />
              <span>{theme.string('action.remove')}</span>
            </button>
          </div>
        ))}
        <button
          type="button"
          className="field-list-add"
          disabled={rows.length >= field.maxItems}
          onClick={() => {
            const fresh: Record<string, ScalarValue> = {};
            for (const itemField of field.item) {
              fresh[itemField.id] =
                itemField.kind === 'select'
                  ? (selectOptionEntries(itemField, domain)[0]?.value ?? '')
                  : itemField.kind === 'toggle'
                    ? itemField.defaultValue
                    : itemField.defaultValue;
            }
            onChange([...rows, fresh]);
          }}
        >
          <IconGlyph id="action.add" />
          <span>{theme.string('action.add')}</span>
        </button>
      </div>
    );
  }

  if (field.kind === 'areaMap') {
    return (
      <AreaMapInput
        field={field}
        value={value as AreaCell[]}
        domain={domain}
        onChange={onChange}
      />
    );
  }

  if (field.kind === 'resourceOps') {
    const table = value as Record<string, { op: ResourceOp; amount: number }>;
    return (
      <div className="field-resource-ops">
        {poolItems(domain, 'resources').map((resource) => {
          const row = table[resource.id] ?? { op: 'ADD' as ResourceOp, amount: 0 };
          const update = (next: { op: ResourceOp; amount: number }) =>
            onChange({ ...table, [resource.id]: next });
          return (
            <div className="resource-op-row" key={resource.id}>
              <span className="resource-op-name">
                <IconGlyph id={resource.icon ?? 'mechanic.resource'} />
                <span>{resource.label}</span>
              </span>
              <select
                className="field-input resource-op-mode"
                value={row.op}
                onChange={(e) =>
                  update({ ...row, op: e.target.value as ResourceOp })
                }
              >
                <option value="ADD">{theme.string('resourceOp.ADD')}</option>
                <option value="SET">{theme.string('resourceOp.SET')}</option>
              </select>
              <input
                className="field-input resource-op-amount"
                type="number"
                min={field.min}
                max={field.max}
                value={row.amount}
                onChange={(e) => update({ ...row, amount: Number(e.target.value) })}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ScalarInput
      field={field}
      value={value as ScalarValue}
      domain={domain}
      onChange={onChange}
    />
  );
}
