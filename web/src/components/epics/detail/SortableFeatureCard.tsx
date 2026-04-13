import React, { useState } from 'react';
import {
  Box, Typography, Paper, Chip, IconButton, Tooltip, Menu, MenuItem,
} from '@mui/material';
import {
  OpenInNew, LinkOff, Apps, Person, Lightbulb, DragIndicator,
  InfoOutlined, FlipCameraAndroid, ThumbUp, EditNote,
} from '@mui/icons-material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FeatureStatusChip from '../../features/components/FeatureStatusChip';
import type { FeatureRequest } from '../../../services/api/types';
import { formatDate } from '../../../shared/utils/dateUtils';
import type { EpicFeature } from './types';

const STATUSES: { value: FeatureRequest['status']; label: string; color: string }[] = [
  { value: 'UNDER_REVIEW', label: 'Under Review', color: '#9e9e9e' },
  { value: 'PLANNED',      label: 'Planned',      color: '#29b6f6' },
  { value: 'IN_PROGRESS',  label: 'In Progress',  color: '#1976d2' },
  { value: 'SHIPPED',      label: 'Shipped',      color: '#2e7d32' },
  { value: 'DECLINED',     label: 'Declined',     color: '#d32f2f' },
];

interface Props {
  feature: EpicFeature;
  isAdmin: boolean;
  isFlipped: boolean;
  onFlip: (id: string | null) => void;
  onNavigate: (id: string) => void;
  onUnlink: (id: string) => void;
  onEdit: (feature: EpicFeature) => void;
  onStatusChange: (id: string, status: FeatureRequest['status']) => void;
  epicId: string;
}

const SortableFeatureCard: React.FC<Props> = ({
  feature, isAdmin, isFlipped, onFlip, onNavigate, onUnlink, onEdit, onStatusChange,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const current = STATUSES.find((s) => s.value === feature.status)!;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: feature.id,
    disabled: !isAdmin,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: 12,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Box sx={{ perspective: '1000px', height: 72 }}>
        <Box sx={{
          position: 'relative', height: '100%',
          transformStyle: 'preserve-3d',
          transition: isDragging ? 'none' : 'transform 0.45s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          {/* FRONT */}
          <Paper sx={{
            position: 'absolute', inset: 0, p: 2, borderRadius: 2,
            border: '1px solid',
            borderColor: isDragging ? 'primary.main' : 'divider',
            boxShadow: isDragging ? 4 : 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' },
          }}
            onClick={() => onNavigate(feature.id)}
          >
            <Box display="flex" alignItems="center" gap={1.5} height="100%">
              {isAdmin && (
                <Box {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
                  sx={{ color: 'text.disabled', cursor: 'grab', display: 'flex', touchAction: 'none' }}>
                  <DragIndicator fontSize="small" />
                </Box>
              )}
              <Lightbulb color="warning" fontSize="small" />
              <Box flex={1} minWidth={0}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }} noWrap>{feature.title}</Typography>
                  {isAdmin ? (
                    <>
                      <Chip
                        label={current.label} size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
                        sx={{ fontWeight: 600, bgcolor: current.color, color: '#fff', cursor: 'pointer', '&:hover': { opacity: 0.85 } }}
                      />
                      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}
                        onClick={(e) => e.stopPropagation()} disableScrollLock>
                        {STATUSES.map((s) => (
                          <MenuItem key={s.value} selected={s.value === feature.status}
                            onClick={() => { onStatusChange(feature.id, s.value); setMenuAnchor(null); }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color, mr: 1, flexShrink: 0 }} />
                            {s.label}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  ) : (
                    <FeatureStatusChip status={feature.status} />
                  )}
                </Box>
                {feature.description && (
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                    {feature.description}
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Details">
                  <IconButton size="small" onClick={() => onFlip(isFlipped ? null : feature.id)}>
                    <InfoOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open feature">
                  <IconButton size="small" onClick={() => onNavigate(feature.id)}>
                    <OpenInNew fontSize="small" />
                  </IconButton>
                </Tooltip>
                {isAdmin && (
                  <Tooltip title="Edit feature">
                    <IconButton size="small" onClick={() => onEdit(feature)}>
                      <EditNote fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isAdmin && (
                  <Tooltip title="Unlink from epic">
                    <IconButton size="small" color="error" onClick={() => onUnlink(feature.id)}>
                      <LinkOff fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>

          {/* BACK */}
          <Paper sx={{
            position: 'absolute', inset: 0, p: 2, borderRadius: 2,
            border: '1px solid', borderColor: 'primary.main',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            bgcolor: 'primary.50',
            overflow: 'hidden',
          }}>
            <Box display="flex" alignItems="center" gap={1.5} height="100%">
              <Box flex={1} minWidth={0} display="flex" gap={2} alignItems="center" flexWrap="wrap">
                {feature.applicationName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Apps sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>{feature.applicationName}</Typography>
                  </Box>
                )}
                {feature.customerName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>{feature.customerName}</Typography>
                  </Box>
                )}
                {feature.submittedByName && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary" noWrap>By: {feature.submittedByName}</Typography>
                  </Box>
                )}
                {feature.voteCount !== undefined && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <ThumbUp sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">{feature.voteCount} votes</Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary">{formatDate(feature.createdAt)}</Typography>
              </Box>
              <Tooltip title="Flip back">
                <IconButton size="small" onClick={() => onFlip(null)}>
                  <FlipCameraAndroid fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default SortableFeatureCard;
