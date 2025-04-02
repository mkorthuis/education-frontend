import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { PATHS } from '@routes/paths';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100'
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <SelfImprovementIcon
            sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 2
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 700,
              mb: 2
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Page Not Found
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            The page you're looking for doesn't exist or has been moved.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate(PATHS.PUBLIC.HOME.path)}
            sx={{
              px: 4,
              py: 1.5
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
