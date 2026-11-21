import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAsk, setDraft } from '@/store/slices/askSlice';
import { ASK_MAX_LENGTH } from '@/services/api/endpoints/ask';

const COUNTER_FROM = 400;

interface AskFormProps {
  id: string;
  label: string;
  /** A question that passed the checks: not empty, not too long */
  onAsk: (question: string) => void;
  /** Says a check's message aloud, through the page's live region */
  onMessage?: (message: string) => void;
  disabled?: boolean;
  fieldRef?: React.RefObject<HTMLTextAreaElement>;
  /** Beside the Ask button, such as the Take More Time switch */
  controls?: React.ReactNode;
  placeholder?: string;
  /** The example shows in the empty field before it's selected, with the label above the field */
  showExample?: boolean;
  /** One line, the button beside the field, as beside a district's or school's title */
  inline?: boolean;
}

/** The question field and its Ask button. The field's text is shared by the home page and the Ask page. */
const AskForm: React.FC<AskFormProps> = ({
  id, label, onAsk, onMessage, disabled = false, fieldRef, controls,
  placeholder = 'Example: How many teachers does Concord have?', showExample = false, inline = false,
}) => {
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

  const askButton = (
    <Button
      type="submit"
      variant="contained"
      disableElevation
      disabled={disabled}
      sx={{ textTransform: 'none', minHeight: inline ? 48 : 44, px: 3, flexShrink: 0, width: inline ? 'auto' : { xs: '100%', sm: 'auto' } }}
    >
      Ask
    </Button>
  );

  return (
    <Box
      component="form"
      noValidate
      onSubmit={(event: React.FormEvent) => { event.preventDefault(); submit(); }}
      sx={inline ? { display: 'flex', alignItems: 'flex-start', gap: 1 } : undefined}
    >
      <TextField
        id={id}
        inputRef={fieldRef}
        label={label}
        placeholder={placeholder}
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
        minRows={inline ? 1 : 2}
        maxRows={8}
        size={inline ? 'small' : 'medium'}
        fullWidth
        autoComplete="off"
        error={Boolean(fieldError) || length > ASK_MAX_LENGTH}
        // Under the field, only the checks' messages: why it can't be asked, or, at the right, how long it is near the limit
        helperText={fieldError ?? (counter && <Box component="span" sx={{ display: 'block', textAlign: 'right' }}>{counter}</Box>)}
        inputProps={{ enterKeyHint: 'go' }}
        slotProps={showExample ? { inputLabel: { shrink: true } } : undefined}
        // One line, 48px tall like its button
        sx={{ '& textarea::placeholder': { color: 'text.secondary', opacity: 1 }, ...(inline && { '& .MuiInputBase-multiline': { py: '12.5px' } }) }}
      />
      {inline ? askButton : (
        // Phones: the button across the field's width, any controls under it
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2, rowGap: 0.5, mt: 1.5 }}>
          {askButton}
          {controls}
        </Box>
      )}
    </Box>
  );
};

export default AskForm;
