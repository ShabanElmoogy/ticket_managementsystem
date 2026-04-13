import React, { useState, useEffect } from 'react';
import { Fab, Zoom, Tooltip } from '@mui/material';
import { KeyboardArrowUp as ArrowUpIcon } from '@mui/icons-material';

interface ScrollToTopProps {
  threshold?: number; // Scroll threshold to show the button (default: 300px)
  showProgress?: boolean; // Show scroll progress indicator
  disableFixed?: boolean; // If true, do not use fixed positioning
}

const AppScrollToTop: React.FC<ScrollToTopProps> = ({ 
  threshold = 300, 
  showProgress = true, 
  disableFixed = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.pageYOffset;
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxHeight) * 100;

      setScrollProgress(progress);
      setIsVisible(scrolled > threshold);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          toggleVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Zoom in={isVisible} timeout={300}>
      <Tooltip title="Back to top" placement="left">
        <Fab
          onClick={scrollToTop}
          color="primary"
          size="medium"
          aria-label="scroll back to top"
          sx={{
            position: disableFixed ? 'static' : 'fixed',
            bottom: disableFixed ? undefined : { xs: 80, sm: 24 },
            right: disableFixed ? undefined : 24,
            zIndex: disableFixed ? 'auto' : 1400,
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0px 4px 12px rgba(0, 0, 0, 0.4)' 
              : '0px 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0px 6px 16px rgba(0, 0, 0, 0.5)' 
                : '0px 6px 16px rgba(0, 0, 0, 0.2)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
            transition: 'all 0.2s ease-in-out',
            background: (theme) => theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
            // Progress ring
            ...(showProgress && {
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: '50%',
                background: `conic-gradient(
                  from 0deg,
                  transparent 0deg,
                  transparent ${(360 * scrollProgress) / 100}deg,
                  rgba(255, 255, 255, 0.3) ${(360 * scrollProgress) / 100}deg,
                  rgba(255, 255, 255, 0.3) 360deg
                )`,
                zIndex: -1,
              },
            }),
          }}
        >
          <ArrowUpIcon 
            sx={{ 
              fontSize: 24,
              animation: isVisible ? 'subtleBounce 3s infinite' : 'none',
              '@keyframes subtleBounce': {
                '0%, 85%, 100%': {
                  transform: 'translateY(0)',
                },
                '92.5%': {
                  transform: 'translateY(-2px)',
                },
              },
            }} 
          />
        </Fab>
      </Tooltip>
    </Zoom>
  );
};

export default AppScrollToTop;

// Legacy alias
export { AppScrollToTop as ScrollToTop };