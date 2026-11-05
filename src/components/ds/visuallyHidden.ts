// Hidden on screen, read by screen readers. Strings, not numbers: in sx, width: 1 would mean
// 100% and m: -1 would mean -8px.
export const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;
