import { useTheme } from '../theme/ThemeContext.tsx';

/** Renders a themed icon by stable id. Artwork comes from the active theme only. */
export function IconGlyph(props: { id: string; className?: string }) {
  const theme = useTheme();
  return (
    <span
      className={`icon-glyph ${props.className ?? ''}`.trim()}
      dangerouslySetInnerHTML={{ __html: theme.iconSvg(props.id) }}
    />
  );
}
