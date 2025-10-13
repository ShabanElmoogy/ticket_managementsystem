import React from "react";
import { Chip, type ChipProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export type ChipVariant =
  | "customer"
  | "application"
  | "priority"
  | "status"
  | "role";

interface MyChipProps extends Omit<ChipProps, "variant"> {
  variant: ChipVariant;
  priorityColor?: string;
  statusColor?: string;
  children?: React.ReactNode;
}

const MyChip: React.FC<MyChipProps> = ({
  variant,
  priorityColor,
  statusColor,
  children,
  ...chipProps
}) => {
  const theme = useTheme();

  const getChipStyles = () => {
    const baseStyles = {
      fontWeight: 700,
      height: { xs: 32, sm: 36, md: 40 },
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "& .MuiChip-label": {
        fontWeight: 700,
      },
    };

    switch (variant) {
      case "customer":
        return {
          ...baseStyles,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)"
              : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
          color: "#2563eb",
          fontSize: {
            xs: "0.7rem",
            sm: "0.75rem",
            md: "0.8rem",
            lg: "0.75rem",
          },
          width: { xs: "100%", sm: "auto", lg: "auto" },
          maxWidth: {
            xs: "none",
            sm: "180px",
            md: "200px",
            lg: "none",
          },
          minWidth: { xs: "auto", sm: "100px", lg: "auto" },
          border: `1.5px solid ${
            theme.palette.mode === "dark"
              ? "rgba(59, 130, 246, 0.4)"
              : "rgba(37, 99, 235, 0.3)"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 8px rgba(59, 130, 246, 0.2)"
              : "0 4px 8px rgba(59, 130, 246, 0.15)",
          "&:hover": {
            transform: "translateY(-2px) scale(1.02)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 16px rgba(59, 130, 246, 0.3)"
                : "0 8px 16px rgba(59, 130, 246, 0.2)",
            borderColor: "#2563eb",
          },
          "& .MuiChip-label": {
            px: { xs: 1.5, sm: 2, md: 2.5, lg: 2 },
            fontSize: {
              xs: "0.7rem",
              sm: "0.75rem",
              md: "0.8rem",
              lg: "0.75rem",
            },
            fontWeight: 700,
            overflow: { xs: "hidden", lg: "visible" },
            textOverflow: { xs: "ellipsis", lg: "clip" },
            whiteSpace: { xs: "nowrap", lg: "normal" },
            maxWidth: { xs: "100%", lg: "none" },
            justifyContent: { xs: "center", sm: "flex-start" },
          },
        };

      case "application":
        return {
          ...baseStyles,
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)"
              : "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          color: "#059669",
          fontSize: {
            xs: "0.7rem",
            sm: "0.75rem",
            md: "0.8rem",
            lg: "0.75rem",
          },
          width: { xs: "100%", sm: "auto", lg: "auto" },
          maxWidth: {
            xs: "none",
            sm: "180px",
            md: "200px",
            lg: "none",
          },
          minWidth: { xs: "auto", sm: "100px", lg: "auto" },
          border: `1.5px solid ${
            theme.palette.mode === "dark"
              ? "rgba(16, 185, 129, 0.4)"
              : "rgba(5, 150, 105, 0.3)"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 4px 8px rgba(16, 185, 129, 0.2)"
              : "0 4px 8px rgba(16, 185, 129, 0.15)",
          "&:hover": {
            transform: "translateY(-2px) scale(1.02)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 16px rgba(16, 185, 129, 0.3)"
                : "0 8px 16px rgba(16, 185, 129, 0.2)",
            borderColor: "#059669",
          },
          "& .MuiChip-label": {
            px: { xs: 1.5, sm: 2, md: 2.5, lg: 2 },
            fontSize: {
              xs: "0.7rem",
              sm: "0.75rem",
              md: "0.8rem",
              lg: "0.75rem",
            },
            fontWeight: 700,
            overflow: { xs: "hidden", lg: "visible" },
            textOverflow: { xs: "ellipsis", lg: "clip" },
            whiteSpace: { xs: "nowrap", lg: "normal" },
            maxWidth: { xs: "100%", lg: "none" },
            justifyContent: { xs: "center", sm: "flex-start" },
          },
        };

      case "priority":
        return {
          ...baseStyles,
          borderColor: priorityColor,
          color: priorityColor,
          fontSize: {
            xs: "0.65rem",
            sm: "0.7rem",
            md: "0.75rem",
            lg: "0.65rem",
          },
          width: { xs: "100%", sm: "auto", lg: "auto" },
          minWidth: { xs: "auto", sm: "85px", md: "95px", lg: "auto" },
          borderWidth: "2px",
          border: `2px solid ${priorityColor}`,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${priorityColor}20 0%, ${priorityColor}10 100%)`
              : `linear-gradient(135deg, ${priorityColor}15 0%, ${priorityColor}08 100%)`,
          boxShadow:
            theme.palette.mode === "dark"
              ? `0 3px 8px ${priorityColor}25`
              : `0 3px 8px ${priorityColor}20`,
          "&:hover": {
            transform: "translateY(-2px) scale(1.05)",
            borderColor: priorityColor,
            boxShadow:
              theme.palette.mode === "dark"
                ? `0 6px 16px ${priorityColor}35`
                : `0 6px 16px ${priorityColor}30`,
          },
          "& .MuiChip-label": {
            px: { xs: 1, sm: 1.5, md: 2, lg: 1.5 },
            fontSize: {
              xs: "0.65rem",
              sm: "0.7rem",
              md: "0.75rem",
              lg: "0.65rem",
            },
            fontWeight: 700,
            justifyContent: { xs: "center", sm: "flex-start" },
          },
        };

      case "status":
        return {
          ...baseStyles,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(135deg, ${statusColor}35 0%, ${statusColor}20 100%)`
              : `linear-gradient(135deg, ${statusColor}25 0%, ${statusColor}15 100%)`,
          color: statusColor,
          fontSize: {
            xs: "0.65rem",
            sm: "0.7rem",
            md: "0.75rem",
            lg: "0.65rem",
          },
          width: { xs: "100%", sm: "auto", lg: "auto" },
          minWidth: { xs: "auto", sm: "100px", md: "110px", lg: "auto" },
          border: `2px solid ${statusColor}60`,
          boxShadow:
            theme.palette.mode === "dark"
              ? `0 3px 8px ${statusColor}25`
              : `0 3px 8px ${statusColor}20`,
          "&:hover": {
            transform: "translateY(-2px) scale(1.05)",
            borderColor: statusColor,
            boxShadow:
              theme.palette.mode === "dark"
                ? `0 6px 16px ${statusColor}35`
                : `0 6px 16px ${statusColor}30`,
          },
          "& .MuiChip-label": {
            px: { xs: 1, sm: 1.5, md: 2, lg: 1.5 },
            fontSize: {
              xs: "0.65rem",
              sm: "0.7rem",
              md: "0.75rem",
              lg: "0.65rem",
            },
            fontWeight: 700,
            justifyContent: { xs: "center", sm: "flex-start" },
          },
        };

      case "role":
        return {
          ...baseStyles,
          height: { xs: 32, sm: 36, md: 40 },
          fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
          fontWeight: 600,
          background:
            chipProps.label === "ADMIN"
              ? theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)"
                : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)"
              : theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)"
              : "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
          color: chipProps.label === "ADMIN" ? "#dc2626" : "#16a34a",
          border: `1px solid ${
            chipProps.label === "ADMIN"
              ? theme.palette.mode === "dark"
                ? "rgba(239, 68, 68, 0.3)"
                : "rgba(220, 38, 38, 0.2)"
              : theme.palette.mode === "dark"
              ? "rgba(16, 185, 129, 0.3)"
              : "rgba(5, 150, 105, 0.2)"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 2px 4px rgba(0, 0, 0, 0.2)"
              : "0 2px 4px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 4px 8px rgba(0, 0, 0, 0.3)"
                : "0 4px 8px rgba(0, 0, 0, 0.15)",
          },
        };

      default:
        return baseStyles;
    }
  };

  return (
    <Chip
      {...chipProps}
      variant={variant === "priority" ? "outlined" : "filled"}
      sx={{
        ...getChipStyles(),
        ...chipProps.sx,
      }}
      label={children || chipProps.label}
    ></Chip>
  );
};

export default MyChip;
