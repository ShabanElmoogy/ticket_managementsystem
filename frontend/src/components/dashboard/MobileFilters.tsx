import React from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { User, Customer, Application } from '../../services/api';

interface MobileFiltersProps {
  statusFilter: string;
  priorityFilter: string;
  userFilter: string;
  customerFilter: string;
  applicationFilter: string;
  searchQuery: string;
  setStatusFilter: (value: string) => void;
  setPriorityFilter: (value: string) => void;
  setUserFilter: (value: string) => void;
  setCustomerFilter: (value: string) => void;
  setApplicationFilter: (value: string) => void;
  setSearchQuery: (value: string) => void;
  allUsers: User[];
  customers: Customer[];
  applications: Application[];
  tickets: any[];
  userRole: string;
  loading: boolean;
  onRefresh: () => void;
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
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
  tickets,
  userRole,
  loading,
  onRefresh,
}) => {
  const hasActiveFilters = !!(statusFilter || priorityFilter || userFilter || customerFilter || applicationFilter || searchQuery);

  const clearAllFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setUserFilter('');
    setCustomerFilter('');
    setApplicationFilter('');
    setSearchQuery('');
  };

  return (
    <Box 
      sx={{ 
        mb: 3,
        p: 1.5,
        backgroundColor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        mb: 2
      }}>
        <Box>
          <Typography 
            variant="h6"
            sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              fontSize: '1.1rem',
              mb: 0.5
            }}
          >
            📋 Ticket Feed
          </Typography>
          {hasActiveFilters && (
            <Typography 
              variant="caption" 
              color="primary.main"
              sx={{ fontWeight: 500 }}
            >
              Filters applied • {tickets.length} result{tickets.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        
        <Button
          variant="outlined"
          onClick={onRefresh}
          disabled={loading}
          size="small"
          sx={{ 
            borderRadius: 2,
            minWidth: 'auto',
            px: 2
          }}
        >
          🔄
        </Button>
      </Box>

      {/* Filter Grid Layout */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search tickets, users, customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
              '&.Mui-focused': {
                backgroundColor: 'background.paper',
              },
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
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery('')}
                  sx={{ p: 0.5 }}
                >
                  <ClearIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Filters Grid - Two per row on mobile */}
        {userRole === 'ADMIN' && (
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            width: '100%'
          }}>
            {/* Priority Filter */}
            <FormControl size="small">
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
                <MenuItem value="HIGH">🟠 High</MenuItem>
                <MenuItem value="URGENT">🔴 Urgent</MenuItem>
              </Select>
            </FormControl>

            {/* User Filter */}
            {allUsers.length > 0 && (
              <FormControl size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={userFilter}
                  label="User"
                  onChange={(e) => setUserFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {allUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: user.role === 'ADMIN' ? '#ef4444' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {user.name.charAt(0)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                          {user.name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Customer Filter */}
            {customers.length > 0 && (
              <FormControl size="small">
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
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        >
                          {customer.name.charAt(0)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                          {customer.name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Application Filter */}
            {applications.length > 0 && (
              <FormControl size="small">
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
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6rem',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        {app.name.charAt(0)}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                        {app.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      )}

      {/* Non-Admin Priority Filter */}
      {userRole !== 'ADMIN' && (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 1,
          width: '100%'
        }}>
          <FormControl size="small">
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
              <MenuItem value="HIGH">🟠 High</MenuItem>
              <MenuItem value="URGENT">🔴 Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

        {/* Filter Summary */}
        {hasActiveFilters && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1.5,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
            fontSize: '0.875rem'
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} found
            </Typography>
            <Button
              size="small"
              onClick={clearAllFilters}
              sx={{ 
                color: 'inherit',
                textDecoration: 'underline',
                minWidth: 'auto',
                p: 0
              }}
            >
              Clear all
            </Button>
          </Box>
        )}

        {/* Quick Filter Chips */}
        {!hasActiveFilters && (
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            mt: 1
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
              Quick status filters:
            </Typography>
            {[
              { label: '🔵 Open', action: () => setStatusFilter('OPEN') },
              { label: '🟡 In Progress', action: () => setStatusFilter('IN_PROGRESS') },
              { label: '🟢 Resolved', action: () => setStatusFilter('RESOLVED') },
              { label: '⚫ Closed', action: () => setStatusFilter('CLOSED') },
            ].map((filter, index) => (
              <Button
                key={index}
                size="small"
                variant="outlined"
                onClick={filter.action}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                  minWidth: 'auto',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                  },
                }}
              >
                {filter.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MobileFilters;