import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, List, ListItemButton, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { AskAnswer, AskChart, AskTable } from '@/services/api/endpoints/ask';
import { type } from '@/theme/tokens';
import TrendChart, { SERIES_COLORS } from '@/features/state/components/TrendChart';
import StateTable from '@/features/state/components/StateTable';
import { keepYearsTogether, READING_WIDTH } from '@/features/state/components/chartText';
import CategoryBars from './CategoryBars';
import { chartShape, formatAxis, formatCell, formatValue, slug, yearOf, yearRows } from './askFormat';
import { chipSx } from './askStyles';

// Charts and tables in an answer come from the database, so they say so
const DATA_NOTE = "From this site's data.";
const TABLE_PREVIEW_ROWS = 10;

const AnswerChart: React.FC<{ chart: AskChart }> = ({ chart }) => {
  if (chartShape(chart) === 'categories') return <CategoryBars chart={chart} note={DATA_NOTE} />;
  const labels = new Map(chart.points.map(point => [yearOf(point.label) as number, point.label]));
  const classes = chart.points.every(point => /^Class of/i.test(point.label));
  const compact = chart.unit === 'dollars' && chart.points.some(point => point.values.some(value => value !== null && Math.abs(value) >= 1e6));
  return (
    <TrendChart
      title={chart.title}
      titleComponent="h3"
      data={yearRows(chart)}
      series={chart.series.map((name, index) => ({ key: `s${index}`, name, color: SERIES_COLORS[index % SERIES_COLORS.length] }))}
      format={value => formatValue(chart.unit, value, compact)}
      axisFormat={value => formatAxis(chart.unit, value)}
      // A line over years starts near the data; a "bar" over years keeps its zero
      axis={chart.kind === 'bar' ? 'zero' : 'fit'}
      yearLabel={year => (classes ? String(year) : labels.get(year) ?? String(year))}
      yearHeader={classes ? 'Class of' : chart.x_label}
      csvName={`${slug(chart.title)}.csv`}
      note={DATA_NOTE}
    />
  );
};

const AnswerTable: React.FC<{ table: AskTable }> = ({ table }) => {
  const [showAll, setShowAll] = useState(false);
  const rows = table.rows.map(row => Object.fromEntries(row.map((value, index) => [`c${index}`, value])));
  const long = rows.length > TABLE_PREVIEW_ROWS;
  return (
    <Box>
      <StateTable
        title={table.title}
        titleComponent="h3"
        columns={table.columns.map((label, index) => ({
          key: `c${index}`,
          label,
          align: index === 0 ? 'left' as const : 'right' as const,
          format: (row: Record<string, string | number | null>) => (index === 0 ? String(row[`c${index}`] ?? '') : formatCell(table.units?.[index] ?? table.unit, row[`c${index}`])),
        }))}
        rows={long && !showAll ? rows.slice(0, TABLE_PREVIEW_ROWS) : rows}
        csvName={`${slug(table.title)}.csv`}
        note={DATA_NOTE}
      />
      {long && (
        <Button onClick={() => setShowAll(open => !open)} sx={{ textTransform: 'none', mt: 1, minHeight: 40 }}>
          {showAll ? 'Show Fewer Rows' : `Show All ${rows.length} Rows`}
        </Button>
      )}
    </Box>
  );
};

interface AskAnswerViewProps {
  answer: AskAnswer;
  onAsk: (question: string) => void;
  onAskAnother: () => void;
}

/** One answer: its text, the pages to check it on, its charts and tables, and follow-up questions. */
const AskAnswerView: React.FC<AskAnswerViewProps> = ({ answer, onAsk, onAskAnother }) => (
  <>
    <Box sx={{ maxWidth: READING_WIDTH }}>
      {answer.answer.map((paragraph, index) => (
        // Plain text only: the answer is written by AI, so it's never rendered as markup
        <Typography key={index} component="p" variant="body1" sx={{ mb: 2, ...(index === 0 && { fontSize: '1.125rem' }) }}>
          {keepYearsTogether(paragraph)}
        </Typography>
      ))}
    </Box>

    {answer.references.length > 0 && (
      <Box sx={{ mt: 4 }}>
        <Typography component="h3" sx={{ ...type.chartTitle, m: 0 }}>Check the Numbers on These Pages</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          This answer was written by AI. These pages show the numbers it used.
        </Typography>
        <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {answer.references.map((reference, index) => (
            <ListItemButton
              key={reference.path}
              component={RouterLink}
              to={reference.path}
              divider={index < answer.references.length - 1}
              sx={{ minHeight: 44, gap: 1, color: 'primary.dark', textDecoration: 'underline' }}
            >
              <Box component="span" sx={{ flex: 1 }}>{reference.label}</Box>
              <ChevronRightIcon aria-hidden fontSize="small" />
            </ListItemButton>
          ))}
        </List>
      </Box>
    )}

    {answer.charts.map((chart, index) => (
      <Box key={`chart-${index}`} sx={{ mt: 4 }}><AnswerChart chart={chart} /></Box>
    ))}
    {answer.tables.map((table, index) => (
      <Box key={`table-${index}`} sx={{ mt: 4 }}><AnswerTable table={table} /></Box>
    ))}

    {answer.follow_ups.length > 0 && (
      <Box sx={{ mt: 4 }}>
        <Typography component="h3" id="ask-follow-ups" sx={{ ...type.chartTitle, m: 0, mb: 1 }}>You Could Also Ask</Typography>
        <Box component="ul" aria-labelledby="ask-follow-ups" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 }}>
          {answer.follow_ups.map(question => (
            <Box component="li" key={question}>
              <Button variant="outlined" onClick={() => onAsk(question)} sx={chipSx}>{question}</Button>
            </Box>
          ))}
        </Box>
      </Box>
    )}

    <Button variant="outlined" startIcon={<ArrowUpwardIcon />} onClick={onAskAnother} sx={{ mt: 4, textTransform: 'none', minHeight: 44, width: { xs: '100%', sm: 'auto' } }}>
      Ask Another Question
    </Button>
  </>
);

export default AskAnswerView;
