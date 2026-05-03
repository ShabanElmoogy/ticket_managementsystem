/**
 * LocationPicker.tsx
 *
 * Interactive map-based location picker for the CustomerForm.
 * Used ONLY in page mode (never inside a Modal) — safe to call useThemeColors().
 *
 * Props:
 *   value    — current coordinate pair, or null if no pin placed
 *   onChange — called with new coords when pin is placed/moved, or null to clear
 *   disabled — disables all interactions
 *
 * Modes:
 *   Map mode     — react-native-maps MapView with draggable pin
 *   Fallback mode — two TextInput fields when map tiles fail to load
 *
 * Feature: customer-map-location
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Linking = require('react-native').Linking as {
  canOpenURL:   (url: string) => Promise<boolean>;
  openURL:      (url: string) => Promise<void>;
  openSettings: ()            => Promise<void>;
};
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useThemeColors } from '@/src/constants/theme';
import AppButton    from '@/src/shared/components/forms/AppButton';
import AppTextInput from '@/src/shared/components/forms/AppTextInput';

// react-native-maps — lazy require on native, stub on web
let MapView: any = null;
let Marker: any  = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Coordinate {
  latitude:  number;
  longitude: number;
}

interface LocationPickerProps {
  value:    Coordinate | null;
  onChange: (coords: Coordinate | null) => void;
  disabled?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const c     = useThemeColors();

  const mapRef = useRef<any>(null);

  const [mapAvailable,    setMapAvailable]    = useState(Platform.OS !== 'web');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationError,    setLocationError]    = useState<string | null>(null);

  // Fallback text-input state
  const [latText, setLatText] = useState(value ? String(value.latitude)  : '');
  const [lngText, setLngText] = useState(value ? String(value.longitude) : '');
  const [latError, setLatError] = useState<string | null>(null);
  const [lngError, setLngError] = useState<string | null>(null);

  // ── Map handlers ────────────────────────────────────────────────────────────

  const handleMapPress = useCallback((e: any) => {
    if (disabled) return;
    onChange(e.nativeEvent.coordinate);
  }, [disabled, onChange]);

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (disabled) return;
    onChange(e.nativeEvent.coordinate);
  }, [disabled, onChange]);

  const handleMapError = useCallback(() => {
    setMapAvailable(false);
  }, []);

  const handleClear = useCallback(() => {
    onChange(null);
    setLatText('');
    setLngText('');
    setLatError(null);
    setLngError(null);
  }, [onChange]);

  // ── Fallback text-input handlers ────────────────────────────────────────────

  const handleLatBlur = useCallback(() => {
    const n = parseFloat(latText);
    if (latText === '') { setLatError(null); return; }
    if (isNaN(n) || n < -90 || n > 90) {
      setLatError(t('customers.location.latRange'));
      return;
    }
    setLatError(null);
    const lng = parseFloat(lngText);
    if (!isNaN(lng) && lng >= -180 && lng <= 180) {
      onChange({ latitude: n, longitude: lng });
    }
  }, [latText, lngText, onChange, t]);

  const handleLngBlur = useCallback(() => {
    const n = parseFloat(lngText);
    if (lngText === '') { setLngError(null); return; }
    if (isNaN(n) || n < -180 || n > 180) {
      setLngError(t('customers.location.lngRange'));
      return;
    }
    setLngError(null);
    const lat = parseFloat(latText);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      onChange({ latitude: lat, longitude: n });
    }
  }, [latText, lngText, onChange, t]);

  // ── "Use My Location" ───────────────────────────────────────────────────────

  const handleUseMyLocation = useCallback(async () => {
    if (fetchingLocation || disabled) return;

    setFetchingLocation(true);
    setPermissionDenied(false);
    setLocationError(null);

    try {
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeoutInterval: 10000,
      } as any);

      const coords: Coordinate = {
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      onChange(coords);

      // Update fallback text fields
      setLatText(String(coords.latitude));
      setLngText(String(coords.longitude));

      // Center map
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude:       coords.latitude,
          longitude:      coords.longitude,
          latitudeDelta:  0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch {
      setLocationError(t('customers.location.gpsError'));
    } finally {
      setFetchingLocation(false);
    }
  }, [fetchingLocation, disabled, onChange, t]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* ── Map mode ── */}
      {mapAvailable && MapView ? (
        <View style={[styles.mapWrapper, { borderColor: c.border.primary }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            scrollEnabled={!disabled}
            zoomEnabled={!disabled}
            onPress={handleMapPress}
            onMapLoadError={handleMapError}
            initialRegion={value ? {
              latitude:       value.latitude,
              longitude:      value.longitude,
              latitudeDelta:  0.05,
              longitudeDelta: 0.05,
            } : {
              latitude:       24.7136,
              longitude:      46.6753,
              latitudeDelta:  5,
              longitudeDelta: 5,
            }}
          >
            {value && Marker && (
              <Marker
                draggable
                coordinate={value}
                onDragEnd={handleMarkerDragEnd}
              />
            )}
          </MapView>
        </View>
      ) : (
        /* ── Fallback mode ── */
        <View style={[styles.fallback, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
          <Text style={[styles.fallbackMsg, { color: c.text.secondary }]}>
            {t('customers.location.mapUnavailable')}
          </Text>

          <AppTextInput
            label={t('customers.location.latitude')}
            value={latText}
            onChangeText={setLatText}
            onBlur={handleLatBlur}
            placeholder={t('customers.location.latPlaceholder')}
            keyboardType="decimal-pad"
            error={latError ?? undefined}
            editable={!disabled}
          />

          <AppTextInput
            label={t('customers.location.longitude')}
            value={lngText}
            onChangeText={setLngText}
            onBlur={handleLngBlur}
            placeholder={t('customers.location.lngPlaceholder')}
            keyboardType="decimal-pad"
            error={lngError ?? undefined}
            editable={!disabled}
          />
        </View>
      )}

      {/* ── "Use My Location" button ── */}
      <AppButton
        onPress={handleUseMyLocation}
        loading={fetchingLocation}
        disabled={disabled || fetchingLocation}
        variant="secondary"
        style={styles.locationBtn}
      >
        {t('customers.location.useMyLocation')}
      </AppButton>

      {/* ── Clear Location link ── */}
      {value !== null && (
        <Pressable onPress={handleClear} disabled={disabled} style={styles.clearBtn}>
          <Text style={[styles.clearText, { color: c.intent.error }]}>
            {t('customers.location.clearLocation')}
          </Text>
        </Pressable>
      )}

      {/* ── Permission denied message ── */}
      {permissionDenied && (
        <View style={[styles.inlineMsg, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error + '44' }]}>
          <Text style={[styles.inlineMsgText, { color: c.intent.error }]}>
            {t('customers.location.permissionDenied')}
          </Text>
          <Pressable onPress={() => Linking.openSettings()}>
            <Text style={[styles.inlineMsgLink, { color: c.intent.error }]}>
              {t('customers.location.openSettings')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── GPS error message ── */}
      {locationError && (
        <View style={[styles.inlineMsg, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error + '44' }]}>
          <Text style={[styles.inlineMsgText, { color: c.intent.error }]}>
            {locationError}
          </Text>
        </View>
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { gap: 10 },
  mapWrapper:  { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  map:         { height: 220 },
  fallback: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 10,
  },
  fallbackMsg: { fontSize: 13, marginBottom: 4 },
  locationBtn: { marginTop: 2 },
  clearBtn:    { alignSelf: 'center', paddingVertical: 4 },
  clearText:   { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  inlineMsg: {
    borderRadius: 8, borderWidth: 1, padding: 10, gap: 4,
  },
  inlineMsgText: { fontSize: 13 },
  inlineMsgLink: { fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});

export default LocationPicker;
