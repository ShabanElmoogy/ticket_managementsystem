import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useKanbanStore } from '../../stores/kanbanStore';
import KanbanBoard from './KanbanBoard';
import CreateBoardDialog from './CreateBoardDialog';

const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    boards,
    loading,
    error,
    fetchBoards,
    setCurrentBoard,
    clearError
  } = useKanbanStore();

  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    // Auto-select the first board or default board
    if (boards.length > 0 && !selectedBoardId) {
      const defaultBoard = boards.find(board => board.isDefault) || boards[0];
      setSelectedBoardId(defaultBoard.id);
    }
  }, [boards, selectedBoardId]);

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setCurrentBoard(null); // Clear current board to trigger loading
  };
  const handleCreateBoard = () => {
    setCreateBoardOpen(true);
  };

  if (loading && boards.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={clearError}>
              Dismiss
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Board Content */}
      <Box sx={{ flex: 1, overflow: 'hidden', m: 2 }}>
        {selectedBoardId ? (
          <KanbanBoard
            boardId={selectedBoardId}
            boards={boards}
            selectedBoardId={selectedBoardId}
            setSelectedBoardId={setSelectedBoardId}
            handleBoardChange={handleBoardChange}
            handleCreateBoard={handleCreateBoard}
            createBoardOpen={createBoardOpen}
            setCreateBoardOpen={setCreateBoardOpen}
          />
        ) : boards.length > 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography variant="h6" color="text.secondary">
              Select a board to view
            </Typography>
          </Box>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            height="100%"
            gap={2}
          >
            <Typography variant="h6" color="text.secondary">
              No boards available
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBoard}
            >
              Create Your First Board
            </Button>
          </Box>
        )}
      </Box>

      {/* Create Board Dialog */}
      <CreateBoardDialog
        open={createBoardOpen}
        onClose={() => setCreateBoardOpen(false)}
      />
      {/* Sidebar Drawer */}
      <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Box sx={{ width: 250 }} role="presentation" onClick={() => setSidebarOpen(false)}>
          <List>
            <ListItem component="a" href="/dashboard">
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <Divider />
            <ListItem component="a" href="/kanban">
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Kanban Board" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
  );
};

export default KanbanPage;