import { useTheme } from '../theme/ThemeContext.tsx';

interface ValidationPanelProps {
  issues: readonly string[];
}

export function ValidationPanel(props: ValidationPanelProps) {
  const theme = useTheme();
  return (
    <div className="validation-panel" data-state={props.issues.length === 0 ? 'ok' : 'error'}>
      <h3 className="validation-title">{theme.string('validation.title')}</h3>
      {props.issues.length === 0 ? (
        <p className="validation-ok">{theme.string('validation.ok')}</p>
      ) : (
        <ul className="validation-issues">
          {props.issues.map((issue, i) => (
            <li className="validation-issue" key={i}>
              {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
