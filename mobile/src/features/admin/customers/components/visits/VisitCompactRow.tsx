import React from 'react';
import { View, Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { FontSize } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';
import s from './visits.styles';
import VisitBadge from './VisitBadge';
import { getVisitCfg } from './visits.types';
import type { VisitRowProps } from './visits.types';

const VisitCompactRow: React.FC<VisitRowProps> = ({ visit, userId, isAdmin, onEdit, onDelete, c }) => {
  const cfg    = getVisitCfg(visit.status);
  const canAct = isAdmin || visit.userId === userId;

  return (
    <View style={[s.compactRow, { borderBottomColor: c.border.primary }]}>
      <View style={[s.compactDot, { backgroundColor: cfg.color }]} />
      <Text style={[s.compactDate, { color: c.text.muted }]} numberOfLines={1}>
        {formatDate(visit.visitedAt)}
      </Text>
      <VisitBadge status={visit.status} />
      <Text style={[s.compactBy, { color: c.text.secondary }]} numberOfLines={1}>
        {visit.user?.name ?? '—'}
      </Text>
      <Text style={[s.compactNotes, { color: c.text.muted }]} numberOfLines={1}>
        {visit.notes ?? ''}
      </Text>
      {canAct ? (
        <View style={s.compactActions}>
          <AppButton
            variant="ghost"
            size="small"
            onPress={() => onEdit(visit)}
            resolvedColors={c}
            style={s.actionBtn}
          >
            <Text style={{ fontSize: FontSize.sm }}>✏️</Text>
          </AppButton>
          <AppButton
            variant="ghost"
            size="small"
            onPress={() => onDelete(visit.id)}
            resolvedColors={c}
            style={[s.actionBtn, { backgroundColor: c.intent.errorSurface }]}
          >
            <Text style={{ fontSize: FontSize.sm }}>🗑️</Text>
          </AppButton>
        </View>
      ) : null}
    </View>
  );
};

export default VisitCompactRow;
