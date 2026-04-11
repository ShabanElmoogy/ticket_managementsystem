import React from 'react';
import { Tooltip, Box } from '@mui/material';
import type { Epic } from '../../../services/api/types';

interface HealthScore {
  score: number;       // 0–100
  color: 'green' | 'yellow' | 'red';
  breakdown: {
    shippedPct: number;
    daysToDeadline: number | null;
    blockedCount: number;
  };
}

export function computeHealthScore(epic: Epic): HealthScore {
  const counts = epic.featureStatusCounts ?? {};
  const total = epic.featureCount ?? 0;
  const shipped = (counts['SHIPPED'] ?? 0);
  const declined = (counts['DECLINED'] ?? 0);
  const active = total - declined;

  // 1. % features shipped (0–50 pts)
  const shippedPct = active > 0 ? Math.round((shipped / active) * 100) : 0;
  const shippedScore = (shippedPct / 100) * 50;

  // 2. Days to deadline (0–30 pts)
  let deadlineScore = 30;
  let daysToDeadline: number | null = null;
  if (epic.targetDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(epic.targetDate); target.setHours(0, 0, 0, 0);
    daysToDeadline = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (epic.status === 'COMPLETED') {
      deadlineScore = 30;
    } else if (daysToDeadline < 0) {
      deadlineScore = 0;                                    // overdue
    } else if (daysToDeadline <= 7) {
      deadlineScore = 10;                                   // very close
    } else if (daysToDeadline <= 30) {
      deadlineScore = 20;                                   // close
    } else {
      deadlineScore = 30;                                   // comfortable
    }
  }

  // 3. Blocked count (0–20 pts)
  const blockedCount = (epic.blockedBy ?? []).filter(
    (b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  ).length;
  const blockedScore = blockedCount === 0 ? 20 : blockedCount === 1 ? 10 : 0;

  const score = Math.round(shippedScore + deadlineScore + blockedScore);

  const color: HealthScore['color'] =
    score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';

  return { score, color, breakdown: { shippedPct, daysToDeadline, blockedCount } };
}

const COLOR_MAP = {
  green:  '#2e7d32',
  yellow: '#f9a825',
  red:    '#c62828',
};

const LABEL_MAP = {
  green:  'Healthy',
  yellow: 'At Risk',
  red:    'Critical',
};

interface Props {
  epic: Epic;
}

const EpicHealthScore: React.FC<Props> = ({ epic }) => {
  const { score, color, breakdown } = computeHealthScore(epic);

  const deadlineText =
    breakdown.daysToDeadline === null
      ? 'No deadline set'
      : breakdown.daysToDeadline < 0
      ? `${Math.abs(breakdown.daysToDeadline)}d overdue`
      : breakdown.daysToDeadline === 0
      ? 'Due today'
      : `${breakdown.daysToDeadline}d to deadline`;

  const tooltipContent = (
    <Box sx={{ fontSize: '0.75rem', lineHeight: 1.8 }}>
      <strong>Health Score: {score}/100 — {LABEL_MAP[color]}</strong>
      <br />• Features shipped: {breakdown.shippedPct}%
      <br />• Deadline: {deadlineText}
      <br />• Blockers: {breakdown.blockedCount}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: COLOR_MAP[color],
          flexShrink: 0,
          cursor: 'default',
          boxShadow: `0 0 0 2px ${COLOR_MAP[color]}33`,
        }}
      />
    </Tooltip>
  );
};

export default EpicHealthScore;
