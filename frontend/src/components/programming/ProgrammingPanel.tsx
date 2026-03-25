import React, { useState } from 'react';
import { Box, Tabs, Tab, Chip, CircularProgress } from '@mui/material';
import { Code as CodeIcon } from '@mui/icons-material';
import TechnicalInfoSection from './components/TechnicalInfoSection';
import SolutionChecklist from './components/SolutionChecklist';
import CodeSnippetList from './components/CodeSnippetList';
import { useProgrammingDetails } from './hooks/useProgrammingDetails';
import type { Ticket, ProgrammingDetails, SolutionStep, CodeSnippet } from '../../services/api/types';

const PROGRAMMING_STATUSES: Ticket['status'][] = [
  'PROGRAMMING', 'UNDER_DEVELOPMENT', 'CODE_REVIEW', 'TESTING', 'RESOLVED'
];

interface Props {
  ticket: Ticket;
  canEdit: boolean;
}

const ProgrammingPanel: React.FC<Props> = ({ ticket, canEdit }) => {
  const [tab, setTab] = useState(0);
  const { details, save, loading, fetching } = useProgrammingDetails(ticket.id);

  if (!PROGRAMMING_STATUSES.includes(ticket.status)) return null;

  return (
    <Box sx={{ mt: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{
        px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)',
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <CodeIcon sx={{ fontSize: 18, color: '#8b5cf6' }} />
        <Chip label="Programming Panel" size="small" sx={{ bgcolor: '#8b5cf6', color: '#fff', fontWeight: 600 }} />
        {fetching && <CircularProgress size={14} sx={{ ml: 'auto' }} />}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Technical Info" sx={{ fontSize: '0.8rem' }} />
        <Tab label="Solution Steps" sx={{ fontSize: '0.8rem' }} />
        <Tab label="Code Snippets" sx={{ fontSize: '0.8rem' }} />
      </Tabs>

      {tab === 0 && (
        <TechnicalInfoSection
          details={details}
          canEdit={canEdit}
          onSave={patch => save(patch as Partial<ProgrammingDetails>)}
          loading={loading}
        />
      )}
      {tab === 1 && (
        <SolutionChecklist
          steps={details?.solutionSteps ?? []}
          canEdit={canEdit}
          onSave={steps => save({ solutionSteps: steps as SolutionStep[] })}
        />
      )}
      {tab === 2 && (
        <CodeSnippetList
          snippets={details?.codeSnippets ?? []}
          canEdit={canEdit}
          onSave={snippets => save({ codeSnippets: snippets as CodeSnippet[] })}
        />
      )}
    </Box>
  );
};

export default ProgrammingPanel;
