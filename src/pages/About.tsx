import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * About Us page component
 */
const About: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="About Us" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" align="center" sx={{ mt: 4, mb: 2 }}>
          Coming Soon
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', textAlign: 'center' }}>
          We're working on our About Us page to tell you more about the NH Education Facts project.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', textAlign: 'center' }}>
          Check back soon to learn about our mission and goals.
        </Typography>
      </Box>
    </Container>
  );
};

export default About; 