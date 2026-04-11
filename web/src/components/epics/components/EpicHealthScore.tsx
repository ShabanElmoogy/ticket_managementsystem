import React from 'react';
import { Tooltip, Chip } from '@mui/material';
import { calculateEpicHealthScore, getHealthScoreTooltip } from '../utils/epicHealthScore';
import type { Epic } from '../../../services/api/types';

interface Props {
  epic: Epic;
  variant?: 'dot' | 'chip';
}

const EpicHealthScore: React.FC<Props> = ({ epic, variant = 'dot' }) => {
  // Convert Epic to the extended type expected by calculateEpicHealthScore
  const extendedEpic = {
    ...epic,
    blockedBy: epic.blockedBy ?? [],
    featureCount: epic.featureCount ?? 0,
    stepsTotal: epic.stepsTotal ?? 0,
    stepsDone: epic.stepsDone ?? 0,
  };

  const healthScore = calculateEpicHealthScore(extendedEpic, []);
  
  const COLOR_MAP = {
    success: '#2e7d32',
    warning: '#f9a825',
    error: '#c62828',
  };

  if (variant === 'chip') {
    return (
      <Tooltip title={getHealthScoreTooltip(healthScore)}>
        <Chip
          label={`${healthScore.score}%`}
          size="small"
          color={healthScore.color}
          variant="filled"
          sx={{ 
            height: 18, 
            fontSize: '0.65rem', 
            fontWeight: 600,
            cursor: 'help',
            '& .MuiChip-label': { px: 0.75 }
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={getHealthScoreTooltip(healthScore)} arrow placement="top">
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: COLOR_MAP[healthScore.color],
          flexShrink: 0,
          cursor: 'default',
          boxShadow: `0 0 0 2px ${COLOR_MAP[healthScore.color]}33`,
        }}
      />
    </Tooltip>
  );
};

export default EpicHealthScore;
