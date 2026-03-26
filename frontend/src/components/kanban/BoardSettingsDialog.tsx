import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Tabs,
  Tab,
  Grid
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from "@mui/icons-material";
import { HexColorPicker } from "react-colorful";
import { useKanbanStore } from "../../stores/kanbanStore";
import type { KanbanBoard, KanbanColumn } from "./types/types";
import { getColorPair } from "../../utils/colorContrast";

interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  board: KanbanBoard;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const BoardSettingsDialog: React.FC<BoardSettingsDialogProps> = ({
  open,
  onClose,
  board,
}) => {
  const { updateBoard, fetchBoard } = useKanbanStore();

  const [tabValue, setTabValue] = useState(0);
  const [boardName, setBoardName] = useState(board?.name || "");
  const [boardDescription, setBoardDescription] = useState(
    board?.description || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column editing state
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [columnForm, setColumnForm] = useState({
    name: "",
    description: "",
    color: "#e3f2fd",
    darkColor: "#1565c0",
    wipLimit: "",
  });
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (board) {
      setBoardName(board.name || "");
      setBoardDescription(board.description || "");
    }
  }, [board]);

  const handleSaveBoard = async () => {
    if (!board?.id) {
      setError("Board ID is missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await updateBoard(board.id, {
        name: boardName,
        description: boardDescription,
      });
      onClose();
    } catch (error) {
      console.error("Error updating board:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update board"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    const currentColor = column.color || "#e3f2fd";
    const colorPair = getColorPair(currentColor);

    setColumnForm({
      name: column.name,
      description: column.description || "",
      color: currentColor,
      darkColor: colorPair.darkColor,
      wipLimit: column.wipLimit?.toString() || "",
    });
  };

  const handleSaveColumn = async () => {
    if (!editingColumn) return;

    setLoading(true);
    try {
      // Here you would call the API to update the column
      // For now, we'll just refresh the board
      await fetchBoard(board.id);
      setEditingColumn(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update column"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteColumn = async (_: string) => {
    if (!confirm("Are you sure you want to delete this column?")) return;

    setLoading(true);
    try {
      // Here you would call the API to delete the column
      await fetchBoard(board.id);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete column"
      );
    } finally {
      setLoading(false);
    }
  };

  // Safety check for board prop
  if (!board) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Board Settings</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Board data is not available. Please try again.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Board Settings</DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label="General" />
          <Tab label="Columns" />
          <Tab label="Permissions" />
        </Tabs>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Board Name"
                fullWidth
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Column Settings */}
        <TabPanel value={tabValue} index={1}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Columns</Typography>
            <Button startIcon={<AddIcon />} variant="outlined">
              Add Column
            </Button>
          </Box>

          <List>
            {board.columns && board.columns.length > 0 ? (
              board.columns.map((column) => (
                <ListItem key={column.id}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: column.color || "#e3f2fd",
                      borderRadius: 1,
                      mr: 2,
                    }}
                  />
                  <ListItemText
                    primary={column.name}
                    secondary={
                      <Box>
                        {column.description && (
                          <Typography variant="body2" color="text.secondary">
                            {column.description}
                          </Typography>
                        )}
                        {column.wipLimit && (
                          <Chip
                            label={`WIP Limit: ${column.wipLimit}`}
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton onClick={() => handleEditColumn(column)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteColumn(column.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="No columns found"
                  secondary="Add a column to get started"
                />
              </ListItem>
            )}
          </List>

          {/* Column Edit Form */}
          {editingColumn && (
            <Box
              sx={{ mt: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}
            >
              <Typography variant="h6" gutterBottom>
                Edit Column: {editingColumn.name}
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="Column Name"
                    fullWidth
                    value={columnForm.name}
                    onChange={(e) =>
                      setColumnForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    label="WIP Limit"
                    type="number"
                    fullWidth
                    value={columnForm.wipLimit}
                    onChange={(e) =>
                      setColumnForm((prev) => ({
                        ...prev,
                        wipLimit: e.target.value,
                      }))
                    }
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={columnForm.description}
                    onChange={(e) =>
                      setColumnForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2">Color:</Typography>
                    <Box display="flex" gap={0.5}>
                      {/* Light mode color */}
                      <Box
                        sx={{
                          width: 32,
                          height: 40,
                          backgroundColor: columnForm.color,
                          borderRadius: "4px 0 0 4px",
                          cursor: "pointer",
                          border: "1px solid #e0e0e0",
                          borderRight: "none",
                        }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      />
                      {/* Dark mode color */}
                      <Box
                        sx={{
                          width: 32,
                          height: 40,
                          backgroundColor: columnForm.darkColor,
                          borderRadius: "0 4px 4px 0",
                          cursor: "pointer",
                          border: "1px solid #e0e0e0",
                          borderLeft: "none",
                        }}
                        onClick={() => setShowColorPicker(!showColorPicker)}
                      />
                    </Box>
                    {showColorPicker && (
                      <Box sx={{ position: "absolute", zIndex: 1000 }}>
                        <Box
                          sx={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                          }}
                          onClick={() => setShowColorPicker(false)}
                        />
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: "background.paper",
                            borderRadius: 1,
                            boxShadow: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            position: "relative",
                          }}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={1}
                          >
                            <Typography variant="subtitle2">
                              Select Light Mode Color
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => setShowColorPicker(false)}
                              sx={{ minWidth: "auto", p: 0.5 }}
                            >
                              ✕
                            </Button>
                          </Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            mb={2}
                          >
                            Dark mode color will be automatically calculated
                          </Typography>
                          <Box
                            sx={{
                              "& .react-colorful": {
                                width: "200px !important",
                                height: "150px !important",
                              },
                              "& .react-colorful__saturation": {
                                borderRadius: "4px 4px 0 0",
                              },
                              "& .react-colorful__hue": {
                                height: "20px",
                                borderRadius: "0 0 4px 4px",
                              },
                              "& .react-colorful__pointer": {
                                width: "16px",
                                height: "16px",
                              },
                            }}
                          >
                            <HexColorPicker
                              color={columnForm.color}
                              onChange={(color) => {
                                const colorPair = getColorPair(color);
                                setColumnForm((prev) => ({
                                  ...prev,
                                  color: colorPair.lightColor,
                                  darkColor: colorPair.darkColor,
                                }));
                              }}
                            />
                          </Box>
                          <Box
                            display="flex"
                            gap={2}
                            mt={2}
                            alignItems="center"
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Light Mode:
                              </Typography>
                              <Box
                                sx={{
                                  width: 50,
                                  height: 24,
                                  backgroundColor: columnForm.color,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                  mt: 0.5,
                                }}
                              />
                            </Box>
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Dark Mode:
                              </Typography>
                              <Box
                                sx={{
                                  width: 50,
                                  height: 24,
                                  backgroundColor: columnForm.darkColor,
                                  border: "1px solid",
                                  borderColor: "divider",
                                  borderRadius: 1,
                                  mt: 0.5,
                                }}
                              />
                            </Box>
                          </Box>
                          <Box mt={2}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => setShowColorPicker(false)}
                              fullWidth
                            >
                              Done
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Box display="flex" gap={1} mt={2}>
                <Button onClick={handleSaveColumn} variant="contained">
                  Save
                </Button>
                <Button onClick={() => setEditingColumn(null)}>Cancel</Button>
              </Box>
            </Box>
          )}
        </TabPanel>

        {/* Permissions */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Board Permissions
          </Typography>

          <List>
            {board.permissions && board.permissions.length > 0 ? (
              board.permissions.map((permission) => (
                <ListItem key={permission.id}>
                  <ListItemText
                    primary={permission.user.name}
                    secondary={permission.user.email}
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={permission.role}
                      color={
                        permission.role === "ADMIN" ? "primary" : "default"
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary="No permissions set"
                  secondary="Add users to manage board access"
                />
              </ListItem>
            )}
          </List>

          <Button startIcon={<AddIcon />} variant="outlined" sx={{ mt: 2 }}>
            Add User
          </Button>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSaveBoard}
          variant="contained"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoardSettingsDialog;
