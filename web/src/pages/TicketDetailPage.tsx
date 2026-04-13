import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import {
  Box, Typography, Chip, Avatar, Button, Tabs, Tab, Paper,
  IconButton, CircularProgress,
  Tooltip, Alert, Skeleton, LinearProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Comment as CommentIcon,
  AttachFile as AttachIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Apps as AppsIcon,
  Code as CodeIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  Timer as TimerIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsApi, type TicketWithComments, type Ticket, type TicketActivity } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { formatDateTime, formatDate, formatRelativeDuration } from '../shared/utils/dateUtils';
import AttachmentsPanel from '../components/tickets/AttachmentsPanel';
import Header from '../components/dashboard/Header';
import WatcherButton from '../components/tickets/WatcherButton';
import MentionTextField, { renderWithMentions, type MentionUser } from '../components/tickets/MentionTextField';
import { usersApi } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6', IN_PROGRESS: '#f59e0b', PROGRAMMING: '#8b5cf6',
  UNDER_DEVELOPMENT: '#6366f1', CODE_REVIEW: '#0ea5e9',
  TESTING: '#f97316', RESOLVED: '#10b981', CLOSED: '#6b7280',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', URGENT: '#dc2626',
};
const ACTIVITY_COLORS: Record<string, string> = {
  CREATED: '#10b981', STATUS_CHANGED: '#3b82f6', PRIORITY_CHANGED: '#f59e0b',
  ASSIGNED: '#8b5cf6', REASSIGNED: '#0ea5e9', COMMENTED: '#6366f1',
  COMMENT_DELETED: '#ef4444', DELETED: '#ef4444', RESTORED: '#10b981',
};

function getActivityLabel(a: TicketActivity): string {
  switch (a.action) {
    case 'CREATED': return 'created this ticket';
    case 'STATUS_CHANGED': return `changed status to ${a.newValue?.replace(/_/g, ' ')}`;
    case 'PRIORITY_CHANGED': return `changed priority to ${a.newValue}`;
    case 'ASSIGNED': return 'took this ticket';
    case 'REASSIGNED': return a.description;
    case 'COMMENTED': return a.newValue ? `commented: ${a.newValue}` : 'added a comment';
    case 'COMMENT_DELETED': return 'deleted a comment';
    case 'UPDATED': return a.description || 'updated this ticket';
    case 'DELETED': return 'deleted this ticket';
    case 'RESTORED': return 'restored this ticket';
    default: return a.description;
  }
}

// ── Tab panel ─────────────────────────────────────────────────────────────────
const TabPanel: React.FC<{ value: number; index: number; children: React.ReactNode }> = ({ value, index, children }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: { xs: 2, md: 3 } }}>
    {value === index && children}
  </Box>
);

// ── SectionLabel ──────────────────────────────────────────────────────────────
const SectionLabel: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <Box sx={{
    px: 2.5, py: 0.75,
    display: 'flex', alignItems: 'center', gap: 0.75,
    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
    borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider',
  }}>
    <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
    <Typography variant="caption" fontWeight={700} color="text.disabled"
      sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem' }}>
      {label}
    </Typography>
  </Box>
);

