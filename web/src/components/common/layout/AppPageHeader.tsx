import React from "react";
import { Box, Button, Chip, CircularProgress, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export interface AppPageHeaderProps {
  title: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  rightActions?: React.ReactNode;
  disableAdd?: boolean;
  mb?: number;
  /** Renders a small secondary line below the title */
  subtitle?: string;
  /** Renders a Chip next to the title showing a count or badge value */
  badge?: number | string;
  /** Disables the Add button and shows a spinner inside it */
  loading?: boolean;
}

/**
 * Reusable header for Admin grid pages (Users, Customers, Applications, Tickets, Tasks, etc.)
 * - Left: Title (string or custom React node) + optional subtitle + optional badge
 * - Right: Optional custom actions + optional primary "Add" button
 */
const AppPageHeader: React.FC<AppPageHeaderProps> = ({
  title,
  onAdd,
  addLabel = "Add",
  rightActions,
  disableAdd = false,
  mb = 3,
  subtitle,
  badge,
  loading = false,
}) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb }}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {typeof title === "string" ? (
            <Typography variant="h4" component="h1">
              {title}
            </Typography>
          ) : (
            title
          )}
          {badge !== undefined && (
            <Chip
              label={badge}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {rightActions}
        {onAdd && (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            onClick={() => onAdd?.()}
            disabled={disableAdd || loading}
          >
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AppPageHeader;

// Legacy alias
export { AppPageHeader as AdminGridHeader };
export type { AppPageHeaderProps as AdminGridHeaderProps };
