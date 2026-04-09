import React, { useMemo, useState } from 'react';
import {
  Box, Typography, Tooltip, Paper, useTheme,
  ToggleButtonGroup, ToggleButton, Chip, Divider,
} from '@mui/material';
import {
  ZoomIn, ZoomOut, AccountTree, Person, Apps, CalendarToday,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { Epic } from '../../../services/api/types';

interface Props { epics: Epic[]; }

const STATUS_COLOR: Record<Epic['status'], string> = {
  DRAFT: '#9e9e9e', ACTIVE: '#1976d2', COMPLETED: '#2e7d32', CANCELLED: '#c62828',
};
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LABEL_WIDTH  = 220;
const ROW_HEIGHT   = 52;
const ZOOM_LEVELS  = [2, 3.5, 5.5, 8];

type Strategy = 'status' | 'owner' | 'application' | 'timeline';

interface Group { label: string; color?: string; items: Epic[]; }

// ── helpers ──────────────────────────────────────────────────────────────────
const buildGroups = (epics: Epic[], strategy: Strategy): Group[] => {
  switch (strategy) {
    case 'status': {
      const order: Epic['status'][] = ['ACTIVE', 'DRAFT', 'COMPLETED', 'CANCELLED'];
      return order
        .map((s) => ({ label: s, color: STATUS_COLOR[s], items: epics.filter((e) => e.status === s) }))
        .filter((g) => g.items.length > 0);
    }
    case 'owner': {
      const map = new Map<string, Epic[]>();
      epics.forEach((e) => {
        const key = e.ownerName ?? '— No Owner';
        map.set(key, [...(map.get(key) ?? []), e]);
      });
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items }));
    }
    case 'application': {
      const map = new Map<string, Epic[]>();
      epics.forEach((e) => {
        const key = e.applicationName ?? '— No Application';
        map.set(key, [...(map.get(key) ?? []), e]);
      });
      return [...map.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => ({ label, items }));
    }
    case 'timeline': {
      const sorted = [...epics].sort((a, b) => {
        const ta = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
        const tb = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
        return ta - tb;
      });
      return [{ label: 'All Epics · sorted by target date', items: sorted }];
    }
  }
};

