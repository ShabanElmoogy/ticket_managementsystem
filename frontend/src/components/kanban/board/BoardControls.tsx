import React from "react";
import {
  Box,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Stack,
  Divider,
  Badge,
  alpha,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Dashboard as DashboardIcon,
  Task as TaskIcon,
  Tune as TuneIcon,
  Speed as SpeedIcon,
  PlaylistAdd as PlaylistAddIcon,
} from "@mui/icons-material";
import type { KanbanBoard } from "../types/types";

interface BoardControlsProps {
  boards: KanbanBoard[];
  selectedBoardId: string;
  currentBoard: KanbanBoard;
  hasActiveFilters: boolean;
  onBoardChange: (id: string) => void;
  onCreateBoard: () => void;
  onCreateTicket: () => void;
  onToggleFilters: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
}

const BoardControls: React.FC<BoardControlsProps> = ({
  boards,
  selectedBoardId,
  currentBoard,
  hasActiveFilters,
  onBoardChange,
  onCreateBoard,
  onCreateTicket,
  onToggleFilters,
  onMenuClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Get board color for theming
  const getBoardColor = () => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.info.main,
    ];

    const hash = currentBoard.name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    return colors[Math.abs(hash) % colors.length];
  };

  const boardColor = getBoardColor();

  // Mobile Layout
  if (isMobile) {
    return (
      <Box sx={{ mb: 2 }}>
        {/* Board Selector Card */}
        <Card
          elevation={2}
          sx={{
            mb: 2,
            background: `linear-gradient(135deg, ${alpha(
              boardColor,
              0.05
            )} 0%, ${alpha(boardColor, 0.02)} 100%)`,
            border: `1px solid ${alpha(boardColor, 0.1)}`,
          }}
        >
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Stack spacing={2}>
              {/* Board Selector with Stats in same row */}
              <Box>
                {/* Board Title and Stats Row */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={1.5}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8rem" }}
                  >
                    Current Board
                  </Typography>
                  {/* Board Stats - Same row as title */}
                  {currentBoard.tickets && (
                    <Stack direction="row" spacing={0.5}>
                      <Chip
                        label={`${currentBoard.tickets.length} Items`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.65rem",
                          height: 20,
                          borderColor: alpha(boardColor, 0.3),
                          color: boardColor,
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                      <Chip
                        label={`${currentBoard.columns?.length || 0} Cols`}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontSize: "0.65rem",
                          height: 20,
                          borderColor: alpha(boardColor, 0.3),
                          color: boardColor,
                          "& .MuiChip-label": { px: 1 },
                        }}
                      />
                    </Stack>
                  )}
                </Stack>

                {/* Board Selector */}
                <FormControl fullWidth size="small">
                  <InputLabel
                    sx={{
                      fontSize: "0.875rem",
                      "&.Mui-focused": { color: boardColor },
                    }}
                  >
                    Select Board
                  </InputLabel>
                  <Select
                    value={selectedBoardId || ""}
                    label="Select Board"
                    onChange={(e) => onBoardChange(e.target.value)}
                    sx={{
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: boardColor,
                      },
                      "& .MuiSelect-select": {
                        fontSize: "0.875rem",
                      },
                    }}
                  >
                    {boards.map((board) => (
                      <MenuItem key={board.id} value={board.id}>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ width: "100%" }}
                        >
                          {board.type === "TASKS" ? (
                            <TaskIcon
                              sx={{ fontSize: "1rem", color: "text.secondary" }}
                            />
                          ) : (
                            <DashboardIcon
                              sx={{ fontSize: "1rem", color: "text.secondary" }}
                            />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {board.name}
                            </Typography>
                            {board.isDefault && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                (Default)
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Action Buttons Grid */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mb={2}>
          {/* Create Board Button */}
          <Button
            variant="contained"
            startIcon={<PlaylistAddIcon />}
            onClick={onCreateBoard}
            size="large"
            sx={{
              py: 1.5,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                  : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                  : `0 3px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
              border:
                theme.palette.mode === "dark"
                  ? `1px solid ${alpha(theme.palette.primary.light, 0.3)}`
                  : "none",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`
                    : `linear-gradient(135deg, ${
                        theme.palette.primary.dark
                      }, ${alpha(theme.palette.primary.dark, 0.9)})`,
                transform: "translateY(-2px)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 8px 25px ${alpha(theme.palette.primary.main, 0.5)}`
                    : `0 5px 18px ${alpha(theme.palette.primary.main, 0.35)}`,
              },
              "&:active": {
                transform: "translateY(0px)",
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            New Board
          </Button>

          {/* Create Ticket/Task Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTicket}
            size="large"
            sx={{
              py: 1.5,
              background:
                theme.palette.mode === "dark"
                  ? `linear-gradient(135deg, ${boardColor}, ${alpha(
                      boardColor,
                      0.7
                    )})`
                  : `linear-gradient(135deg, ${boardColor}, ${alpha(
                      boardColor,
                      0.85
                    )})`,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 4px 20px ${alpha(boardColor, 0.4)}`
                  : `0 3px 12px ${alpha(boardColor, 0.25)}`,
              border:
                theme.palette.mode === "dark"
                  ? `1px solid ${alpha(boardColor, 0.4)}`
                  : "none",
              "&:hover": {
                background:
                  theme.palette.mode === "dark"
                    ? `linear-gradient(135deg, ${alpha(
                        boardColor,
                        0.9
                      )}, ${boardColor})`
                    : `linear-gradient(135deg, ${alpha(
                        boardColor,
                        0.9
                      )}, ${alpha(boardColor, 0.7)})`,
                transform: "translateY(-2px)",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 8px 25px ${alpha(boardColor, 0.5)}`
                    : `0 5px 18px ${alpha(boardColor, 0.35)}`,
              },
              "&:active": {
                transform: "translateY(0px)",
              },
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              fontSize: "0.8rem",
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            {currentBoard.type === "TASKS" ? "New Task" : "New Ticket"}
          </Button>
        </Box>

        {/* Action Icons Row */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{
            p: 2,
            backgroundColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.background.default, 0.9),
            borderRadius: 3,
            backdropFilter: "blur(10px)",
            border:
              theme.palette.mode === "dark"
                ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                : `1px solid ${alpha(theme.palette.divider, 0.15)}`,
            boxShadow:
              theme.palette.mode === "dark"
                ? `0 4px 20px ${alpha(theme.palette.common.black, 0.3)}`
                : `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
          }}
        >
          <Tooltip title="Toggle Filters" arrow>
            <Badge
              variant="dot"
              color="primary"
              invisible={!hasActiveFilters}
              sx={{
                "& .MuiBadge-dot": {
                  right: 6,
                  top: 6,
                },
              }}
            >
              <IconButton
                onClick={onToggleFilters}
                size="large"
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: hasActiveFilters
                    ? theme.palette.mode === "dark"
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.main, 0.12)
                    : theme.palette.mode === "dark"
                    ? alpha(theme.palette.action.hover, 0.3)
                    : alpha(theme.palette.action.hover, 0.08),
                  color: hasActiveFilters
                    ? theme.palette.primary.main
                    : theme.palette.mode === "dark"
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  border:
                    theme.palette.mode === "dark"
                      ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                      : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `0 2px 8px ${alpha(theme.palette.common.black, 0.4)}`
                      : `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                  "&:hover": {
                    backgroundColor: hasActiveFilters
                      ? theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.3)
                        : alpha(theme.palette.primary.main, 0.18)
                      : theme.palette.mode === "dark"
                      ? alpha(theme.palette.action.hover, 0.5)
                      : alpha(theme.palette.action.hover, 0.12),
                    transform: "scale(1.05)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? `0 4px 12px ${alpha(theme.palette.common.black, 0.5)}`
                        : `0 2px 8px ${alpha(
                            theme.palette.common.black,
                            0.12
                          )}`,
                  },
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <FilterIcon />
              </IconButton>
            </Badge>
          </Tooltip>

          <Tooltip title="Board Settings" arrow>
            <IconButton
              onClick={onMenuClick}
              size="large"
              sx={{
                width: 48,
                height: 48,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.action.hover, 0.3)
                    : alpha(theme.palette.action.hover, 0.08),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                border:
                  theme.palette.mode === "dark"
                    ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 2px 8px ${alpha(theme.palette.common.black, 0.4)}`
                    : `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.action.hover, 0.5)
                      : alpha(theme.palette.action.hover, 0.12),
                  transform: "scale(1.05)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.5)}`
                      : `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`,
                },
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <TuneIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Quick Actions" arrow>
            <IconButton
              onClick={onMenuClick}
              size="large"
              sx={{
                width: 48,
                height: 48,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.action.hover, 0.3)
                    : alpha(theme.palette.action.hover, 0.08),
                color:
                  theme.palette.mode === "dark"
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                border:
                  theme.palette.mode === "dark"
                    ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? `0 2px 8px ${alpha(theme.palette.common.black, 0.4)}`
                    : `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.action.hover, 0.5)
                      : alpha(theme.palette.action.hover, 0.12),
                  transform: "scale(1.05)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? `0 4px 12px ${alpha(theme.palette.common.black, 0.5)}`
                      : `0 2px 8px ${alpha(theme.palette.common.black, 0.12)}`,
                },
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <SpeedIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Empty State */}
        {boards.length === 0 && (
          <Card
            sx={{
              mt: 2,
              textAlign: "center",
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.warning.main,
                0.05
              )} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <DashboardIcon
                sx={{
                  fontSize: "2.5rem",
                  color: theme.palette.warning.main,
                  mb: 1,
                }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.85rem", lineHeight: 1.5 }}
              >
                No boards available yet.{"\n"}
                Create your first board to get started!
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // Desktop/Tablet Layout
  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 2, md: 3 }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
      >
        {/* Board Selector */}
        <FormControl
          sx={{
            minWidth: { sm: 280, md: 320 },
            maxWidth: { sm: 400, md: 450 },
          }}
          size="small"
        >
          <InputLabel
            sx={{
              "&.Mui-focused": { color: boardColor },
            }}
          >
            Select Board
          </InputLabel>
          <Select
            value={selectedBoardId || ""}
            label="Select Board"
            onChange={(e) => onBoardChange(e.target.value)}
            sx={{
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: boardColor,
              },
            }}
          >
            {boards.map((board) => (
              <MenuItem key={board.id} value={board.id}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ width: "100%" }}
                >
                  {board.type === "TASKS" ? (
                    <TaskIcon
                      sx={{ fontSize: "1.1rem", color: "text.secondary" }}
                    />
                  ) : (
                    <DashboardIcon
                      sx={{ fontSize: "1.1rem", color: "text.secondary" }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" noWrap>
                      {board.name}
                    </Typography>
                    {board.isDefault && (
                      <Typography variant="caption" color="text.secondary">
                        (Default)
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            variant="contained"
            startIcon={<PlaylistAddIcon />}
            onClick={onCreateBoard}
            sx={{
              px: 3,
              py: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              boxShadow: `0 3px 10px ${alpha(theme.palette.primary.main, 0.3)}`,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                transform: "translateY(-1px)",
                boxShadow: `0 5px 15px ${alpha(
                  theme.palette.primary.main,
                  0.4
                )}`,
              },
              transition: "all 0.2s ease-in-out",
              fontWeight: 600,
            }}
          >
            Create Board
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTicket}
            sx={{
              px: 3,
              py: 1,
              background: `linear-gradient(135deg, ${boardColor}, ${alpha(
                boardColor,
                0.8
              )})`,
              boxShadow: `0 3px 10px ${alpha(boardColor, 0.3)}`,
              "&:hover": {
                background: `linear-gradient(135deg, ${alpha(
                  boardColor,
                  0.8
                )}, ${boardColor})`,
                transform: "translateY(-1px)",
                boxShadow: `0 5px 15px ${alpha(boardColor, 0.4)}`,
              },
              transition: "all 0.2s ease-in-out",
              fontWeight: 600,
            }}
          >
            {currentBoard.type === "TASKS" ? "Create Task" : "Create Ticket"}
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Stack direction="row" spacing={1}>
            <Tooltip title="Toggle Filters" arrow>
              <Badge
                variant="dot"
                color="primary"
                invisible={!hasActiveFilters}
              >
                <IconButton
                  onClick={onToggleFilters}
                  sx={{
                    width: 42,
                    height: 42,
                    backgroundColor: hasActiveFilters
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                    color: hasActiveFilters
                      ? theme.palette.primary.main
                      : "text.secondary",
                    border: `1px solid ${
                      hasActiveFilters
                        ? theme.palette.primary.main
                        : "transparent"
                    }`,
                    "&:hover": {
                      backgroundColor: hasActiveFilters
                        ? alpha(theme.palette.primary.main, 0.2)
                        : alpha(theme.palette.action.hover, 0.1),
                      transform: "scale(1.05)",
                    },
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <FilterIcon />
                </IconButton>
              </Badge>
            </Tooltip>

            <Tooltip title="Board Options" arrow>
              <IconButton
                onClick={onMenuClick}
                sx={{
                  width: 42,
                  height: 42,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.action.hover, 0.1),
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Stack>

      {/* Empty State - Desktop */}
      {boards.length === 0 && (
        <Box
          sx={{
            mt: 3,
            p: 4,
            textAlign: "center",
            backgroundColor: alpha(theme.palette.warning.main, 0.05),
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
          }}
        >
          <DashboardIcon
            sx={{
              fontSize: "3rem",
              color: theme.palette.warning.main,
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No boards available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first board to start organizing your tasks and tickets
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BoardControls;
