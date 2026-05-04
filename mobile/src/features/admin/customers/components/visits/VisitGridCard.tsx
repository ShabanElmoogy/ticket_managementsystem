import React from 'react';
import { View, Text } from 'react-native';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { FontSize } from '@/src/constants/theme';
import AppButton from '@/src/shared/components/forms/AppButton';
import s from './visits.styles';
import VisitBadge from './VisitBadge';
import { getVisitCfg } from './visits.types';
import type { VisitRowProps } from './visits.types';

const VisitGridCard: React.FC<VisitRowProps> = ({ visit, userId, isAdmin, onEdit, onDelete, c }) => {
  const cfg    = getVisitCfg(visit.status);
  const canAct = isAdmin || visit.userId === userId;

  return (
    <View style={[s.gridCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
      <View style={[s.gridAccent, { backgroundColor: cfg.color }]} />
      <View style={s.gridBody}>
        {/* Top row: badge + date */}
        <View style={s.gridTop}>
          <VisitBadge status={visit.status} />
          <Text style={[s.gridDate, { color: c.text.muted }]}>{formatDate(visit.visitedAt)}</Text>
        </View>

        {/* Notes */}
        <Text
          style={[
            s.gridNotes,
            {
              color:     visit.notes ? c.text.secondary : c.text.muted,
              fontStyle: visit.notes ? 'normal' : 'italic',
            },
          ]}
          numberOfLines={4}
        >
          {visit.notes ?? 'No notes'}
        </Text>

        {/* Meta: user + GPS */}
        <View style={s.gridMeta}>
          {visit.user?.name ? (
            <View style={s.gridMetaRow}>
              <Text style={{ fontSize: FontSize.sm }}>👤</Text>
              <Text style={[s.gridMetaText, { color: c.text.muted }]}>{visit.user.name}</Text>
            </View>
          ) : null}
          {visit.latitude != null ? (
            <View style={s.gridMetaRow}>
              <Text style={{ fontSize: FontSize.sm }}>📍</Text>
              <Text style={[s.gridMetaText, { color: c.text.muted }]}>
                {visit.latitude.toFixed(5)}, {visit.longitude?.toFixed(5)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Actions */}
        {canAct ? (
          <View style={[s.gridActions, { borderTopColor: c.border.primary }]}>
            <AppButton
              variant="outline"
              size="small"
              onPress={() => onEdit(visit)}
              resolvedColors={c}
              style={{ flex: 1 }}
            >
              ✏️  Edit
            </AppButton>
            <AppButton
              variant="danger"
              size="small"
              onPress={() => onDelete(visit.id)}
              resolvedColors={c}
              style={{ flex: 1 }}
            >
              🗑️  Delete
            </AppButton>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default VisitGridCard;
