import { Box, Button, Container, Typography } from "@mui/material";
import React from "react";

/**
 * Full-page "something went wrong" screen, shared by the app ErrorBoundary and the
 * router's error element.
 */
const ErrorFallback: React.FC = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
    <Container maxWidth="md">
      <Typography sx={{ fontSize: [35], fontWeight: 700, letterSpacing: 2.5, textAlign: 'center' }}>
        Uh oh!
      </Typography>
      <Typography
        color="GrayText"
        sx={{ fontSize: [25], fontWeight: 400, letterSpacing: 2.5, textAlign: 'center' }}
      >
        Something went wrong. Please try again.
      </Typography>

      <Button
        sx={{ display: 'block', marginX: 'auto', marginTop: '2em', paddingX: '3em', maxWidth: '90%' }}
        variant="contained"
        size="large"
        onClick={() => (window.location.href = window.location.origin)}
      >
        Ok
      </Button>
    </Container>
  </Box>
);

export default ErrorFallback;
