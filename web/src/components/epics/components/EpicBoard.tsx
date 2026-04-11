import React, { useState } from 'react';
import {
  Box, Paper, Typography, Chip, Tooltip,
  useTheme, alpha, Card, Badge,
} from '@mui/material';
import {
  DndContext,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  AccountTree, Apps, Person, CalendarToday, Lock, Timer,
  DashboardOutlined, PlayArrowOutlined, CheckCircleOutlined, CancelOutlined,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { epicsApi } from '../api/epics';
import EpicPriorityChip from './EpicPriorityChip';
import EpicHealthScore from './EpicHealthScore';
import { formatDate } from '../../../utils/dateUtils';
import type { Epic } from '../../../services/api/types';

const EPIC_STATUSES: Epic['status'][] = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    icon: DashboardOutlined,
    color: '#9e9e9e',
    description: 'Ideas and planning',
  },
  ACTIVE: {
    label: 'Active',
    icon: PlayArrowOutlined,
    color: '#1976d2',
    description: 'In progress',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircleOutlined,
    color: '#2e7d32',
    description: 'Successfully delivered',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: CancelOutlined,
    color: '#d32f2f',
    description: 'No longer needed',
  },
};

interface Props {
  epics: Epic[];
  isAdmin: boolean;
}

const EpicBoard: React.FC<Props> = ({ epics, isAdmin }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Epic['status'] }) =>
      epicsApi.update(id, { status }),
    onMutate: async ({ id, status }) => {
      // Cancel in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ['epics'] });

      // Snapshot current data for rollback
      const previous = qc.getQueryData<Epic[]>(['epics']);

      // Optimistically update the cache immediately
      qc.setQueryData<Epic[]>(['epics'], (old = []) =>
        old.map(e => e.id === id ? { ...e, status } : e)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on failure
      if (context?.previous) {
        qc.setQueryData(['epics'], context.previous);
      }
    },
    onSettled: () => {
      // Sync with server after success or error
      qc.invalidateQueries({ queryKey: ['epics'] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    if (!event.over || !isAdmin) return;

    const epicId = event.active.id as string;
    const overId = event.over.id as string;

    // overId is either a column status (from useDroppable) or an epic id (from useSortable)
    // Resolve to a column status in both cases
    const newStatus = (EPIC_STATUSES as string[]).includes(overId)
      ? (overId as Epic['status'])
      : epics.find(e => e.id === overId)?.status;

    if (!newStatus) return;

    const epic = epics.find(e => e.id === epicId);
    if (!epic || epic.status === newStatus) return;

    // Prevent invalid transitions
    if (epic.status === 'COMPLETED' && newStatus !== 'ACTIVE') return;
    if (epic.status === 'CANCELLED' && newStatus !== 'DRAFT') return;

    updateStatusMutation.mutate({ id: epicId, status: newStatus });
  };

  const getEpicsForStatus = (status: Epic['status']) =>
    epics.filter(epic => epic.status === status);

  const EpicCard: React.FC<{ epic: Epic }> = ({ epic }) => {
    const progress = epic.stepsTotal > 0 ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
    const overdue = epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED';
    const isBlocked = epic.blockedBy?.some(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
    const isDragging = activeId === epic.id;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging: isSortableDragging,
    } = useSortable({
      id: epic.id,
      disabled: !isAdmin,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => navigate(`/epics/${epic.id}`)}
        sx={{
          p: 2,
          mb: 1.5,
          cursor: 'pointer',
          borderRadius: 2,
          border: '1px solid',
          borderColor: isSortableDragging ? 'primary.main' : 'divider',
          backgroundColor: isSortableDragging
            ? alpha(theme.palette.primary.main, 0.05)
            : 'background.paper',
          boxShadow: isSortableDragging ? 4 : 1,
          transform: isSortableDragging ? 'rotate(2deg)' : 'none',
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: theme.transitions.duration.short,
          }),
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 2,
          },
          opacity: isDragging && !isSortableDragging ? 0.5 : 1,
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
          <AccountTree sx={{ fontSize: 16, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {epic.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} mt={0.5} flexWrap="wrap">
              <EpicPriorityChip priority={epic.priority} />
              <EpicHealthScore epic={epic} variant="chip" />
              {isBlocked && (
                <Tooltip title={`Blocked by: ${epic.blockedBy!.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').map(b => b.title).join(', ')}`}>
                  <Lock sx={{ fontSize: 12, color: 'error.main' }} />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {/* Description */}
        {epic.description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: 1,
              lineHeight: 1.3,
            }}
          >
            {epic.description}
          </Typography>
        )}

        {/* Meta chips */}
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
          {epic.applicationName && (
            <Chip
              icon={<Apps sx={{ fontSize: '0.7rem !important' }} />}
              label={epic.applicationName}
              size="small"
              variant="outlined"
              sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
          {epic.customerName && (
            <Chip
              icon={<Person sx={{ fontSize: '0.7rem !important' }} />}
              label={epic.customerName}
              size="small"
              variant="outlined"
              color="secondary"
              sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
          {epic.ownerName && (
            <Chip
              icon={<Person sx={{ fontSize: '0.7rem !important' }} />}
              label={epic.ownerName}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
        </Box>

        {/* Stats row */}
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
          <Box display="flex" gap={1}>
            <Tooltip title={`${epic.featureCount} features`}>
              <Chip
                label={epic.featureCount}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', minWidth: 24 }}
              />
            </Tooltip>
            {epic.stepsTotal > 0 && (
              <Tooltip title={`${epic.stepsDone}/${epic.stepsTotal} steps (${progress}%)`}>
                <Chip
                  label={`${progress}%`}
                  size="small"
                  color={progress === 100 ? 'success' : 'default'}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Due date */}
          {epic.targetDate && (
            <Tooltip title={`Target: ${formatDate(epic.targetDate)}`}>
              <Box display="flex" alignItems="center" gap={0.25}>
                <CalendarToday sx={{ fontSize: 10, color: overdue ? 'error.main' : 'text.secondary' }} />
                <Typography
                  variant="caption"
                  color={overdue ? 'error.main' : 'text.secondary'}
                  sx={{ fontSize: '0.65rem' }}
                >
                  {formatDate(epic.targetDate)}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Effort estimation */}
        {epic.estimatedDays && (
          <Box display="flex" alignItems="center" gap={0.25} mt={0.5}>
            <Timer sx={{ fontSize: 10, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {epic.estimatedDays}d estimated
            </Typography>
          </Box>
        )}
      </Card>
    );
  };

  const BoardColumn: React.FC<{ status: Epic['status'] }> = ({ status }) => {
    const config = STATUS_CONFIG[status];
    const epicsInColumn = getEpicsForStatus(status);
    const IconComponent = config.icon;

    const { isOver, setNodeRef } = useDroppable({
      id: status,
    });

    return (
      <Box sx={{ flex: '1 1 0', minWidth: 0, minHeight: 0 }}>
        <Paper
          sx={{
            height: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            border: '1px solid',
            borderColor: isOver ? config.color : 'divider',
            backgroundColor: isOver ? alpha(config.color, 0.05) : 'background.paper',
            transition: theme.transitions.create(['border-color', 'background-color']),
          }}
        >
          {/* Column header */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: alpha(config.color, 0.05),
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <IconComponent sx={{ fontSize: 18, color: config.color }} />
              <Typography variant="subtitle1" fontWeight={600} color={config.color} sx={{ mr: 1 }}>
                {config.label}
              </Typography>
              <Badge
                badgeContent={epicsInColumn.length}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    minWidth: 18,
                    height: 18
                  },
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              {config.description}
            </Typography>
          </Box>

          {/* Droppable area */}
          <Box
            ref={setNodeRef}
            sx={{
              flex: 1,
              p: 1.5,
              minHeight: 200,
              maxHeight: 'calc(100vh - 320px)',
              overflowY: 'auto',
              overflowX: 'hidden',
              backgroundColor: isOver ? alpha(config.color, 0.08) : 'transparent',
              transition: theme.transitions.create('background-color'),
            }}
          >
            <SortableContext
              items={epicsInColumn.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              {epicsInColumn.map((epic) => (
                <EpicCard key={epic.id} epic={epic} />
              ))}
            </SortableContext>

            {epicsInColumn.length === 0 && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 4,
                  color: 'text.secondary',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.action.hover, 0.02),
                }}
              >
                <IconComponent sx={{ fontSize: 32, mb: 1, opacity: 0.3 }} />
                <Typography variant="caption">
                  No {config.label.toLowerCase()} epics
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          display="flex"
          gap={2}
          sx={{
            height: '100%',
            overflowX: 'auto',
            overflowY: 'hidden',
            pb: 2,
          }}
        >
          {EPIC_STATUSES.map(status => (
            <BoardColumn key={status} status={status} />
          ))}
        </Box>
      </DndContext>
    </Box>
  );
};

export default EpicBoard;