// ── component ─────────────────────────────────────────────────────────────────
const EpicRoadmap: React.FC<Props> = ({ epics }) => {
  const theme    = useTheme();
  const navigate = useNavigate();
  const [zoom,     setZoom]     = useState(1);
  const [strategy, setStrategy] = useState<Strategy>('status');

  const pxPerDay = ZOOM_LEVELS[zoom];

  const { rangeStart, months, totalDays } = useMemo(() => {
    const dates = epics.flatMap((e) => [
      new Date(e.createdAt),
      e.targetDate ? new Date(e.targetDate) : null,
    ]).filter(Boolean) as Date[];

    const now  = new Date();
    const minD = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : now;
    const maxD = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : now;

    const start = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const end   = new Date(maxD.getFullYear(), maxD.getMonth() + 2, 0);

    const cols: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { cols.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }

    return {
      rangeStart: start,
      months: cols,
      totalDays: Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1,
    };
  }, [epics]);

  const toPx = (date: Date) =>
    Math.max(0, Math.round((date.getTime() - rangeStart.getTime()) / 86_400_000) * pxPerDay);

  const today   = new Date();
  const todayPx = toPx(today);
  const totalPx = totalDays * pxPerDay;

  const monthPositions = useMemo(
    () => months.map((m) => ({ date: m, px: toPx(m) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [months, pxPerDay],
  );

  const groups = useMemo(() => buildGroups(epics, strategy), [epics, strategy]);

  const noDateEpics = epics.filter((e) => !e.targetDate);

  if (epics.length === 0) return null;

  const STRATEGY_ICONS: Record<Strategy, React.ReactNode> = {
    status:      <AccountTree sx={{ fontSize: 14 }} />,
    owner:       <Person sx={{ fontSize: 14 }} />,
    application: <Apps sx={{ fontSize: 14 }} />,
    timeline:    <CalendarToday sx={{ fontSize: 14 }} />,
  };

  return (
    <Box>
      {/* ── Toolbar ── */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
        {/* Strategy selector */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Group by:</Typography>
          <ToggleButtonGroup size="small" exclusive value={strategy}
            onChange={(_, v) => v && setStrategy(v)}>
            {(['status', 'owner', 'application', 'timeline'] as Strategy[]).map((s) => (
              <ToggleButton key={s} value={s} sx={{ px: 1.2, py: 0.3, gap: 0.5, fontSize: '0.68rem', textTransform: 'capitalize' }}>
                {STRATEGY_ICONS[s]}{s}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {/* Zoom + range */}
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            {new Date(rangeStart).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            {' → '}
            {months[months.length - 1] && new Date(months[months.length - 1]).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </Typography>
          <Divider orientation="vertical" flexItem />
          <ZoomOut fontSize="small" sx={{ color: 'text.secondary' }} />
          <ToggleButtonGroup size="small" exclusive value={zoom} onChange={(_, v) => v !== null && setZoom(v)}>
            {['1×','2×','3×','4×'].map((l, i) => (
              <ToggleButton key={i} value={i} sx={{ px: 1.2, py: 0.25, fontSize: '0.68rem' }}>{l}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <ZoomIn fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>

        {/* ── Sticky month header ── */}
        <Box display="flex" sx={{
          borderBottom: '2px solid', borderColor: 'divider',
          bgcolor: 'background.default', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Box sx={{ minWidth: LABEL_WIDTH, flexShrink: 0, px: 2, py: 1, borderRight: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>EPIC</Typography>
          </Box>
          <Box sx={{ flex: 1, overflowX: 'hidden', position: 'relative', height: 36 }}>
            <Box sx={{ width: totalPx, height: '100%', position: 'relative' }}>
              {monthPositions.map(({ date, px }, i) => (
                <Box key={i} sx={{ position: 'absolute', left: px, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pl: 0.75 }}>
                  {i > 0 && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderLeft: '1px solid', borderColor: 'divider' }} />}
                  <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap sx={{ fontSize: '0.68rem' }}>
                    {MONTH_LABELS[date.getMonth()]}
                    {(i === 0 || date.getMonth() === 0) && ` ${date.getFullYear()}`}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* ── Scrollable body ── */}
        <Box sx={{ overflowX: 'auto' }}>
          <Box sx={{ minWidth: LABEL_WIDTH + totalPx }}>
            {groups.map((group, gi) => (
              <Box key={group.label}>
                {/* Group header */}
                <Box display="flex" alignItems="center" gap={1} px={2} py={0.6}
                  sx={{ bgcolor: 'action.hover', borderBottom: '1px solid', borderTop: gi > 0 ? '2px solid' : 'none', borderColor: 'divider' }}>
                  {group.color && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: group.color, flexShrink: 0 }} />}
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {group.label}
                  </Typography>
                  <Chip label={group.items.length} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                </Box>

                {/* Rows */}
                {group.items.map((epic, idx) => {
                  const startPx  = toPx(new Date(epic.createdAt));
                  const end      = epic.targetDate ? new Date(epic.targetDate) : null;
                  const endPx    = end ? toPx(end) : startPx + pxPerDay * 14;
                  const barW     = Math.max(endPx - startPx, pxPerDay * 3);
                  const overdue  = end && end < today && epic.status !== 'COMPLETED';
                  const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
                  const barColor = overdue ? STATUS_COLOR.CANCELLED : STATUS_COLOR[epic.status];
                  const isLast   = idx === group.items.length - 1;

                  // days remaining label
                  const daysLeft = end ? Math.ceil((end.getTime() - today.getTime()) / 86_400_000) : null;
                  const daysLabel = daysLeft === null ? null
                    : daysLeft < 0  ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0 ? 'Due today'
                    : `${daysLeft}d left`;

                  return (
                    <Box key={epic.id} display="flex" sx={{
                      borderBottom: isLast ? 'none' : '1px solid', borderColor: 'divider',
                      minHeight: ROW_HEIGHT, '&:hover': { bgcolor: 'action.hover' },
                    }}>
                      {/* Label column */}
                      <Box sx={{
                        minWidth: LABEL_WIDTH, flexShrink: 0, px: 2,
                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                        borderRight: '1px solid', borderColor: 'divider', gap: 0.3,
                      }}>
                        <Typography variant="body2" fontWeight={600} noWrap
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          onClick={() => navigate(`/epics/${epic.id}`)}>
                          {epic.title}
                        </Typography>
                        <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
                          {/* show status chip when not grouping by status */}
                          {strategy !== 'status' && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLOR[epic.status], flexShrink: 0 }} />
                          )}
                          {epic.featureCount > 0 && (
                            <Chip label={`${epic.featureCount}f`} size="small" sx={{ height: 15, fontSize: '0.58rem' }} />
                          )}
                          {daysLabel && (
                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: overdue ? 'error.main' : 'text.secondary' }}>
                              {daysLabel}
                            </Typography>
                          )}
                          {progress > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                              {progress}%
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Bar area */}
                      <Box sx={{ position: 'relative', width: totalPx, minWidth: totalPx }}>
                        {/* Month grid lines */}
                        {monthPositions.map(({ px: mpx }, i) => i > 0 && (
                          <Box key={i} sx={{
                            position: 'absolute', top: 0, bottom: 0, left: mpx,
                            borderLeft: '1px dashed', borderColor: theme.palette.divider,
                            pointerEvents: 'none',
                          }} />
                        ))}

                        {/* Today line */}
                        {todayPx > 0 && todayPx < totalPx && (
                          <Box sx={{
                            position: 'absolute', top: 0, bottom: 0, left: todayPx,
                            borderLeft: '2px solid', borderColor: 'error.main',
                            zIndex: 2, pointerEvents: 'none',
                          }} />
                        )}

                        {/* Epic bar */}
                        <Tooltip arrow title={
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{epic.title}</Typography>
                            <Typography variant="caption" display="block">Status: {epic.status}</Typography>
                            <Typography variant="caption" display="block">
                              Start: {new Date(epic.createdAt).toLocaleDateString()}
                            </Typography>
                            {end && (
                              <Typography variant="caption" display="block" color={overdue ? 'error.light' : 'inherit'}>
                                Target: {end.toLocaleDateString()}{overdue ? ' ⚠ Overdue' : ''}
                              </Typography>
                            )}
                            <Typography variant="caption" display="block">
                              Progress: {progress}% ({epic.stepsDone}/{epic.stepsTotal} steps)
                            </Typography>
                            {epic.ownerName && <Typography variant="caption" display="block">Owner: {epic.ownerName}</Typography>}
                            {epic.applicationName && <Typography variant="caption" display="block">App: {epic.applicationName}</Typography>}
                            {epic.customerName && <Typography variant="caption" display="block">Customer: {epic.customerName}</Typography>}
                          </Box>
                        }>
                          <Box onClick={() => navigate(`/epics/${epic.id}`)} sx={{
                            position: 'absolute',
                            left: startPx, width: barW,
                            top: '50%', transform: 'translateY(-50%)',
                            height: 26, borderRadius: 1.5,
                            bgcolor: barColor,
                            opacity: epic.status === 'CANCELLED' ? 0.4 : 0.88,
                            cursor: 'pointer', overflow: 'hidden',
                            display: 'flex', alignItems: 'center',
                            zIndex: 1,
                            transition: 'opacity 0.15s, box-shadow 0.15s',
                            '&:hover': { opacity: 1, boxShadow: 3 },
                          }}>
                            {/* Progress fill */}
                            {progress > 0 && (
                              <Box sx={{
                                position: 'absolute', left: 0, top: 0, bottom: 0,
                                width: `${progress}%`,
                                bgcolor: 'rgba(255,255,255,0.22)', borderRadius: 1.5,
                              }} />
                            )}
                            {/* Deadline cap */}
                            {end && (
                              <Box sx={{
                                position: 'absolute', right: 0, top: 0, bottom: 0, width: 4,
                                bgcolor: overdue ? 'rgba(255,180,180,0.8)' : 'rgba(255,255,255,0.4)',
                                borderRadius: '0 6px 6px 0',
                              }} />
                            )}
                            <Typography variant="caption" fontWeight={600} noWrap
                              sx={{ px: 1, color: '#fff', position: 'relative', zIndex: 1, fontSize: '0.68rem' }}>
                              {barW > 60 ? epic.title : ''}
                            </Typography>
                          </Box>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))}

            {/* No-date notice */}
            {noDateEpics.length > 0 && (
              <Box px={2} py={0.75} sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                  {noDateEpics.length} epic{noDateEpics.length !== 1 ? 's' : ''} without a target date (shown with 14-day fallback bar):{' '}
                  {noDateEpics.map((e) => e.title).join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* ── Legend ── */}
        <Box display="flex" gap={2} px={2} py={1} flexWrap="wrap"
          sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
          {(Object.entries(STATUS_COLOR) as [Epic['status'], string][]).map(([s, c]) => (
            <Box key={s} display="flex" alignItems="center" gap={0.5}>
              <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: c }} />
              <Typography variant="caption" color="text.secondary">{s}</Typography>
            </Box>
          ))}
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 2, height: 12, bgcolor: 'error.main' }} />
            <Typography variant="caption" color="text.secondary">Today</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: 'rgba(128,128,128,0.3)', border: '1px solid #aaa' }} />
            <Typography variant="caption" color="text.secondary">Progress</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EpicRoadmap;
