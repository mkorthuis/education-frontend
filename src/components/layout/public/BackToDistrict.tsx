import { Link as RouterLink, useLocation } from 'react-router-dom';
import { Link } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAppSelector } from '@/store/hooks';
import { selectCurrentDistrict, selectCurrentSchool } from '@/store/slices/locationSlice';
import { extractIdsFromUrl } from '@/routes/pageRegistry';
import { districtTitle } from '@/features/district/utils/labels';

/**
 * On phones, on every school page, a link back to the school's district above the page: "‹ Concord
 * School District" (wider screens have the section tabs, and the overview links the district in
 * the line under its title). Shown once the school and its own district are loaded, never a
 * district left over from an earlier page.
 */
const BackToDistrict = () => {
  const { pathname } = useLocation();
  const { schoolId } = extractIdsFromUrl(pathname);
  const school = useAppSelector(selectCurrentSchool);
  const district = useAppSelector(selectCurrentDistrict);
  if (schoolId === undefined || !school || school.id !== schoolId || !district || school.district_id !== district.id) return null;
  const name = districtTitle(district.name);
  return (
    <Link
      component={RouterLink}
      to={`/district/${district.id}`}
      aria-label={`Back to ${name}`}
      underline="hover"
      sx={{
        display: { xs: 'inline-flex', sm: 'none' },
        alignItems: 'center',
        typography: 'body2',
        fontWeight: 500,
        // A comfortable tap target, tucked close to the title
        minHeight: 40,
        mt: -1.5,
      }}
    >
      <ChevronLeftIcon aria-hidden fontSize="small" sx={{ ml: -0.75 }} />
      {name}
    </Link>
  );
};

export default BackToDistrict;
