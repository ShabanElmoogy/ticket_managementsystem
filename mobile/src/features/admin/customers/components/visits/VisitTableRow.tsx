import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/src/shared/utils/dateUtils';
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
          {/* Edit */}
          <Pressable
            onPress={() => onEdit(visit)}
            style={[s.actionBtn, { backgroundColor: c.intent.infoSurface }]}
            accessibilityRole="button"
            accessibilityLabel="Edit visit"
          >
            <Ionicons name="create-outline" size={15} color={c.interactive.primary} />
          </Pressable>

          {/* Delete */}
          <Pressable
            onPress={() => onDelete(visit.id)}
            style={[s.actionBtn, { backgroundColor: c.intent.errorSurface }]}
            accessibilityRole="button"
            accessibilityLabel="Delete visit"
          >
            <Ionicons name="trash-outline" size={15} color={c.intent.error} />
          </Pressable>
        </View>
      ) : (
        <View style={s.tableColActions} />
      )}
    </View>
  );
};

export default VisitTableRow;
