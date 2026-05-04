import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Platform, Clipboard, Share } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/src/shared/utils/dateUtils';
import { useThemeColors } from '@/src/constants/theme';
import { Palette, SubscriptionColors, SubscriptionSurfaces } from '@/src/constants/tokens';
import AdminDetailScreen from '@/src/features/admin/shared/AdminDetailScreen';
import DetailInfoCard    from '@/src/features/admin/shared/DetailInfoCard';
import DetailStatRow     from '@/src/features/admin/shared/DetailStatRow';
import CustomerLocationMap from './CustomerLocationMap';
import { customersApi, customersKeys } from '../api/customers';
import { getCustomerStatus, type SubscriptionStatus } from '../components/customerColumns';
import { PAGINATION } from '@/src/constants/api';

interface Props {
  customerId:    string;
  onClose:       () => void;
  onEdit:        () => void;
  onDelete:      () => void;
  queryEnabled?: boolean;
}

// ── Status config — uses Palette tokens ──────────────────────────────────────

const STATUS_CFG: Record<SubscriptionStatus, { color: string; bg: string; label: string; icon: string }> = {
  ACTIVE:        { color: Palette.green600,  bg: SubscriptionSurfaces.light.ACTIVE,        label: 'Active',        icon: '✅' },
  TRIAL:         { color: Palette.violet600, bg: SubscriptionSurfaces.light.TRIAL,         label: 'Trial',         icon: '🔬' },
  EXPIRED:       { color: Palette.red600,    bg: SubscriptionSurfaces.light.EXPIRED,       label: 'Expired',       icon: '⚠️' },
  INACTIVE:      { color: Palette.gray500,   bg: SubscriptionSurfaces.light.INACTIVE,      label: 'Inactive',      icon: '⏸️' },
  PAY_AS_YOU_GO: { color: Palette.cyan600,   bg: SubscriptionSurfaces.light.PAY_AS_YOU_GO, label: 'Pay As You Go', icon: '💳' },
};

const MAINTENANCE_LABELS: Record<string, string> = {
  MONTHLY_SUBSCRIPTION: 'Monthly Subscription',
  FREE_TRIAL:           'Free Trial',
  PAY_AS_YOU_GO:        'Pay As You Go',
};

// ── Open in Maps ──────────────────────────────────────────────────────────────

