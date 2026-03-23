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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import type { Ticket, Comment } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { ticketsApi } from "../../services/api";
import { useQueryClient } from "@tanstack/react-query";
import MyChip from "../common/MyChip";

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
  onDeleteTicket,
}) => {
  const { user, token } = useAuthStore();
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

  const isDeleted = !!ticket.deletedAt;

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
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
  }, [ticket.id]); // only re-run if ticket ID changes, not on every prop update

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

  const canUpdateStatus =
    user?.role === "ADMIN" || ticket.assignedTo?.id === user?.id;
  const canTakeTicket = !ticket.assignedTo && user?.role === "EMPLOYEE";
  const canDelete = user?.role === "TENANT_ADMIN";

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
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
                  {new Date(ticket.dueDate).toLocaleDateString()}
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
                  transform: "translateY(-1px)",
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
                transform: "translateY(-1px)",
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
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 0.5,
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                        }}
                      >
                        {comment.user.name}
                      </Typography>
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
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  maxRows={3}
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
                        disabled={!newComment.trim() || submitting}
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
        <MenuItem onClick={() => onTicketClick(ticket)}>
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
