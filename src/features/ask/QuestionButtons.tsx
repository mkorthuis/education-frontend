import React from 'react';
import { Box, Button } from '@mui/material';
import { color, radius } from '@/theme/tokens';

// Questions to ask in one tap: the examples on the home and Ask pages and an answer's follow-ups.
// They look like the site's navigation cards (NavCard): the light grey fill, thin border and 8px
// corners, dark text in sentence case at body letter-spacing, the cards' darker grey on hover, and
// full width so a list of them lines up.
const questionSx = {
  justifyContent: 'flex-start',
  textAlign: 'left',
  textTransform: 'none',
  letterSpacing: '0.00938em',
  fontSize: { xs: '0.9375rem', sm: '1rem' },
  fontWeight: 500,
  lineHeight: 1.4,
  color: 'text.primary',
  backgroundColor: color.surfaceSubtle,
  borderColor: 'divider',
  borderRadius: radius.card,
  minHeight: 44,
  px: { xs: 1.5, sm: 2 },
  py: 1,
  transition: 'background-color 120ms',
  '&:hover': { backgroundColor: color.surfaceSubtleHover, borderColor: 'divider' },
} as const;

interface QuestionButtonsProps {
  questions: string[];
  onAsk: (question: string) => void;
  /** How many across on wide screens (two from tablets up when more than one), or one above another */
  columns?: 1 | 2 | 3;
  /** The id of the heading that names the list, or a label when there's no heading */
  labelledBy?: string;
  label?: string;
}

const QuestionButtons: React.FC<QuestionButtonsProps> = ({ questions, onAsk, columns = 1, labelledBy, label }) => (
  <Box
    component="ul"
    aria-labelledby={labelledBy}
    aria-label={labelledBy ? undefined : label}
    sx={{
      listStyle: 'none', p: 0, m: 0, display: 'grid', gap: 1,
      gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        sm: columns > 1 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
        lg: `repeat(${columns}, minmax(0, 1fr))`,
      },
    }}
  >
    {questions.map(question => (
      // A row's buttons share its height
      <Box component="li" key={question} sx={{ display: 'flex' }}>
        <Button variant="outlined" color="inherit" fullWidth onClick={() => onAsk(question)} sx={questionSx}>{question}</Button>
      </Box>
    ))}
  </Box>
);

export default QuestionButtons;
