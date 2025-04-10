import { Box, Drawer, AppBar, Toolbar, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import MenuContent from './MenuContent';
import { useState } from 'react';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: { xs: 'flex', md: 'none' },
      justifyContent: 'flex-end'
    }}>
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: '100%',
            height: '100%',
          },
        }}
      >
        <AppBar position="static" sx={{ backgroundColor: 'purple' }}>
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }} />
            <IconButton
              edge="end"
              color="inherit"
              onClick={toggleDrawer(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <MenuContent onClose={toggleDrawer(false)} />
      </Drawer>

      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={toggleDrawer(true)}
        color="inherit"
        sx={{ display: { xs: 'flex', md: 'none' }, p:'0px' }}
      >
       {/* <MenuIcon /> */}
      </IconButton>
    </Box>
  );
}