import React, { memo } from "react";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, TextField, InputAdornment } from "@mui/material";
import { Refresh as RefreshIcon, Search as SearchIcon, Clear as ClearIcon, Schedule as ScheduleIcon } from "@mui/icons-material";
import { type User, type Customer, type Application, type Ticket } from "../../../services/api";
import TicketViewToggle from "../../tickets/TicketViewToggle";

type Props = {
  statusFilter: Ticket['status'] | "";
  priorityFilter: string;
  userFilter: string;
  customerFilter: string;
  applicationFilter: string;
  searchQuery: string;
  deletedFilter: 'active' | 'deleted';
  overdueFilter: boolean;
  setStatusFilter: (v: Ticket['status'] | "") => void;
  setPriorityFilter: (v: string) => void;
  setUserFilter: (v: string) => void;
  setCustomerFilter: (v: string) => void;
  setApplicationFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
  setDeletedFilter: (v: 'active' | 'deleted') => void;
  setOverdueFilter: (v: boolean) => void;
  allUsers: User[];
  customers: Customer[];
  applications: Application[];
  loading: boolean;
  onRefresh: () => void;
};

const DesktopFilters: React.FC<Props> = memo(({
  statusFilter,
  priorityFilter,
  userFilter,
  customerFilter,
  applicationFilter,
  searchQuery,
  deletedFilter,
  overdueFilter,
  setStatusFilter,
  setPriorityFilter,
  setUserFilter,
  setCustomerFilter,
  setApplicationFilter,
  setSearchQuery,
  setDeletedFilter,
  setOverdueFilter,
  allUsers,
  customers,
  applications,
  loading,
  onRefresh,
}) => {
  return (
    <Box sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, backgroundColor: 'background.paper', borderRadius: 3 }}>

      {/* Row 1: title + right-side actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 1 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' } }}
        >
          📋 Ticket Feed
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TicketViewToggle />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            size="small"
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Row 2: filter controls */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>

        <TextField
          size="small"
          placeholder="Search tickets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: '1 1 180px', minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Button size="small" onClick={() => setSearchQuery('')} sx={{ minWidth: 'auto', p: 0.5 }}>
                  <ClearIcon sx={{ fontSize: 16 }} />
                </Button>
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 100 }}>
          <InputLabel>Show</InputLabel>
          <Select value={deletedFilter} label="Show" onChange={(e) => setDeletedFilter(e.target.value as 'active' | 'deleted')} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="active">✅ Active</MenuItem>
            <MenuItem value="deleted">🗑️ Deleted</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 100 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value as Ticket['status'] | '')} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="OPEN">🔵 Open</MenuItem>
            <MenuItem value="IN_PROGRESS">🟡 In Progress</MenuItem>
            <MenuItem value="RESOLVED">🟢 Resolved</MenuItem>
            <MenuItem value="CLOSED">⚫ Closed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 110px', minWidth: 100 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="LOW">🟢 Low</MenuItem>
            <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
            <MenuItem value="HIGH">🔶 High</MenuItem>
            <MenuItem value="URGENT">🔴 Urgent</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 120 }}>
          <InputLabel>User</InputLabel>
          <Select value={userFilter} label="User" onChange={(e) => setUserFilter(e.target.value)} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="">All Users</MenuItem>
            <MenuItem value="NEW_TICKETS">🆕 New Tickets</MenuItem>
            {allUsers.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: (user.role === 'TENANT_ADMIN' || user.role === 'SUPER_ADMIN') ? 'error.main' : 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                    {user.name.charAt(0)}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{user.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 120 }}>
          <InputLabel>Customer</InputLabel>
          <Select value={customerFilter} label="Customer" onChange={(e) => setCustomerFilter(e.target.value)} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="">All Customers</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                    {c.name.charAt(0)}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{c.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ flex: '1 1 130px', minWidth: 120 }}>
          <InputLabel>Application</InputLabel>
          <Select value={applicationFilter} label="Application" onChange={(e) => setApplicationFilter(e.target.value)} sx={{ borderRadius: 2 }} MenuProps={{ disableScrollLock: true }}>
            <MenuItem value="">All Applications</MenuItem>
            {applications.map((app) => (
              <MenuItem key={app.id} value={app.id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'success.dark', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                    {app.name.charAt(0)}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{app.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          onClick={() => setOverdueFilter(!overdueFilter)}
          size="small"
          startIcon={<ScheduleIcon sx={{ fontSize: '16px !important', color: overdueFilter ? '#fff' : '#ef4444' }} />}
          sx={{
            flex: '0 0 auto',
            borderRadius: 2,
            px: 1.5,
            fontWeight: 700,
            fontSize: '0.75rem',
            textTransform: 'none',
            border: '1px solid',
            transition: 'all 0.2s',
            color: overdueFilter ? '#fff' : '#ef4444',
            borderColor: overdueFilter ? 'transparent' : 'rgba(239,68,68,0.4)',
            background: overdueFilter ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(239,68,68,0.06)',
            boxShadow: overdueFilter ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
              background: overdueFilter ? 'linear-gradient(135deg, #f87171, #ef4444)' : 'rgba(239,68,68,0.12)',
              borderColor: overdueFilter ? 'transparent' : 'rgba(239,68,68,0.5)',
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          Overdue
        </Button>

      </Box>
    </Box>
  );
});

export default DesktopFilters;
