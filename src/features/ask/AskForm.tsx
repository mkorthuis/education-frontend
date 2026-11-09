import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAsk, setDraft } from '@/store/slices/askSlice';
import { ASK_MAX_LENGTH } from '@/services/api/endpoints/ask';

const COUNTER_FROM = 400;
const DEFAULT_HINT = "Name the school, town or district you mean. Don't include personal details.";

interface AskFormProps {
  id: string;
  label: string;
  /** A question that passed the checks: not empty, not too long */
  onAsk: (question: string) => void;
  /** Says a check's message aloud, through the page's live region */
  onMessage?: (message: string) => void;
  disabled?: boolean;
  /** The tip under the field, or false for none; the checks' messages show there either way */
  hint?: string | false;
  fieldRef?: React.RefObject<HTMLTextAreaElement>;
  /** Beside the Ask button, such as the Take More Time switch */
  controls?: React.ReactNode;
}

/** The question field and its Ask button. The field's text is shared by the home page and the Ask page. */
const AskForm: React.FC<AskFormProps> = ({ id, label, onAsk, onMessage, disabled = false, hint = DEFAULT_HINT, fieldRef, controls }) => {
  const dispatch = useAppDispatch();
  const { draft } = useAppSelector(selectAsk);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const refuse = (message: string) => {
    setFieldError(message);
    onMessage?.(message);
    fieldRef?.current?.focus();
  };

  const submit = () => {
    const question = draft.trim();
    if (!question) return refuse('Type a question first, or choose an example.');
    if (question.length > ASK_MAX_LENGTH) return refuse(`${question.length} of ${ASK_MAX_LENGTH} characters. Please shorten your question.`);
    setFieldError(null);
    onAsk(question);
  };

  const length = draft.trim().length;
  const counter = length >= COUNTER_FROM ? `${length} of ${ASK_MAX_LENGTH} characters${length > ASK_MAX_LENGTH ? '. Please shorten your question.' : ''}` : null;

  return (
    <Box component="form" noValidate onSubmit={(event: React.FormEvent) => { event.preventDefault(); submit(); }}>
      <TextField
        id={id}
        inputRef={fieldRef}
        label={label}
        placeholder="Example: How many teachers does Concord have?"
        value={draft}
        onChange={event => { dispatch(setDraft(event.target.value)); if (fieldError) setFieldError(null); }}
        onKeyDown={event => {
          // Enter asks; Shift+Enter adds a line; nothing while an input method is composing
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
          }
        }}
        multiline
        minRows={2}
        maxRows={8}
        fullWidth
        autoComplete="off"
        error={Boolean(fieldError) || length > ASK_MAX_LENGTH}
        helperText={(hint || fieldError || counter) && (
          <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <span>{fieldError ?? (hint || '')}</span>
            {counter && !fieldError && <span>{counter}</span>}
          </Box>
        )}
        inputProps={{ enterKeyHint: 'go' }}
        sx={{ '& textarea::placeholder': { color: 'text.secondary', opacity: 1 } }}
      />
      {/* Phones: the button across the field's width, any controls under it */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 0.5, mt: 1.5 }}>
        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={disabled}
          sx={{ textTransform: 'none', minHeight: 44, px: 3, width: { xs: '100%', sm: 'auto' } }}
        >
          Ask
        </Button>
        {controls}
      </Box>
    </Box>
  );
};

export default AskForm;
