import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface AdminDetailScreenProps {
  title:         string;
  subtitle?:     string;
  isLoading:     boolean;
  notFound:      boolean;
  notFoundText?: string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  children?:     React.ReactNode;
}

const AdminDetailScreen: React.FC<AdminDetailScreenProps> = ({
  title, subtitle, isLoading, notFound, notFoundText,
  onClose, onEdit, onDelete, children,
}) => {
  const { t }  = useTranslation();
  const c      = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: c.surface.secondary }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
        <Pressable onPress={onClose} style={[styles.backBtn, { backgroundColor: c.surface.tertiary }]} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <Text style={{ color: c.text.secondary, fontSize: FontSize['2xl'], lineHeight: 22 }}>←</Text>
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.headerTitle, { color: c.text.primary }]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.headerSubtitle, { color: c.text.secondary }]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        <Pressable onPress={onEdit} style={[styles.editBtn, { backgroundColor: c.intent.infoSurface, borderColor: c.interactive.primary + '44' }]} accessibilityRole="button">
          <Text style={[styles.editBtnText, { color: c.interactive.primary }]}>✏️  {t('common.edit')}</Text>
        </Pressable>

        <Pressable onPress={onDelete} style={[styles.deleteBtn, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error + '66' }]} accessibilityRole="button">
          <Text style={{ fontSize: FontSize.xl }}>🗑️</Text>
        </Pressable>
      </View>

      {/* ── Body ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
          <Text style={[styles.loadingText, { color: c.text.secondary }]}>Loading…</Text>
        </View>
      ) : notFound ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={[styles.notFoundText, { color: c.text.secondary }]}>{notFoundText ?? 'Not found'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:           { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, gap: 8 },
  backBtn:        { width: 36, height: 36, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  headerSubtitle: { fontSize: FontSize.sm, marginTop: 1 },
  editBtn:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md, borderWidth: 1, flexShrink: 0 },
  editBtnText:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  deleteBtn:      { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText:    { fontSize: FontSize.base, marginTop: 8 },
  notFoundText:   { fontSize: FontSize.lg, fontWeight: FontWeight.medium },
  scrollContent:  { padding: 16, gap: 12 },
});

export default AdminDetailScreen;
