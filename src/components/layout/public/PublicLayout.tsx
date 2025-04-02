import { Outlet } from "react-router-dom";
import { Box, useTheme, Card, Container, useMediaQuery } from "@mui/material";
import Top from "./Top/Top";

const PrivateLayout = () => {
  const theme = useTheme();
  const isMediumOrLarger = useMediaQuery(theme.breakpoints.up('md'));

  const content = (
    <Container maxWidth="xl" sx={{ py: isMediumOrLarger ? 2 : 0, px: isMediumOrLarger ? 2 : 0 }}>
        <Top />
        <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
    </Container>
  );

  if (!isMediumOrLarger) return content;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        overflowY: 'auto',
      }}
    >
      {content}
    </Box>
  );
};

export default PrivateLayout;
