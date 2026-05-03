import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
// FlatList and TextInput via require — avoids @types/react-native named export conflict
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN       = require('react-native') as any;
const FlatList  = RN.FlatList  as any;
const TextInput = RN.TextInput as any;
import { useThemeColors } from '@/src/constants/theme';
import type { PublicTenant } from '@/src/features/auth/api/tenants';

export interface TenantPickerProps {
  tenants:  PublicTenant[];
  value:    string;
  loading:  boolean;
  disabled: boolean;
  onChange: (slug: string) => void;
}

const TenantPicker: React.FC<TenantPickerProps> = ({
  tenants, value, loading, disabled, onChange,
}) => {
  const c = useThemeColors();
  const { t } = useTranslation();
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');

  const selected = tenants.find((t) => t.slug === value);

  const filtered = search.trim()
    ? tenants.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
      )
    : tenants;

  const handleOpen = () => {
    if (disabled) return;
    setSearch('');
    setOpen(true);
  };

  const handleSelect = (slug: string) => {
    onChange(slug);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={selected ? `Tenant: ${selected.name}` : 'Select tenant'}
        style={[
          styles.trigger,
          {
            backgroundColor: selected ? c.intent.infoSurface : c.surface.primary,
            borderColor:     selected ? c.interactive.primary : c.border.primary,
            opacity:         disabled ? 0.4 : 1,
          },
        ]}
      >
        <View style={styles.triggerLeft}>
          <View style={[
            styles.avatar,
            { backgroundColor: selected ? c.interactive.primary : c.surface.secondary },
          ]}>
            <Text style={{ fontSize: selected ? 12 : 14, fontWeight: 'bold', color: selected ? c.text.inverse : c.text.muted }}>
              {selected ? selected.name.charAt(0).toUpperCase() : '🏢'}
            </Text>
          </View>
          {selected ? (
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: c.text.primary }}>{selected.name}</Text>
              <Text style={{ fontSize: 12, color: c.text.muted }}>{selected.slug}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 14, flex: 1, color: c.text.muted }}>
              {loading ? t('auth.loadingTenants') : t('auth.selectTenant')}
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 14, marginStart: 8, color: selected ? c.interactive.primary : c.text.muted }}>
          {selected ? '✕' : '▼'}
        </Text>
      </Pressable>

      {/* Clear link */}
      {selected && !disabled && (
        <Pressable
          style={styles.clearLink}
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="Clear tenant selection"
        >
          <Text style={{ fontSize: 12, textDecorationLine: 'underline', color: c.text.muted }}>
            {t('auth.clearSelection')}
          </Text>
        </Pressable>
      )}

      {/* Bottom sheet */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: c.surface.primary }]}
            onPress={() => {}}
          >
            {/* Handle */}
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: c.border.primary }]} />
            </View>

            {/* Header */}
            <View style={[styles.sheetHeader, { borderColor: c.border.secondary }]}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.text.primary }}>
                {t('auth.selectTenantTitle')}
              </Text>
              <Pressable
                style={[styles.closeBtn, { backgroundColor: c.surface.secondary }]}
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={{ fontSize: 16, color: c.text.secondary }}>✕</Text>
              </Pressable>
            </View>

            {/* Search */}
            <View style={[styles.searchRow, { borderColor: c.border.secondary }]}>
              <View style={[styles.searchBox, { backgroundColor: c.surface.secondary }]}>
                <Text style={{ color: c.text.muted }}>🔍</Text>
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: c.text.primary }}
                  placeholder={t('auth.searchTenants')}
                  placeholderTextColor={c.text.muted}
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                    <Text style={{ fontSize: 14, color: c.text.muted }}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* List */}
            <FlatList
              data={filtered}
              keyExtractor={(t: PublicTenant) => t.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>🔍</Text>
                  <Text style={{ fontSize: 14, color: c.text.muted }}>{t('auth.noTenantsFound')}</Text>
                </View>
              }
              renderItem={({ item }: { item: PublicTenant }) => {
                const isSelected = item.slug === value;
                return (
                  <Pressable
                    style={[
                      styles.listItem,
                      {
                        borderColor:     c.border.secondary,
                        backgroundColor: isSelected ? c.intent.infoSurface : 'transparent',
                      },
                    ]}
                    onPress={() => handleSelect(item.slug)}
                    accessibilityRole="radio"
                    accessibilityLabel={item.name}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={[
                      styles.listAvatar,
                      { backgroundColor: isSelected ? c.interactive.primary : c.surface.secondary },
                    ]}>
                      <Text style={{ fontWeight: 'bold', fontSize: 14, color: isSelected ? c.text.inverse : c.text.secondary }}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? c.interactive.primary : c.text.primary }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, marginTop: 2, color: c.text.muted }}>{item.slug}</Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkBadge, { backgroundColor: c.interactive.primary }]}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: c.text.inverse }}>✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger:     { borderRadius: 12, borderWidth: 2, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  triggerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  clearLink:   { marginBottom: 12, marginTop: -8, alignSelf: 'flex-end' },
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  handleRow:   { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
  handle:      { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchRow:   { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  emptyState:  { alignItems: 'center', paddingVertical: 40 },
  listItem:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  listAvatar:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  checkBadge:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

export default TenantPicker;
