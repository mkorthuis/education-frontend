import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigationType } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Skeleton, TextField, Typography, useMediaQuery } from '@mui/material';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import { SectionHeading, visuallyHidden } from '@/components/ds';
import { type } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AskErrorKind, askQuestion, clearAnswer, selectAsk, setDraft } from '@/store/slices/askSlice';
import { ASK_MAX_LENGTH, AskAnswer } from '@/services/api/endpoints/ask';
import AskAnswerView from './AskAnswerView';
import { chipSx } from './askStyles';

// The home page's "Ask a Question" box and its answer: one question, one answer, no chat thread.

export const EXAMPLE_QUESTIONS = [
  'How much does Concord spend per student?',
  'How are Nashua students doing in reading?',
  "What is Manchester's graduation rate?",
  'How has the number of students in NH changed?',
  'What is the average class size in Claremont?',
  'Which districts spend the most per student?',
];
// Phones show the first four
const PHONE_EXAMPLES = 4;
const COUNTER_FROM = 400;
const STILL_WORKING_MS = 15000;

const LOADING_TEXT = "Looking up the answer in this site's data. This usually takes 5 to 15 seconds.";

const ERRORS: Record<AskErrorKind, { message: string; severity: 'info' | 'error'; action: 'retry' | 'edit' | 'browse' }> = {
  limit: { message: "We've reached today's limit on questions. Please try again tomorrow. You can still look up any district or see statewide data.", severity: 'info', action: 'browse' },
  unavailable: { message: "Asking questions isn't available right now. You can still look up any district or see statewide data.", severity: 'info', action: 'browse' },
  tooLong: { message: `Questions can be up to ${ASK_MAX_LENGTH} characters. Please shorten your question.`, severity: 'info', action: 'edit' },
  network: { message: "We couldn't connect. Check your internet connection, then try again.", severity: 'error', action: 'retry' },
  timeout: { message: 'This is taking too long. Please try again in a minute.', severity: 'error', action: 'retry' },
  server: { message: 'Something went wrong on our end. Please try again.', severity: 'error', action: 'retry' },
};
// A question this box can't take, whether off-topic or about a person
const DECLINED_MESSAGE = "We can only answer questions about New Hampshire public schools using this site's data, and we can't answer questions about a particular student, teacher or family.";

const readyMessage = (answer: AskAnswer) => {
  const parts = [
    answer.charts.length ? `${answer.charts.length} chart${answer.charts.length > 1 ? 's' : ''}` : '',
    answer.tables.length ? `${answer.tables.length} table${answer.tables.length > 1 ? 's' : ''}` : '',
  ].filter(Boolean);
  return parts.length ? `Answer ready, with ${parts.join(' and ')}.` : 'Answer ready.';
};

interface AskSectionProps {
  /** Brings the district picker into view and focuses it, for "Look Up a District" */
  onLookUpDistrict: () => void;
}

