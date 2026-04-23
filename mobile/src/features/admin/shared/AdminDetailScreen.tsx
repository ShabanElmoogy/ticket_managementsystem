import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/src/constants/theme';

export interface AdminDetailScreenProps {
  title:         string;
  isLoading:     boolean;
  notFound:      boolean;
  notFoundText?: string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  children:      React.ReactNode;
}

/**
 * AdminDetailScreen — reusable detail screen shell.
 *
 * Handles: header (back, title, edit, delete), loading state,
 * not-found state, and scrollable body.
 *
 * Usage:
 *   <AdminDetailScreen title={entity.name} isLoading={...} notFound={...} ...>
 *     <DetailInfoCard fields={[...]} />
 *     <DetailStatRow stats={[...]} />
 *   </AdminDetailScreen>
 */
const AdminDetailScreen: React.FC<AdminDetailScreenProps> = ({
  title, isLoading, notFound, notFoundText,
  onClose, onEdit, onDelete, children,
}) => {
  const { t }  = useTranslation();
  const isDark = useIsDark();

  const bg      = isDark ? '#0f172a' : '#f8fafc';
  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const border  = isDark ? '#334155' : '#e5e7eb';
  const textPri = isDark ? '#f1f5f9' : '#111827';
  const textSec = isDark ? '#94a3b8' : '#6b7280';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: cardBg, borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Pressable
          onPress={onClose}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#334155' : '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: textSec, fontSize: 18 }}>←</Text>
        </Pressable>

        <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: textPri }} numberOfLines={1}>
          {title}
        </Text>

        <Pressable
          onPress={onEdit}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2563eb' }}>✏️ {t('common.edit')}</Text>
        </Pressable>

        <Pressable
          onPress={onDelete}
          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>🗑️ {t('common.delete')}</Text>
        </Pressable>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : notFound ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: textSec }}>{notFoundText ?? 'Not found'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          {children}
        </ScrollView>
      )}
    </View>
  );
};

export default AdminDetailScreen;
