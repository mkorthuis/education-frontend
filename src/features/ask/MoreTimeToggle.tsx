import React from 'react';
import { Box, FormControlLabel, IconButton, Switch, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAsk, setMoreTime } from '@/store/slices/askSlice';
import { MORE_TIME_TIP } from './askCopy';

/**
 * The Take More Time switch beside the Ask button, shared by the home page and the Ask page, with a tip
 * on what it does: on hover and keyboard focus, on a tap on phones, and as the button's description
 * for screen readers.
 */
const MoreTimeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const { moreTime } = useAppSelector(selectAsk);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
      <FormControlLabel
        control={<Switch checked={moreTime} onChange={event => dispatch(setMoreTime(event.target.checked))} />}
        label="Take More Time"
        sx={{ mr: 0 }}
      />
      <Tooltip title={MORE_TIME_TIP} arrow describeChild enterTouchDelay={0} leaveTouchDelay={6000}>
        <IconButton aria-label="About Take More Time" size="small" sx={{ color: 'text.secondary' }}>
          <InfoOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default MoreTimeToggle;
