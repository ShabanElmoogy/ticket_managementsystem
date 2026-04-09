import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Toolbar, Typography, Chip, Paper, List, ListItemButton,
  ListItemText, ListItemIcon, Divider, CircularProgress, Avatar,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  Button, Tooltip, IconButton, Tabs, Tab,
} from '@mui/material';
import {
  Code as CodeIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  FiberManualRecord as DotIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { ticketsApi, type Ticket, type Comment } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/dashboard/Header';
import ProgrammingPanel from '../components/programming/ProgrammingPanel';
import AssignProgrammerDialog from '../components/programming/components/AssignProgrammerDialog';
import { useQueryClient } from '@tanstack/react-query';

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN:              { label: 'Open',              color: '#6366f1' },
  IN_PROGRESS:       { label: 'In Progress',       color: '#f59e0b' },
  PROGRAMMING:       { label: 'منتقل إلى البرمجة', color: '#8b5cf6' },
  UNDER_DEVELOPMENT: { label: 'Under Development', color: '#3b82f6' },
  CODE_REVIEW:       { label: 'Code Review',       color: '#06b6d4' },
  TESTING:           { label: 'Testing',           color: '#f97316' },
  RESOLVED:          { label: 'Resolved',          color: '#22c55e' },
  CLOSED:            { label: 'Closed',            color: '#6b7280' },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626',
};

const PROGRAMMING_STATUSES = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED'];

// ── Component ────────────────────────────────────────────────────────────────

