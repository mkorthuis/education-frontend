import { Card, CardActionArea, CardContent, Typography } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { selectSelectedSafetyPage } from '@/store/slices/safetySlice';
import { useAppSelector } from '@/store/hooks';

interface DefaultSafetyCardProps {
    title?: string;
    shortTitle?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    isSelected?: boolean;
}

const DefaultSafetyCard: React.FC<DefaultSafetyCardProps> = ({
    children,
    onClick,
    isSelected = false,
    title = "",
    shortTitle = ""
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const selectedSafetyPage = useAppSelector(selectSelectedSafetyPage);

    const isCollapsed = isMobile && selectedSafetyPage !== null;
    
    const handleCardClick = () => {
        if (onClick) {
            onClick();
        }
    };

    const cardStyles = {
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: isSelected ? 'grey.300' : 'grey.100',
        mb: isCollapsed ? 0 : 2,
        flex: isCollapsed ? { xs: '1 1 0', md: '1 0 auto' } : '1 0 auto',
        minWidth: isCollapsed ? { xs: 0, md: '100%' } : '100%',
        marginRight: isCollapsed ? { xs: '8px', md: 0 } : 0,
        '&:last-child': {
            marginRight: 0
        },
        transition: 'all 0.3s ease',
        height: '100%'
    };

    const contentStyles = { 
        py: isCollapsed ? 1 : 2,
        px: 2,
        '&:last-child': { pb: isCollapsed ? 1 : 2 }
    };

    const titleStyles = {
        whiteSpace: isCollapsed ? 'normal' : 'initial',
        textAlign: isCollapsed ? 'center' : 'left'
      };

    return (
        <Card
            sx={cardStyles}
            onClick={handleCardClick}
        >
            <CardActionArea>
                <CardContent sx={contentStyles}>
                    <Typography 
                    variant="body1"
                    fontWeight="bold" 
                    gutterBottom={!isCollapsed}
                    noWrap={isCollapsed}
                    sx={titleStyles}
                >
                    {!isCollapsed ? title : shortTitle}
                </Typography>
                {!isCollapsed && (
                    <>
                        {children}
                    </>
                )}
                </CardContent>
            </CardActionArea>
        </Card>
    )
};

export default DefaultSafetyCard;