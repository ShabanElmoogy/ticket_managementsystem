import React from "react";
import {
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  DoneAll as MarkAllReadIcon,
  RadioButtonUnchecked as MarkAllUnreadIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";

interface ActivityHeaderActionsProps {
  onMarkAllRead?: () => void;
  onMarkAllUnread?: () => void;
  onClearAll: () => void;
  expanded: boolean;
}

export const ActivityHeaderActions: React.FC<ActivityHeaderActionsProps> = ({
  onMarkAllRead,
  onMarkAllUnread,
  onClearAll,
  expanded,
}) => {
  return (
    <>
      {onMarkAllRead && (
        <Tooltip title="Mark all as read">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "success.main",
                color: "success.contrastText",
                transform: "scale(1.1)",
              },
            }}
          >
            <MarkAllReadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {onMarkAllUnread && (
        <Tooltip title="Mark all as unread">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllUnread();
            }}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "warning.main",
                color: "warning.contrastText",
                transform: "scale(1.1)",
              },
            }}
          >
            <MarkAllUnreadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Clear all activities">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClearAll();
          }}
          sx={{
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "error.main",
              color: "error.contrastText",
              transform: "scale(1.1)",
            },
          }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <IconButton
        size="small"
        sx={{
          transition: "transform 0.3s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}
      >
        <ExpandMoreIcon />
      </IconButton>
    </>
  );
};