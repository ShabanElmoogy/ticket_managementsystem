import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  IconButton,
  Alert,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import { useKanbanStore } from '../../stores/kanbanStore';
import { getColorPair } from '../../shared/utils/colorContrast';
import type { BoardType } from './types/types';

interface CreateBoardDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ColumnData {
  name: string;
  description: string;
  color: string;
  darkColor: string;
  wipLimit: string;
  position?: number;
}

const CreateBoardDialog: React.FC<CreateBoardDialogProps> = ({
  open,
  onClose
}) => {
  const { createBoard, loading } = useKanbanStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    type: 'tickets' as BoardType | string, // 'tickets' or 'tasks'
  });

  const [columns, setColumns] = useState<ColumnData[]>(() => {
    const defaultColors = ['#e3f2fd', '#fff3e0', '#f3e5f5', '#e8f5e8'];
    const defaultData = [
      { name: 'To Do', description: 'Tasks to be started', wipLimit: '' },
      { name: 'In Progress', description: 'Tasks currently being worked on', wipLimit: '3' },
      { name: 'Review', description: 'Tasks ready for review', wipLimit: '2' },
      { name: 'Done', description: 'Completed tasks', wipLimit: '' }
    ];
    
    return defaultData.map((item, index) => {
      const colorPair = getColorPair(defaultColors[index]);
      return {
        ...item,
        color: colorPair.lightColor,
        darkColor: colorPair.darkColor,
      };
    });
  });

  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Board name is required');
      return;
    }

    if (columns.length === 0) {
      setError('At least one column is required');
      return;
    }

    setError(null);

    try {
      const boardData = {
        name: formData.name,
        description: formData.description,
        isDefault: formData.isDefault,
        type: formData.type as BoardType,
        columns: columns.map((col, index) => ({
          name: col.name,
          description: col.description,
          color: col.color,
          position: index,
          wipLimit: col.wipLimit ? parseInt(col.wipLimit) : undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          boardId: '', // Will be set by backend
          id: '' // Will be set by backend
        }))
      };

      await createBoard(boardData);
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create board');
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '', isDefault: false, type: 'tickets' });
    const defaultColors = ['#e3f2fd', '#fff3e0', '#f3e5f5', '#e8f5e8'];
    const defaultData = [
      { name: 'To Do', description: 'Tasks to be started', wipLimit: '' },
      { name: 'In Progress', description: 'Tasks currently being worked on', wipLimit: '3' },
      { name: 'Review', description: 'Tasks ready for review', wipLimit: '2' },
      { name: 'Done', description: 'Completed tasks', wipLimit: '' }
    ];
    
    setColumns(defaultData.map((item, index) => {
      const colorPair = getColorPair(defaultColors[index]);
      return {
        ...item,
        color: colorPair.lightColor,
        darkColor: colorPair.darkColor,
      };
    }));
    setError(null);
    setColorPickerIndex(null);
    onClose();
  };

  const addColumn = () => {
    const defaultColor = '#f5f5f5';
    const colorPair = getColorPair(defaultColor);
    setColumns([...columns, {
      name: '',
      description: '',
      color: colorPair.lightColor,
      darkColor: colorPair.darkColor,
      wipLimit: ''
    }]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: keyof ColumnData, value: string) => {
    const updatedColumns = [...columns];
    
    if (field === 'color') {
      // When color changes, automatically calculate dark mode color
      const colorPair = getColorPair(value);
      updatedColumns[index] = { 
        ...updatedColumns[index], 
        color: colorPair.lightColor,
        darkColor: colorPair.darkColor
      };
    } else {
      updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    }
    
    setColumns(updatedColumns);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableScrollLock>
      <DialogTitle>Create New Board</DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Board Details */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{xs:12}}>
            <TextField
              label="Board Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid size={{xs:12}}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          <Grid size={{xs:12,sm:6}}>
            <FormControl fullWidth>
              <InputLabel id="board-type-label">Board Type</InputLabel>
              <Select
                labelId="board-type-label"
                value={formData.type}
                label="Board Type"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="tickets">Tickets (for support, bug, or issue tracking)</MenuItem>
                <MenuItem value="tasks">Tasks (for general workflow or agile tasks)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
           <Grid size={{xs:12,sm:6}}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                />
              }
              label="Set as default board"
            />
          </Grid>
        </Grid>

        {/* Columns Configuration */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Columns</Typography>
            <Button startIcon={<AddIcon />} onClick={addColumn}>
              Add Column
            </Button>
          </Box>

          {columns.map((column, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{xs:3}}>
                  <TextField
                    label="Column Name"
                    fullWidth
                    required
                    value={column.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                  />
                </Grid>
                <Grid size={{xs:4}}>
                  <TextField
                    label="Description"
                    fullWidth
                    value={column.description}
                    onChange={(e) => updateColumn(index, 'description', e.target.value)}
                  />
                </Grid>
                <Grid size={{xs:2}}>
                  <TextField
                    label="WIP Limit"
                    type="number"
                    fullWidth
                    value={column.wipLimit}
                    onChange={(e) => updateColumn(index, 'wipLimit', e.target.value)}
                    slotProps={{ htmlInput: { min: 0 } }}
                  />
                </Grid>
                <Grid size={{xs:2}}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Color:</Typography>
                    <Box display="flex" gap={0.5}>
                      {/* Light mode color */}
                      <Box
                        sx={{
                          width: 24,
                          height: 30,
                          backgroundColor: column.color,
                          borderRadius: '4px 0 0 4px',
                          cursor: 'pointer',
                          border: '1px solid #e0e0e0',
                          borderRight: 'none'
                        }}
                        onClick={() => setColorPickerIndex(colorPickerIndex === index ? null : index)}
                      />
                      {/* Dark mode color */}
                      <Box
                        sx={{
                          width: 24,
                          height: 30,
                          backgroundColor: column.darkColor,
                          borderRadius: '0 4px 4px 0',
                          cursor: 'pointer',
                          border: '1px solid #e0e0e0',
                          borderLeft: 'none'
                        }}
                        onClick={() => setColorPickerIndex(colorPickerIndex === index ? null : index)}
                      />
                    </Box>
                  </Box>
                  {colorPickerIndex === index && (
                    <Box sx={{ position: 'absolute', zIndex: 1000, mt: 1 }}>
                      <Box
                        sx={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0
                        }}
                        onClick={() => setColorPickerIndex(null)}
                      />
                      <Box 
                        sx={{ 
                          p: 2, 
                          backgroundColor: 'background.paper', 
                          borderRadius: 1, 
                          boxShadow: 3,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle2">
                            Select Light Mode Color
                          </Typography>
                          <Button 
                            size="small" 
                            onClick={() => setColorPickerIndex(null)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            ✕
                          </Button>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                          Dark mode color will be automatically calculated
                        </Typography>
                        <Box 
                          sx={{ 
                            '& .react-colorful': {
                              width: '200px !important',
                              height: '150px !important'
                            },
                            '& .react-colorful__saturation': {
                              borderRadius: '4px 4px 0 0'
                            },
                            '& .react-colorful__hue': {
                              height: '20px',
                              borderRadius: '0 0 4px 4px'
                            },
                            '& .react-colorful__pointer': {
                              width: '16px',
                              height: '16px'
                            }
                          }}
                        >
                          <HexColorPicker
                            color={column.color}
                            onChange={(color) => updateColumn(index, 'color', color)}
                          />
                        </Box>
                        <Box display="flex" gap={2} mt={2} alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary">Light Mode:</Typography>
                            <Box
                              sx={{
                                width: 50,
                                height: 24,
                                backgroundColor: column.color,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mt: 0.5
                              }}
                            />
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">Dark Mode:</Typography>
                            <Box
                              sx={{
                                width: 50,
                                height: 24,
                                backgroundColor: column.darkColor,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mt: 0.5
                              }}
                            />
                          </Box>
                        </Box>
                        <Box mt={2}>
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={() => setColorPickerIndex(null)}
                            fullWidth
                          >
                            Done
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Grid>
                <Grid size={{xs:1}}>
                  <IconButton
                    onClick={() => removeColumn(index)}
                    disabled={columns.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.name.trim()}
        >
          {loading ? 'Creating...' : 'Create Board'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateBoardDialog;