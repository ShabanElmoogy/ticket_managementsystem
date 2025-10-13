import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export interface AdminGridHeaderProps {
  title: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  rightActions?: React.ReactNode;
  disableAdd?: boolean;
  mb?: number;
}

/**
 * Reusable header for Admin grid pages (Users, Customers, Applications, Tickets, Tasks, etc.)
 * - Left: Title (string or custom React node)
 * - Right: Optional custom actions + optional primary "Add" button
 */
const AdminGridHeader: React.FC<AdminGridHeaderProps> = ({
  title,
  onAdd,
  addLabel = "Add",
  rightActions,
  disableAdd = false,
  mb = 3,
}) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb }}>
      {typeof title === "string" ? (
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
      ) : (
        title
      )}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {rightActions}
        {onAdd && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onAdd?.()}
            disabled={disableAdd}
         >
            {addLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default AdminGridHeader;
