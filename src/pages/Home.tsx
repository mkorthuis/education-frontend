import React, { useEffect, useRef } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Box, GlobalStyles, Link, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NavCard, NavCardGrid, SectionHeading, visuallyHidden } from '@/components/ds';
import { PAGE_REGISTRY } from '@/routes/pageRegistry';
import { PAGE_WIDTH, radius, type } from '@/theme/tokens';
import PlaceSearch from '@/features/search/PlaceSearch';
import { LOOK_UP_HASH } from '@/features/search/placeOptions';
import AskForm from '@/features/ask/AskForm';
import { AI_NOTE, EXAMPLE_QUESTIONS } from '@/features/ask/askCopy';
import { ASK_PATH, askState } from '@/features/ask/askRoute';
import QuestionButtons from '@/features/ask/QuestionButtons';
import { STATE_PAGE_DESCRIPTIONS } from '@/features/state/utils/labels';
import { useAppDispatch } from '@/store/hooks';
import { clearTurns } from '@/store/slices/askSlice';

// The home page offers two ways in, side by side on wide screens and stacked on phones: look up a
// place and browse its pages, or ask a question, which opens the Ask page. Below them, the
// statewide pages.

const HOME_EXAMPLES = 3;
// The lists to browse when the visitor doesn't have a name in mind
const BROWSE = [
  { to: '/districts', title: 'All Districts', description: 'Every public school district, A to Z' },
  { to: '/schools', title: 'All Schools', description: 'Every public school, A to Z' },
  { to: '/state', title: 'Statewide Data', description: 'Totals and trends for all of New Hampshire' },
];

interface WayInProps {
  id: string;
  title: string;
  intro: string;
  /** The search box or question box */
  field: React.ReactNode;
  children: React.ReactNode;
}

/**
 * One way in: a bordered panel with a heading, a line on what it does, its box, and the rest. Side by
 * side, the two panels share the heading's row (CSS subgrid), so their boxes start level however long
 * the lines above them run.
 */
const WayIn: React.FC<WayInProps> = ({ id, title, intro, field, children }) => (
  <Box
    component="section"
    aria-labelledby={id}
    sx={{
      border: '1px solid', borderColor: 'divider', borderRadius: radius.card, p: { xs: 2, sm: 3 },
      display: 'grid', alignContent: 'start', rowGap: 2,
      gridRow: { md: 'span 2' }, gridTemplateRows: { md: 'subgrid' },
    }}
  >
    <Box>
      <Typography id={id} component="h2" sx={{ ...type.sectionTitle, m: 0 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{intro}</Typography>
    </Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {field}
      {children}
    </Box>
  </Box>
);

export default function Home() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // A question from here starts a new discussion: the earlier questions are cleared, not continued
  const askFresh = (question: string) => {
    dispatch(clearTurns());
    navigate(ASK_PATH, askState(question));
  };
  const location = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const statePages = Object.values(PAGE_REGISTRY.state);

  useEffect(() => {
    if (location.hash === LOOK_UP_HASH) searchRef.current?.focus();
  }, [location.hash]);

  return (
    // On phones the layout's own top padding is enough
    <Box sx={{ width: '100%', maxWidth: PAGE_WIDTH, pt: { xs: 0, sm: 3 }, pb: 3 }}>
      {/* Keep focused and scrolled-to items clear of the fixed header */}
      <GlobalStyles styles={{ html: { scrollPaddingTop: 72 } }} />
      <Box sx={{ mb: 3 }}>
        {/* Phones skip the title (screen readers still get it) and start with the line under it */}
        <Typography component="h1" sx={theme => ({ ...type.pageTitle, mb: 1, [theme.breakpoints.down('sm')]: visuallyHidden })}>
          New Hampshire Education Data Made Accessible
        </Typography>
        <Typography variant="body1">
          Access to all available data on New Hampshire's public school districts and schools, from the state's own reports.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, columnGap: 3, rowGap: 2, mb: 5 }}>
        <WayIn
          id="look-up-heading"
          title="Look Up a District or School"
          intro="See enrollment, test scores, graduation, spending, teachers and safety for any public school district or school."
          field={<PlaceSearch id="place-search" inputRef={searchRef} />}
        >
          {/* On phones the links sit closer to the search box than the panel's usual spacing */}
          <Box sx={{ mt: { xs: -1, sm: 0 } }}>
            {/* Phones show the links alone; the label still names them for screen readers */}
            <Typography id="browse-heading" variant="body2" color="text.secondary" sx={{ mb: 1, display: { xs: 'none', sm: 'block' } }}>Or browse:</Typography>
            {/* Phones: the three as plain links spread across the panel */}
            <Box component="ul" aria-labelledby="browse-heading" sx={{ display: { xs: 'flex', sm: 'none' }, flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 0.5, rowGap: 0.5, listStyle: 'none', p: 0, px: 0.75, m: 0, '@media (max-width: 340px)': { px: 0 } }}>
              {BROWSE.map(item => (
                <Box component="li" key={item.to}>
                  <Link component={RouterLink} to={item.to} variant="body2" sx={{ display: 'inline-block', py: 0.25 }}>{item.title}</Link>
                </Box>
              ))}
            </Box>
            {/* Wider screens: a row for each, with what it lists */}
            <List aria-labelledby="browse-heading" disablePadding sx={{ display: { xs: 'none', sm: 'block' }, border: 1, borderColor: 'divider', borderRadius: radius.card, overflow: 'hidden' }}>
              {BROWSE.map((item, index) => (
                <ListItemButton key={item.to} component={RouterLink} to={item.to} divider={index < BROWSE.length - 1} sx={{ minHeight: 44, gap: 1 }}>
                  <ListItemText
                    primary={item.title}
                    secondary={item.description}
                    primaryTypographyProps={{ sx: { color: 'primary.dark', fontWeight: 500 } }}
                  />
                  <ChevronRightIcon aria-hidden fontSize="small" color="action" />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </WayIn>

        <WayIn
          id="ask-heading"
          title="Or Try Asking a Question"
          intro="In your own words. Answers come from this site with charts and links to source data."
          field={<AskForm id="home-question" label="Your question" onAsk={askFresh} fieldRef={questionRef} hint={false} />}
        >
          <QuestionButtons label="Example questions" questions={EXAMPLE_QUESTIONS.slice(0, HOME_EXAMPLES)} onAsk={askFresh} />
          <Typography variant="body2" color="text.secondary">{AI_NOTE}</Typography>
        </WayIn>
      </Box>

      <SectionHeading>Explore Statewide Data</SectionHeading>
      <NavCardGrid label="Statewide data">
        {statePages.map(page => (
          <NavCard
            key={page.id}
            title={page.id === PAGE_REGISTRY.state.overview.id ? 'Statewide Overview' : page.displayName}
            description={STATE_PAGE_DESCRIPTIONS[page.id.split('.')[1]]}
            to={page.urlPatterns[0]}
          />
        ))}
      </NavCardGrid>
    </Box>
  );
}
