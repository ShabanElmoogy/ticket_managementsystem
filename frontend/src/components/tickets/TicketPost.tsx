import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  TextField,
  Badge,
  Paper,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Comment as CommentIcon,
  Assignment as TakeIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  RestoreFromTrash as RestoreIcon,
  History as HistoryIcon,
  OpenInFull as MaximizeIcon,
  CloseFullscreen as MinimizeIcon,
  Close as CloseIcon,
  Code as CodeIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { formatDate, formatDateTime, formatRelativeDuration } from "../../utils/dateUtils";
import type { Ticket, Comment } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { ticketsApi } from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import MyChip from "../common/MyChip";
import { type TicketActivity } from '../../services/api';
import AssignProgrammerDialog from '../programming/components/AssignProgrammerDialog';

interface TicketPostProps {
  ticket: Ticket;
  onTakeTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: Ticket['status']) => void;
  onAddComment: (ticketId: string, content: string) => void;
  onTicketClick: (ticket: Ticket) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

const TicketPost: React.FC<TicketPostProps> = ({
  ticket,
  onTakeTicket,
  onUpdateStatus,
  onAddComment,
  onTicketClick,
  onDeleteTicket: _onDeleteTicket,
}) => {
  const { user, token, tenantSuspended } = useAuthStore();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityMaximized, setActivityMaximized] = useState(false);
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesFetched, setActivitiesFetched] = useState(false);
  const [assignProgrammerOpen, setAssignProgrammerOpen] = useState(false);

  const isAdmin = user?.role === 'TENANT_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDeleted = !!ticket.deletedAt;
  const readonly = !!tenantSuspended;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusUpdate = (status: Ticket['status']) => {
    onUpdateStatus(ticket.id, status);
    handleMenuClose();
  };

  const fetchComments = async () => {
    if (!token) return;
    try {
      const ticketDetails = await ticketsApi.getTicket(ticket.id);
      const sortedComments = (ticketDetails.comments || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setComments(sortedComments);
      setCommentsFetched(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !token || submitting) return;
    const content = newComment.trim();
    setNewComment("");
    setSubmitting(true);
    try {
      await onAddComment(ticket.id, content);
      fetchComments();
      setVisibleCommentsCount(3);
    } catch (error) {
      console.error("Error adding comment:", error);
      setNewComment(content);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await ticketsApi.deleteComment(ticket.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleShowComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsFetched) {
      fetchComments();
    }
    setVisibleCommentsCount(3);
  };

  const handleLoadMoreComments = () => {
    setLoadingMoreComments(true);
    setTimeout(() => {
      setVisibleCommentsCount((prev) => prev + 3);
      setLoadingMoreComments(false);
    }, 500); // Small delay to show loading state
  };

  useEffect(() => {
    if (ticket._count?.comments && ticket._count.comments > 0 && !commentsFetched) {
      fetchComments();
      setShowComments(true);
    }
  }, [ticket.id]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.ticketId === ticket.id) fetchComments();
    };
    window.addEventListener('commentDeleted', handler);
    return () => window.removeEventListener('commentDeleted', handler);
  }, [ticket.id]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "#3b82f6";
      case "IN_PROGRESS":
        return "#f59e0b";
      case "RESOLVED":
        return "#10b981";
      case "CLOSED":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "#10b981";
      case "MEDIUM":
        return "#f59e0b";
      case "HIGH":
        return "#ef4444";
      case "URGENT":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };



  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "🟢";
      case "MEDIUM":
        return "🟡";
      case "HIGH":
        return "🟠";
      case "URGENT":
        return "🔴";
      default:
        return "🟡";
    }
  };

  const PROGRAMMING_STATUSES_CHECK = ['PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING'];
  const canUpdateStatus = !readonly &&
    (user?.role === "TENANT_ADMIN" || user?.role === "SUPER_ADMIN" ||
    (ticket.assignedTo?.id === user?.id && !PROGRAMMING_STATUSES_CHECK.includes(ticket.status)));
  const canTakeTicket = !readonly && !ticket.assignedTo && user?.role === "EMPLOYEE";
  const canDelete = !readonly && user?.role === "TENANT_ADMIN";

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await ticketsApi.deleteTicket(ticket.id);
      setConfirmDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (error) {
      console.error('Delete ticket error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenActivityDialog = async () => {
    setActivityDialogOpen(true);
    if (activitiesFetched) return;
    setActivitiesLoading(true);
    try {
      const data = await ticketsApi.getTicket(ticket.id);
      setActivities(data.activities || []);
      setActivitiesFetched(true);
    } catch (e) {
      console.error('Error fetching activities:', e);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'CREATED': return '#10b981';
      case 'STATUS_CHANGED': return '#3b82f6';
      case 'PRIORITY_CHANGED': return '#f59e0b';
      case 'ASSIGNED': return '#8b5cf6';
      case 'COMMENTED': return '#6366f1';
      case 'COMMENT_DELETED': return '#ef4444';
      case 'DELETED': return '#ef4444';
      case 'RESTORED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getActivityLabel = (activity: TicketActivity) => {
    switch (activity.action) {
      case 'CREATED': return 'created this ticket';
      case 'STATUS_CHANGED': return `changed status to ${activity.newValue?.replace('_', ' ')}`;
      case 'PRIORITY_CHANGED': return `changed priority to ${activity.newValue}`;
      case 'ASSIGNED': return 'took this ticket';
      case 'COMMENTED': return 'added a comment';
      case 'COMMENT_DELETED': return 'deleted a comment';
      case 'UPDATED': return 'updated this ticket';
      case 'DELETED': return 'deleted this ticket';
      case 'RESTORED': return 'restored this ticket';
      default: return activity.description;
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await ticketsApi.restoreTicket(ticket.id);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (error) {
      console.error('Restore ticket error:', error);
    } finally {
      setRestoring(false);
    }
  };

  const isOverdue = !!ticket.dueDate
    && new Date(ticket.dueDate) < new Date()
    && !['RESOLVED', 'CLOSED'].includes(ticket.status)
    && !isDeleted;

  const shouldTruncate = ticket.description.length > 200;
  const displayDescription =
    shouldTruncate && !isExpanded
      ? `${ticket.description.substring(0, 200)}...`
      : ticket.description;

  return (
    <Card
      sx={{
        mb: { xs: 1.5, sm: 2, md: 2.5 },
        borderRadius: { xs: 2, sm: 3, md: 4 },
        mx: { xs: 0, sm: 0 },
        overflow: "hidden",
        position: "relative",
        transition: "none",
        backdropFilter: "blur(10px)",
      }}
    >
      <CardContent
        sx={{
          pb: 1,
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Post Header */}
        <Box mb={2}>
          {/* Top Row: Avatar, Name, and Menu Button */}
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            mb={{ xs: 1.5, sm: 2 }}
          >
            <Box
              display="flex"
              gap={2}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              <Avatar
                sx={{
                  width: { xs: 42, sm: 50, md: 56 },
                  height: { xs: 42, sm: 50, md: 56 },
                  fontSize: { xs: "0.875rem", sm: "1rem", md: "1.1rem" },
                  fontWeight: 700,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                {getInitials(ticket.createdBy?.name || "U")}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ flexWrap: "wrap" }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                    }}
                  >
                    {ticket.createdBy?.name}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mt={0.5}
                  sx={{ flexWrap: "wrap" }}
                >
                  <Typography variant="caption" color="textSecondary">
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                    })}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    •
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ScheduleIcon sx={{ fontSize: 12 }} />
                    <Typography variant="caption" color="textSecondary">
                      #{ticket.id.slice(-6)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Menu Button - Always visible on the right */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconButton
                onClick={handleMenuClick}
                size="small"
                sx={{
                  p: { xs: 1, sm: 1.5, md: 2, lg: 1 },
                  borderRadius: { xs: 2, sm: 3, lg: 2 },
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)"
                      : "linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.02) 100%)",
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.08)"
                    }`,
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                      : "0 2px 8px rgba(0, 0, 0, 0.1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-1px) scale(1.1)",
                    boxShadow: (theme) =>
                      theme.palette.mode === "dark"
                        ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                        : "0 4px 12px rgba(0, 0, 0, 0.15)",
                  },
                  "&:active": {
                    transform: "translateY(0) scale(1.05)",
                  },
                }}
              >
                <MoreVertIcon
                  sx={{
                    fontSize: { xs: 18, sm: 20, md: 22, lg: 20 },
                    color: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.8)"
                        : "rgba(0, 0, 0, 0.7)",
                  }}
                />
              </IconButton>
            </Box>
          </Box>

          {/* Bottom Row: Badges in Row */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: { xs: 1, sm: 1.5, md: 2, lg: 1 },
              alignItems: "center",
              justifyContent: { xs: "center", sm: "flex-end" },
              width: "100%",
            }}
          >
            {ticket.customer && (
              <MyChip
                variant="customer"
                label={`${!isMobile ? "👤" : ""} ${ticket.customer.name}`}
              />
            )}
            {ticket.application && (
              <MyChip
                variant="application"
                label={`${!isMobile ? "🚀" : ""} ${ticket.application.name}`}
              />
            )}

            <MyChip
              variant="priority"
              label={`${!isMobile ? getPriorityEmoji(ticket.priority) : ""} ${
                ticket.priority
              }`}
              priorityColor={getPriorityColor(ticket.priority)}
            />

            <MyChip
              variant="status"
              label={
                `${!isMobile ? getPriorityEmoji(ticket.status) : ""}` +
                " " +
                ticket.status
              }
              statusColor={getStatusColor(ticket.status)}
            />

            {isOverdue && (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 1,
                  py: 0.4,
                  borderRadius: 2,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(220,38,38,0.2))'
                      : 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: '1px solid',
                  borderColor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.5)' : 'transparent',
                  boxShadow: '0 2px 6px rgba(239,68,68,0.35)',
                  animation: 'overduePulse 2s ease-in-out infinite',
                  '@keyframes overduePulse': {
                    '0%, 100%': { boxShadow: '0 2px 6px rgba(239,68,68,0.35)' },
                    '50%': { boxShadow: '0 2px 12px rgba(239,68,68,0.6)' },
                  },
                }}
              >
                <ScheduleIcon sx={{ fontSize: 12, color: '#fff' }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '0.05em' }}>
                  OVERDUE
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Post Content */}
        <Box
          mb={2}
          onClick={() => onTicketClick(ticket)}
          sx={{ cursor: "pointer" }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1,
              lineHeight: 1.3,
              fontSize: { xs: "1rem", sm: "1.25rem" },
            }}
          >
            {ticket.title}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.6,
              color: "text.secondary",
              whiteSpace: "pre-wrap",
              fontSize: { xs: "0.875rem", sm: "1rem" },
            }}
          >
            {displayDescription}
          </Typography>
          {shouldTruncate && (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              sx={{
                mt: 1,
                p: 0,
                minWidth: "auto",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {isExpanded ? "Show less" : "See more"}
            </Button>
          )}
        </Box>

        {/* Assignment Info */}
        {ticket.assignedTo && (
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f8fafc",
              borderRadius: 2,
              mb: 2,
            }}
          >
            <PersonIcon
              sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
            >
              Assigned to
            </Typography>
            <Avatar
              sx={{
                width: { xs: 20, sm: 24 },
                height: { xs: 20, sm: 24 },
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
              }}
            >
              {getInitials(ticket.assignedTo.name)}
            </Avatar>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              {ticket.assignedTo.name}
            </Typography>
          </Box>
        )}

        {/* Due Date and Estimated Hours Info */}
        {(ticket.dueDate || ticket.estimatedHours) && (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{
              p: { xs: 1.5, sm: 2 },
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f8fafc",
              borderRadius: 2,
              mb: 2,
            }}
          >
            {ticket.dueDate && (
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon
                  sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.secondary" }}
                />
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  Due:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    color: new Date(ticket.dueDate) < new Date() ? "error.main" : "text.primary"
                  }}
                >
                  {formatDate(ticket.dueDate)}
                </Typography>
              </Box>
            )}
            
            {ticket.estimatedHours && (
              <Box display="flex" alignItems="center" gap={1}>
                <ScheduleIcon
                  sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.secondary" }}
                />
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                >
                  Est:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  {ticket.estimatedHours}h
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Action Buttons */}
      <CardActions
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 1, sm: 1.5, md: 2 },
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)"
              : "linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)",
        }}
      >
        <Box
          display="flex"
          width="100%"
          justifyContent="space-around"
          sx={{ gap: { xs: 1, sm: 2, md: 3 } }}
        >
          {canTakeTicket && (
            <Button
              startIcon={!isMobile ? <TakeIcon /> : undefined}
              onClick={() => onTakeTicket(ticket.id)}
              size={isMobile ? "small" : "medium"}
              variant="outlined"
              sx={{
                flex: 1,
                color: "primary.main",
                borderColor: "primary.main",
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.9rem" },
                py: { xs: 1, sm: 1.5, md: 2 },
                borderRadius: { xs: 2, sm: 3, md: 4 },
                fontWeight: 600,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)"
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  boxShadow: (theme) =>
                    theme.palette.mode === "dark"
                      ? "0 4px 12px rgba(59, 130, 246, 0.3)"
                      : "0 4px 12px rgba(59, 130, 246, 0.2)",
                },
              }}
            >
              {isMobile ? (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TakeIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                  Take
                </Box>
              ) : (
                "Take Ticket"
              )}
            </Button>
          )}

          <Button
            startIcon={
              !isMobile ? (
                <Badge
                  badgeContent={ticket._count?.comments || 0}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.65rem",
                      minWidth: "16px",
                      height: "16px",
                      fontWeight: 700,
                    },
                  }}
                >
                  <CommentIcon />
                </Badge>
              ) : undefined
            }
            onClick={handleShowComments}
            size={isMobile ? "small" : "medium"}
            variant="outlined"
            sx={{
              flex: 1,
              color: "text.primary",
              borderColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.2)",
              fontSize: { xs: "0.75rem", sm: "0.875rem", md: "0.9rem" },
              py: { xs: 1, sm: 1.5, md: 2 },
              borderRadius: { xs: 2, sm: 3, md: 4 },
              fontWeight: 600,
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(0, 0, 0, 0.03) 0%, rgba(0, 0, 0, 0.01) 100%)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.08)",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 4px 12px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            {isMobile ? (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Badge
                  badgeContent={ticket._count?.comments || 0}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.6rem",
                      minWidth: "14px",
                      height: "14px",
                      fontWeight: 700,
                    },
                  }}
                >
                  <CommentIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
                </Badge>
                Comment
              </Box>
            ) : (
              "Comment"
            )}
          </Button>

          {/* Activity Log Button */}
          <Box
            onClick={handleOpenActivityDialog}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.5,
              py: 0.6,
              borderRadius: 2,
              cursor: 'pointer',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(79,70,229,0.25) 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              border: '1px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.4)' : 'transparent',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              transition: 'all 0.2s',
              flexShrink: 0,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
              },
              '&:active': { transform: 'translateY(0)' },
            }}
          >
            <HistoryIcon sx={{ fontSize: 16, color: '#fff' }} />
            {!isMobile && (
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1 }}>
                Activity
              </Typography>
            )}
          </Box>
        </Box>
      </CardActions>

      {/* Comments Section - only show when explicitly opened or has comments and was fetched */}
      {(showComments || (commentsFetched && comments.length > 0)) && (
        <>
          <Divider />

          {/* Existing Comments */}
          {comments.length > 0 && (
            <Box sx={{ px: { xs: 1.5, sm: 2 }, py: 1 }}>
              {comments.slice(0, visibleCommentsCount).map((comment) => (
                <Box
                  key={comment.id}
                  display="flex"
                  gap={{ xs: 1, sm: 2 }}
                  mb={2}
                >
                  <Avatar
                    sx={{
                      width: { xs: 28, sm: 32 },
                      height: { xs: 28, sm: 32 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    {getInitials(comment.user.name)}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Paper
                      sx={{
                        p: { xs: 1.5, sm: 2 },
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, 0.08)"
                            : "#f0f2f5",
                        borderRadius: { xs: 2, sm: 3 },
                        display: "inline-block",
                        maxWidth: "100%",
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          }}
                        >
                          {comment.user.name}
                        </Typography>
                        {(comment.userId === user?.id || comment.user?.id === user?.id) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteComment(comment.id)}
                            sx={{ ml: 1, p: 0.25, color: 'error.main', opacity: 0.7, '&:hover': { opacity: 1 } }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          wordBreak: "break-word",
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        {comment.content}
                      </Typography>
                    </Paper>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{
                        ml: 1,
                        mt: 0.5,
                        display: "block",
                        fontSize: { xs: "0.65rem", sm: "0.75rem" },
                      }}
                    >
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {/* See More Comments Button */}
              {comments.length > visibleCommentsCount && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 2,
                    mb: 1,
                  }}
                >
                  <Button
                    variant="text"
                    onClick={handleLoadMoreComments}
                    disabled={loadingMoreComments}
                    sx={{
                      color: "primary.main",
                      textTransform: "none",
                      fontWeight: 500,
                      "&:hover": {
                        backgroundColor: (theme) =>
                          theme.palette.mode === "dark"
                            ? "rgba(59, 130, 246, 0.1)"
                            : "rgba(59, 130, 246, 0.05)",
                      },
                    }}
                    startIcon={
                      loadingMoreComments ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              border: "2px solid",
                              borderColor: "primary.main",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                              "@keyframes spin": {
                                "0%": { transform: "rotate(0deg)" },
                                "100%": { transform: "rotate(360deg)" },
                              },
                            }}
                          />
                        </Box>
                      ) : (
                        <ExpandMoreIcon />
                      )
                    }
                  >
                    {loadingMoreComments
                      ? "Loading..."
                      : `See ${Math.min(
                          3,
                          comments.length - visibleCommentsCount
                        )} more comment${
                          comments.length - visibleCommentsCount === 1
                            ? ""
                            : "s"
                        }`}
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Add Comment */}
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              pt: comments.length > 0 ? 1 : { xs: 1.5, sm: 2 },
            }}
          >
            <Box display="flex" gap={{ xs: 1, sm: 2 }}>
              <Avatar
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                {getInitials(user?.name || "U")}
              </Avatar>
              <Box flexGrow={1}>
                <TextField
                  fullWidth
                  placeholder={readonly ? "Subscription ended — read only" : "Write a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  maxRows={3}
                  disabled={readonly}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: { xs: 2, sm: 3 },
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "#f9fafb",
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    },
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || submitting || readonly}
                        size="small"
                        sx={{ p: { xs: 0.5, sm: 1 } }}
                      >
                        <SendIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableScrollLock
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => { onTicketClick(ticket); handleMenuClose(); }}>
          <CommentIcon sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        {canUpdateStatus && [
          <Divider key="divider" />,
          <MenuItem key="open" onClick={() => handleStatusUpdate("OPEN")}>
            🔵 Mark as Open
          </MenuItem>,
          <MenuItem
            key="in-progress"
            onClick={() => handleStatusUpdate("IN_PROGRESS")}
          >
            🟡 Mark as In Progress
          </MenuItem>,
          <MenuItem
            key="resolved"
            onClick={() => handleStatusUpdate("RESOLVED")}
          >
            🟢 Mark as Resolved
          </MenuItem>,
          <MenuItem key="closed" onClick={() => handleStatusUpdate("CLOSED")}>
            ⚫ Mark as Closed
          </MenuItem>,
        ]}
        {isAdmin && !readonly && [
          <Divider key="programmer-divider" />,
          <MenuItem
            key="assign-programmer"
            onClick={() => { setAssignProgrammerOpen(true); handleMenuClose(); }}
            sx={{ color: '#8b5cf6' }}
          >
            <CodeIcon sx={{ mr: 2, fontSize: 20, color: '#8b5cf6' }} />
            {ticket.programmerId ? 'Reassign Programmer' : 'Send to Programmer'}
          </MenuItem>,
        ]}
        {canDelete && [
          <Divider key="delete-divider" />,
          isDeleted ? (
            <MenuItem
              key="restore"
              onClick={() => { handleRestore(); handleMenuClose(); }}
              sx={{ color: 'success.main' }}
              disabled={restoring}
            >
              <RestoreIcon sx={{ mr: 2, fontSize: 20 }} />
              {restoring ? 'Restoring...' : 'Restore Ticket'}
            </MenuItem>
          ) : (
            <MenuItem
              key="delete"
              onClick={() => { setConfirmDeleteOpen(true); handleMenuClose(); }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 2, fontSize: 20 }} />
              Delete Ticket
            </MenuItem>
          ),
        ]}
      </Menu>

      {/* Activity Log Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => { setActivityDialogOpen(false); setActivityMaximized(false); }}
        maxWidth={activityMaximized ? false : 'sm'}
        fullWidth
        fullScreen={activityMaximized}
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: activityMaximized ? 0 : 3,
            overflow: 'hidden',
            ...(activityMaximized ? {} : { maxHeight: '80vh' }),
          },
        }}
      >
        <Box
          sx={{
            px: 3, py: 2,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}
        >
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HistoryIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>Activity Log</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{ticket.title}</Typography>
          </Box>
          <Chip label={`${activities.length} event${activities.length !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, border: 'none' }} />
          <IconButton size="small" onClick={() => setActivityMaximized((v) => !v)} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            {activityMaximized ? <MinimizeIcon fontSize="small" /> : <MaximizeIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={() => { setActivityDialogOpen(false); setActivityMaximized(false); }} sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
          {activitiesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={6}>
              <CircularProgress size={32} sx={{ color: '#6366f1' }} />
            </Box>
          ) : activities.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={2}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HistoryIcon sx={{ fontSize: 32, color: '#6366f1', opacity: 0.6 }} />
              </Box>
              <Typography variant="body2" color="text.secondary">No activity recorded yet</Typography>
            </Box>
          ) : (
            <Box sx={{ overflowY: 'auto', flex: 1, px: 3, py: 2 }}>
              {activities.map((activity, index) => (
                <Box key={activity.id} display="flex" gap={2}>
                  <Box display="flex" flexDirection="column" alignItems="center" sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: getActivityColor(activity.action), boxShadow: `0 0 0 3px ${getActivityColor(activity.action)}33` }}>
                      {activity.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    {index < activities.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, minHeight: 20, my: 0.5, background: (theme) => theme.palette.mode === 'dark' ? 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0.03))' : 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.03))', borderRadius: 1 }} />
                    )}
                  </Box>
                  <Box pb={index < activities.length - 1 ? 2 : 0} flex={1} sx={{ minWidth: 0 }}>
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#fff', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{activity.user.name}</Typography>
                          <Chip label={activity.action.replace('_', ' ')} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${getActivityColor(activity.action)}22`, color: getActivityColor(activity.action), border: `1px solid ${getActivityColor(activity.action)}44` }} />
                        </Box>
                        <Tooltip title={formatDateTime(activity.createdAt)}>
                          <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: 'nowrap', ml: 1, cursor: 'default' }}>
                            {formatRelativeDuration(activity.createdAt)}
                          </Typography>
                        </Tooltip>
                      </Box>
                      <Typography variant="body2" color="text.secondary">{getActivityLabel(activity)}</Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <AssignProgrammerDialog
        open={assignProgrammerOpen}
        ticketId={ticket.id}
        onClose={() => setAssignProgrammerOpen(false)}
        onAssigned={() => { setAssignProgrammerOpen(false); queryClient.invalidateQueries({ queryKey: ['tickets'] }); }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} disableScrollLock>
        <DialogTitle>Delete Ticket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{ticket.title}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleting}
            onClick={handleDeleteConfirmed}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TicketPost;
