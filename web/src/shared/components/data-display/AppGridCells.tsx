import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import type { CustomerApplication } from "../../../services/api";

// Reusable DataGrid cell renderers

export const VersionCell: React.FC<{ value?: string | null }> = ({ value }) => (
  <Chip label={value || "N/A"} size="small" color="info" variant="outlined" />
);

export const CustomersCell: React.FC<{ customers?: CustomerApplication[] }> = ({ customers }) => {
  if (!customers || customers.length === 0) return <Typography variant="body2">-</Typography>;
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 1 }}>
      {customers.map((ca) => (
        <Chip
          key={ca.customerId}
          label={ca.customer?.name}
          size="small"
          color="secondary"
          variant="outlined"
        />
      ))}
    </Box>
  );
};

export const CountChip: React.FC<{ count: number; color?: "primary" | "success" }> = ({ count, color = "primary" }) => (
  <Chip label={count} size="small" color={color} />
);

export const StatusCell: React.FC<{ active?: boolean }> = ({ active }) => (
  <Chip label={active ? "Active" : "Inactive"} color={active ? "success" : "default"} size="small" />
);

export default {
  VersionCell,
  CustomersCell,
  CountChip,
  StatusCell,
};
