import React from 'react';
import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

interface BoardFiltersProps {
  filtersOpen: boolean;
  hasActiveFilters: boolean;
  searchFilter: string;
  dueDateFrom: Date | null;
  dueDateTo: Date | null;
  priorityFilter: string;
  assigneeFilter: string;
  customerFilter: string;
  applicationFilter: string;
  createdByFilter: string;
  estimatedHoursMin: number | '';
  estimatedHoursMax: number | '';
  uniqueAssignees: any[];
  uniqueCustomers: any[];
  uniqueApplications: any[];
  uniqueCreators: any[];
  onSearchChange: (value: string) => void;
  onDueDateFromChange: (date: Date | null) => void;
  onDueDateToChange: (date: Date | null) => void;
  onPriorityChange: (value: string) => void;
  onAssigneeChange: (value: string) => void;
  onCustomerChange: (value: string) => void;
  onApplicationChange: (value: string) => void;
  onCreatedByChange: (value: string) => void;
  onEstimatedHoursMinChange: (value: number | '') => void;
  onEstimatedHoursMaxChange: (value: number | '') => void;
  onClearFilters: () => void;
}

const BoardFilters: React.FC<BoardFiltersProps> = ({
  filtersOpen,
  hasActiveFilters,
  searchFilter,
  dueDateFrom,
  dueDateTo,
  priorityFilter,
  assigneeFilter,
  customerFilter,
  applicationFilter,
  createdByFilter,
  estimatedHoursMin,
  estimatedHoursMax,
  uniqueAssignees,
  uniqueCustomers,
  uniqueApplications,
  uniqueCreators,
  onSearchChange,
  onDueDateFromChange,
  onDueDateToChange,
  onPriorityChange,
  onAssigneeChange,
  onCustomerChange,
  onApplicationChange,
  onCreatedByChange,
  onEstimatedHoursMinChange,
  onEstimatedHoursMaxChange,
  onClearFilters
}) => {
  return (
    <Collapse in={filtersOpen}>
      <Box
        sx={{
          mt: 2,
          p: { xs: 1.5, sm: 2 },
          backgroundColor: "background.default",
          borderRadius: 2,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography
            variant="h6"
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            <DateRangeIcon sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} />
            Filters
          </Typography>
          {hasActiveFilters && (
            <Button
              startIcon={<ClearIcon />}
              onClick={onClearFilters}
              size="small"
              variant="outlined"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Clear All
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Clear
              </Box>
            </Button>
          )}
        </Box>

        {/* First Row - Search and Due Dates */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }} mb={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Search"
              placeholder="Search tickets..."
              value={searchFilter}
              onChange={(e) => onSearchChange(e.target.value)}
              size="small"
              fullWidth
            />
          </Grid>

          {/* Due Date From */}
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Due Date From"
              value={dueDateFrom}
              onChange={onDueDateFromChange}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Grid>

          {/* Due Date To */}
          <Grid item xs={12} sm={6} md={4}>
            <DatePicker
              label="Due Date To"
              value={dueDateTo}
              onChange={onDueDateToChange}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Grid>
        </Grid>

        {/* Second Row - Other Filters */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {/* Priority Filter */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => onPriorityChange(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="LOW">🟢 Low</MenuItem>
                <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
                <MenuItem value="HIGH">🟠 High</MenuItem>
                <MenuItem value="URGENT">🔴 Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Assignee Filter */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>
              <Select
                value={assigneeFilter}
                label="Assignee"
                onChange={(e) => onAssigneeChange(e.target.value)}
              >
                <MenuItem value="">All Assignees</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
                {uniqueAssignees.map((assignee) => (
                  <MenuItem key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Customer Filter */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={customerFilter}
                label="Customer"
                onChange={(e) => onCustomerChange(e.target.value)}
              >
                <MenuItem value="">All Customers</MenuItem>
                <MenuItem value="no-customer">No Customer</MenuItem>
                {uniqueCustomers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Application Filter */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Application</InputLabel>
              <Select
                value={applicationFilter}
                label="Application"
                onChange={(e) => onApplicationChange(e.target.value)}
              >
                <MenuItem value="">All Applications</MenuItem>
                <MenuItem value="no-application">No Application</MenuItem>
                {uniqueApplications.map((application) => (
                  <MenuItem key={application.id} value={application.id}>
                    {application.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Created By Filter */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Created By</InputLabel>
              <Select
                value={createdByFilter}
                label="Created By"
                onChange={(e) => onCreatedByChange(e.target.value)}
              >
                <MenuItem value="">All Creators</MenuItem>
                {uniqueCreators.map((creator) => (
                  <MenuItem key={creator.id} value={creator.id}>
                    {creator.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Estimated Hours Min */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Min Hours"
              type="number"
              value={estimatedHoursMin}
              onChange={(e) => onEstimatedHoursMinChange(e.target.value === "" ? "" : Number(e.target.value))}
              size="small"
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>

          {/* Estimated Hours Max */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <TextField
              label="Max Hours"
              type="number"
              value={estimatedHoursMax}
              onChange={(e) => onEstimatedHoursMaxChange(e.target.value === "" ? "" : Number(e.target.value))}
              size="small"
              fullWidth
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Grid>
        </Grid>
      </Box>
    </Collapse>
  );
};

export default BoardFilters;