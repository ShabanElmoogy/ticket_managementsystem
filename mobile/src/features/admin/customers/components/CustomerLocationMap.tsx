/**
 * CustomerLocationMap.tsx
 *
 * Read-only map view for the CustomerDetailScreen.
 * Modal-safe: does NOT call useThemeColors() — colors are passed via the
 * `style` prop from the parent.
 *
 * Collapsed mode: static thumbnail, tap to expand.
 * Expanded mode:  full-screen overlay with scroll + zoom enabled and a Done button.
 *
 * Feature: customer-map-location
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// react-native-maps — lazy require on native, stub on web
let MapView: any = null;
let Marker: any  = null;
let Callout: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView  = maps.default;
  Marker   = maps.Marker;
  Callout  = maps.Callout;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'INACTIVE' | 'PAY_AS_YOU_GO';

const STATUS_CFG: Record<SubscriptionStatus, { color: string; bg: string; icon: string; label: string }> = {
  ACTIVE:        { color: '#16a34a', bg: '#f0fdf4', icon: '✅', label: 'Active'        },
  TRIAL:         { color: '#7c3aed', bg: '#f5f3ff', icon: '🔬', label: 'Trial'         },
  EXPIRED:       { color: '#dc2626', bg: '#fef2f2', icon: '⚠️', label: 'Expired'       },
  INACTIVE:      { color: '#6b7280', bg: '#f9fafb', icon: '⏸️', label: 'Inactive'      },
  PAY_AS_YOU_GO: { color: '#0284c7', bg: '#f0f9ff', icon: '💳', label: 'Pay As You Go' },
};

interface CustomerLocationMapProps {
  latitude:           number;
  longitude:          number;
  customerName?:      string;
  subscriptionStatus?: SubscriptionStatus;
  style?:             ViewStyle;
}

// ── Map type toggle ───────────────────────────────────────────────────────────

type MapType = 'standard' | 'satellite' | 'hybrid';

const MAP_TYPE_CYCLE: MapType[] = ['standard', 'satellite', 'hybrid'];
const MAP_TYPE_ICON: Record<MapType, string> = {
  standard:  '🗺️',
  satellite: '🛰️',
  hybrid:    '🌍',
};

function nextMapType(current: MapType): MapType {
  const idx = MAP_TYPE_CYCLE.indexOf(current);
  return MAP_TYPE_CYCLE[(idx + 1) % MAP_TYPE_CYCLE.length];
}

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerLocationMap: React.FC<CustomerLocationMapProps> = ({
  latitude,
  longitude,
  customerName,
  subscriptionStatus,
  style,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [mapType,  setMapType]  = useState<MapType>('standard');

  const region = {
    latitude,
    longitude,
    latitudeDelta:  0.01,
    longitudeDelta: 0.01,
  };

  const status = subscriptionStatus ?? 'INACTIVE';
  const cfg    = STATUS_CFG[status];

  // Callout content — rendered inside both markers
  const calloutContent = customerName ? (
    <View style={styles.callout}>
      <Text style={styles.calloutName} numberOfLines={2}>{customerName}</Text>
      <View style={[styles.calloutBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '55' }]}>
        <Text style={styles.calloutBadgeIcon}>{cfg.icon}</Text>
        <Text style={[styles.calloutBadgeLabel, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  ) : null;

  return (
    <>
      {/* ── Collapsed thumbnail ── */}
      <Pressable
        onPress={() => setExpanded(true)}
        style={[styles.container, style]}
        accessibilityRole="button"
        accessibilityLabel={t('customers.location.expandMap')}
        accessibilityHint={t('customers.location.expandMapHint')}
      >
        {MapView ? (
          <>
            <MapView
              style={styles.map}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              pointerEvents="none"
              mapType={mapType}
              initialRegion={region}
            >
              {Marker && (
                <Marker coordinate={{ latitude, longitude }} pinColor={cfg.color}>
                  {Callout && calloutContent && (
                    <Callout tooltip>
                      {calloutContent}
                    </Callout>
                  )}
                </Marker>
              )}
            </MapView>

            {/* Map type toggle — top-left */}
            <Pressable
              onPress={() => setMapType(nextMapType(mapType))}
              style={styles.mapTypeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customers.location.toggleMapType')}
            >
              <Text style={styles.mapTypeBtnText}>{MAP_TYPE_ICON[mapType]}</Text>
            </Pressable>

            {/* Expand hint overlay */}
            <View style={styles.expandHint} pointerEvents="none">
              <Text style={styles.expandHintText}>
                🔍  {t('customers.location.tapToExpand')}
              </Text>
            </View>
          </>
        ) : null}
      </Pressable>

      {/* ── Expanded full-screen modal ── */}
      <Modal
        visible={expanded}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setExpanded(false)}
      >
        <View style={styles.fullScreen}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />

          {MapView ? (
            <MapView
              style={StyleSheet.absoluteFill}
              scrollEnabled
              zoomEnabled
              rotateEnabled
              pitchEnabled
              mapType={mapType}
              initialRegion={region}
            >
              {Marker && (
                <Marker coordinate={{ latitude, longitude }} pinColor={cfg.color}>
                  {Callout && calloutContent && (
                    <Callout tooltip>
                      {calloutContent}
                    </Callout>
                  )}
                </Marker>
              )}
            </MapView>
          ) : null}

          {/* Map type toggle — top-left */}
          <Pressable
            onPress={() => setMapType(nextMapType(mapType))}
            style={styles.mapTypeBtnExpanded}
            accessibilityRole="button"
            accessibilityLabel={t('customers.location.toggleMapType')}
          >
            <Text style={styles.mapTypeBtnText}>{MAP_TYPE_ICON[mapType]}</Text>
          </Pressable>

          {/* Done button */}
          <Pressable
            onPress={() => setExpanded(false)}
            style={({ pressed }) => [
              styles.doneBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          >
            <Text style={styles.doneBtnText}>✕  {t('customers.location.done')}</Text>
          </Pressable>

          {/* Customer name label */}
          {customerName && (
            <View style={styles.nameLabel} pointerEvents="none">
              <Text style={styles.nameLabelText} numberOfLines={1}>
                📍  {customerName}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Collapsed
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    flex: 1,
  },
  expandHint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  expandHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Map type toggle
  mapTypeBtn: {
    position: 'absolute',
    top: 8,
    start: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeBtnExpanded: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    start: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  mapTypeBtnText: { fontSize: 18 },

  // Expanded
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  doneBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    end: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 99,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  nameLabel: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  nameLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Callout bubble
  callout: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    gap: 6,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  calloutBadgeIcon:  { fontSize: 11 },
  calloutBadgeLabel: { fontSize: 11, fontWeight: '700' },
});

export default CustomerLocationMap;
