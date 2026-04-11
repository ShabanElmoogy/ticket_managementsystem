import React from 'react';
import {
  Box, CircularProgress, Alert, Snackbar, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
  Tabs, Tab, Paper, Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';import { useQuery } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import EpicFormDialog from '../components/EpicFormDialog';
import EpicComments from '../components/EpicComments';
import EpicActivity from '../components/EpicActivity';
import FeatureFormDialog from '../../features/components/FeatureFormDialog';
import EpicHeader from './EpicHeader';
import EpicFeaturesList from './EpicFeaturesList';
import EpicLinkedTickets from './EpicLinkedTickets';
import LinkFeatureDialog from './LinkFeatureDialog';
import { useEpicDetail } from '../hooks/useEpicDetail';
import { exportEpicToCsv } from '../utils/exportEpicCsv';
import type { UpdateEpicData, FeatureRequest } from '../../../services/api/types';
import { formatDate } from '../../../utils/dateUtils';

const EpicDetailPage: React.FC = () => {
  const {
    id, navigate, isAdmin,
    epic, isLoading,
    orderedFeatures,
    flippedId, setFlippedId,
    blockerMenuAnchor, setBlockerMenuAnchor,
    sidebarTab, setSidebarTab,
    editOpen, setEditOpen,
    linkOpen, setLinkOpen,
    newFeatureOpen, setNewFeatureOpen,
    editingFeature, setEditingFeature,
    snack, setSnack,
    suggestActive, setSuggestActive,
    suggestCompleted, setSuggestCompleted,
    handleNewFeature, handleEditFeature,
    handleStatusChange, handleReorder, handleUpdate,
    onUnlink, onBlockerAdd, onBlockerRemove,
    invalidate,
  } = useEpicDetail();

  const { data: comments = [] } = useQuery({
    queryKey: ['epics', id, 'comments'],
    queryFn: () => epicsApi.listComments(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['epics', id, 'activity'],
    queryFn: () => epicsApi.listActivity(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const { data: linkedTickets = [] } = useQuery({
    queryKey: ['epics', id, 'tickets'],
    queryFn: () => epicsApi.listLinkedTickets(id!),
    enabled: !!id,
    staleTime: 0,
  });

  const handleCsvExport = () => {
    if (!epic) return;
    exportEpicToCsv(epic as any, orderedFeatures, linkedTickets);
  };

  if (isLoading) return <Box display="flex" justifyContent="center" pt={8}><CircularProgress /></Box>;
  if (!epic) return <Box p={4}><Alert severity="error">Epic not found</Alert></Box>;

  const progress = epic.stepsTotal ? Math.round((epic.stepsDone / epic.stepsTotal) * 100) : 0;
  const overdue = !!(epic.targetDate && new Date(epic.targetDate) < new Date() && epic.status !== 'COMPLETED');
  const linkedIds = orderedFeatures.map((f) => f.id);
  const overduedays = (() => {
    if (!epic.targetDate || !overdue) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(epic.targetDate); target.setHours(0, 0, 0, 0);
    return Math.round((today.getTime() - target.getTime()) / 86400000);
  })();

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3, alignItems: 'start' }}>

        {/* Left column */}
        <Box>
          {overdue && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              This epic is <strong>{overduedays} day{overduedays !== 1 ? 's' : ''} overdue</strong> — target date was {formatDate(epic.targetDate!)}. Update the target date or mark it completed.
            </Alert>
          )}

          <EpicHeader
            epic={epic as any}
            progress={progress}
            overdue={overdue}
            isAdmin={isAdmin}
            orderedFeatures={orderedFeatures}
            blockerMenuAnchor={blockerMenuAnchor}
            onEditOpen={() => setEditOpen(true)}
            onAddBlocker={(e) => setBlockerMenuAnchor(e.currentTarget)}
            onRemoveBlocker={onBlockerRemove}
            onBlockerMenuClose={() => setBlockerMenuAnchor(null)}
            onBlockerAdd={onBlockerAdd}
            onBack={() => navigate('/epics')}
            onExportCsv={handleCsvExport}
          />

          <EpicFeaturesList
            features={orderedFeatures}
            isAdmin={isAdmin}
            flippedId={flippedId}
            epicId={id!}
            onFlip={setFlippedId}
            onNavigate={(fid) => navigate(`/features/${fid}`, { state: { from: `/epics/${id}` } })}
            onUnlink={onUnlink}
            onEdit={(f) => setEditingFeature(f)}
            onStatusChange={handleStatusChange}
            onReorder={handleReorder}
            onNewFeature={() => setNewFeatureOpen(true)}
            onLinkExisting={() => setLinkOpen(true)}
          />

          <EpicLinkedTickets epicId={id!} isAdmin={isAdmin} />
        </Box>

        {/* Right column: sticky tabbed sidebar */}
        <Box sx={{ position: { lg: 'sticky' }, top: { lg: 30 } }}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
              <Tab label={
                <Box display="flex" alignItems="center" gap={0.75}>
                  Comments
                  {comments.length > 0 && <Chip label={comments.length} size="small" sx={{ height: 18, fontSize: '0.7rem', pointerEvents: 'none' }} />}
                </Box>
              } />
              <Tab label={
                <Box display="flex" alignItems="center" gap={0.75}>
                  Activity
                  {activities.length > 0 && <Chip label={activities.length} size="small" sx={{ height: 18, fontSize: '0.7rem', pointerEvents: 'none' }} />}
                </Box>
              } />
            </Tabs>
            <Box sx={{ p: 2 }}>
              {sidebarTab === 0 && <EpicComments epicId={id!} />}
              {sidebarTab === 1 && <EpicActivity epicId={id!} />}
            </Box>
          </Paper>
        </Box>

      </Box>

      {/* Dialogs */}
      <EpicFormDialog
        open={editOpen}
        editing={epic}
        onClose={() => setEditOpen(false)}
        onSubmit={async (data) => { await handleUpdate(data as UpdateEpicData); setEditOpen(false); }}
      />
      <FeatureFormDialog
        open={newFeatureOpen}
        editing={null}
        isAdmin={isAdmin}
        onClose={() => setNewFeatureOpen(false)}
        onSubmit={handleNewFeature}
      />
      <FeatureFormDialog
        open={!!editingFeature}
        editing={editingFeature as FeatureRequest | null}
        isAdmin={isAdmin}
        onClose={() => setEditingFeature(null)}
        onSubmit={handleEditFeature}
      />
      <LinkFeatureDialog
        open={linkOpen}
        epicId={id!}
        linkedIds={linkedIds}
        onClose={() => setLinkOpen(false)}
        onLinked={(suggested) => { invalidate(); if (suggested === 'ACTIVE') setSuggestActive(true); }}
      />

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>

      <Dialog open={suggestActive} onClose={() => setSuggestActive(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Set Epic to Active?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You just linked the first feature to this epic. Would you like to set its status to <strong>ACTIVE</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestActive(false)}>Keep as Draft</Button>
          <Button variant="contained" onClick={async () => { await handleUpdate({ status: 'ACTIVE' }); setSuggestActive(false); }}>
            Set Active
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={suggestCompleted} onClose={() => setSuggestCompleted(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Mark Epic as Completed?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            All features have been shipped. Would you like to mark this epic as <strong>COMPLETED</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestCompleted(false)}>Not Yet</Button>
          <Button variant="contained" color="success" onClick={async () => { await handleUpdate({ status: 'COMPLETED' }); setSuggestCompleted(false); }}>
            Mark Completed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EpicDetailPage;
