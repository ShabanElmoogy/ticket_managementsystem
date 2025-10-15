/* eslint-disable react/prop-types */
import { Card, CardContent, Box, Typography, Tooltip, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddCircleIcon from '@mui/icons-material/Add';
import type { ReactNode, ElementType } from 'react';

interface MyGridHeaderProps {
  title: ReactNode;
  onAdd?: () => void;
  addButtonText?: string;
  addTooltip?: string;
  rightActions?: ReactNode;
  icon?: ElementType;
}

const MyGridHeader = ({ 
  title, 
  onAdd, 
  addButtonText = "Add", 
  addTooltip = "Add new item",
  rightActions,
  icon: Icon 
}: MyGridHeaderProps) => {
  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 3,
        background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {Icon && (
              <Box 
                sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  backgroundColor: (theme) => theme.palette.primary.main,
                  color: (theme) => theme.palette.primary.contrastText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon />
              </Box>
            )}
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600,
                color: (theme) => theme.palette.text.primary,
                mb: 0
              }}
            >
              {title}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {rightActions}
            {onAdd && (
              <Tooltip title={addTooltip}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleIcon />}
                  onClick={onAdd}
                  size="large"
                  sx={{ 
                  borderRadius: 2,
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                  boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  }}
                  >
                  {addButtonText}
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MyGridHeader;