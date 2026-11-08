import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete, Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { locationApi } from '@/services/api/endpoints/locations';
import { buildPlaceOptions, DistrictRow, PLACE_KINDS, PlaceOption, SchoolRow, searchPlaces, TownRow } from './placeOptions';

interface PlaceSearchProps {
  id: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

/** Find a public school district, town or school by name and open its page. */
const PlaceSearch: React.FC<PlaceSearchProps> = ({ id, inputRef }) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [input, setInput] = useState('');

  useEffect(() => {
    let current = true;
    Promise.all([locationApi.getDistricts(), locationApi.getTowns(), locationApi.getSchools()])
      .then(([districts, towns, schools]) => {
        if (current) setOptions(buildPlaceOptions(districts as DistrictRow[], towns as TownRow[], schools as SchoolRow[]));
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
      onChange={(_event, option) => { if (option) navigate(option.path); }}
      // The list opens once something is typed
      open={input.trim().length > 0 && !loading}
      forcePopupIcon={false}
      blurOnSelect
      autoHighlight
      noOptionsText={failed ? "Search isn't available right now. Try All Districts or All Schools below." : 'No district, town or school by that name'}
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
          label="Town, district or school"
          placeholder={loading ? 'Loading places...' : 'Example: Concord, Hampton or Bedford High School'}
          InputProps={{
            ...params.InputProps,
            startAdornment: <InputAdornment position="start"><SearchIcon aria-hidden color="action" /></InputAdornment>,
          }}
          inputProps={{ ...params.inputProps, enterKeyHint: 'search' }}
          sx={{ '& input::placeholder': { color: 'text.secondary', opacity: 1 } }}
        />
      )}
    />
  );
};

export default PlaceSearch;
