/**
 * CustomerInfoCard.tsx
 *
 * Shows selected customer's avatar, name, subscription status,
 * contact meta (email, phone, address), and distance from current location.
 * Includes the "Log Visit" button (AppButton).
 *
 * All colors use c.* theme tokens or Palette.* constants.
 */

import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import { useThemeColors, FontSize } from '@/src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '@/src/shared/components/forms/AppButton';
import s from './visits.styles';
import { SUB_CFG, getSubStatus } from './visits.types';
import type { Customer } from '@/src/services/api/types/index';

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

// ── useCurrentDistance — passive GPS, never prompts ───────────────────────────

function useCurrentDistance(
  targetLat: number | null | undefined,
  targetLng: number | null | undefined,
): string | null {
  const [distance, setDistance] = useState<string | null>(null);

  useEffect(() => {
    if (targetLat == null || targetLng == null) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced } as any);
        if (cancelled) return;
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, targetLat, targetLng);
        setDistance(formatDistance(km));
      } catch { /* optional — silently skip */ }
    })();
    return () => { cancelled = true; };
  }, [targetLat, targetLng]);

  return distance;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  customer:      Customer;
  onLogVisit:    () => void;
  logVisitLabel: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerInfoCard: React.FC<Props> = ({ customer, onLogVisit, logVisitLabel }) => {
  const c        = useThemeColors();
  const subCfg   = SUB_CFG[getSubStatus(customer)];
  const initials = customer.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const distance = useCurrentDistance(customer.latitude, customer.longitude);

  return (
    <View style={[s.infoCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
      {/* Accent bar */}
      <View style={[s.infoAccent, { backgroundColor: subCfg.color }]} />

      <View style={s.infoBody}>
        <View style={s.infoTop}>
          {/* Avatar */}
          <View style={[s.infoAvatar, { backgroundColor: subCfg.color + '22' }]}>
            <Text style={[s.infoAvatarText, { color: subCfg.color }]}>{initials}</Text>
          </View>

          {/* Name + company + status + distance */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.infoName, { color: c.text.primary }]} numberOfLines={1}>
              {customer.name}
            </Text>
            {customer.company ? (
              <Text style={[s.infoCompany, { color: c.text.secondary }]} numberOfLines={1}>
                🏢  {customer.company}
              </Text>
            ) : null}

            <View style={s.infoStatusRow}>
              {/* Subscription status badge */}
              <View style={[s.infoSubBadge, { backgroundColor: subCfg.bg, borderColor: subCfg.color + '44' }]}>
                <Text style={[s.infoSubText, { color: subCfg.color }]}>{subCfg.label}</Text>
              </View>
              {/* Distance chip */}
              {distance ? (
                <View style={[s.distanceChip, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
                  <Ionicons name="location-outline" size={10} color={c.text.secondary} />
                  <Text style={[s.distanceText, { color: c.text.secondary }]}>{distance}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Log visit — AppButton */}
          <AppButton
            variant="primary"
            size="small"
            onPress={onLogVisit}
            resolvedColors={c}
          >
            + {logVisitLabel}
          </AppButton>
        </View>

        {/* Contact meta row */}
        <View style={[s.infoMeta, { borderTopColor: c.border.primary }]}>
          {customer.email ? (
            <View style={s.infoMetaItem}>
              <Text style={{ fontSize: FontSize.sm }}>✉️</Text>
              <Text style={[s.infoMetaText, { color: c.text.secondary }]} numberOfLines={1}>
                {customer.email}
              </Text>
            </View>
          ) : null}
          {customer.phone ? (
            <View style={s.infoMetaItem}>
              <Text style={{ fontSize: FontSize.sm }}>📞</Text>
              <Text style={[s.infoMetaText, { color: c.text.secondary }]}>
                {customer.phone}
              </Text>
            </View>
          ) : null}
          {customer.address ? (
            <View style={s.infoMetaItem}>
              <Text style={{ fontSize: FontSize.sm }}>📍</Text>
              <Text style={[s.infoMetaText, { color: c.text.secondary }]} numberOfLines={1}>
                {customer.address}
              </Text>
            </View>
          ) : null}
          {customer.latitude != null && customer.longitude != null ? (
            <View style={s.infoMetaItem}>
              <Text style={{ fontSize: FontSize.sm }}>🌐</Text>
              <Text style={[s.infoMetaText, { color: c.text.muted }]}>
                {customer.latitude.toFixed(5)}, {customer.longitude.toFixed(5)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default CustomerInfoCard;
