import React from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
  Stack,
  Divider,
  alpha,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DescriptionIcon,
  Verified as VerifiedIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import type { KanbanBoard } from '../../../types/kanban';

interface BoardHeaderProps {
  currentBoard: KanbanBoard;
  children?: React.ReactNode;
}

const BoardHeader: React.FC<BoardHeaderProps> = ({
  currentBoard,
  children
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Generate board icon based on type or name
  const getBoardIcon = () => {
    const iconProps = {
      sx: { 
        fontSize: { xs: '1.5rem', sm: '2rem' },
        color: theme.palette.primary.main
      }
    };

    if (currentBoard.type === 'TASKS') {
      return <VerifiedIcon {...iconProps} />;
    }
    return <DashboardIcon {...iconProps} />;
  };

  // Generate board color based on name or type
  const getBoardColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
    ];
    
    const hash = currentBoard.name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const boardColor = getBoardColor();

  return (
    <Paper 
      elevation={isMobile ? 1 : 2}
      sx={{ 
        p: 0,
        mb: 2,
        background: isMobile 
          ? `linear-gradient(135deg, ${alpha(boardColor, 0.05)} 0%, ${alpha(boardColor, 0.02)} 100%)`
          : `linear-gradient(135deg, ${alpha(boardColor, 0.08)} 0%, ${alpha(boardColor, 0.03)} 100%)`,
        border: `1px solid ${alpha(boardColor, 0.1)}`,
        borderRadius: { xs: 2, sm: 3 },
        overflow: 'hidden',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: { xs: 3, sm: 4 },
          background: `linear-gradient(90deg, ${boardColor}, ${alpha(boardColor, 0.7)})`,
        }
      }}
    >
      {/* Main Header Content */}
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Board Title Section */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={{ xs: 2, sm: 3 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          mb={{ xs: 2, sm: 3 }}
        >
          {/* Board Icon and Title */}
          <Stack 
            direction="row" 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems="center"
            sx={{ flex: 1, minWidth: 0 }}
          >
            {/* Board Avatar/Icon */}
            <Avatar
              sx={{
                width: { xs: 40, sm: 48, md: 56 },
                height: { xs: 40, sm: 48, md: 56 },
                background: `linear-gradient(135deg, ${boardColor}, ${alpha(boardColor, 0.8)})`,
                boxShadow: `0 4px 12px ${alpha(boardColor, 0.3)}`,
              }}
            >
              {getBoardIcon()}
            </Avatar>

            {/* Title and Description */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Typography 
                  variant="h5" 
                  component="h1"
                  sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.4rem', md: '1.8rem' },
                    fontWeight: { xs: 700, sm: 600 },
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                  }}
                >
                  {currentBoard.name}
                </Typography>
                
                {/* Board Type Chip */}
                <Chip
                  label={currentBoard.type === 'TASKS' ? 'Tasks' : 'Tickets'}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: { xs: 20, sm: 24 },
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    borderColor: alpha(boardColor, 0.5),
                    color: boardColor,
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'flex' }
                  }}
                />
              </Stack>

              {/* Description */}
              {currentBoard.description && (
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <DescriptionIcon 
                    sx={{ 
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      color: 'text.secondary',
                      mt: 0.1,
                      display: { xs: 'none', sm: 'block' }
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      lineHeight: { xs: 1.3, sm: 1.4 },
                      display: '-webkit-box',
                      WebkitLineClamp: { xs: 2, sm: 2, md: 1 },
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1,
                    }}
                  >
                    {currentBoard.description}
                  </Typography>
                </Stack>
              )}

              {/* Mobile Type Chip - Keep below description */}
              <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1 }}>
                <Chip
                  label={currentBoard.type === 'TASKS' ? 'Tasks Board' : 'Tickets Board'}
                  size="small"
                  variant="filled"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    backgroundColor: alpha(boardColor, 0.15),
                    color: boardColor,
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          </Stack>

          {/* Home Button and Quick Stats - Desktop Only */}
          {!isMobile && (
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  startIcon={<HomeIcon />}
                  onClick={() => navigate('/dashboard')}
                  variant="outlined"
                  size="small"
                >
                  Home
                </Button>
                {currentBoard.tickets && (
                  <>
                    <Chip
                      label={`${currentBoard.tickets.length} Total`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        height: 28,
                        borderColor: alpha(theme.palette.text.secondary, 0.3),
                        color: 'text.secondary',
                      }}
                    />
                    <Chip
                      label={`${currentBoard.columns?.length || 0} Columns`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        height: 28,
                        borderColor: alpha(theme.palette.text.secondary, 0.3),
                        color: 'text.secondary',
                      }}
                    />
                  </>
                )}
              </Stack>
            </Box>
          )}
          
          {/* Mobile Home Button */}
          {isMobile && (
            <Box>
              <Button
                startIcon={<HomeIcon />}
                onClick={() => navigate('/dashboard')}
                variant="outlined"
                size="small"
              >
                Home
              </Button>
            </Box>
          )}
        </Stack>

        {/* Remove the separate mobile stats section since we moved them to title row */}

        {/* Divider before children */}
        {children && (
          <Divider 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              borderColor: alpha(boardColor, 0.1),
            }} 
          />
        )}

        {/* Children components (controls, filters, stats) */}
        {children}
      </Box>
    </Paper>
  );
};

export default BoardHeader;