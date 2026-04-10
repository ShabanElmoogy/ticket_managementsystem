import React from 'react';
import { Box, Typography, CircularProgress, Avatar, Tooltip } from '@mui/material';
import {
  SwapHoriz, Link, LinkOff, Edit, Lightbulb, History,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { epicsApi, type EpicActivityItem } from '../api/epics';
import { formatDateTime } from '../../../utils/dateUtils';

const ACTION_CONFIG: Record<string, { label: (meta: any) => string; icon: React.ReactNode; color: string }> = {
  STATUS_CHANGED:         { label: (m) => `Status changed from ${m.from ?? '—'} to ${m.to}`, icon: <SwapHoriz fontSize="small" />, color: '#f59e0b' },
  PRIORITY_CHANGED:       { label: (m) => `Priority changed${m.from ? ` from ${m.from}` : ''} to ${m.to}`,         icon: <Edit fontSize="small" />,     color: '#8b5cf6' },
  TITLE_CHANGED:          { label: (m) => `Title updated to "${m.to}"`,                        icon: <Edit fontSize="small" />,     color: '#3b82f6' },
  FEATURE_LINKED:         { label: (m) => `Feature "${m.featureTitle}" linked`,                icon: <Link fontSize="small" />,     color: '#10b981' },
  FEATURE_UNLINKED:       { label: (m) => `Feature "${m.featureTitle}" unlinked`,              icon: <LinkOff fontSize="small" />,  color: '#ef4444' },
  FEATURES_REORDERED:     { label: (m) => `Features reordered (${m.count} items)`,             icon: <History fontSize="small" />,  color: '#6b7280' },
  FEATURE_STATUS_CHANGED: { label: (m) => `"${m.featureTitle}" → ${m.to}`,                    icon: <Lightbulb fontSize="small" />, color: '#06b6d4' },
};

const getConfig = (action: string) =>
  ACTION_CONFIG[action] ?? { label: () => action, icon: <History fontSize="small" />, color: '#6b7280' };

interface Props { epicId: string; }

const EpicActivity: React.FC<Props> = ({ epicId }) => {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['epics', epicId, 'activity'],
    queryFn: () => epicsApi.listActivity(epicId),
    enabled: !!epicId,
  });

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <History color="action" />
        <Typography variant="h6" fontWeight={700}>
          Activity
          {items.length > 0 && (
            <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({items.length})
            </Typography>
          )}
        </Typography>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No activity yet.
        </Typography>
      ) : (
        <Box sx={{ position: 'relative', pl: 2.5 }}>
          {/* Vertical line */}
          <Box sx={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, bgcolor: 'divider', borderRadius: 1 }} />
          {items.map((item: EpicActivityItem) => {
            const cfg = getConfig(item.action);
            const initials = item.user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';
            return (
              <Box key={item.id} display="flex" gap={1.5} mb={2} sx={{ position: 'relative' }}>
                {/* Icon dot */}
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', bgcolor: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#fff', zIndex: 1,
                }}>
                  {cfg.icon}
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                    {cfg.label(item.meta ?? {})}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.75} mt={0.25}>
                    {item.user && (
                      <Tooltip title={item.user.name}>
                        <Avatar sx={{ width: 16, height: 16, fontSize: '0.55rem', bgcolor: 'primary.main' }}>
                          {initials}
                        </Avatar>
                      </Tooltip>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {item.user?.name ?? 'System'} · {formatDateTime(item.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default EpicActivity;
