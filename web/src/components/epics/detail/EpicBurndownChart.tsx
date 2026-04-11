import React from 'react';
import { Box, Typography, Paper, Chip, Skeleton, useTheme } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from 'recharts';
import { epicsApi } from '../api/epics';
import { formatDate } from '../../../utils/dateUtils';

interface Props {
  epicId: string;
  targetDate?: string | null;
}

const fmt = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper sx={{ p: 1.5, fontSize: 12, minWidth: 140 }}>
      <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>
        {label}
      </Typography>
      {payload.map((p: any) => (
        <Box key={p.dataKey} display="flex" justifyContent="space-between" gap={2}>
          <Typography variant="caption" color={p.color}>{p.name}</Typography>
          <Typography variant="caption" fontWeight={600}>{p.value}</Typography>
        </Box>
      ))}
    </Paper>
  );
};

const EpicBurndownChart: React.FC<Props> = ({ epicId, targetDate }) => {
  const theme = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['epics', epicId, 'burndown'],
    queryFn: () => epicsApi.getBurndown(epicId),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Skeleton variant="text" width={180} height={28} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Paper>
    );
  }

  if (!data || data.points.length < 2) return null;

  // Thin out points to at most ~60 for readability (sample every N days)
  const raw = data.points;
  const step = Math.max(1, Math.floor(raw.length / 60));
  const points = raw.filter((_, i) => i % step === 0 || i === raw.length - 1);

  const hasIdeal = points.some((p) => p.ideal !== null);
  const today = new Date().toISOString().slice(0, 10);
  const todayFmt = fmt(today);

  const velocity7 = (() => {
    const last7 = raw.slice(-7);
    if (last7.length < 2) return 0;
    return (last7[last7.length - 1].completed - last7[0].completed) / (last7.length - 1);
  })();

  return (
    <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight={700} fontSize={15}>
            Burnup Chart
          </Typography>
          <Chip
            label={`${data.completed} / ${data.total} features shipped`}
            size="small"
            color={data.completed === data.total && data.total > 0 ? 'success' : 'default'}
            sx={{ fontSize: 11 }}
          />
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          {velocity7 > 0 && (
            <Chip
              label={`~${velocity7.toFixed(1)} features/day`}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          )}
          {data.projectedDate && data.completed < data.total && (
            <Chip
              label={`Projected: ${formatDate(data.projectedDate)}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: 11 }}
            />
          )}
          {data.completed >= data.total && data.total > 0 && (
            <Chip label="All shipped ✓" size="small" color="success" sx={{ fontSize: 11 }} />
          )}
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="burnup-completed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.25} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="burnup-ideal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.15} />
              <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            tickFormatter={fmt}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
            stroke={theme.palette.text.disabled}
          />
          <YAxis
            domain={[0, data.total || 1]}
            tick={{ fontSize: 10 }}
            stroke={theme.palette.text.disabled}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />

          {/* Today marker */}
          <ReferenceLine
            x={todayFmt}
            stroke={theme.palette.warning.main}
            strokeDasharray="4 3"
            label={{ value: 'Today', position: 'top', fontSize: 9, fill: theme.palette.warning.main }}
          />

          {/* Target date marker */}
          {data.targetDate && (
            <ReferenceLine
              x={fmt(data.targetDate)}
              stroke={theme.palette.error.light}
              strokeDasharray="4 3"
              label={{ value: 'Target', position: 'top', fontSize: 9, fill: theme.palette.error.light }}
            />
          )}

          {hasIdeal && (
            <Area
              type="monotone"
              dataKey="ideal"
              name="Ideal"
              stroke={theme.palette.success.main}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#burnup-ideal)"
              dot={false}
              activeDot={false}
            />
          )}

          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke={theme.palette.primary.main}
            strokeWidth={2}
            fill="url(#burnup-completed)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default EpicBurndownChart;
