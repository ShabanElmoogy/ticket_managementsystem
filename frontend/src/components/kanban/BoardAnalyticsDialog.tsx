import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { subDays, subMonths } from 'date-fns';
import { useKanbanStore } from '../../stores/kanbanStore';

interface BoardAnalyticsDialogProps {
  open: boolean;
  onClose: () => void;
  boardId: string;
}



const BoardAnalyticsDialog: React.FC<BoardAnalyticsDialogProps> = ({
  open,
  onClose,
  boardId
}) => {
  const { analytics, fetchBoardAnalytics, loading, error } = useKanbanStore();
  
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [customRange, setCustomRange] = useState(false);

  useEffect(() => {
    if (open && boardId) {
      loadAnalytics();
    }
  }, [open, boardId, dateRange, startDate, endDate]);

  const loadAnalytics = () => {
    let start: string | undefined;
    let end: string | undefined;

    if (customRange && startDate && endDate) {
      start = startDate.toISOString();
      end = endDate.toISOString();
    } else {
      const now = new Date();
      switch (dateRange) {
        case '7days':
          start = subDays(now, 7).toISOString();
          break;
        case '30days':
          start = subDays(now, 30).toISOString();
          break;
        case '3months':
          start = subMonths(now, 3).toISOString();
          break;
        case '6months':
          start = subMonths(now, 6).toISOString();
          break;
      }
      end = now.toISOString();
    }

    fetchBoardAnalytics(boardId, start, end);
  };

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    setCustomRange(value === 'custom');
  };

  const formatStatusData = () => {
    if (!analytics) return [];
    
    return analytics.ticketsByStatus.map(item => ({
      name: item.status.replace('_', ' '),
      value: item._count.id,
      color: getStatusColor(item.status)
    }));
  };

  const formatPriorityData = () => {
    if (!analytics) return [];
    
    return analytics.ticketsByPriority.map(item => ({
      name: item.priority,
      value: item._count.id,
      color: getPriorityColor(item.priority)
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#e3f2fd';
      case 'IN_PROGRESS': return '#fff3e0';
      case 'RESOLVED': return '#f3e5f5';
      case 'CLOSED': return '#e8f5e8';
      default: return '#f5f5f5';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#f44336';
      case 'HIGH': return '#ff9800';
      case 'MEDIUM': return '#2196f3';
      case 'LOW': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>Board Analytics</DialogTitle>
        
        <DialogContent>
          {/* Date Range Selector */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{xs: 4}}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    label="Date Range"
                    onChange={(e) => handleDateRangeChange(e.target.value)}
                  >
                    <MenuItem value="7days">Last 7 days</MenuItem>
                    <MenuItem value="30days">Last 30 days</MenuItem>
                    <MenuItem value="3months">Last 3 months</MenuItem>
                    <MenuItem value="6months">Last 6 months</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {customRange && (
                <>
                  <Grid size={{xs: 4}}>
                    <DatePicker
                      label="Start Date"
                      value={startDate}
                      onChange={setStartDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid size={{xs: 4}}>
                    <DatePicker
                      label="End Date"
                      value={endDate}
                      onChange={setEndDate}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {analytics && !loading && (
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid size={{xs: 12, md: 3}}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Tickets
                    </Typography>
                    <Typography variant="h4">
                      {analytics.totalTickets}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Completed
                    </Typography>
                    <Typography variant="h4">
                      {analytics.completedTickets}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h4">
                      {analytics.completionRate}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs: 12, md: 3}}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Avg. Completion Time
                    </Typography>
                    <Typography variant="h4">
                      {analytics.avgCompletionTime} days
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Charts */}
              <Grid size={{xs: 12, md: 6}}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tickets by Status
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={formatStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {formatStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{xs: 12, md: 6}}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Tickets by Priority
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={formatPriorityData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#8884d8">
                          {formatPriorityData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BoardAnalyticsDialog;