const ProgrammingPage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isProgrammer = user?.role === 'PROGRAMMER';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assignProgrammerOpen, setAssignProgrammerOpen] = useState(false);
  const [rightTab, setRightTab] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const selectedTicketRef = useRef<Ticket | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const all = await ticketsApi.getTickets();
      const filtered = isAdmin
        ? all.filter(t => PROGRAMMING_STATUSES.includes(t.status))
        : all;
      setTickets(filtered);
      if (selectedTicketRef.current) {
        const updated = filtered.find(t => t.id === selectedTicketRef.current!.id);
        if (updated) setSelectedTicket(updated);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleSelectTicket = (ticket: Ticket) => {
    selectedTicketRef.current = ticket;
    setSelectedTicket(ticket);
    setRightTab(0);
    setComments([]);
    setNewComment('');
  };

  const fetchComments = useCallback(async (ticketId: string, silent = false) => {
    if (!silent) setCommentsLoading(true);
    try {
      const data = await ticketsApi.getTicket(ticketId);
      setComments(data.comments || []);
    } finally {
      if (!silent) setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rightTab === 2 && selectedTicket) fetchComments(selectedTicket.id);
  }, [rightTab, selectedTicket?.id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicketRef.current || submittingComment) return;
    const ticketId = selectedTicketRef.current.id;
    const content = newComment.trim();
    setNewComment('');
    setSubmittingComment(true);
    try {
      await ticketsApi.addComment(ticketId, content);
      await fetchComments(ticketId, true);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTicketRef.current) return;
    await ticketsApi.deleteComment(selectedTicketRef.current.id, commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleUpdateStatus = async (ticketId: string, status: Ticket['status']) => {
    await ticketsApi.updateTicket(ticketId, { status });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    fetchTickets();
  };

  const getAllowedStatuses = (): Ticket['status'][] => {
    if (isAdmin) return ['OPEN', 'IN_PROGRESS', 'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED', 'CLOSED'];
    return ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED'];
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const visibleTickets = tickets.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header onTicketClick={() => {}} />
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: 'calc(100vh - 70px)' }}>

        {/* ── Left panel: ticket list ── */}
        <Box
          sx={{
            width: { xs: '100%', md: 340 },
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CodeIcon sx={{ fontSize: 18, color: '#fff' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                Programming Tickets
              </Typography>
              <Chip label={visibleTickets.length} size="small" sx={{ ml: 'auto', bgcolor: '#8b5cf6', color: '#fff', fontWeight: 700 }} />
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={fetchTickets} disabled={loading}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Search */}
            <TextField
              size="small"
              fullWidth
              placeholder="Search tickets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ mb: 1 }}
            />

            {/* Status filter */}
            <FormControl size="small" fullWidth>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                {PROGRAMMING_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DotIcon sx={{ fontSize: 10, color: STATUS_CONFIG[s]?.color }} />
                      {STATUS_CONFIG[s]?.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <CircularProgress size={28} />
              </Box>
            ) : visibleTickets.length === 0 ? (
              <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height={200} gap={1}>
                <BugIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary">No tickets found</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {visibleTickets.map((ticket, idx) => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const statusCfg = STATUS_CONFIG[ticket.status] ?? { label: ticket.status, color: '#6b7280' };
                  return (
                    <React.Fragment key={ticket.id}>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => handleSelectTicket(ticket)}
                        sx={{
                          py: 1.5, px: 2,
                          borderLeft: isSelected ? '3px solid #8b5cf6' : '3px solid transparent',
                          '&.Mui-selected': { bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)' },
                          '&.Mui-selected:hover': { bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.1)' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: PRIORITY_COLOR[ticket.priority] + '22', color: PRIORITY_COLOR[ticket.priority], border: `1px solid ${PRIORITY_COLOR[ticket.priority]}44` }}>
                            {ticket.priority[0]}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, mb: 0.5 }} noWrap>
                              {ticket.title}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                              <Chip
                                label={statusCfg.label}
                                size="small"
                                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: statusCfg.color + '22', color: statusCfg.color, border: `1px solid ${statusCfg.color}44` }}
                              />
                              {ticket.programmer && (
                                <Typography variant="caption" color="text.disabled" noWrap>
                                  {ticket.programmer.name}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                      {idx < visibleTickets.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>

        {/* ── Right panel ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedTicket ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2} sx={{ opacity: 0.5 }}>
              <CodeIcon sx={{ fontSize: 64, color: '#8b5cf6' }} />
              <Typography variant="h6" color="text.secondary">Select a ticket to view details</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Ticket title bar */}
              <Box sx={{ px: 3, pt: 2.5, pb: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} mb={1.5}>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{selectedTicket.title}</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                      <Chip
                        label={STATUS_CONFIG[selectedTicket.status]?.label ?? selectedTicket.status}
                        size="small"
                        sx={{ bgcolor: (STATUS_CONFIG[selectedTicket.status]?.color ?? '#6b7280') + '22', color: STATUS_CONFIG[selectedTicket.status]?.color ?? '#6b7280', fontWeight: 700, border: `1px solid ${(STATUS_CONFIG[selectedTicket.status]?.color ?? '#6b7280')}44` }}
                      />
                      <Chip label={selectedTicket.priority} size="small" variant="outlined" sx={{ borderColor: PRIORITY_COLOR[selectedTicket.priority], color: PRIORITY_COLOR[selectedTicket.priority], fontWeight: 600 }} />
                    </Box>
                  </Box>
                  {isAdmin && (
                    <Button size="small" variant="outlined" startIcon={<CodeIcon />} onClick={() => setAssignProgrammerOpen(true)}
                      sx={{ borderColor: '#8b5cf6', color: '#8b5cf6', flexShrink: 0, '&:hover': { borderColor: '#7c3aed', bgcolor: 'rgba(139,92,246,0.05)' } }}>
                      {selectedTicket.programmerId ? 'Reassign' : 'Assign Programmer'}
                    </Button>
                  )}
                </Box>
                <Tabs value={rightTab} onChange={(_, v) => setRightTab(v)} sx={{ minHeight: 36 }}>
                  <Tab icon={<InfoIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Ticket Info" sx={{ fontSize: '0.8rem', minHeight: 36, py: 0 }} />
                  <Tab icon={<CodeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Programming" sx={{ fontSize: '0.8rem', minHeight: 36, py: 0 }} />
                  <Tab icon={<CommentIcon sx={{ fontSize: 16 }} />} iconPosition="start" label={`Comments${selectedTicket._count?.comments ? ` (${selectedTicket._count.comments})` : ''}`} sx={{ fontSize: '0.8rem', minHeight: 36, py: 0 }} />
                </Tabs>
              </Box>

              {/* Tab content */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>

                {/* ── Tab 0: Ticket Info ── */}
                {rightTab === 0 && (
                  <Box>
                    {/* Description */}
                    {selectedTicket.description && (
                      <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>Description</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{selectedTicket.description}</Typography>
                      </Paper>
                    )}

                    {/* Details grid */}
                    <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>Details</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Created By</Typography>
                          <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem' }}>{selectedTicket.createdBy?.name?.[0]}</Avatar>
                            <Typography variant="body2" fontWeight={500}>{selectedTicket.createdBy?.name ?? '—'}</Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Assigned To</Typography>
                          <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
                            {selectedTicket.assignedTo
                              ? <><Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem' }}>{selectedTicket.assignedTo.name[0]}</Avatar><Typography variant="body2" fontWeight={500}>{selectedTicket.assignedTo.name}</Typography></>
                              : <Typography variant="body2" color="text.disabled">Unassigned</Typography>}
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Programmer</Typography>
                          <Box display="flex" alignItems="center" gap={0.75} mt={0.5}>
                            {selectedTicket.programmer
                              ? <><Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#8b5cf6' }}>{selectedTicket.programmer.name[0]}</Avatar><Typography variant="body2" fontWeight={500} sx={{ color: '#8b5cf6' }}>{selectedTicket.programmer.name}</Typography></>
                              : <Typography variant="body2" color="text.disabled">Not assigned</Typography>}
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Customer</Typography>
                          <Typography variant="body2" fontWeight={500} mt={0.5}>{selectedTicket.customer?.name ?? '—'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Application</Typography>
                          <Typography variant="body2" fontWeight={500} mt={0.5}>{selectedTicket.application?.name ?? '—'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Due Date</Typography>
                          <Typography variant="body2" fontWeight={500} mt={0.5}
                            sx={{ color: selectedTicket.dueDate && new Date(selectedTicket.dueDate) < new Date() ? 'error.main' : 'text.primary' }}>
                            {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleDateString() : '—'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Estimated Hours</Typography>
                          <Typography variant="body2" fontWeight={500} mt={0.5}>{selectedTicket.estimatedHours ? `${selectedTicket.estimatedHours}h` : '—'}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.disabled">Created At</Typography>
                          <Typography variant="body2" fontWeight={500} mt={0.5}>{new Date(selectedTicket.createdAt).toLocaleDateString()}</Typography>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Status update */}
                    {(isAdmin || isProgrammer) && (
                      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>Update Status</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {getAllowedStatuses().map(status => (
                            <Button key={status} size="small"
                              variant={selectedTicket.status === status ? 'contained' : 'outlined'}
                              disabled={selectedTicket.status === status}
                              onClick={() => handleUpdateStatus(selectedTicket.id, status)}
                              sx={selectedTicket.status === status
                                ? { bgcolor: STATUS_CONFIG[status]?.color, borderColor: STATUS_CONFIG[status]?.color, '&:hover': { bgcolor: STATUS_CONFIG[status]?.color }, fontSize: '0.7rem' }
                                : { borderColor: STATUS_CONFIG[status]?.color + '88', color: STATUS_CONFIG[status]?.color, '&:hover': { borderColor: STATUS_CONFIG[status]?.color, bgcolor: STATUS_CONFIG[status]?.color + '11' }, fontSize: '0.7rem' }}
                            >
                              {STATUS_CONFIG[status]?.label ?? status.replace(/_/g, ' ')}
                            </Button>
                          ))}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}

                {/* ── Tab 1: Programming Panel ── */}
                {rightTab === 1 && (
                  <ProgrammingPanel
                    ticket={selectedTicket}
                    canEdit={isAdmin || (isProgrammer && selectedTicket.programmerId === user?.id)}
                  />
                )}

                {/* ── Tab 2: Comments ── */}
                {rightTab === 2 && (
                  <Box>
                    {/* Add comment */}
                    <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <Box display="flex" gap={1.5} alignItems="flex-start">
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', mt: 0.5 }}>{user?.name?.[0]}</Avatar>
                        <Box flex={1}>
                          <TextField
                            fullWidth multiline maxRows={4} size="small"
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                            sx={{ mb: 1 }}
                          />
                          <Box display="flex" justifyContent="flex-end">
                            <Button
                              size="small" variant="contained" startIcon={submittingComment ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                              disabled={!newComment.trim() || submittingComment}
                              onClick={handleAddComment}
                              sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                            >
                              Send
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Comments list */}
                    {commentsLoading ? (
                      <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
                    ) : comments.length === 0 ? (
                      <Box display="flex" flexDirection="column" alignItems="center" py={6} gap={1} sx={{ opacity: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography variant="body2" color="text.secondary">No comments yet</Typography>
                      </Box>
                    ) : (
                      <Box display="flex" flexDirection="column" gap={1.5}>
                        {comments.map(comment => (
                          <Paper key={comment.id} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Box display="flex" gap={1.5}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', flexShrink: 0 }}>{comment.user.name[0]}</Avatar>
                              <Box flex={1} minWidth={0}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" fontWeight={600}>{comment.user.name}</Typography>
                                    <Typography variant="caption" color="text.disabled">
                                      {new Date(comment.createdAt).toLocaleString()}
                                    </Typography>
                                  </Box>
                                  {(comment.userId === user?.id || comment.user?.id === user?.id) && (
                                    <IconButton size="small" onClick={() => handleDeleteComment(comment.id)}
                                      sx={{ color: 'error.main', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                                      <DeleteIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {comment.content}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {selectedTicket && (
        <AssignProgrammerDialog
          open={assignProgrammerOpen}
          ticketId={selectedTicket.id}
          onClose={() => setAssignProgrammerOpen(false)}
          onAssigned={() => { fetchTickets(); queryClient.invalidateQueries({ queryKey: ['tickets'] }); }}
        />
      )}
    </Box>
  );
};

export default ProgrammingPage;
