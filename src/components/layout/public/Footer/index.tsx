import { Box, Container, Typography, Link as MuiLink, Divider, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Footer component with links and copyright information
 */
const Footer = () => {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        mt: 'auto',
        backgroundColor: theme.palette.custom.footer.background,
        color: theme.palette.custom.footer.text,
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Box sx={{ px: { xs: 2, md: 3 } }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: {xs: 2, md: 4},
              mb: 2,
              justifyContent: { xs: 'center', md: 'flex-start' }
            }}
          >
            <Box sx={{ 
              flexBasis: { xs: '100%', md: '27%' },
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="inherit">
                New Hampshire Education Facts
              </Typography>
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                State Education Data Made Accessible
              </Typography>
            </Box>
            
            <Box sx={{ 
              flexBasis: { xs: '100%', md: '17%' },
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="inherit">
                About
              </Typography>
              <MuiLink 
                component={RouterLink} 
                to="/about" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                About Us
              </MuiLink>
              <MuiLink 
                component={RouterLink} 
                to="/contact" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                Contact
              </MuiLink>
            </Box>
            
            <Box sx={{ 
              flexBasis: { xs: '100%', md: '27%' },
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="inherit">
                Resources
              </Typography>
              <MuiLink 
                component={RouterLink} 
                to="/districts" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                Available Districts and Schools
              </MuiLink>
              <MuiLink 
                component={RouterLink} 
                to="/datasources" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                Data Sources
              </MuiLink>
              <MuiLink 
                href="https://api.nhfacts.com/docs#/" 
                target="_blank"
                rel="noopener noreferrer"
                color="inherit" 
                display="block" 
                variant="body2" 
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                API Documentation
              </MuiLink>
            </Box>
            
            <Box sx={{ 
              flexBasis: { xs: '100%', md: '17%' },
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="inherit">
                Legal
              </Typography>
              <MuiLink 
                component={RouterLink} 
                to="/privacy" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                Privacy Policy
              </MuiLink>
              <MuiLink 
                component={RouterLink} 
                to="/terms" 
                color="inherit" 
                display="block" 
                variant="body2"
                sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
              >
                Terms of Use
              </MuiLink>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
          
          <Typography variant="body2" color="inherit" align="center" sx={{ opacity: 0.7 }}>
            ©{currentYear} NH Education Facts. All data sourced from public education records.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 