import type { Epic } from '../../../services/api/types';
import type { EpicFeature } from '../detail/types';

export interface HealthScore {
  score: number; // 0-100
  color: 'success' | 'warning' | 'error';
  label: string;
  breakdown: {
    progress: number;
    timeline: number;
    blockers: number;
    overdue: number;
  };
}

export function calculateEpicHealthScore(
  epic: Epic & { 
    blockedBy?: { id: string; title: string; status: string }[];
    featureCount: number;
    stepsTotal: number;
    stepsDone: number;
  },
  orderedFeatures: EpicFeature[]
): HealthScore {
  let totalScore = 100;
  const breakdown = { progress: 0, timeline: 0, blockers: 0, overdue: 0 };

  // 1. Progress penalty (0-30 points) — low completion hurts health
  const progressPercent = epic.stepsTotal > 0 ? (epic.stepsDone / epic.stepsTotal) * 100 : 0;
  if (progressPercent < 25) {
    breakdown.progress = -30;
  } else if (progressPercent < 50) {
    breakdown.progress = -20;
  } else if (progressPercent < 75) {
    breakdown.progress = -10;
  }
  totalScore += breakdown.progress;

  // 2. Timeline penalty (0-25 points) — overdue or tight deadlines
  if (epic.targetDate && epic.status !== 'COMPLETED' && epic.status !== 'CANCELLED') {
    const targetDate = new Date(epic.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const daysToTarget = Math.round((targetDate.getTime() - today.getTime()) / 86_400_000);
    
    if (daysToTarget < 0) {
      // Overdue
      breakdown.timeline = Math.max(-25, daysToTarget * -2); // -2 points per overdue day, capped at -25
    } else if (daysToTarget <= 3) {
      // Due very soon
      breakdown.timeline = -15;
    } else if (daysToTarget <= 7) {
      // Due soon
      breakdown.timeline = -10;
    }
  }
  totalScore += breakdown.timeline;

  // 3. Blocker penalty (0-20 points) — active blockers hurt health
  const activeBlockers = (epic.blockedBy ?? []).filter(b => 
    b.status !== 'COMPLETED' && b.status !== 'CANCELLED'
  );
  if (activeBlockers.length > 0) {
    breakdown.blockers = Math.max(-20, activeBlockers.length * -8); // -8 points per blocker, capped at -20
  }
  totalScore += breakdown.blockers;

  // 4. Overdue features penalty (0-15 points)
  const overdueFeatures = orderedFeatures.filter(f => 
    f.status !== 'SHIPPED' && f.status !== 'DECLINED'
    // Note: features don't have due dates in current schema, so this is placeholder
  );
  // For now, penalize if >50% features are stuck in UNDER_REVIEW for active epics
  if (epic.status === 'ACTIVE') {
    const stuckFeatures = orderedFeatures.filter(f => f.status === 'UNDER_REVIEW');
    if (stuckFeatures.length > orderedFeatures.length * 0.5) {
      breakdown.overdue = -15;
    }
  }
  totalScore += breakdown.overdue;

  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, totalScore));

  // Determine color and label
  let color: 'success' | 'warning' | 'error';
  let label: string;

  if (finalScore >= 80) {
    color = 'success';
    label = 'Healthy';
  } else if (finalScore >= 60) {
    color = 'warning';
    label = 'At Risk';
  } else {
    color = 'error';
    label = 'Critical';
  }

  return {
    score: finalScore,
    color,
    label,
    breakdown,
  };
}

export function getHealthScoreTooltip(health: HealthScore): string {
  const parts = [];
  
  if (health.breakdown.progress < 0) {
    parts.push(`Progress: ${health.breakdown.progress} pts`);
  }
  if (health.breakdown.timeline < 0) {
    parts.push(`Timeline: ${health.breakdown.timeline} pts`);
  }
  if (health.breakdown.blockers < 0) {
    parts.push(`Blockers: ${health.breakdown.blockers} pts`);
  }
  if (health.breakdown.overdue < 0) {
    parts.push(`Stuck features: ${health.breakdown.overdue} pts`);
  }

  return parts.length > 0 
    ? `Health: ${health.score}/100 (${health.label})\n${parts.join(', ')}`
    : `Health: ${health.score}/100 (${health.label})`;
}