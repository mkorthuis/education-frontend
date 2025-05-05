import React from 'react';
import { Box, Typography, Container, Link } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * Contact page component
 */
const Contact: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Contact Us" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
          Questions? Comments? Suggestions? Want to help support the site?
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
          Email me at <Link href="mailto:webmaster@nhfacts.com">webmaster@nhfacts.com</Link> and we will be in touch.
        </Typography>
      </Box>
    </Container>
  );
};

export default Contact; 