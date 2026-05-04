import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { FontSize } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';
import s from './visits.styles';
import VisitBadge from './VisitBadge';
import type { VisitRowProps } from './visits.types';

const VisitTableRow: React.FC<VisitRowProps> = ({ visit, userId, isAdmin, onEdit, onDelete, c }) => {
  const canAct = isAdmin || visit.userId === userId;
  return (
    <View style={[s.tableRow, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
      <View style={s.tableColDate}>
        <Text style={[s.tableText, { color: c.text.primary }]} numberOfLines={1}>
          {formatDate(visit.visitedAt)}
        </Text>
      </View>
      <View style={s.tableColStatus}>
        <VisitBadge status={visit.status} />
      </View>
      <View style={s.tableColBy}>
        <Text style={[s.tableTextSm, { color: c.text.secondary }]} numberOfLines={1}>
          {visit.user?.name ?? '—'}
        </Text>
      </View>
      <View style={s.tableColNotes}>
        <Text style={[s.tableTextSm, { color: c.text.muted }]} numberOfLines={2}>
          {visit.notes ?? '—'}
        </Text>
      </View>
      {canAct ? (
        <View style={s.tableColActions}>
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
      ) : <View style={s.tableColActions} />}
    </View>
  );
};

export default VisitTableRow;
