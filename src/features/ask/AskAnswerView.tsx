import React, { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, List, ListItemButton, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { AskAnswer, AskChart, AskSource, AskTable } from '@/services/api/endpoints/ask';
import { visuallyHidden } from '@/components/ds';
import { READING_WIDTH, type } from '@/theme/tokens';
import TrendChart, { SERIES_COLORS } from '@/features/state/components/TrendChart';
import StateTable from '@/features/state/components/StateTable';
import { keepYearsTogether } from '@/features/state/components/chartText';
import CategoryBars from './CategoryBars';
import { chartShape, formatAxis, formatCell, formatValue, slug, yearOf, yearRows } from './askFormat';
import QuestionButtons from './QuestionButtons';

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
}

/**
 * One answer: its text and follow-up questions, and the pages to check it on with its charts and
 * tables. On wide screens the text and follow-ups are on the left and the rest on the right; narrower,
 * the follow-ups come last.
 */
const CHECKED = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** The laws, studies and organizations an answer draws on, as links that open in a new tab */
const OutsideSources: React.FC<{ sources: AskSource[] }> = ({ sources }) => (
  <Box>
    <Typography component="h3" sx={{ ...type.chartTitle, m: 0 }}>Sources Outside This Site</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>The laws, studies and organizations this answer draws on, and what each one supports.</Typography>
    <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      {sources.map((source, index) => (
        <ListItemButton
          key={source.url}
          component="a"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          divider={index < sources.length - 1}
          sx={{ minHeight: 44, gap: 1, alignItems: 'flex-start' }}
        >
          <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
            <Box component="span" sx={{ display: 'block', color: 'primary.dark', textDecoration: 'underline', overflowWrap: 'anywhere' }}>
              {source.label}
            </Box>
            {(source.reasons ?? []).map(reason => (
              // Plain text only: the reasons are written by AI
              <Box key={reason} component="span" sx={{ display: 'block', typography: 'body2', color: 'text.primary', mt: 0.25 }}>{reason}</Box>
            ))}
            <Box component="span" sx={{ display: 'block', typography: 'body2', color: 'text.secondary' }}>
              {source.site}{source.as_of ? ` · checked ${CHECKED.format(new Date(`${source.as_of}T00:00:00`))}` : ''}
            </Box>
          </Box>
          <OpenInNewIcon aria-hidden fontSize="small" sx={{ mt: 0.25, color: 'action.active' }} />
          <Box component="span" sx={visuallyHidden}>(opens in a new tab)</Box>
        </ListItemButton>
      ))}
    </List>
  </Box>
);

const AskAnswerView: React.FC<AskAnswerViewProps> = ({ answer, onAsk }) => {
  const followUpsId = useId();
  // A general explanation isn't from the site's data, so it says so and its links aren't "the numbers"
  const general = answer.status === 'general';
  const sources = answer.sources ?? [];
  const hasSide = answer.references.length > 0 || sources.length > 0 || answer.charts.length > 0 || answer.tables.length > 0;
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: hasSide ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' },
        gridTemplateAreas: hasSide ? { xs: '"text" "side" "followUps"', lg: '"text side" "followUps side"' } : '"text" "followUps"',
        // The follow-ups sit right under the text, however tall the right column runs
        gridTemplateRows: { lg: 'auto 1fr' },
        columnGap: 6,
        rowGap: 4,
        alignItems: 'start',
      }}
    >
      <Box sx={{ gridArea: 'text', maxWidth: READING_WIDTH }}>
        {general && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
            <InfoOutlinedIcon aria-hidden fontSize="small" />
            <Typography variant="body2">General information, not from this site's data.</Typography>
          </Box>
        )}
        {answer.answer.map((paragraph, index) => (
          // Plain text only: the answer is written by AI, so it's never rendered as markup
          <Typography key={index} component="p" variant="body1" sx={{ mb: 2, '&:last-of-type': { mb: 0 }, ...(index === 0 && { fontSize: '1.125rem' }) }}>
            {keepYearsTogether(paragraph)}
          </Typography>
        ))}
      </Box>

      {hasSide && (
        <Box sx={{ gridArea: 'side', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          {answer.references.length > 0 && (
            <Box>
              <Typography component="h3" sx={{ ...type.chartTitle, m: 0 }}>{general ? 'Related Pages on This Site' : 'Check the Numbers on These Pages'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {general ? 'This answer was written by AI.' : 'This answer was written by AI. These pages show the numbers it used.'}
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

          {sources.length > 0 && <OutsideSources sources={sources} />}

          {answer.charts.map((chart, index) => <AnswerChart key={`chart-${index}`} chart={chart} />)}
          {answer.tables.map((table, index) => <AnswerTable key={`table-${index}`} table={table} />)}
        </Box>
      )}

      {answer.follow_ups.length > 0 && (
        <Box sx={{ gridArea: 'followUps', maxWidth: READING_WIDTH }}>
          <Typography component="h3" id={followUpsId} sx={{ ...type.chartTitle, m: 0, mb: 1 }}>You Could Also Ask</Typography>
          <QuestionButtons labelledBy={followUpsId} questions={answer.follow_ups} onAsk={onAsk} />
        </Box>
      )}
    </Box>
  );
};

export default AskAnswerView;
