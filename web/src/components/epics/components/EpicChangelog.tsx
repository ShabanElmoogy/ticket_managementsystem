import React, { useMemo, useState } from 'react';
import {
  Box, Typography, CircularProgress, Avatar, Tooltip, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  InputAdornment, Collapse, IconButton,
} from '@mui/material';
import {
  SwapHoriz, Edit, Link, LinkOff, History, Lightbulb,
  ConfirmationNumber, FilterList, ExpandMore, ExpandLess,
  ArrowForward,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { epicsApi, type EpicActivityItem } from '../api/epics';
import { formatDateTime } from '../../../shared/utils/dateUtils';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { type Dayjs } from 'dayjs';
import { getPickerDateFormat } from '../../../stores/tenantStore';

// ── Action metadata ──────────────────────────────────────────────────────────

type ActionMeta = {
  label: string;
  icon: React.ReactNode;
  color: string;
  group: 'field' | 'feature' | 'ticket' | 'other';
  renderDiff?: (meta: any) => React.ReactNode;
};

const PILL = (text: string, color: string) => (
  <Chip
    label={text}
    size="small"
    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
      bgcolor: `${color}22`, color, border: `1px solid ${color}44`,
      borderRadius: 1 }}
  />
);

const ARROW = <ArrowForward sx={{ fontSize: 12, mx: 0.5, color: 'text.disabled', flexShrink: 0 }} />;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#9e9e9e', ACTIVE: '#1976d2', COMPLETED: '#2e7d32', CANCELLED: '#d32f2f',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#7c3aed',
};
const FEATURE_COLORS: Record<string, string> = {
  UNDER_REVIEW: '#9e9e9e', PLANNED: '#29b6f6', IN_PROGRESS: '#1976d2',
  SHIPPED: '#2e7d32', DECLINED: '#d32f2f',
};

const ACTION_META: Record<string, ActionMeta> = {
  STATUS_CHANGED: {
    label: 'Status changed',
    icon: <SwapHoriz fontSize="small" />,
    color: '#f59e0b',
    group: 'field',
    renderDiff: (m) => (
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5} mt={0.5}>
        {PILL(m.from ?? '—', STATUS_COLORS[m.from] ?? '#9e9e9e')}
        {ARROW}
        {PILL(m.to, STATUS_COLORS[m.to] ?? '#9e9e9e')}
      </Box>
    ),
  },
  PRIORITY_CHANGED: {
    label: 'Priority changed',
    icon: <Edit fontSize="small" />,
    color: '#8b5cf6',
    group: 'field',
    renderDiff: (m) => (
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5} mt={0.5}>
        {m.from && PILL(m.from, PRIORITY_COLORS[m.from] ?? '#9e9e9e')}
        {m.from && ARROW}
        {PILL(m.to, PRIORITY_COLORS[m.to] ?? '#9e9e9e')}
      </Box>
    ),
  },
  TITLE_CHANGED: {
    label: 'Title updated',
    icon: <Edit fontSize="small" />,
    color: '#3b82f6',
    group: 'field',
    renderDiff: (m) => (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
        "{m.to}"
      </Typography>
    ),
  },
  FEATURE_LINKED: {
    label: 'Feature linked',
    icon: <Link fontSize="small" />,
    color: '#10b981',
    group: 'feature',
    renderDiff: (m) => (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {m.featureTitle}
      </Typography>
    ),
  },
  FEATURE_UNLINKED: {
    label: 'Feature unlinked',
    icon: <LinkOff fontSize="small" />,
    color: '#ef4444',
    group: 'feature',
    renderDiff: (m) => (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {m.featureTitle}
      </Typography>
    ),
  },
  FEATURES_REORDERED: {
    label: 'Features reordered',
    icon: <History fontSize="small" />,
    color: '#6b7280',
    group: 'feature',
  },
  FEATURE_STATUS_CHANGED: {
    label: 'Feature status changed',
    icon: <Lightbulb fontSize="small" />,
    color: '#06b6d4',
    group: 'feature',
    renderDiff: (m) => (
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {m.featureTitle}
        </Typography>
        <Box display="flex" alignItems="center" flexWrap="wrap" gap={0.5} mt={0.25}>
          {PILL(m.from ?? '—', FEATURE_COLORS[m.from] ?? '#9e9e9e')}
          {ARROW}
          {PILL(m.to, FEATURE_COLORS[m.to] ?? '#9e9e9e')}
        </Box>
      </Box>
    ),
  },
  TICKET_LINKED: {
    label: 'Ticket linked',
    icon: <ConfirmationNumber fontSize="small" />,
    color: '#0ea5e9',
    group: 'ticket',
    renderDiff: (m) => (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {m.ticketTitle}
      </Typography>
    ),
  },
  TICKET_UNLINKED: {
    label: 'Ticket unlinked',
    icon: <ConfirmationNumber fontSize="small" />,
    color: '#f97316',
    group: 'ticket',
    renderDiff: (m) => (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {m.ticketTitle}
      </Typography>
    ),
  },
};

const getMeta = (action: string): ActionMeta =>
  ACTION_META[action] ?? { label: action, icon: <History fontSize="small" />, color: '#6b7280', group: 'other' };

// ── Group label ───────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  field: 'Field Changes', feature: 'Feature Changes',
  ticket: 'Ticket Changes', other: 'Other',
};

// ── Date helpers ──────────────────────────────────────────────────────────────

const toDateStr = (iso: string) => iso.slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const DATE_PRESETS = [
  { label: 'All time', from: '', to: '' },
  { label: 'Today',    from: today(), to: today() },
  { label: 'Last 7d',  from: daysAgo(7), to: today() },
  { label: 'Last 30d', from: daysAgo(30), to: today() },
];

// ── Component ─────────────────────────────────────────────────────────────────

interface Props { epicId: string }

const EpicChangelog: React.FC<Props> = ({ epicId }) => {
  const [typeFilter, setTypeFilter] = useState('');
  const [datePreset, setDatePreset] = useState(0);
  const [customFrom, setCustomFrom] = useState<Dayjs | null>(null);
  const [customTo, setCustomTo]     = useState<Dayjs | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['epics', epicId, 'activity'],
    queryFn: () => epicsApi.listActivity(epicId),
    enabled: !!epicId,
    staleTime: 0,
  });

  const actionTypes = useMemo(() => [...new Set(items.map((i) => i.action))].sort(), [items]);

  const { from, to } = useMemo(() => {
    if (datePreset === 4) return {
      from: customFrom ? customFrom.format('YYYY-MM-DD') : '',
      to:   customTo   ? customTo.format('YYYY-MM-DD')   : '',
    };
    return { from: DATE_PRESETS[datePreset]?.from ?? '', to: DATE_PRESETS[datePreset]?.to ?? '' };
  }, [datePreset, customFrom, customTo]);

  const filtered = useMemo(() => items.filter((item) => {
    if (typeFilter && item.action !== typeFilter) return false;
    const d = toDateStr(item.createdAt);
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }), [items, typeFilter, from, to]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, EpicActivityItem[]>();
    for (const item of filtered) {
      const key = toDateStr(item.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [filtered]);

  return (
    <Box>
      {/* Header + filter toggle */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1}>
          <History color="action" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Changelog
          </Typography>
          {filtered.length > 0 && (
            <Chip label={filtered.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
        </Box>
        <IconButton size="small" onClick={() => setFiltersOpen((v) => !v)}>
          <FilterList fontSize="small" color={typeFilter || datePreset !== 0 ? 'primary' : 'action'} />
        </IconButton>
      </Box>

      {/* Filters */}
      <Collapse in={filtersOpen}>
        <Box display="flex" flexDirection="column" gap={1.5} mb={2} p={1.5}
          sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Change type</InputLabel>
            <Select value={typeFilter} label="Change type" onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="">All types</MenuItem>
              {actionTypes.map((a) => (
                <MenuItem key={a} value={a}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getMeta(a).color, flexShrink: 0 }} />
                    {getMeta(a).label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Date range</InputLabel>
            <Select value={datePreset} label="Date range"
              onChange={(e) => setDatePreset(Number(e.target.value))}>
              {DATE_PRESETS.map((p, i) => <MenuItem key={i} value={i}>{p.label}</MenuItem>)}
              <MenuItem value={4}>Custom…</MenuItem>
            </Select>
          </FormControl>

          {datePreset === 4 && (
            <Box display="flex" gap={1}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From" value={customFrom}
                  onChange={(val) => setCustomFrom(val as Dayjs | null)}
                  format={getPickerDateFormat()}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                />
                <DatePicker
                  label="To" value={customTo}
                  onChange={(val) => setCustomTo(val as Dayjs | null)}
                  format={getPickerDateFormat()}
                  slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                />
              </LocalizationProvider>
            </Box>
          )}

          {(typeFilter || datePreset !== 0) && (
            <Box display="flex" gap={0.5} flexWrap="wrap">
              {typeFilter && (
                <Chip label={getMeta(typeFilter).label} size="small" onDelete={() => setTypeFilter('')} />
              )}
              {datePreset !== 0 && (
                <Chip
                  label={datePreset === 4
                    ? `${customFrom?.format('YYYY-MM-DD') ?? ''} → ${customTo?.format('YYYY-MM-DD') ?? ''}`
                    : DATE_PRESETS[datePreset].label}
                  size="small" onDelete={() => { setDatePreset(0); setCustomFrom(null); setCustomTo(null); }}
                />
              )}
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Content */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : filtered.length === 0 ? (
        <Box textAlign="center" py={4}>
          <History sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {items.length === 0 ? 'No changes recorded yet.' : 'No changes match your filters.'}
          </Typography>
        </Box>
      ) : (
        <Box>
          {[...grouped.entries()].map(([date, dayItems]) => (
            <Box key={date} mb={2}>
              {/* Date separator */}
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                  {new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Typography>
                <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
              </Box>

              {/* Items for this day */}
              <Box sx={{ position: 'relative', pl: 2.5 }}>
                <Box sx={{ position: 'absolute', left: 11, top: 4, bottom: 4, width: 2, bgcolor: 'divider', borderRadius: 1 }} />
                {dayItems.map((item) => {
                  const cfg = getMeta(item.action);
                  const initials = item.user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
                  const isExpanded = expandedId === item.id;
                  const hasDiff = !!cfg.renderDiff;

                  return (
                    <Box key={item.id} display="flex" gap={1.5} mb={1.5} sx={{ position: 'relative' }}>
                      {/* Icon dot */}
                      <Box sx={{
                        width: 22, height: 22, borderRadius: '50%', bgcolor: cfg.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, color: '#fff', zIndex: 1, mt: 0.1,
                      }}>
                        {cfg.icon}
                      </Box>

                      <Box flex={1} minWidth={0}
                        sx={{ cursor: hasDiff ? 'pointer' : 'default' }}
                        onClick={() => hasDiff && setExpandedId(isExpanded ? null : item.id)}
                      >
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                            {cfg.label}
                          </Typography>
                          {hasDiff && (
                            <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                              {isExpanded ? <ExpandLess sx={{ fontSize: 14 }} /> : <ExpandMore sx={{ fontSize: 14 }} />}
                            </IconButton>
                          )}
                        </Box>

                        {/* Diff — always visible for simple ones, collapsible for others */}
                        {hasDiff && (
                          <Collapse in={isExpanded || ['STATUS_CHANGED', 'PRIORITY_CHANGED', 'FEATURE_STATUS_CHANGED'].includes(item.action)}>
                            {cfg.renderDiff!(item.meta ?? {})}
                          </Collapse>
                        )}

                        <Box display="flex" alignItems="center" gap={0.75} mt={0.25}>
                          {item.user && (
                            <Tooltip title={item.user.name}>
                              <Avatar sx={{ width: 14, height: 14, fontSize: '0.5rem', bgcolor: 'primary.main' }}>
                                {initials}
                              </Avatar>
                            </Tooltip>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {item.user?.name ?? 'System'} · {formatDateTime(item.createdAt)}
                          </Typography>
                          <Chip
                            label={GROUP_LABELS[cfg.group]}
                            size="small"
                            sx={{ height: 14, fontSize: '0.55rem', ml: 'auto',
                              bgcolor: `${cfg.color}18`, color: cfg.color }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EpicChangelog;
