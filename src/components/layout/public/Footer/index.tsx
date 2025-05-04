import { Box, Container, Grid, Typography, Link, Divider, useTheme, useMediaQuery } from '@mui/material';

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
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.custom.footer.background,
        color: theme.palette.custom.footer.text,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="inherit" gutterBottom>
              New Hampshire Education Facts
            </Typography>
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
              Your Education Data Made Accessible
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="inherit" gutterBottom>
              About
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              About Us
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Our Mission
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Data Sources
            </Link>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="inherit" gutterBottom>
              Resources
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Available Districts and Schools
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              API Documentation
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              FAQ
            </Link>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="inherit" gutterBottom>
              Legal
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Terms of Use
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Contact
            </Link>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <Typography variant="body2" color="inherit" align="center" sx={{ opacity: 0.7 }}>
          ©{currentYear} NH Education Facts. All data sourced from public education records.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 