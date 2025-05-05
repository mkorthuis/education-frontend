import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import SectionTitle from '@/components/ui/SectionTitle';

/**
 * FAQ page component
 */
const FAQ: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <SectionTitle displayName="Frequently Asked Questions" />
      
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" align="center" sx={{ mt: 4, mb: 2 }}>
          Coming Soon
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', textAlign: 'center' }}>
          We're working on putting together a comprehensive FAQ section.
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', textAlign: 'center' }}>
          Check back soon for answers to common questions.
        </Typography>
      </Box>
    </Container>
  );
};

export default FAQ; 