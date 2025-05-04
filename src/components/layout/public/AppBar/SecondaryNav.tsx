import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  useTheme, 
  useMediaQuery,
  styled
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom styled Tab for better appearance
const NavTab = styled(Tab)(({ theme }) => ({
  minWidth: 100,
  fontWeight: 500,
  color: theme.palette.custom.secondaryNav.text,
  '&.Mui-selected': {
    fontWeight: 700,
    color: theme.palette.custom.secondaryNav.text,
  },
}));

/**
 * Secondary navigation bar that appears below the main AppBar on desktop
 */
const SecondaryNav = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const [value, setValue] = useState(0);

  // Navigation items
  const navItems = [
    { label: 'Academics', path: '/academics' },
    { label: 'Financials', path: '/financials' },
    { label: 'Safety', path: '/safety' },
    { label: 'EFA', path: '/efa' },
    { label: 'Staff', path: '/staff' },
    { label: 'Contact', path: '/contact' },
  ];

  // Find active tab based on current path
  const findActiveTab = () => {
    const foundIndex = navItems.findIndex(item => location.pathname.includes(item.path));
    return foundIndex !== -1 ? foundIndex : 0;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    navigate(navItems[newValue].path);
  };

  // Only render on desktop
  if (!isMediumOrLarger) return null;

  return (
    <Box 
      sx={{ 
        width: '100%',
        position: 'fixed',
        top: 64, // Position below the main AppBar
        height: 48,
        zIndex: theme.zIndex.appBar,
        bgcolor: 'transparent',
      }}
    >
      <Container 
        maxWidth="xl" 
        disableGutters
        sx={{ 
          height: '100%',
          margin: '0 auto',
          bgcolor: theme.palette.custom.secondaryNav.background,
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2)',
        }}
      >
        <Tabs
          value={findActiveTab()}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          TabIndicatorProps={{
            style: {
              backgroundColor: theme.palette.primary.main,
              height: 3
            }
          }}
          sx={{
            '& .MuiTabs-flexContainer': {
              justifyContent: 'flex-start',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.secondary.main,
            },
            px: { xs: 2, md: 3 },
            height: '100%',
          }}
        >
          {navItems.map((item) => (
            <NavTab key={item.path} label={item.label} />
          ))}
        </Tabs>
      </Container>
    </Box>
  );
};

export default SecondaryNav; 