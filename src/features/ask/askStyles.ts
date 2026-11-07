// Example and follow-up questions: outlined buttons styled as chips whose text wraps, at least
// 40px tall, in a darker blue than the border so the text passes 4.5:1
export const chipSx = {
  textTransform: 'none',
  textAlign: 'left',
  justifyContent: 'flex-start',
  borderRadius: 4,
  minHeight: 40,
  px: 1.75,
  py: 0.75,
  fontSize: '0.9375rem',
  fontWeight: 400,
  lineHeight: 1.35,
  color: 'primary.dark',
  borderColor: 'primary.main',
} as const;
