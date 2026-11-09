import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete, Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { locationApi } from '@/services/api/endpoints/locations';
import { trackEvent } from '@/utils/analytics';
import { buildPlaceOptions, DistrictRow, PLACE_KINDS, PlaceOption, SchoolRow, searchPlaces } from './placeOptions';

interface PlaceSearchProps {
  id: string;
  inputRef?: React.Ref<HTMLInputElement>;
  /** The header's search: a small white box on the blue bar, labeled for screen readers, its list wider than the box */
  compact?: boolean;
  autoFocus?: boolean;
  /** After a place is picked and its page opened, e.g. to close the phone's search bar */
  onSelect?: () => void;
}

const LABEL = 'District or school';

/** Find a public school district or school by name and open its page. */
const PlaceSearch: React.FC<PlaceSearchProps> = ({ id, inputRef, compact = false, autoFocus = false, onSelect }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([locationApi.getDistricts(), locationApi.getSchools()])
      .then(([districts, schools]) => {
        if (current) setOptions(buildPlaceOptions(districts as DistrictRow[], schools as SchoolRow[]));
      })
      .catch(() => current && setFailed(true))
      .finally(() => current && setLoading(false));
    return () => { current = false; };
  }, []);

  const matches = useMemo(() => searchPlaces(options, input), [options, input]);

  return (
    <Autocomplete<PlaceOption>
      id={id}
      options={options}
      filterOptions={() => matches}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, value) => option.key === value.key}
      value={null}
      inputValue={input}
      onInputChange={(_event, value, reason) => { if (reason !== 'reset') setInput(value); }}
      onChange={(_event, option) => {
        if (!option) return;
        trackEvent('search', { search_term: input.trim(), place_kind: option.kind, place_name: option.name, search_box: compact ? 'header' : 'page' });
        navigate(option.path);
        setInput('');
        onSelect?.();
      }}
      // The list opens once something is typed
      open={input.trim().length > 0 && !loading}
      forcePopupIcon={false}
      blurOnSelect
      autoHighlight
      noOptionsText={failed
        ? `Search isn't available right now. Try All Districts or All Schools${compact ? ' in the menu' : ' below'}.`
        : 'No district or school by that name'}
      // The header's box is narrow; its list is wider, under its right edge
      slotProps={compact ? { popper: { placement: 'bottom-end', sx: { minWidth: { sm: 400 } } } } : undefined}
      // MUI's own key is left out of the spread; React wants keys passed directly
      renderOption={({ key: _key, ...props }, option) => (
        <Box component="li" key={option.key} {...props} sx={{ display: 'flex !important', alignItems: 'baseline', gap: 2, py: '8px !important' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1">{option.name}</Typography>
            {option.detail && <Typography variant="body2" color="text.secondary">{option.detail}</Typography>}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, fontSize: '0.8125rem' }}>{PLACE_KINDS[option.kind]}</Typography>
        </Box>
      )}
      renderInput={params => (
        <TextField
          {...params}
          inputRef={inputRef}
          autoFocus={autoFocus}
          // The header's box has no room for a label above it: its placeholder shows the label and
          // screen readers get it
          label={compact ? undefined : LABEL}
          size={compact ? 'small' : 'medium'}
          placeholder={loading ? 'Loading places...' : compact ? 'Search districts and schools' : 'Example: Concord, Hampton or Bedford High School'}
          InputProps={{
            ...params.InputProps,
            startAdornment: <InputAdornment position="start"><SearchIcon aria-hidden color="action" /></InputAdornment>,
          }}
          inputProps={{ ...params.inputProps, enterKeyHint: 'search', ...(compact && { 'aria-label': LABEL }) }}
          sx={{
            '& input::placeholder': { color: 'text.secondary', opacity: 1 },
            ...(compact && { '& .MuiOutlinedInput-root': { backgroundColor: 'background.paper' } }),
          }}
        />
      )}
    />
  );
};

export default PlaceSearch;
