import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Add, Lightbulb } from '@mui/icons-material';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableFeatureCard from './SortableFeatureCard';
import type { EpicFeature } from './types';
import type { FeatureRequest } from '../../../services/api/types';

interface Props {
  features: EpicFeature[];
  isAdmin: boolean;
  flippedId: string | null;
  epicId: string;
  onFlip: (id: string | null) => void;
  onNavigate: (id: string) => void;
  onUnlink: (id: string) => void;
  onEdit: (feature: EpicFeature) => void;
  onStatusChange: (id: string, status: FeatureRequest['status']) => void;
  onReorder: (reordered: EpicFeature[]) => void;
  onNewFeature: () => void;
  onLinkExisting: () => void;
}

const EpicFeaturesList: React.FC<Props> = ({
  features, isAdmin, flippedId, epicId,
  onFlip, onNavigate, onUnlink, onEdit, onStatusChange, onReorder,
  onNewFeature, onLinkExisting,
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = features.findIndex((f) => f.id === active.id);
    const newIndex = features.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(features, oldIndex, newIndex));
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Feature Requests
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({features.length})
          </Typography>
        </Typography>
        {isAdmin && (
          <Box display="flex" gap={1}>
            <Button variant="outlined" size="small" startIcon={<Add />} onClick={onNewFeature}>New Feature</Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={onLinkExisting}>Link Existing</Button>
          </Box>
        )}
      </Box>

      {features.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Lightbulb sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No features linked yet.</Typography>
          {isAdmin && (
            <Box display="flex" gap={1} mt={1} justifyContent="center">
              <Button startIcon={<Add />} onClick={onNewFeature}>New Feature</Button>
              <Button startIcon={<Add />} onClick={onLinkExisting}>Link Existing</Button>
            </Box>
          )}
        </Paper>
      ) : (
        <Box sx={{ maxHeight: 250, overflowY: 'auto', pr: 0.5 }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={features.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {features.map((feature) => (
                <SortableFeatureCard
                  key={feature.id}
                  feature={feature}
                  isAdmin={isAdmin}
                  isFlipped={flippedId === feature.id}
                  onFlip={onFlip}
                  onNavigate={onNavigate}
                  onUnlink={onUnlink}
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  epicId={epicId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Box>
      )}
    </Box>
  );
};

export default EpicFeaturesList;
