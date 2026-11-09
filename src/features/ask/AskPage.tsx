import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from 'react-redux';
import { Alert, Box, Button, CircularProgress, Divider, GlobalStyles, Link, Skeleton, Typography, useMediaQuery } from '@mui/material';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import { visuallyHidden } from '@/components/ds';
import { PAGE_WIDTH, type } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import { askQuestion, AskTurn, clearTurns, contextFrom, removeTurn, selectAsk, setDraft } from '@/store/slices/askSlice';
import { ASK_MAX_LENGTH, AskEarlierTurn } from '@/services/api/endpoints/ask';
import { LOOK_UP_HASH } from '@/features/search/placeOptions';
import AskAnswerView, { AnswerInProgress } from './AskAnswerView';
import AskForm from './AskForm';
import { AI_NOTE, DECLINED_MESSAGE, MORE_TIME_LOADING_TEXT, ERRORS, EXAMPLE_QUESTIONS, LOADING_TEXT, readyMessage } from './askCopy';
import { ASK_PATH, askState, contextIn, deepIn, questionIn } from './askRoute';
import MoreTimeToggle from './MoreTimeToggle';
import QuestionButtons from './QuestionButtons';

// The Ask page: the visitor's questions and their answers, oldest first, with the question field
// under the latest. Each question is its own history entry (see askState), so Back and Forward step
// through them, and a reload asks the latest again.

const STILL_WORKING_MS = 15000;

/** Whether a question on the page is this one: the same words after the same earlier questions, asked the same way */
const isAsked = (turn: AskTurn, question: string, context: AskEarlierTurn[], deep: boolean) =>
  turn.question === question && turn.deep === deep && turn.context.length === context.length && turn.context.every((earlier, index) => earlier.question === context[index].question);

/** The spinner and "still working" note while a question is being answered */
const Working: React.FC<{ deep: boolean; onCancel: () => void; onStillWorking: () => void }> = ({ deep, onCancel, onStillWorking }) => {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [stillWorking, setStillWorking] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { setStillWorking(true); onStillWorking(); }, STILL_WORKING_MS);
    return () => window.clearTimeout(timer);
    // Once, when the question is asked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        {reduceMotion ? <HourglassEmptyOutlinedIcon aria-hidden fontSize="small" color="action" /> : <CircularProgress size={20} aria-hidden />}
        <Typography variant="body1">{stillWorking ? 'Still working. Thanks for waiting.' : deep ? MORE_TIME_LOADING_TEXT : LOADING_TEXT}</Typography>
      </Box>
      <Box aria-hidden>
        {['100%', '92%', '60%'].map(width => <Skeleton key={width} variant="text" width={width} animation={reduceMotion ? false : 'pulse'} />)}
      </Box>
      <Button onClick={onCancel} sx={{ mt: 1, textTransform: 'none' }}>Cancel</Button>
    </Box>
  );
};

const AskPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const navigate = useNavigate();
  const location = useLocation();
  const question = questionIn(location.state);
  const { turns, moreTime } = useAppSelector(selectAsk);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [announcement, setAnnouncement] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const requests = useRef(new Map<string, { abort: () => void }>());
  const sections = useRef(new Map<string, HTMLElement>());
  const statuses = useRef(new Map<string, AskTurn['status']>());

  // Clear, then set, so a repeated message is announced again
  const announce = (message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 100);
  };

  /** Brings a question to the top of the screen, focusing its heading when it's new */
  const showTurn = (id: string, focus: boolean) => {
    const section = sections.current.get(id);
    if (!section) return;
    if (focus) section.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    section.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const focusField = (select = false) => {
    const field = fieldRef.current;
    if (!field) return;
    field.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    field.focus({ preventScroll: true });
    if (select) field.select();
  };

  const ask = (text: string, context: AskEarlierTurn[], deep: boolean) => {
    const request = dispatch(askQuestion({ question: text, context, deep }));
    requests.current.set(request.requestId, request);
    announce(deep ? MORE_TIME_LOADING_TEXT : 'Looking up the answer. This usually takes 5 to 15 seconds.');
    window.requestAnimationFrame(() => showTurn(request.requestId, true));
  };

  // The question this history entry carries: ask it, unless it's already here (Back, Forward or a
  // return from a linked page), in which case bring its answer back into view
  useEffect(() => {
    if (!question) return;
    // The store's latest, not this render's, so a second run of this effect can't ask twice
    const current = store.getState().ask.turns;
    const context = contextIn(location.state);
    const deep = deepIn(location.state);
    const existing = [...current].reverse().find(turn => isAsked(turn, question, context, deep) && turn.status !== 'failed');
    if (existing) {
      window.requestAnimationFrame(() => showTurn(existing.id, false));
      return;
    }
    if (question.length > ASK_MAX_LENGTH) {
      dispatch(setDraft(question));
      announce(ERRORS.tooLong.message);
      return;
    }
    current.filter(turn => isAsked(turn, question, context, deep)).forEach(turn => dispatch(removeTurn(turn.id)));
    ask(question, context, deep);
    // Once per history entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Announce each answer as it arrives
  useEffect(() => {
    turns.forEach(turn => {
      const was = statuses.current.get(turn.id);
      statuses.current.set(turn.id, turn.status);
      if (was !== 'loading' || turn.status === 'loading') return;
      if (turn.status === 'succeeded' && turn.response) {
        announce(turn.response.status === 'declined' ? DECLINED_MESSAGE : readyMessage(turn.response));
      } else if (turn.status === 'failed' && turn.error) {
        announce(ERRORS[turn.error].message);
      }
    });
  }, [turns]);

  /** Each question gets its own history entry, which asks it after the questions answered on the page, taking more time if that's switched on */
  const submit = (text: string) => navigate(ASK_PATH, askState(text, contextFrom(turns), moreTime));

  const retry = (turn: AskTurn) => {
    dispatch(removeTurn(turn.id));
    ask(turn.question, turn.context, turn.deep);
  };

  const edit = (turn: AskTurn) => {
    dispatch(setDraft(turn.question));
    window.requestAnimationFrame(() => focusField(true));
  };

  const cancel = (turn: AskTurn) => {
    requests.current.get(turn.id)?.abort();
    announce('Question canceled.');
    // So Back or a reload doesn't ask it again
    if (turn.question === question) navigate(ASK_PATH, { replace: true });
    window.requestAnimationFrame(() => focusField());
  };

  const startOver = () => {
    turns.forEach(turn => requests.current.get(turn.id)?.abort());
    dispatch(clearTurns());
    navigate(ASK_PATH, { replace: true });
    announce('Questions cleared.');
    window.requestAnimationFrame(() => focusField());
  };

  const errorActions = (turn: AskTurn) => {
    const action = turn.error ? ERRORS[turn.error].action : 'retry';
    if (action === 'retry') return <Button onClick={() => retry(turn)} sx={{ textTransform: 'none' }}>Try Again</Button>;
    if (action === 'edit') return <Button onClick={() => edit(turn)} sx={{ textTransform: 'none' }}>Edit Your Question</Button>;
    return (
      <>
        <Button component={RouterLink} to={`/${LOOK_UP_HASH}`} sx={{ textTransform: 'none' }}>Look Up a Place</Button>
        <Button component={RouterLink} to="/state" sx={{ textTransform: 'none' }}>See Statewide Data</Button>
      </>
    );
  };

  const hasTurns = turns.length > 0;
  const loading = turns.some(turn => turn.status === 'loading');

  return (
    // The full width of the page; only an answer's paragraphs keep to reading width
    <Box sx={{ width: '100%', maxWidth: PAGE_WIDTH, py: 3 }}>
      {/* Keep focused and scrolled-to items clear of the fixed header */}
      <GlobalStyles styles={{ html: { scrollPaddingTop: 72 } }} />
      <Typography component="h1" sx={{ ...type.pageTitle, mb: 1 }}>Ask About New Hampshire Schools</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        Ask in your own words about any public school district, school or the whole state. Answers come from this site's data, with charts, tables and links to the pages the numbers came from.
      </Typography>

      {turns.map(turn => (
        <Box
          key={turn.id}
          component="section"
          aria-labelledby={`question-${turn.id}`}
          aria-busy={turn.status === 'loading'}
          ref={(element: HTMLElement | null) => { if (element) sections.current.set(turn.id, element); else sections.current.delete(turn.id); }}
          sx={{ scrollMarginTop: '72px' }}
        >
          <Box sx={{ borderLeft: '3px solid', borderColor: 'grey.300', pl: 1.5, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>{turn.deep ? 'You asked, taking more time' : 'You asked'}</Typography>
            <Typography
              id={`question-${turn.id}`}
              component="h2"
              tabIndex={-1}
              sx={{ fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4, m: 0, overflowWrap: 'anywhere', '&:focus': { outline: 'none' } }}
            >
              {turn.question}
            </Typography>
          </Box>

          {/* Its text shows as it's written */}
          {turn.status === 'loading' && (turn.partial.length > 0
            ? <AnswerInProgress paragraphs={turn.partial} onCancel={() => cancel(turn)} />
            : <Working deep={turn.deep} onCancel={() => cancel(turn)} onStillWorking={() => announce('Still working.')} />)}

          {turn.status === 'failed' && turn.error && (
            <Alert severity={ERRORS[turn.error].severity} role="none" action={<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{errorActions(turn)}</Box>}
              sx={{ alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, '& .MuiAlert-action': { ml: { xs: 0, sm: 'auto' }, pl: { xs: 0, sm: 2 } } }}>
              {ERRORS[turn.error].message}
            </Alert>
          )}

          {turn.status === 'succeeded' && turn.response?.status === 'declined' && (
            <Alert severity="info" role="none" action={<Button onClick={() => edit(turn)} sx={{ textTransform: 'none' }}>Edit Your Question</Button>}
              sx={{ alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              {DECLINED_MESSAGE}
            </Alert>
          )}

          {turn.status === 'succeeded' && turn.response && turn.response.status !== 'declined' && (
            <AskAnswerView answer={turn.response} onAsk={submit} />
          )}

          <Divider sx={{ my: 5 }} />
        </Box>
      ))}

      <Box component="section" aria-labelledby="ask-form-heading">
        <Typography id="ask-form-heading" component="h2" sx={hasTurns ? { ...type.sectionTitle, m: 0, mb: 2 } : visuallyHidden}>
          {hasTurns ? 'Continue the Discussion' : 'Your Question'}
        </Typography>
        <AskForm
          id="ask-question"
          label={hasTurns ? 'Ask your next question' : 'Your question'}
          onAsk={submit}
          onMessage={announce}
          fieldRef={fieldRef}
          disabled={loading}
          hint={hasTurns ? false : undefined}
          controls={<MoreTimeToggle />}
        />

        {!hasTurns && (
          <>
            <Typography id="ask-examples" variant="body1" sx={{ mt: 3, mb: 1 }}>Or try one of these:</Typography>
            <QuestionButtons labelledBy="ask-examples" questions={EXAMPLE_QUESTIONS} onAsk={submit} columns={3} />
          </>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{AI_NOTE}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Prefer to browse? <Link component={RouterLink} to={`/${LOOK_UP_HASH}`}>Look up a district or school</Link> or see <Link component={RouterLink} to="/state">statewide data</Link>.
        </Typography>
        {hasTurns && (
          <Button onClick={startOver} sx={{ mt: 2, textTransform: 'none' }}>Clear All Questions</Button>
        )}
      </Box>

      {/* The one place this page announces anything */}
      <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>{announcement}</Box>
    </Box>
  );
};

export default AskPage;
