import React from 'react';
import { Box, FormControlLabel, IconButton, Switch, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAsk, setDeepThink } from '@/store/slices/askSlice';
import { DEEP_THINK_TIP } from './askCopy';

/**
 * The Deep Think switch beside the Ask button, shared by the home page and the Ask page, with a tip
 * on what it does: on hover and keyboard focus, on a tap on phones, and as the button's description
 * for screen readers.
 */
const DeepThinkToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { deepThink } = useAppSelector(selectAsk);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <FormControlLabel
        control={<Switch checked={deepThink} onChange={event => dispatch(setDeepThink(event.target.checked))} />}
        label="Deep Think"
        sx={{ mr: 0 }}
      />
      <Tooltip title={DEEP_THINK_TIP} arrow describeChild enterTouchDelay={0} leaveTouchDelay={6000}>
        <IconButton aria-label="About Deep Think" size="small" sx={{ color: 'text.secondary' }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default DeepThinkToggle;
