import React, { memo } from "react";
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, TextField, InputAdornment } from "@mui/material";
import { Refresh as RefreshIcon, Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import { type User, type Customer, type Application, type Ticket } from "../../../services/api";

type Props = {
  statusFilter: Ticket['status'] | "";
  priorityFilter: string;
  userFilter: string;
  customerFilter: string;
  applicationFilter: string;
  searchQuery: string;
  setStatusFilter: (v: Ticket['status'] | "") => void;
  setPriorityFilter: (v: string) => void;
  setUserFilter: (v: string) => void;
  setCustomerFilter: (v: string) => void;
  setApplicationFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
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
  setStatusFilter,
  setPriorityFilter,
  setUserFilter,
  setCustomerFilter,
  setApplicationFilter,
  setSearchQuery,
  allUsers,
  customers,
  applications,
  loading,
  onRefresh,
}) => {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 1.5, sm: 2 },
        backgroundColor: "background.paper",
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", lg: "center" },
          gap: { xs: 2, lg: 0 },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "text.primary",
            fontSize: {
              xs: "1.1rem",
              sm: "1.25rem",
              md: "1.3rem",
              lg: "1.35rem",
            },
            mb: { xs: 0.5, md: 0 },
          }}
        >
          📋 Ticket Feed
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 1.5, md: 2 },
            alignItems: "center",
            flexWrap: "wrap",
            width: { xs: "100%", lg: "auto" },
            justifyContent: { xs: "flex-start", lg: "flex-end" },
          }}
        >
          <TextField
            size="small"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              minWidth: { xs: 200, sm: 250 },
              flex: { xs: "1 1 100%", lg: "0 0 auto" },
              order: { xs: -1, lg: 0 },
              mb: { xs: 1, lg: 0 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ minWidth: 'auto', p: 0.5 }}
                  >
                    <ClearIcon sx={{ fontSize: 16 }} />
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 110, sm: 120 },
              flex: {
                xs: "1 1 calc(50% - 4px)",
                md: "1 1 calc(33.333% - 8px)",
                lg: "0 0 auto",
              },
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as Ticket['status'] | "")}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="OPEN">🔵 Open</MenuItem>
              <MenuItem value="IN_PROGRESS">🟡 In Progress</MenuItem>
              <MenuItem value="RESOLVED">🟢 Resolved</MenuItem>
              <MenuItem value="CLOSED">⚫ Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 110, sm: 120 },
              flex: {
                xs: "1 1 calc(50% - 4px)",
                md: "1 1 calc(33.333% - 8px)",
                lg: "0 0 auto",
              },
            }}
          >
            <InputLabel>Priority</InputLabel>
            <Select
              value={priorityFilter}
              label="Priority"
              onChange={(e) => setPriorityFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="LOW">🟢 Low</MenuItem>
              <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
              <MenuItem value="HIGH">🔶 High</MenuItem>
              <MenuItem value="URGENT">🔴 Urgent</MenuItem>
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 130, sm: 140 },
              flex: {
                xs: "1 1 calc(50% - 4px)",
                md: "1 1 calc(33.333% - 8px)",
                lg: "0 0 auto",
              },
            }}
          >
            <InputLabel>User</InputLabel>
            <Select
              value={userFilter}
              label="User"
              onChange={(e) => setUserFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Users</MenuItem>
              <MenuItem value="NEW_TICKETS">🆕 New Tickets</MenuItem>
              {allUsers.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: user.role === "ADMIN" ? "#ef4444" : "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {user.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {user.name}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 130, sm: 140 },
              flex: {
                xs: "1 1 calc(50% - 4px)",
                md: "1 1 calc(33.333% - 8px)",
                lg: "0 0 auto",
              },
            }}
          >
            <InputLabel>Customer</InputLabel>
            <Select
              value={customerFilter}
              label="Customer"
              onChange={(e) => setCustomerFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {customer.name.charAt(0)}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {customer.name}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 130, sm: 140 },
              flex: {
                xs: "1 1 calc(50% - 4px)",
                md: "1 1 calc(33.333% - 8px)",
                lg: "0 0 auto",
              },
            }}
          >
            <InputLabel>Application</InputLabel>
            <Select
              value={applicationFilter}
              label="Application"
              onChange={(e) => setApplicationFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="">All Applications</MenuItem>
              {applications.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "#059669",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.7rem",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {app.name.charAt(0)}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {app.name}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            size="small"
            sx={{
              borderRadius: 2,
              minWidth: { xs: "100%", md: "auto" },
              mt: { xs: 1, lg: 0 },
              flex: { xs: "1 1 100%", lg: "0 0 auto" },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>
    </Box>
  );
});

export default DesktopFilters;
