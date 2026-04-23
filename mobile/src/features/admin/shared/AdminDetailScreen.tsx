import React from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  Pressable, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDark } from '@/src/constants/theme';

export interface AdminDetailScreenProps {
  title:         string;
  subtitle?:     string;
  isLoading:     boolean;
  notFound:      boolean;
  notFoundText?: string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  children:      React.ReactNode;
}

const AdminDetailScreen: React.FC<AdminDetailScreenProps> = ({
  title, subtitle, isLoading, notFound, notFoundText,
  onClose, onEdit, onDelete, children,
}) => {
  const { t }    = useTranslation();
  const isDark   = useIsDark();
  const insets   = useSafeAreaInsets();

  const bg      = isDark ? '#0f172a' : '#f1f5f9';
  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const border  = isDark ? '#334155' : '#e2e8f0';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* ── Header bar ── */}
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: cardBg,
          borderBottomColor: border,
        },
      ]}>
        {/* Back */}
        <Pressable
          onPress={onClose}
          style={[styles.backBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={{ color: textSec, fontSize: 18, lineHeight: 22 }}>←</Text>
        </Pressable>

        {/* Title + subtitle */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: textPri }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.headerSubtitle, { color: textSec }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Edit */}
        <Pressable
          onPress={onEdit}
          style={styles.editBtn}
          accessibilityRole="button"
        >
          <Text style={styles.editBtnText}>✏️  {t('common.edit')}</Text>
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={onDelete}
          style={styles.deleteBtn}
          accessibilityRole="button"
        >
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </Pressable>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={[styles.loadingText, { color: textSec }]}>Loading…</Text>
        </View>
      ) : notFound ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={[styles.notFoundText, { color: textSec }]}>
            {notFoundText ?? 'Not found'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flexShrink: 0,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    flexShrink: 0,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 8,
  },
  notFoundText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
});

export default AdminDetailScreen;
