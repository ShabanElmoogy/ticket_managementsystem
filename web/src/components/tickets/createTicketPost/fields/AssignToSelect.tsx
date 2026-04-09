import { memo, useMemo } from "react";
import { Avatar, Box, Chip, FormControl, InputLabel, MenuItem, Select, Typography } from "@mui/material";
import type { Ticket, User } from "../../../../services/api";
import { getInitials } from "../Header";

export interface AssignToSelectProps {
  value: string;
  onChange: (id: string) => void;
  employees: User[];
  tickets?: Ticket[];
}

const AssignToSelect = memo(({ value, onChange, employees, tickets = [] }: AssignToSelectProps) => {
  const todayCountByUser = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const map = new Map<string, number>();
    for (const t of tickets) {
      if (!t.assignedToId || new Date(t.createdAt) < todayStart) continue;
      map.set(t.assignedToId, (map.get(t.assignedToId) ?? 0) + 1);
    }
    return map;
  }, [tickets]);

  return (
    <FormControl size="small" fullWidth>
      <InputLabel>Assign To</InputLabel>
      <Select
        value={value}
        label="Assign To"
        onChange={(e) => onChange(e.target.value)}
        sx={{ borderRadius: 2 }}
        inputProps={{ autoComplete: "off" }}
        MenuProps={{ disableScrollLock: true }}
      >
        <MenuItem value="">Unassigned</MenuItem>
        {employees.map((employee) => {
          const todayCount = todayCountByUser.get(employee.id) ?? 0;
          return (
            <MenuItem key={employee.id} value={employee.id}>
              <Box display="flex" alignItems="center" gap={1} width="100%">
                <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem", flexShrink: 0 }}>
                  {getInitials(employee.name)}
                </Avatar>
                <Typography variant="body2" sx={{ flex: 1 }}>{employee.name}</Typography>
                {todayCount > 0 && (
                  <Chip
                    label={`${todayCount} today`}
                    size="small"
                    color={todayCount >= 5 ? 'error' : 'primary'}
                    sx={{ height: 18, fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
});

AssignToSelect.displayName = "AssignToSelect";
export default AssignToSelect;