const AskSection: React.FC<AskSectionProps> = ({ onLookUpDistrict }) => {
  const dispatch = useAppDispatch();
  const { question, draft, status, response, error } = useAppSelector(selectAsk);
  const navigationType = useNavigationType();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [stillWorking, setStillWorking] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef<{ abort: () => void } | null>(null);
  const statusRef = useRef(status);

  // Clear, then set, so a repeated message is announced again
  const announce = (message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 100);
  };

  const focusField = (select: boolean) => {
    const field = fieldRef.current;
    if (!field) return;
    field.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    field.focus({ preventScroll: true });
    if (select) field.select();
    else field.setSelectionRange(field.value.length, field.value.length);
  };

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      setFieldError('Type a question first, or choose an example below.');
      announce('Type a question first, or choose an example below.');
      focusField(false);
      return;
    }
    if (trimmed.length > ASK_MAX_LENGTH) {
      const message = `${trimmed.length} of ${ASK_MAX_LENGTH} characters. Please shorten your question.`;
      setFieldError(message);
      announce(message);
      focusField(false);
      return;
    }
    setFieldError(null);
    requestRef.current?.abort();
    requestRef.current = dispatch(askQuestion(trimmed));
    announce('Looking up the answer. This usually takes 5 to 15 seconds.');
    // Once the answer section renders: focus its heading and bring it to the top
    window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      sectionRef.current?.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  };

  const cancel = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    dispatch(clearAnswer());
    announce('Question canceled.');
    window.requestAnimationFrame(() => focusField(false));
  };

  // "Still working" after 15 seconds
  useEffect(() => {
    setStillWorking(false);
    if (status !== 'loading') return undefined;
    const timer = window.setTimeout(() => {
      setStillWorking(true);
      announce('Still working.');
    }, STILL_WORKING_MS);
    return () => window.clearTimeout(timer);
  }, [status, question]);

  // Announce the result; move nothing if the visitor has gone elsewhere on the page
  useEffect(() => {
    const was = statusRef.current;
    statusRef.current = status;
    if (was !== 'loading') return;
    if (status === 'succeeded' && response) {
      if (response.status === 'declined') announce(DECLINED_MESSAGE);
      else if (sectionRef.current?.contains(document.activeElement)) announce(readyMessage(response));
      else announce('Your answer is ready, below the question box.');
    } else if (status === 'failed' && error) {
      announce(ERRORS[error].message);
    }
  }, [status, response, error]);

  // Back from a linked page: bring the stored answer into view, without moving focus
  useEffect(() => {
    if (navigationType === 'POP' && (status === 'succeeded' || status === 'failed')) {
      window.requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ block: 'start' }));
    }
    // Only when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const length = draft.trim().length;
  const loading = status === 'loading';
  const counter = length >= COUNTER_FROM ? `${length} of ${ASK_MAX_LENGTH} characters${length > ASK_MAX_LENGTH ? '. Please shorten your question.' : ''}` : null;

  const errorActions = (kind: AskErrorKind) => {
    const action = ERRORS[kind].action;
    if (action === 'retry') return <Button onClick={() => submit(question)} sx={{ textTransform: 'none' }}>Try Again</Button>;
    if (action === 'edit') return <Button onClick={() => focusField(true)} sx={{ textTransform: 'none' }}>Edit Your Question</Button>;
    return (
      <>
        <Button onClick={onLookUpDistrict} sx={{ textTransform: 'none' }}>Look Up a District</Button>
        <Button component={RouterLink} to="/state" sx={{ textTransform: 'none' }}>See Statewide Data</Button>
      </>
    );
  };

  return (
    <>
      <Box component="section" aria-labelledby="ask-heading" sx={{ mt: 4 }}>
        <SectionHeading id="ask-heading">Ask a Question</SectionHeading>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Type a question in your own words. Name the school, town or district you mean.
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={(event: React.FormEvent) => { event.preventDefault(); submit(draft); }}
        >
          <TextField
            inputRef={fieldRef}
            label="Your question"
            placeholder="Example: How many teachers does Concord have?"
            value={draft}
            onChange={event => { dispatch(setDraft(event.target.value)); if (fieldError) setFieldError(null); }}
            onKeyDown={event => {
              // Enter asks; Shift+Enter adds a line; nothing while an input method is composing
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit(draft);
              }
            }}
            multiline
            minRows={2}
            maxRows={8}
            fullWidth
            autoComplete="off"
            error={Boolean(fieldError) || length > ASK_MAX_LENGTH}
            helperText={(
              <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <span>{fieldError ?? "Don't include names or personal details."}</span>
                {counter && !fieldError && <span>{counter}</span>}
              </Box>
            )}
            inputProps={{ enterKeyHint: 'go' }}
            sx={{ '& textarea::placeholder': { color: 'text.secondary', opacity: 1 } }}
          />
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={loading}
            sx={{ mt: 1.5, textTransform: 'none', minHeight: 44, px: 3, width: { xs: '100%', sm: 'auto' } }}
          >
            Ask
          </Button>
        </Box>

        <Typography id="ask-examples" variant="body1" sx={{ mt: 2.5, mb: 1 }}>Or try one of these:</Typography>
        <Box component="ul" aria-labelledby="ask-examples" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', alignItems: 'flex-start', gap: 1 }}>
          {EXAMPLE_QUESTIONS.map((example, index) => (
            <Box component="li" key={example} sx={index >= PHONE_EXAMPLES ? { display: { xs: 'none', sm: 'list-item' } } : undefined}>
              <Button
                variant="outlined"
                disabled={loading}
                onClick={() => { dispatch(setDraft(example)); submit(example); }}
                sx={chipSx}
              >
                {example}
              </Button>
            </Box>
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Answers are written by AI from this site's data and can be wrong. Check the linked pages.
        </Typography>
        {/* The one place this feature announces anything */}
        <Box role="status" aria-live="polite" aria-atomic="true" sx={visuallyHidden}>{announcement}</Box>
      </Box>

      {status !== 'idle' && (
        <Box component="section" ref={sectionRef} aria-labelledby="answer-heading" sx={{ mt: 4, scrollMarginTop: '72px' }}>
          <Box sx={{ mt: { xs: 1, sm: 2 }, mb: 2 }}>
            <Typography
              id="answer-heading"
              ref={headingRef}
              component="h2"
              tabIndex={-1}
              sx={{ ...type.sectionTitle, lineHeight: { xs: 1.2, sm: 1.5 }, m: 0, mb: { xs: 0, sm: 0.5 }, '&:focus': { outline: 'none' } }}
            >
              Answer
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, borderBottom: 1, borderColor: 'divider' }} />
          </Box>

          <Box sx={{ borderLeft: '3px solid', borderColor: 'grey.300', pl: 1.5, mb: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>You asked</Typography>
            <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>{question}</Typography>
          </Box>

          {loading && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {reduceMotion ? <HourglassEmptyOutlinedIcon aria-hidden fontSize="small" color="action" /> : <CircularProgress size={20} aria-hidden />}
                <Typography variant="body1">{stillWorking ? 'Still working. Thanks for waiting.' : LOADING_TEXT}</Typography>
              </Box>
              <Box aria-hidden>
                {['100%', '92%', '60%'].map(width => <Skeleton key={width} variant="text" width={width} animation={reduceMotion ? false : 'pulse'} />)}
              </Box>
              <Button onClick={cancel} sx={{ mt: 1, textTransform: 'none' }}>Cancel</Button>
            </Box>
          )}

          {status === 'failed' && error && (
            <Alert severity={ERRORS[error].severity} role="none" action={<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{errorActions(error)}</Box>}
              sx={{ alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, '& .MuiAlert-action': { ml: { xs: 0, sm: 'auto' }, pl: { xs: 0, sm: 2 } } }}>
              {ERRORS[error].message}
            </Alert>
          )}

          {status === 'succeeded' && response && (response.status === 'declined' ? (
            <Alert severity="info" role="none" action={<Button onClick={() => focusField(true)} sx={{ textTransform: 'none' }}>Edit Your Question</Button>}
              sx={{ alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              {DECLINED_MESSAGE}
            </Alert>
          ) : (
            <AskAnswerView
              answer={response}
              onAsk={followUp => { dispatch(setDraft(followUp)); submit(followUp); }}
              onAskAnother={() => focusField(true)}
            />
          ))}
        </Box>
      )}
    </>
  );
};

export default AskSection;
