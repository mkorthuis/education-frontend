import { Box, Container, Grid, Typography, Link, Divider, useTheme, useMediaQuery } from '@mui/material';

export default function Footer() {
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
        backgroundColor: theme => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              New Hampshire Education Facts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Education Data Made Accessible
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              About
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              About Us
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Our Mission
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Data Sources
            </Link>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Resources
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Available Districts and Schools
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              API Documentation
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              FAQ
            </Link>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Legal
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Terms of Use
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1 }}>
              Contact
            </Link>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          ©{currentYear} NH Education Facts. All data sourced from public education records.
        </Typography>
      </Container>
    </Box>
  );
} 