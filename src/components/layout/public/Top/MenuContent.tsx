import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import GroupsIcon from '@mui/icons-material/Groups';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { PATHS } from '@routes/paths';

const mainListItems = [
  { text: 'Dashboard', icon: <GroupsIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Community', icon: <GroupsIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Habits', icon: <CheckCircleOutlineIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Insights', icon: <AssessmentIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Programs', icon: <FitnessCenterIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Profile', icon: <AccountCircleIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Account', icon: <SettingsIcon />, route: PATHS.PUBLIC.HOME.path },
  { text: 'Logout', icon: <ExitToAppIcon />, route: PATHS.PUBLIC.HOME.path },
];

interface MenuContentProps {
  onClose: () => void;
}

export default function MenuContent({ onClose }: MenuContentProps) {
  const location = useLocation();

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to={item.route}
                selected={location.pathname === item.route}
                onClick={() => {
                  if (location.pathname === item.route) {
                    onClose();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
            {index === 4 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Stack>
  );
}