function openInMaps(latitude: number, longitude: number, name?: string): void {
  const label = encodeURIComponent(name ?? '');
  const url = Platform.OS === 'ios'
    ? `maps://0,0?q=${latitude},${longitude}`
    : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
  Linking.canOpenURL(url).then((canOpen) => {
    if (canOpen) { Linking.openURL(url); }
    else if (Platform.OS === 'ios') { Linking.openURL(`https://maps.apple.com/?q=${latitude},${longitude}`); }
    else { Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`); }
  });
}

// ── Haversine distance ────────────────────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `~${Math.round(km * 1000)} m` : `~${km.toFixed(1)} km`;
}

function useCurrentDistance(targetLat?: number | null, targetLng?: number | null) {
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
        setDistance(formatDistance(haversineKm(pos.coords.latitude, pos.coords.longitude, targetLat, targetLng)));
      } catch { /* optional UI */ }
    })();
    return () => { cancelled = true; };
  }, [targetLat, targetLng]);
  return distance;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerDetailScreen: React.FC<Props> = ({
  customerId, onClose, onEdit, onDelete, queryEnabled = true,
}) => {
  const { t } = useTranslation();
  const c     = useThemeColors();

  const { data: customer, isLoading } = useQuery({
    queryKey: customersKeys.detail(customerId),
    queryFn:  () => customersApi.getCustomer(customerId),
    staleTime: PAGINATION.DETAIL_STALE_TIME,
    enabled:  queryEnabled,
  });

  const [copied, setCopied] = useState(false);

  const handleCopyCoords = useCallback((lat: number, lng: number) => {
    Clipboard.setString(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const handleShareLocation = useCallback((lat: number, lng: number, name?: string) => {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    Share.share({ message: name ? `${name}\n${mapsUrl}` : mapsUrl, url: mapsUrl });
  }, []);

  const distance = useCurrentDistance(customer?.latitude, customer?.longitude);

  const status    = customer
    ? ((customer.subscriptionStatus as SubscriptionStatus | undefined) ?? getCustomerStatus(customer))
    : 'INACTIVE';
  const statusCfg = STATUS_CFG[status];

  const initials = customer?.name
    ? customer.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <AdminDetailScreen
      title={customer?.name ?? t('customers.title')}
      subtitle={customer?.company ?? undefined}
      isLoading={isLoading}
      notFound={!isLoading && !customer}
      notFoundText={t('customers.notFound')}
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      {customer && (
        <>
          {/* ── Hero card ── */}
          <View style={[styles.heroCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
            <View style={[styles.accentBar, { backgroundColor: statusCfg.color }]} />
            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                <View style={[styles.avatar, { backgroundColor: statusCfg.color + '22' }]}>
                  <Text style={[styles.avatarText, { color: statusCfg.color }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.heroName, { color: c.text.primary }]} numberOfLines={2}>
                    {customer.name}
                  </Text>
                  {customer.company && (
                    <Text style={[styles.heroCompany, { color: c.text.secondary }]} numberOfLines={1}>
                      🏢  {customer.company}
                    </Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color + '44' }]}>
                  <Text style={{ fontSize: 12 }}>{statusCfg.icon}</Text>
                  <Text style={[styles.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                </View>
              </View>

              <View style={[styles.contactRow, { borderTopColor: c.border.primary }]}>
                {customer.email && (
                  <View style={styles.contactItem}>
                    <Ionicons name="mail-outline" size={13} color={c.text.muted} />
                    <Text style={[styles.contactText, { color: c.text.secondary }]} numberOfLines={1}>
                      {customer.email}
                    </Text>
                  </View>
                )}
                {customer.phone && (
                  <View style={styles.contactItem}>
                    <Ionicons name="call-outline" size={13} color={c.text.muted} />
                    <Text style={[styles.contactText, { color: c.text.secondary }]} numberOfLines={1}>
                      {customer.phone}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Stats row ── */}
          <DetailStatRow
            stats={[
              { value: customer._count?.tickets ?? 0,      label: t('customers.columns.tickets'),     color: Palette.blue700,    bgColor: Palette.blue50   },
              { value: customer.applications?.length ?? 0, label: t('customers.detail.applications'), color: Palette.emerald700, bgColor: Palette.emerald50 },
            ]}
          />

          {/* ── Contact & address ── */}
          <DetailInfoCard
            title={t('customers.detail.contact') ?? 'Contact'}
            fields={[
              { icon: '✉️', label: t('customers.columns.email'),   value: customer.email },
              { icon: '📞', label: t('customers.columns.phone'),   value: customer.phone },
              { icon: '🏢', label: t('customers.detail.company'),  value: customer.company },
              { icon: '📍', label: t('customers.detail.address'),  value: customer.address },
              { icon: '📅', label: t('customers.columns.created'), value: formatDate(customer.createdAt) },
            ]}
          />

          {/* ── Location map ── */}
          {customer.latitude != null && customer.longitude != null ? (
            <>
              <CustomerLocationMap
                latitude={customer.latitude}
                longitude={customer.longitude}
                customerName={customer.name}
                subscriptionStatus={status}
                style={{ borderWidth: 1, borderColor: c.border.primary }}
              />

              {distance && (
                <View style={[styles.distanceChip, { backgroundColor: c.surface.elevated, borderColor: c.border.primary }]}>
                  <Ionicons name="location-outline" size={14} color={c.text.secondary} />
                  <Text style={[styles.distanceText, { color: c.text.secondary }]}>
                    {distance} {t('customers.location.away')}
                  </Text>
                </View>
              )}

              <View style={styles.locationBtnRow}>
                {/* Open in Maps */}
                <Pressable
                  onPress={() => openInMaps(customer.latitude!, customer.longitude!, customer.name)}
                  style={({ pressed }) => [styles.locationBtn, { backgroundColor: pressed ? c.interactive.primaryPressed : c.interactive.primary }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="map-outline" size={16} color={Palette.white} />
                  <Text style={styles.locationBtnText}>{t('customers.location.openInMaps')}</Text>
                </Pressable>

                {/* Copy coords */}
                <Pressable
                  onPress={() => handleCopyCoords(customer.latitude!, customer.longitude!)}
                  style={({ pressed }) => [styles.locationBtn, {
                    backgroundColor: copied
                      ? c.intent.success
                      : pressed ? c.interactive.pressed : c.surface.elevated,
                    borderWidth: 1,
                    borderColor: c.border.primary,
                  }]}
                  accessibilityRole="button"
                >
                  <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={16} color={copied ? Palette.white : c.text.primary} />
                  <Text style={[styles.locationBtnText, { color: copied ? Palette.white : c.text.primary }]}>
                    {copied ? t('customers.location.copied') : t('customers.location.copyCoords')}
                  </Text>
                </Pressable>

                {/* Share */}
                <Pressable
                  onPress={() => handleShareLocation(customer.latitude!, customer.longitude!, customer.name)}
                  style={({ pressed }) => [styles.locationBtn, {
                    backgroundColor: pressed ? c.interactive.pressed : c.surface.elevated,
                    borderWidth: 1,
                    borderColor: c.border.primary,
                  }]}
                  accessibilityRole="button"
                >
                  <Ionicons name="share-outline" size={16} color={c.text.primary} />
                  <Text style={[styles.locationBtnText, { color: c.text.primary }]}>{t('customers.location.share')}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={[styles.noLocationCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
              <Ionicons name="location-outline" size={20} color={c.text.muted} />
              <Text style={[styles.noLocationText, { color: c.text.secondary }]}>
                {t('customers.location.noLocation')}
              </Text>
            </View>
          )}

          {/* ── Subscription ── */}
          {customer.maintenanceType && (
            <DetailInfoCard
              title={t('customers.detail.maintenance')}
              fields={[
                { icon: '📋', label: t('customers.detail.maintenanceType'),   value: MAINTENANCE_LABELS[customer.maintenanceType] ?? customer.maintenanceType },
                { icon: '▶️', label: t('customers.detail.subscriptionStart'), value: customer.subscriptionStartDate ? formatDate(customer.subscriptionStartDate) : null },
                (() => {
                  const endDate  = customer.subscriptionEndDate;
                  const end      = endDate ? new Date(endDate) : null;
                  const now      = new Date();
                  const daysLeft = end ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isSoon    = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
                  const color     = isExpired ? Palette.red600 : isSoon ? Palette.amber600 : undefined;
                  return { icon: '⏹️', label: t('customers.detail.subscriptionEnd'), value: endDate ? formatDate(endDate) : null, valueColor: color };
                })(),
              ]}
            />
          )}

          {/* ── Linked applications ── */}
          {!!customer.applications?.length && (
            <View style={[styles.appsCard, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
              <View style={[styles.appsTitleRow, { borderBottomColor: c.border.primary }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="phone-portrait-outline" size={14} color={c.text.muted} />
                  <Text style={[styles.appsTitle, { color: c.text.muted }]}>
                    {t('customers.detail.applications')}
                  </Text>
                </View>
                <View style={[styles.appsBadge, { backgroundColor: c.interactive.primary + '20' }]}>
                  <Text style={[styles.appsBadgeText, { color: c.interactive.primary }]}>
                    {customer.applications!.length}
                  </Text>
                </View>
              </View>
              {customer.applications!.map((ca: any, i: number) => (
                <View
                  key={ca.id}
                  style={[
                    styles.appRow,
                    i < customer.applications!.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border.secondary },
                  ]}
                >
                  <View style={[styles.appIcon, { backgroundColor: c.surface.tertiary }]}>
                    <Ionicons name="cube-outline" size={16} color={c.text.secondary} />
                  </View>
                  <Text style={[styles.appName, { color: c.text.primary }]} numberOfLines={1}>
                    {ca.application?.name ?? ca.applicationId}
                  </Text>
                  {ca.application?.version && (
                    <View style={[styles.versionBadge, { backgroundColor: c.intent.infoSurface, borderColor: c.interactive.primary + '44' }]}>
                      <Text style={[styles.versionText, { color: c.interactive.primary }]}>
                        {ca.application.version}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </AdminDetailScreen>
  );
};

const styles = StyleSheet.create({
  heroCard:    { borderRadius: 14, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  accentBar:   { height: 4 },
  heroBody:    { padding: 16 },
  heroTop:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  avatar:      { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:  { fontSize: 18, fontWeight: '800' },
  heroName:    { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  heroCompany: { fontSize: 12, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  contactRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTopWidth: 1 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  contactText: { fontSize: 12, flexShrink: 1 },

  appsCard:      { borderRadius: 14, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  appsTitleRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  appsTitle:     { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  appsBadge:     { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  appsBadgeText: { fontSize: 11, fontWeight: '700' },
  appRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  appIcon:       { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  appName:       { flex: 1, fontSize: 13, fontWeight: '600' },
  versionBadge:  { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  versionText:   { fontSize: 11, fontWeight: '600' },

  noLocationCard: { borderRadius: 12, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 60 },
  noLocationText: { fontSize: 13, fontStyle: 'italic' },

  locationBtnRow: { flexDirection: 'row', gap: 8 },
  locationBtn:    { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  locationBtnText:{ fontSize: 12, fontWeight: '700' },

  distanceChip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  distanceText: { fontSize: 13, fontWeight: '600' },
});

export default CustomerDetailScreen;
