// components/header/HeaderLogo.tsx
import React from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ConfirmationNumber as TicketIcon } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';

interface HeaderLogoProps {
  mode: "light" | "dark";
}

const HeaderLogo: React.FC<HeaderLogoProps> = ({ mode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      sx={{ 
        flexGrow: 1, 
        cursor: 'pointer',
        '&:hover': { opacity: 0.8 }
      }}
      onClick={() => navigate('/dashboard')}
    >
      <TicketIcon
        sx={{
          mr: { xs: 1, sm: 2 },
          fontSize: { xs: 24, sm: 26, md: 28 },
        }}
      />

      {/* Desktop Title */}
      <Typography
        variant={isSmallMobile ? "h6" : isMobile ? "h5" : "h5"}
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "1.1rem", sm: "1.3rem", md: "1.5rem" },
          background:
            mode === "light"
              ? "linear-gradient(45deg, #ffffff 30%, #f0f9ff 90%)"
              : "linear-gradient(45deg, #f1f5f9 30%, #e2e8f0 90%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: { xs: "none", sm: "block" },
        }}
      >
        Ticket Management
      </Typography>

      {/* Mobile Title */}
      <Typography
        variant="h6"
        component="div"
        sx={{
          fontWeight: 700,
          fontSize: "1rem",
          background:
            mode === "light"
              ? "linear-gradient(45deg, #ffffff 30%, #f0f9ff 90%)"
              : "linear-gradient(45deg, #f1f5f9 30%, #e2e8f0 90%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: { xs: "block", sm: "none" },
        }}
      >
        Tickets
      </Typography>
    </Box>
  );
};

export default HeaderLogo;
