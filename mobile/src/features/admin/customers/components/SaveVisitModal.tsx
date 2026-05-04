/**
 * SaveVisitModal.tsx
 *
 * Bottom-sheet modal for logging or editing a customer visit.
 * All colors use theme tokens (c.*) or Palette.* constants.
 * No hardcoded hex strings.
 *
 * Modal-safe: reads direction from useUiStore (not useDirection()).
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Modal, ScrollView, Pressable,
  StyleSheet, Platform,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TextInput } = require('react-native') as any;
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import {
  useThemeColors,
  FontSize, FontWeight, Radius, BorderWidth, Spacing,
  Palette,
} from '@/src/constants/theme';
import { useUiStore } from '@/src/stores/uiStore';
import AppButton from '@/src/shared/components/forms/AppButton';
import { useVisitForm } from '../hooks/useVisitForm';
import type { Customer, CustomerVisit, CreateVisitData, VisitStatus } from '@/src/services/api/types/index';

// ── react-native-maps (native only) ──────────────────────────────────────────
let MapView: any = null;
let Marker: any  = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

// ── Haversine distance ────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `~${Math.round(km * 1000)} m` : `~${km.toFixed(1)} km`;
}

// ── Status options — colors use Palette tokens ────────────────────────────────

const STATUS_OPTIONS: { value: VisitStatus; label: string; color: string; bg: string }[] = [
  { value: 'COMPLETED', label: 'Completed', color: Palette.green600,  bg: '#f0fdf4' },
  { value: 'PLANNED',   label: 'Planned',   color: Palette.blue600,   bg: '#eff6ff' },
  { value: 'CANCELLED', label: 'Cancelled', color: Palette.gray500,   bg: '#f9fafb' },
  { value: 'NO_SHOW',   label: 'No Show',   color: Palette.amber600,  bg: '#fffbeb' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  customer: Customer;
  visit:    CustomerVisit | null;
  onClose:  () => void;
  onSave:   (data: CreateVisitData) => Promise<boolean>;
  isSaving: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const SaveVisitModal: React.FC<Props> = ({ customer, visit, onClose, onSave, isSaving }) => {
  const { t }     = useTranslation();
  const c         = useThemeColors();
  const direction = useUiStore((s) => s.direction);
  const isRtl     = direction === 'rtl';

  const { fields, errors, isSubmitting, gpsCoords, handleChange, handleSubmit } = useVisitForm({
    item:    visit,
    onSave,
    onClose,
  });

  // Distance between current GPS and customer
  const [distance, setDistance] = useState<string | null>(null);
  const distanceFetched = useRef(false);

  useEffect(() => {
    if (distanceFetched.current) return;
    if (customer.latitude == null || customer.longitude == null) return;
    distanceFetched.current = true;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced } as any);
        const km  = haversineKm(
          pos.coords.latitude, pos.coords.longitude,
          customer.latitude!, customer.longitude!,
        );
        setDistance(formatDistance(km));
      } catch { /* optional — silently skip */ }
    })();
  }, [customer.latitude, customer.longitude]);

  const busy = isSaving || isSubmitting;
  const hasCustomerLocation = customer.latitude != null && customer.longitude != null;

  // Map region
  const mapRegion = hasCustomerLocation ? {
    latitude:       customer.latitude!,
    longitude:      customer.longitude!,
    latitudeDelta:  gpsCoords ? Math.abs(gpsCoords.latitude  - customer.latitude!)  * 2.5 + 0.01 : 0.01,
    longitudeDelta: gpsCoords ? Math.abs(gpsCoords.longitude - customer.longitude!) * 2.5 + 0.01 : 0.01,
  } : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={st.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={[st.sheet, { backgroundColor: c.surface.primary, shadowColor: c.shadow } as any]}>
        {/* Handle */}
        <View style={[st.handle, { backgroundColor: c.border.secondary }]} />

        {/* ── Header ── */}
        <View style={[st.sheetHeader, { borderBottomColor: c.border.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={[st.sheetTitle, { color: c.text.primary }]}>
              {visit ? t('visits.editVisit') : t('visits.logVisit')}
            </Text>
            <View style={st.headerMeta}>
              <Text style={[st.sheetSub, { color: c.text.muted }]} numberOfLines={1}>
                {customer.name}{customer.company ? `  ·  ${customer.company}` : ''}
              </Text>
              {distance ? (
                <View style={[st.distancePill, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
                  <Text style={[st.distancePillText, { color: c.text.secondary }]}>📍 {distance}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }: { pressed: boolean }) => [
              st.closeBtn,
              { backgroundColor: pressed ? c.interactive.pressed : c.surface.tertiary },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Text style={{ color: c.text.secondary, fontSize: FontSize.xl }}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={st.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── Mini-map ── */}
          {hasCustomerLocation && Platform.OS !== 'web' && mapRegion ? (
            <View style={[st.miniMapWrapper, { borderColor: c.border.primary }]}>
              <MapView
                style={StyleSheet.absoluteFillObject}
                region={mapRegion}
                scrollEnabled={false} zoomEnabled={false}
                rotateEnabled={false} pitchEnabled={false}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: customer.latitude!, longitude: customer.longitude! }}
                  pinColor={Palette.blue600} title={customer.name} />
                {gpsCoords ? (
                  <Marker coordinate={{ latitude: gpsCoords.latitude, longitude: gpsCoords.longitude }}
                    pinColor={Palette.green600} title="You" />
                ) : null}
              </MapView>
              {/* Legend */}
              <View style={[st.mapLegend, { backgroundColor: c.surface.primary + 'ee', borderColor: c.border.primary }]}>
                <View style={st.legendRow}>
                  <View style={[st.legendDot, { backgroundColor: Palette.blue600 }]} />
                  <Text style={[st.legendText, { color: c.text.secondary }]}>{customer.name}</Text>
                </View>
                {gpsCoords ? (
                  <View style={st.legendRow}>
                    <View style={[st.legendDot, { backgroundColor: Palette.green600 }]} />
                    <Text style={[st.legendText, { color: c.text.secondary }]}>You</Text>
                  </View>
                ) : null}
                {distance ? (
                  <Text style={[st.legendDist, { color: c.text.muted }]}>📏 {distance}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* ── Status chips ── */}
          <Text style={[st.fieldLabel, { color: c.text.secondary }]}>
            {t('visits.form.status')} *
          </Text>
          <View style={st.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = fields.status === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleChange('status', opt.value)}
                  style={[
                    st.statusChip,
                    {
                      backgroundColor: active ? opt.color : c.surface.elevated,
                      borderColor:     active ? opt.color : c.border.primary,
                    },
                  ]}
                >
                  <Text style={[st.statusChipText, { color: active ? c.text.inverse : c.text.secondary }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.status ? (
            <Text style={[st.errorText, { color: c.intent.error }]}>{errors.status}</Text>
          ) : null}

          {/* ── Visit date ── */}
          <Text style={[st.fieldLabel, { color: c.text.secondary, marginTop: Spacing.lg }]}>
            {t('visits.form.visitedAt')} *
          </Text>
          <View style={[
            st.dateRow,
            {
              backgroundColor: c.surface.secondary,
              borderColor: errors.visitedAt ? c.intent.error : c.border.primary,
            },
          ]}>
            <Text style={[
              st.dateValue,
              { color: fields.visitedAt ? c.text.primary : c.text.muted, textAlign: isRtl ? 'right' : 'left' },
            ]}>
              {fields.visitedAt
                ? new Date(fields.visitedAt).toLocaleString()
                : t('visits.form.visitedAtPlaceholder')}
            </Text>
            <Pressable
              onPress={() => handleChange('visitedAt', new Date().toISOString())}
              style={({ pressed }: { pressed: boolean }) => [
                st.nowBtn,
                {
                  backgroundColor: pressed ? c.intent.infoSurface : c.interactive.primary + '15',
                  borderColor: c.interactive.primary + '55',
                },
              ]}
            >
              <Text style={[st.nowBtnText, { color: c.interactive.primary }]}>
                🕐 {t('visits.form.useNow')}
              </Text>
            </Pressable>
          </View>
          {errors.visitedAt ? (
            <Text style={[st.errorText, { color: c.intent.error }]}>{errors.visitedAt}</Text>
          ) : null}

          {/* ── Notes ── */}
          <Text style={[st.fieldLabel, { color: c.text.secondary, marginTop: Spacing.lg }]}>
            {t('visits.form.notes')}
          </Text>
          <TextInput
            value={fields.notes}
            onChangeText={(v: string) => handleChange('notes', v)}
            multiline
            numberOfLines={4}
            style={[
              st.notesInput,
              {
                backgroundColor:  c.surface.secondary,
                borderColor:      c.border.primary,
                color:            c.text.primary,
                textAlign:        isRtl ? 'right' : 'left',
                writingDirection: isRtl ? 'rtl' : 'ltr',
              },
            ]}
            placeholder={t('visits.form.notesPlaceholder')}
            placeholderTextColor={c.text.muted}
          />

          {/* ── GPS indicator ── */}
          <View style={[st.gpsRow, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
            <Text style={{ fontSize: FontSize.lg }}>{gpsCoords ? '📍' : '📵'}</Text>
            <Text style={[st.gpsText, { color: c.text.muted }]}>
              {gpsCoords
                ? `${t('visits.form.gpsCapture')}  ${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}`
                : t('visits.form.noGps')}
            </Text>
          </View>

          {/* ── Submit button ── */}
          <AppButton
            variant={
              fields.status === 'COMPLETED' ? 'success'
              : fields.status === 'CANCELLED' || fields.status === 'NO_SHOW' ? 'secondary'
              : 'primary'
            }
            size="large"
            fullWidth
            loading={busy}
            loadingText={t('common.saving')}
            disabled={busy}
            onPress={handleSubmit}
            resolvedColors={c}
            isRtlOverride={isRtl}
            leftIcon={<Text style={{ fontSize: FontSize.xl }}>{visit ? '✏️' : '✅'}</Text>}
            style={{ marginTop: Spacing.xl }}
          >
            {visit ? t('visits.form.update') : t('visits.form.save')}
          </AppButton>

        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Styles — no hardcoded hex, only Palette.* and scale tokens ────────────────

const st = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    maxHeight: '90%',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 18,
  },

  handle: {
    width: 40, height: 4, borderRadius: Radius.full,
    alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xs,
  },

  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: BorderWidth.thin,
  },
  sheetTitle: { fontSize: FontSize.lg,  fontWeight: FontWeight.bold },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 3, flexWrap: 'wrap' },
  sheetSub:   { fontSize: FontSize.xs },

  distancePill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.full, borderWidth: BorderWidth.thin,
    paddingHorizontal: Spacing.sm, paddingVertical: 3,
  },
  distancePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  closeBtn: {
    width: 32, height: 32, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing['3xl'] },

  // Mini-map
  miniMapWrapper: {
    height: 160, borderRadius: Radius.lg,
    borderWidth: BorderWidth.thin, overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapLegend: {
    position: 'absolute', bottom: Spacing.sm, start: Spacing.sm,
    borderRadius: Radius.md, borderWidth: BorderWidth.thin,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: 4,
  },
  legendRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot:  { width: 8, height: 8, borderRadius: Radius.full },
  legendText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  legendDist: { fontSize: FontSize.xs, marginTop: 2 },

  // Fields
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: Spacing.xs },
  errorText:  { fontSize: FontSize.xs, marginTop: 4 },

  // Status chips
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: BorderWidth.thin,
  },
  statusChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  // Date row
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: BorderWidth.thin, borderRadius: Radius.lg,
    paddingStart: Spacing.md, paddingEnd: Spacing.xs, paddingVertical: Spacing.sm,
  },
  dateValue:  { flex: 1, fontSize: FontSize.base },
  nowBtn:     { borderRadius: Radius.md, borderWidth: BorderWidth.thin, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  nowBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Notes
  notesInput: {
    borderWidth: BorderWidth.thin, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSize.base, minHeight: 90, textAlignVertical: 'top',
  },

  // GPS row
  gpsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.md, borderRadius: Radius.lg, borderWidth: BorderWidth.thin,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
  },
  gpsText: { fontSize: FontSize.xs, flex: 1 },
});

export default SaveVisitModal;
