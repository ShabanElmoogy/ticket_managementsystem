import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  Box,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  InputAdornment,
  Slide,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import type { Ticket } from '../../services/api';

const Transition = React.forwardRef<HTMLDivElement, React.ComponentProps<typeof Slide>>(function Transition(
  props,
  ref,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
}

const MobileSearchOverlay: React.FC<MobileSearchOverlayProps> = ({
  open,
  onClose,
  searchQuery,
  onSearchChange,
  tickets,
  onTicketClick,
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentTicketSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      // tickets are already backend-filtered; just cap display to 10
      setFilteredTickets(tickets.slice(0, 10));
    } else {
      setFilteredTickets([]);
    }
  }, [searchQuery, tickets]);

  const handleSearch = (query: string) => {
    onSearchChange(query);
    if (query.trim() && !recentSearches.includes(query)) {
      const newSearches = [query, ...recentSearches.slice(0, 4)]; // Keep only 5 recent searches
      setRecentSearches(newSearches);
      localStorage.setItem('recentTicketSearches', JSON.stringify(newSearches));
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    onTicketClick(ticket);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentTicketSearches');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#3b82f6';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'RESOLVED': return '#10b981';
      case 'CLOSED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      case 'URGENT': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      <AppBar sx={{ position: 'relative', backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 3,
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        {!searchQuery.trim() && recentSearches.length > 0 && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Recent Searches
              </Typography>
              <IconButton size="small" onClick={clearRecentSearches}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
            {recentSearches.map((search, index) => (
              <Chip
                key={index}
                label={search}
                onClick={() => handleSearch(search)}
                onDelete={() => {
                  const newSearches = recentSearches.filter((_, i) => i !== index);
                  setRecentSearches(newSearches);
                  localStorage.setItem('recentTicketSearches', JSON.stringify(newSearches));
                }}
                sx={{ mr: 1, mb: 1 }}
                icon={<HistoryIcon />}
              />
            ))}
          </Box>
        )}

        {searchQuery.trim() && (
          <Box>
            {filteredTickets.length > 0 ? (
              <List>
                {filteredTickets.map((ticket) => (
                  <ListItem
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      py: 2,
                      cursor: 'pointer',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: (ticket.createdBy?.role === 'TENANT_ADMIN' || ticket.createdBy?.role === 'SUPER_ADMIN') ? '#ef4444' : '#10b981',
                          width: 40,
                          height: 40,
                        }}
                      >
                        {ticket.createdBy?.name.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {ticket.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip
                              label={ticket.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                backgroundColor: `${getStatusColor(ticket.status)}20`,
                                color: getStatusColor(ticket.status),
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                            <Chip
                              label={ticket.priority}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: getPriorityColor(ticket.priority),
                                color: getPriorityColor(ticket.priority),
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {ticket.description.length > 100
                            ? `${ticket.description.substring(0, 100)}...`
                            : ticket.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No tickets found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search terms
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {!searchQuery.trim() && recentSearches.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Search Tickets
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Find tickets by title, description, user, or customer
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MobileSearchOverlay;