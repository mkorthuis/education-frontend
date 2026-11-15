import React, { useState } from 'react';
import { Box, Button, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { visuallyHidden } from '@/components/ds';
import { AID_COLORS, AidBar, PROSE_WIDTH } from '../../utils/stateAid';

// A calculation step by step, as the State Aid tab shows each kind of aid: each line's figure, a caption
// with its arithmetic ("926.66 × $4,351"), and a bar on one scale, so the lines read as a waterfall down
// the table. A line with details opens to them: its explanation, and for the adequacy aid, its formula.

export interface CalcRow {
  key: string;
  name: string;
  /** Under the name, e.g. the line's arithmetic */
  caption?: string;
  /** The figure as shown, e.g. "−$3,795,601" */
  value: string;
  /** Subtotals and results are bold under a rule; figures used along the way are grey */
  emphasis?: 'subtotal' | 'muted';
  /** Lines that make up the next subtotal are indented */
  indent?: boolean;
  /** "+" for a line that goes on, "−" for one that comes off */
  sign?: '+' | '−';
  bar?: AidBar | null;
  /** The bar's color; grey by default */
  color?: string;
  /** Shown when the line is opened; a line without them doesn't open */
  details?: React.ReactNode;
}

/** A step's bar within the scale shared by the table's lines; a line at zero when the scale goes below it */
const WaterfallBar: React.FC<{ bar: AidBar; low: number; high: number; color: string }> = ({ bar, low, high, color }) => {
  const span = high - low || 1;
  const left = ((Math.min(bar.from, bar.to) - low) / span) * 100;
  const width = (Math.abs(bar.to - bar.from) / span) * 100;
  return (
    <Box aria-hidden sx={{ position: 'relative', height: 14 }}>
      {low < 0 && <Box sx={{ position: 'absolute', left: `${(-low / span) * 100}%`, top: -6, bottom: -6, borderLeft: '1px solid', borderColor: 'divider' }} />}
      {width > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: `${left}%`,
            width: `${width}%`,
            minWidth: 2,
            top: 0,
            bottom: 0,
            borderRadius: '2px',
            backgroundColor: color,
            opacity: bar.kind === 'total' ? 1 : 0.75,
          }}
        />
      )}
    </Box>
  );
};

interface CalculationTableProps {
  rows: CalcRow[];
  /** Names the table for screen readers, e.g. "Conway's adequacy aid calculation, 2024-25" */
  label: string;
  /** Leave out the bars' column, for a list of figures that don't build on each other */
  bars?: boolean;
  /** The first column's heading */
  heading?: string;
}

const CalculationTable: React.FC<CalculationTableProps> = ({ rows, label, bars = true, heading = 'Step' }) => {
  const [open, setOpen] = useState<Set<string>>(new Set());
  // Without a line that opens, no room for the arrows: the lines' words start under the heading's
  const anyOpens = rows.some(row => Boolean(row.details));
  const ends = rows.flatMap(row => (row.bar ? [row.bar.from, row.bar.to] : []));
  const low = Math.min(0, ...ends);
  const high = Math.max(0, ...ends);

  const toggle = (key: string) => setOpen(previous => {
    const next = new Set(previous);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  return (
    <Table size="small" aria-label={label} sx={{ tableLayout: 'fixed', fontVariantNumeric: 'tabular-nums' }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: bars ? { xs: '62%', md: '46%' } : { xs: '62%', md: '75%' } }}>{heading}</TableCell>
          <TableCell align="right" sx={{ width: bars ? { xs: '38%', md: '20%' } : { xs: '38%', md: '25%' } }}>Amount</TableCell>
          {bars && <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><Box component="span" sx={visuallyHidden}>Chart</Box></TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => {
          const expanded = open.has(row.key);
          const opens = Boolean(row.details);
          const subtotal = row.emphasis === 'subtotal';
          const muted = row.emphasis === 'muted';
          const rule = subtotal ? { borderTop: '2px solid', borderTopColor: 'divider' } : {};
          return (
            <React.Fragment key={row.key}>
              <TableRow
                hover={opens}
                onClick={opens ? () => toggle(row.key) : undefined}
                sx={{ cursor: opens ? 'pointer' : 'default', '& > td': { borderBottom: expanded ? 'none' : undefined, ...rule } }}
              >
                <TableCell sx={{ pl: anyOpens ? 0.5 : 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, pl: row.indent ? { xs: anyOpens ? 1 : 0, sm: 2 } : 0 }}>
                    {opens ? (
                      <IconButton
                        size="small"
                        aria-label={`${expanded ? 'Hide' : 'Show'} how ${row.name} is figured`}
                        aria-expanded={expanded}
                        onClick={event => { event.stopPropagation(); toggle(row.key); }}
                        sx={{ p: 0.25, mt: '-1px' }}
                      >
                        {expanded ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                      </IconButton>
                    ) : anyOpens ? (
                      // Lined up with the lines that open
                      <Box aria-hidden sx={{ width: 24, flexShrink: 0 }} />
                    ) : null}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: subtotal ? 600 : 400, color: muted ? 'text.secondary' : 'text.primary' }}>
                        {row.sign && <Box component="span" aria-hidden sx={{ display: 'inline-block', width: '1em' }}>{row.sign}</Box>}
                        {row.name}
                      </Typography>
                      {row.caption && <Typography variant="caption" component="p" color="text.secondary">{row.caption}</Typography>}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: subtotal ? 600 : 400, color: muted ? 'text.secondary' : 'text.primary', whiteSpace: 'nowrap' }}>
                  {row.value}
                </TableCell>
                {bars && (
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, verticalAlign: 'middle' }}>
                    {row.bar && <WaterfallBar bar={row.bar} low={low} high={high} color={row.color ?? AID_COLORS.other} />}
                  </TableCell>
                )}
              </TableRow>
              {expanded && (
                <TableRow>
                  <TableCell colSpan={bars ? 3 : 2} sx={{ pt: 0, pb: 1.5, pl: { xs: 4, sm: 5 }, ...(subtotal && { borderTop: 'none' }) }}>
                    {row.details}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
};

/** A line's details: its explanation, then any grey lines (a formula, the figures in it) */
export const LineDetails: React.FC<{ explanation: string; children?: React.ReactNode }> = ({ explanation, children }) => (
  <>
    <Typography variant="body2" sx={PROSE_WIDTH}>{explanation}</Typography>
    {children}
  </>
);

/** The full calculation, folded away under the explanation for anyone checking the math */
export const StepsFold: React.FC<{ label?: string; children: React.ReactNode }> = ({ label = 'Show Every Step the DOE Uses', children }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ mt: 1.5 }}>
      <Button
        size="small"
        onClick={() => setOpen(shown => !shown)}
        aria-expanded={open}
        startIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{ px: 0.5, textTransform: 'none' }}
      >
        {open ? 'Hide the Steps' : label}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

export default CalculationTable;
