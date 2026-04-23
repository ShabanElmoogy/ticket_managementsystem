import React from 'react';
import { View, Text } from 'react-native';
import { useIsDark } from '@/src/constants/theme';

export interface InfoField {
  label: string;
  value?: string | number | null;
  /** Optional custom render — overrides value display */
  render?: () => React.ReactNode;
}

interface Props {
  /** Optional uppercase section title */
  title?: string;
  fields: InfoField[];
}

/**
 * DetailInfoCard — renders a list of label/value rows inside a card.
 *
 * - Rows with null/undefined/empty value are hidden automatically
 * - `render` prop overrides the default text display for custom badges, etc.
 * - Returns null if all fields are empty
 *
 * Usage:
 *   <DetailInfoCard
 *     title="Contact"
 *     fields={[
 *       { label: 'Email', value: customer.email },
 *       { label: 'Status', render: () => <AppBadge label={customer.status} /> },
 *     ]}
 *   />
 */
const DetailInfoCard: React.FC<Props> = ({ title, fields }) => {
  const isDark     = useIsDark();
  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const border     = isDark ? '#334155' : '#e5e7eb';
  const textSec    = isDark ? '#94a3b8' : '#6b7280';
  const labelColor = isDark ? '#64748b' : '#9ca3af';

  const visibleFields = fields.filter(
    (f) => f.render || (f.value !== null && f.value !== undefined && f.value !== ''),
  );

  if (visibleFields.length === 0) return null;

  return (
    <View style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: border, padding: 16 }}>
      {title && (
        <Text style={{
          fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.5, color: labelColor, marginBottom: 12,
        }}>
          {title}
        </Text>
      )}
      {visibleFields.map((field, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row', alignItems: 'flex-start', gap: 8,
            marginBottom: i < visibleFields.length - 1 ? 10 : 0,
          }}
        >
          {!!field.label && (
            <Text style={{ fontSize: 12, color: labelColor, width: 100, paddingTop: 1, flexShrink: 0 }}>
              {field.label}
            </Text>
          )}
          {field.render ? (
            <View style={{ flex: 1 }}>{field.render()}</View>
          ) : (
            <Text style={{ flex: 1, fontSize: 13, color: textSec, lineHeight: 20 }}>
              {String(field.value)}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default DetailInfoCard;