// ── DetailRow ─────────────────────────────────────────────────────────────────
const DetailRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  last?: boolean;
}> = ({ icon, label, value, last }) => (
  <Box sx={{
    px: 2.5, py: 1.25,
    display: 'flex', alignItems: 'center', gap: 1.5,
    borderBottom: last ? 'none' : '1px solid',
    borderColor: 'divider',
    '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' },
    transition: 'background 0.15s',
  }}>
    <Box sx={{ display: 'flex', flexShrink: 0, mt: 0.25 }}>{icon}</Box>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, minWidth: 0 }}>{value}</Box>
  </Box>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, tenantSuspended } = useAuthStore();
  const queryClient = useQueryClient();

  const [ticket, setTicket] = useState<TicketWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Comments
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Status update
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const readonly = !!tenantSuspended;
  const PROGRAMMING_STATUSES = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
  const canUpdateStatus = !readonly && (isAdmin || (ticket?.assignedTo?.id === user?.id && !PROGRAMMING_STATUSES.includes(ticket?.status ?? '')));
  const isOverdue = !!ticket?.dueDate && new Date(ticket.dueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(ticket.status);

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  const { data: employeesData = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.getEmployees(),
    staleTime: 300_000,
  });
  const mentionUsers = employeesData.map((u) => ({ id: u.id, name: u.name }));

  const fetchTicket = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.getTicket(id);
      setTicket({ ...data, comments: [...(data.comments ?? [])].reverse() });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: Ticket['status']) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    try {
      await ticketsApi.updateTicket(ticket.id, { status });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      await fetchTicket();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !ticket) return;
    setSubmittingComment(true);
    try {
      const comment = await ticketsApi.addComment(ticket.id, newComment.trim());
      setNewComment('');
      setTicket((prev) => prev ? { ...prev, comments: [comment, ...(prev.comments ?? [])] } : prev);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!ticket) return;
    setDeletingCommentId(commentId);
    try {
      await ticketsApi.deleteComment(ticket.id, commentId);
      await fetchTicket();
    } finally {
      setDeletingCommentId(null);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box>
        <Header onTicketClick={() => {}} />
        <Box sx={{ px: { xs: 2, md: 4 }, pt: 12, pb: 6 }}>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box>
        <Header onTicketClick={() => {}} />
        <Box sx={{ px: 4, pt: 12 }}>
          <Alert severity="error" action={<Button onClick={fetchTicket}>Retry</Button>}>
            {error ?? 'Ticket not found'}
          </Alert>
        </Box>
      </Box>
    );
  }

  const statusColor = STATUS_COLORS[ticket.status] ?? '#6b7280';
  const priorityColor = PRIORITY_COLORS[ticket.priority] ?? '#6b7280';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Header onTicketClick={() => {}} />

      {/* ── Content area below fixed header ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, pt: { xs: '56px', sm: '64px', md: '70px' } }}>

        {/* ── Title bar ── */}
        <Box sx={{ px: { xs: 2, md: 4 }, py: 2, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate(-1)}
              variant="outlined"
              size="small"
              sx={{ flexShrink: 0, alignSelf: 'center' }}
            >
              Back
            </Button>
            <Box flex={1} minWidth={0}>
              <Typography variant="h6" fontWeight={700} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                {ticket.title}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mt={0.75} alignItems="center">
                <Chip
                  label={ticket.status.replace(/_/g, ' ')}
                  size="small"
                  sx={{ bgcolor: `${statusColor}22`, color: statusColor, fontWeight: 700, border: `1px solid ${statusColor}44` }}
                />
                <Chip
                  label={ticket.priority}
                  size="small"
                  variant="outlined"
                  sx={{ color: priorityColor, borderColor: priorityColor, fontWeight: 700 }}
                />
                {isOverdue && (
                  <Chip label="⏰ OVERDUE" size="small" color="error" sx={{ fontWeight: 700 }} />
                )}
                <Typography variant="caption" color="text.secondary">#{ticket.id.slice(-8)}</Typography>
              </Box>
            </Box>
            <WatcherButton ticketId={ticket.id} />
          </Box>
        </Box>

        {/* ── Tabs + content ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, px: { xs: 2, md: 4 }, py: 2 }}>
          <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, borderRadius: 3, overflow: 'hidden' }}>

            {/* Tab bar — fixed */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, flexShrink: 0 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
                <Tab icon={<InfoIcon fontSize="small" />} iconPosition="start" label="Overview" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
                <Tab icon={<CommentIcon fontSize="small" />} iconPosition="start" label={`Comments (${ticket.comments?.length ?? 0})`} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
                <Tab icon={<AttachIcon fontSize="small" />} iconPosition="start" label="Attachments" sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
                <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label={`Activity (${ticket.activities?.length ?? 0})`} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 52 }} />
              </Tabs>
            </Box>

            {/* ── Tab 0: Overview ── */}
            <TabPanel value={tab} index={0}>
              <Grid container spacing={3}>

                {/* ── Left: description + status ── */}
                <Grid size={{ xs: 12, md: 8 }}>

                  {/* Description card */}
                  <Paper
                    variant="outlined"
                    sx={{
                      borderRadius: 3, mb: 3, overflow: 'hidden',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{
                      px: 2.5, py: 1.5,
                      background: (t) => t.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(99,102,241,0.04) 100%)',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex', alignItems: 'center', gap: 1,
                    }}>
                      <InfoIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      <Typography variant="caption" fontWeight={700} color="primary.main"
                        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Description
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2.5 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap', lineHeight: 1.9,
                          color: ticket.description ? 'text.primary' : 'text.disabled',
                          fontStyle: ticket.description ? 'normal' : 'italic',
                        }}
                      >
                        {ticket.description || 'No description provided.'}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Status update card */}
                  {canUpdateStatus && (
                    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: 'divider' }}>
                      <Box sx={{
                        px: 2.5, py: 1.5,
                        background: (t) => t.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        borderBottom: '1px solid', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', gap: 1,
                      }}>
                        <RefreshIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary"
                          sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                          Update Status
                        </Typography>
                        {updatingStatus && <CircularProgress size={12} sx={{ ml: 'auto' }} />}
                      </Box>
                      <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {([
                          'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED',
                          ...(isAdmin ? ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'] : []),
                        ] as Ticket['status'][]).map((s) => {
                          const active = ticket.status === s;
                          const color = STATUS_COLORS[s] ?? '#6b7280';
                          return (
                            <Button
                              key={s}
                              size="small"
                              disabled={active || updatingStatus}
                              onClick={() => handleStatusUpdate(s)}
                              sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                fontSize: '0.75rem', px: 1.5, py: 0.6,
                                border: '1px solid',
                                borderColor: active ? 'transparent' : `${color}55`,
                                color: active ? '#fff' : color,
                                bgcolor: active ? color : `${color}11`,
                                '&:hover': { bgcolor: `${color}22`, borderColor: color },
                                '&.Mui-disabled': {
                                  bgcolor: active ? color : 'transparent',
                                  color: active ? '#fff' : `${color}88`,
                                  borderColor: active ? 'transparent' : `${color}33`,
                                },
                              }}
                            >
                              {active && <CheckCircleIcon sx={{ fontSize: 13, mr: 0.5 }} />}
                              {s.replace(/_/g, ' ')}
                            </Button>
                          );
                        })}
                      </Box>
                    </Paper>
                  )}
                </Grid>

                {/* ── Right: details panel ── */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', borderColor: 'divider' }}>

                    {/* Panel header */}
                    <Box sx={{
                      px: 2.5, py: 1.5,
                      background: (t) => t.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary"
                        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Ticket Details
                      </Typography>
                    </Box>

                    {/* ── People section ── */}
                    <SectionLabel icon={<PersonIcon sx={{ fontSize: 13 }} />} label="People" />

                    <DetailRow
                      icon={<PersonIcon sx={{ fontSize: 15, color: 'primary.main' }} />}
                      label="Created by"
                      value={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                            {ticket.createdBy?.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>{ticket.createdBy?.name ?? '—'}</Typography>
                        </Box>
                      }
                    />

                    <DetailRow
                      icon={<PersonIcon sx={{ fontSize: 15, color: ticket.assignedTo ? 'success.main' : 'text.disabled' }} />}
                      label="Assigned to"
                      value={
                        ticket.assignedTo ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: 'success.main' }}>
                              {ticket.assignedTo.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>{ticket.assignedTo.name}</Typography>
                          </Box>
                        ) : (
                          <Chip label="Unassigned" size="small"
                            sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'action.hover', color: 'text.secondary' }} />
                        )
                      }
                    />

                    {ticket.programmer && (
                      <DetailRow
                        icon={<CodeIcon sx={{ fontSize: 15, color: '#8b5cf6' }} />}
                        label="Programmer"
                        value={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#8b5cf6' }}>
                              {ticket.programmer.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" fontWeight={500}>{ticket.programmer.name}</Typography>
                          </Box>
                        }
                      />
                    )}

                    {/* ── Links section ── */}
                    {(ticket.customer || ticket.application) && (
                      <>
                        <SectionLabel icon={<BusinessIcon sx={{ fontSize: 13 }} />} label="Linked To" />

                        {ticket.customer && (
                          <DetailRow
                            icon={<BusinessIcon sx={{ fontSize: 15, color: '#0ea5e9' }} />}
                            label="Customer"
                            value={
                              <Chip
                                label={ticket.customer.name}
                                size="small"
                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600,
                                  bgcolor: 'rgba(14,165,233,0.1)', color: '#0ea5e9',
                                  border: '1px solid rgba(14,165,233,0.3)' }}
                              />
                            }
                          />
                        )}

                        {ticket.application && (
                          <DetailRow
                            icon={<AppsIcon sx={{ fontSize: 15, color: '#f97316' }} />}
                            label="Application"
                            value={
                              <Chip
                                label={ticket.application.name}
                                size="small"
                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600,
                                  bgcolor: 'rgba(249,115,22,0.1)', color: '#f97316',
                                  border: '1px solid rgba(249,115,22,0.3)' }}
                              />
                            }
                          />
                        )}
                      </>
                    )}

                    {/* ── Dates & Time section ── */}
                    <SectionLabel icon={<CalendarIcon sx={{ fontSize: 13 }} />} label="Dates & Time" />

                    {ticket.dueDate && (
                      <DetailRow
                        icon={<ScheduleIcon sx={{ fontSize: 15, color: isOverdue ? 'error.main' : 'warning.main' }} />}
                        label="Due date"
                        value={
                          <Box display="flex" alignItems="center" gap={0.75}>
                            <Typography variant="body2" fontWeight={600}
                              sx={{ color: isOverdue ? 'error.main' : 'text.primary' }}>
                              {formatDate(ticket.dueDate)}
                            </Typography>
                            {isOverdue && (
                              <Chip label="Overdue" size="small" color="error"
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                            )}
                          </Box>
                        }
                      />
                    )}

                    {(ticket.estimatedHours != null || ticket.actualHours != null) && (
                      <DetailRow
                        icon={<TimerIcon sx={{ fontSize: 15, color: 'text.secondary' }} />}
                        label="Hours"
                        value={
                          <Box>
                            {ticket.estimatedHours != null && ticket.actualHours != null ? (
                              <Box>
                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                  <Typography variant="caption" color="text.secondary">
                                    {ticket.actualHours}h / {ticket.estimatedHours}h
                                  </Typography>
                                  <Typography variant="caption" fontWeight={700}
                                    sx={{ color: ticket.actualHours > ticket.estimatedHours ? 'error.main' : 'success.main' }}>
                                    {Math.round((ticket.actualHours / ticket.estimatedHours) * 100)}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((ticket.actualHours / ticket.estimatedHours) * 100, 100)}
                                  color={ticket.actualHours > ticket.estimatedHours ? 'error' : 'success'}
                                  sx={{ height: 5, borderRadius: 3 }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" fontWeight={500}>
                                {ticket.estimatedHours != null ? `Est: ${ticket.estimatedHours}h` : `Actual: ${ticket.actualHours}h`}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    )}

                    <DetailRow
                      icon={<AccessTimeIcon sx={{ fontSize: 15, color: 'text.disabled' }} />}
                      label="Created"
                      value={
                        <Tooltip title={formatDateTime(ticket.createdAt)}>
                          <Typography variant="body2" sx={{ cursor: 'default' }}>
                            {formatRelativeDuration(ticket.createdAt)}
                          </Typography>
                        </Tooltip>
                      }
                    />

                    <DetailRow
                      icon={<AccessTimeIcon sx={{ fontSize: 15, color: 'text.disabled' }} />}
                      label="Updated"
                      value={
                        <Tooltip title={formatDateTime(ticket.updatedAt)}>
                          <Typography variant="body2" sx={{ cursor: 'default' }}>
                            {formatRelativeDuration(ticket.updatedAt)}
                          </Typography>
                        </Tooltip>
                      }
                      last
                    />

                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* ── Tab 1: Comments ── */}
            <TabPanel value={tab} index={1}>
              {/* Add comment */}
              {!readonly && (
                <Box display="flex" gap={2} mb={3} alignItems="flex-start">
                  <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box flex={1}>
                    <MentionTextField
                      value={newComment}
                      onChange={setNewComment}
                      onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment(); }}
                      users={mentionUsers}
                      placeholder="Write a comment... use @ to mention someone"
                      minRows={2}
                      maxRows={6}
                      disabled={submittingComment}
                    />
                    <Box display="flex" justifyContent="flex-end" mt={1}>
                      <Button
                        variant="contained"
                        size="small"
                        endIcon={submittingComment ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                        disabled={!newComment.trim() || submittingComment}
                        onClick={handleAddComment}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Comment
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Comment list */}
              {ticket.comments?.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <CommentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No comments yet</Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={2}>
                  {(ticket.comments ?? []).map((c) => (
                    <Box key={c.id} display="flex" gap={2}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', flexShrink: 0 }}>
                        {c.user?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="subtitle2" fontWeight={600}>{c.user?.name}</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(c.createdAt)}
                            </Typography>
                            {(c.userId === user?.id || c.user?.id === user?.id) && (
                              <Tooltip title="Delete comment">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteComment(c.id)}
                                  disabled={deletingCommentId === c.id}
                                >
                                  {deletingCommentId === c.id
                                    ? <CircularProgress size={14} />
                                    : <DeleteIcon fontSize="small" />}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                          {renderWithMentions(c.content, mentionUsers)}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>

            {/* ── Tab 2: Attachments ── */}
            <TabPanel value={tab} index={2}>
              <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <AttachmentsPanel ticketId={ticket.id} readonly={readonly} />
              </Box>
            </TabPanel>
            {/* ── Tab 3: Activity ── */}
            <TabPanel value={tab} index={3}>
              {ticket.activities?.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No activity recorded yet</Typography>
                </Box>
              ) : (
                <Box>
                  {ticket.activities?.map((a, i) => {
                    const isMentioned = a.action === 'COMMENTED' && !!a.newValue && !!user?.name && a.newValue.toLowerCase().includes(`@${user.name.toLowerCase()}`);
                    return (
                    <Box key={a.id} display="flex" gap={2}>
                      <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: ACTIVITY_COLORS[a.action] ?? '#6b7280', boxShadow: `0 0 0 3px ${(ACTIVITY_COLORS[a.action] ?? '#6b7280')}33` }}>
                          {a.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        {i < (ticket.activities?.length ?? 0) - 1 && (
                          <Box sx={{ width: 2, flex: 1, minHeight: 20, my: 0.5, bgcolor: 'divider', borderRadius: 1 }} />
                        )}
                      </Box>
                      <Box pb={i < (ticket.activities?.length ?? 0) - 1 ? 2 : 0} flex={1} minWidth={0}>
                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: isMentioned ? 'primary.main' : 'divider', bgcolor: isMentioned ? (t) => t.palette.mode === 'dark' ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.06)' : 'transparent' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5} flexWrap="wrap" gap={1}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight={600}>{a.user?.name}</Typography>
                              <Chip label={a.action.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${ACTIVITY_COLORS[a.action] ?? '#6b7280'}22`, color: ACTIVITY_COLORS[a.action] ?? '#6b7280', border: `1px solid ${ACTIVITY_COLORS[a.action] ?? '#6b7280'}44` }} />
                              {isMentioned && <Chip label="mentioned you" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'primary.main', color: '#fff' }} />}
                            </Box>
                            <Tooltip title={formatDateTime(a.createdAt)}>
                              <Typography variant="caption" color="text.disabled" sx={{ cursor: 'default', whiteSpace: 'nowrap' }}>
                                {formatRelativeDuration(a.createdAt)}
                              </Typography>
                            </Tooltip>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{renderWithMentions(getActivityLabel(a), mentionUsers)}</Typography>
                        </Paper>
                      </Box>
                    </Box>
                    );
                  })}
                </Box>
              )}
            </TabPanel>

          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default TicketDetailPage;
