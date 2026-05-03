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
  TextInput,
  ActivityIndicator,
  Modal,
  StatusBar,
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

// ── Map type helpers ──────────────────────────────────────────────────────────

type MapType = 'standard' | 'satellite' | 'hybrid';
const MAP_TYPE_CYCLE: MapType[] = ['standard', 'satellite', 'hybrid'];
const MAP_TYPE_ICON: Record<MapType, string> = { standard: '🗺️', satellite: '🛰️', hybrid: '🌍' };
function nextMapType(c: MapType): MapType {
  return MAP_TYPE_CYCLE[(MAP_TYPE_CYCLE.indexOf(c) + 1) % MAP_TYPE_CYCLE.length];
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
  /** Called with a human-readable address after reverse geocoding succeeds */
  onAddressSuggested?: (address: string) => void;
  /** Whether an address is already saved — suppresses auto-fill when true */
  hasExistingAddress?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  disabled = false,
  onAddressSuggested,
  hasExistingAddress = false,
}) => {
  const { t } = useTranslation();
  const c     = useThemeColors();

  const mapRef = useRef<any>(null);

  const [mapAvailable,     setMapAvailable]     = useState(Platform.OS !== 'web');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationError,    setLocationError]    = useState<string | null>(null);
  const [geocoding,        setGeocoding]        = useState(false);
  const [expanded,         setExpanded]         = useState(false);
  const [mapType,          setMapType]          = useState<MapType>('standard');

  // ── Near-me suggestions ────────────────────────────────────────────────────
  interface NearMePlace { name: string; lat: number; lon: number; icon: string; }
  const [nearMePlaces,    setNearMePlaces]    = useState<NearMePlace[]>([]);
  const [selectedNearMe,  setSelectedNearMe]  = useState<string | null>(null);
  const nearMeFetched = useRef(false);

  // Map Nominatim category/type to an emoji icon
  function placeIcon(category: string, type: string): string {
    if (category === 'amenity') {
      if (type === 'restaurant' || type === 'cafe' || type === 'fast_food') return '🍽️';
      if (type === 'hospital' || type === 'clinic' || type === 'pharmacy') return '🏥';
      if (type === 'school' || type === 'university' || type === 'college') return '🎓';
      if (type === 'mosque' || type === 'church' || type === 'place_of_worship') return '🕌';
      if (type === 'bank' || type === 'atm') return '🏦';
      if (type === 'fuel') return '⛽';
      if (type === 'parking') return '🅿️';
      if (type === 'supermarket' || type === 'marketplace') return '🛒';
    }
    if (category === 'shop') return '🛍️';
    if (category === 'tourism') return '🏛️';
    if (category === 'leisure') return '🌳';
    if (category === 'highway') return '🛣️';
    return '📍';
  }

  // Fetch once when map is available
  React.useEffect(() => {
    if (!mapAvailable || disabled || nearMeFetched.current) return;
    nearMeFetched.current = true;

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        } as any);

        const { latitude, longitude } = pos.coords;

        // Query multiple amenity types for richer results
        const amenities = 'mosque|restaurant|hospital|school|supermarket|bank|hotel|park';
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json&limit=8&addressdetails=0&extratags=0` +
          `&amenity=${encodeURIComponent(amenities)}` +
          `&viewbox=${longitude - 0.08},${latitude + 0.08},${longitude + 0.08},${latitude - 0.08}` +
          `&bounded=1`;

        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' },
        });

        if (!res.ok) return;

        const data: Array<{
          display_name: string; lat: string; lon: string;
          category: string; type: string;
        }> = await res.json();

        if (!data.length) {
          // Fallback: reverse geocode to show current area
          const revUrl =
            `https://nominatim.openstreetmap.org/reverse` +
            `?format=json&lat=${latitude}&lon=${longitude}&zoom=14`;
          const revRes = await fetch(revUrl, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' },
          });
          if (revRes.ok) {
            const rev: { address?: { suburb?: string; city?: string; town?: string } } = await revRes.json();
            const area = rev.address?.suburb ?? rev.address?.city ?? rev.address?.town;
            if (area) {
              setNearMePlaces([{ name: area, lat: latitude, lon: longitude, icon: '📍' }]);
            }
          }
          return;
        }

        const places: NearMePlace[] = data.slice(0, 5).map((p) => ({
          name: p.display_name.split(',')[0].trim(),
          lat:  parseFloat(p.lat),
          lon:  parseFloat(p.lon),
          icon: placeIcon(p.category, p.type),
        }));

        setNearMePlaces(places);
      } catch {
        // Silently skip — suggestions are optional
      }
    })();
  }, [mapAvailable, disabled]);

  const handleNearMeSelect = useCallback((place: NearMePlace) => {
    const key = `${place.lat}-${place.lon}`;
    setSelectedNearMe(key);
    const coords: Coordinate = { latitude: place.lat, longitude: place.lon };
    onChange(coords);
    reverseGeocode(place.lat, place.lon);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude:       place.lat,
        longitude:      place.lon,
        latitudeDelta:  0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  }, [onChange, reverseGeocode]);

  // ── Address search (Nominatim / OpenStreetMap — no API key needed) ──────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searching,     setSearching]     = useState(false);
  const [searchError,   setSearchError]   = useState<string | null>(null);

  const handleAddressSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query || disabled) return;

    setSearching(true);
    setSearchError(null);

    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(query)}&format=json&limit=1`;

      const res  = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'TicketFlowApp/1.0' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: Array<{ lat: string; lon: string }> = await res.json();

      if (!data.length) {
        setSearchError(t('customers.location.searchNoResults'));
        return;
      }

      const latitude  = parseFloat(data[0].lat);
      const longitude = parseFloat(data[0].lon);
      const coords: Coordinate = { latitude, longitude };

      onChange(coords);
      setLatText(String(latitude));
      setLngText(String(longitude));
      reverseGeocode(latitude, longitude);

      // Animate map to result
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta:  0.01,
          longitudeDelta: 0.01,
        }, 600);
      }
    } catch {
      setSearchError(t('customers.location.searchError'));
    } finally {
      setSearching(false);
    }
  }, [searchQuery, disabled, onChange, reverseGeocode, t]);

  // ── Reverse geocode helper ─────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (hasExistingAddress || !onAddressSuggested) return;
    setGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [
          r.streetNumber,
          r.street,
          r.district,
          r.city,
          r.region,
          r.country,
        ].filter(Boolean);
        const address = parts.join(', ');
        if (address) onAddressSuggested(address);
      }
    } catch {
      // Silently skip — address suggestion is optional
    } finally {
      setGeocoding(false);
    }
  }, [hasExistingAddress, onAddressSuggested]);

  // Fallback text-input state
  const [latText, setLatText] = useState(value ? String(value.latitude)  : '');
  const [lngText, setLngText] = useState(value ? String(value.longitude) : '');
  const [latError, setLatError] = useState<string | null>(null);
  const [lngError, setLngError] = useState<string | null>(null);

  // ── Map handlers ────────────────────────────────────────────────────────────

  const handleMapPress = useCallback((e: any) => {
    if (disabled) return;
    const coords = e.nativeEvent.coordinate;
    onChange(coords);
    reverseGeocode(coords.latitude, coords.longitude);
  }, [disabled, onChange, reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: any) => {
    if (disabled) return;
    const coords = e.nativeEvent.coordinate;
    onChange(coords);
    reverseGeocode(coords.latitude, coords.longitude);
  }, [disabled, onChange, reverseGeocode]);

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
      reverseGeocode(n, lng);
    }
  }, [latText, lngText, onChange, reverseGeocode, t]);

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
      reverseGeocode(lat, n);
    }
  }, [latText, lngText, onChange, reverseGeocode, t]);

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

      // Reverse geocode for address suggestion
      reverseGeocode(coords.latitude, coords.longitude);

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
        <>
          {/* Address search bar */}
          {!disabled && (
            <View style={[styles.searchRow, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
              <TextInput
                value={searchQuery}
                onChangeText={(v: string) => { setSearchQuery(v); setSearchError(null); }}
                placeholder={t('customers.location.searchPlaceholder')}
                placeholderTextColor={c.text.muted}
                returnKeyType="search"
                onSubmitEditing={handleAddressSearch}
                editable={!searching}
                style={[styles.searchInput, { color: c.text.primary }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => { setSearchQuery(''); setSearchError(null); }}
                  style={styles.searchClearBtn}
                  accessibilityRole="button"
                >
                  <Text style={[styles.searchClearText, { color: c.text.muted }]}>✕</Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleAddressSearch}
                disabled={!searchQuery.trim() || searching}
                style={({ pressed }) => [
                  styles.searchBtn,
                  { backgroundColor: c.interactive.primary, opacity: pressed || !searchQuery.trim() ? 0.6 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('customers.location.searchBtn')}
              >
                {searching
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.searchBtnText}>🔍</Text>
                }
              </Pressable>
            </View>
          )}

          {/* Search error */}
          {searchError && (
            <View style={[styles.inlineMsg, { backgroundColor: c.intent.errorSurface, borderColor: c.intent.error + '44' }]}>
              <Text style={[styles.inlineMsgText, { color: c.intent.error }]}>{searchError}</Text>
            </View>
          )}

          {/* Near-me suggestions */}
          {nearMePlaces.length > 0 && (
            <View style={styles.nearMeRow}>
              <Text style={[styles.nearMeLabel, { color: c.text.muted }]}>
                📍 {t('customers.location.nearMe')}
              </Text>
              <View style={styles.nearMeChips}>
                {nearMePlaces.map((place) => {
                  const key       = `${place.lat}-${place.lon}`;
                  const isSelected = selectedNearMe === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => handleNearMeSelect(place)}
                      style={({ pressed }) => [
                        styles.nearMeChip,
                        {
                          backgroundColor: isSelected
                            ? c.interactive.primary + '18'
                            : pressed ? c.surface.elevated : c.surface.secondary,
                          borderColor: isSelected
                            ? c.interactive.primary
                            : c.border.primary,
                          borderWidth: isSelected ? 1.5 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.nearMeChipIcon}>{place.icon}</Text>
                      <Text
                        style={[
                          styles.nearMeChipText,
                          { color: isSelected ? c.interactive.primary : c.text.secondary },
                        ]}
                        numberOfLines={1}
                      >
                        {place.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Thumbnail map with expand button */}
          <View style={[styles.mapWrapper, { borderColor: c.border.primary }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              scrollEnabled={!disabled}
              zoomEnabled={!disabled}
              mapType={mapType}
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

            {/* Map type toggle — top-left */}
            <Pressable
              onPress={() => setMapType(nextMapType(mapType))}
              style={styles.mapTypeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customers.location.toggleMapType')}
            >
              <Text style={styles.mapTypeBtnText}>{MAP_TYPE_ICON[mapType]}</Text>
            </Pressable>

            {/* Expand button — top-right corner */}
            <Pressable
              onPress={() => setExpanded(true)}
              style={styles.expandBtn}
              accessibilityRole="button"
              accessibilityLabel={t('customers.location.expandMap')}
            >
              <Text style={styles.expandBtnText}>⛶</Text>
            </Pressable>
          </View>

          {/* Full-screen modal map */}
          <Modal
            visible={expanded}
            animationType="slide"
            statusBarTranslucent
            onRequestClose={() => setExpanded(false)}
          >
            <View style={styles.fullScreen}>
              <StatusBar barStyle="light-content" backgroundColor="#000" />
              <MapView
                style={StyleSheet.absoluteFill}
                scrollEnabled={!disabled}
                zoomEnabled={!disabled}
                rotateEnabled
                pitchEnabled
                mapType={mapType}
                onPress={handleMapPress}
                initialRegion={value ? {
                  latitude:       value.latitude,
                  longitude:      value.longitude,
                  latitudeDelta:  0.01,
                  longitudeDelta: 0.01,
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

              {/* Map type toggle — top-left */}
              <Pressable
                onPress={() => setMapType(nextMapType(mapType))}
                style={styles.mapTypeBtnExpanded}
                accessibilityRole="button"
                accessibilityLabel={t('customers.location.toggleMapType')}
              >
                <Text style={styles.mapTypeBtnText}>{MAP_TYPE_ICON[mapType]}</Text>
              </Pressable>

              {/* Instruction label */}
              <View style={styles.fullScreenHint} pointerEvents="none">
                <Text style={styles.fullScreenHintText}>
                  {disabled ? '👁️' : '📍'}  {disabled
                    ? t('customers.location.tapToExpand')
                    : t('customers.location.tapToPin')}
                </Text>
              </View>

              {/* Done button */}
              <Pressable
                onPress={() => setExpanded(false)}
                style={({ pressed }) => [styles.doneBtn, { opacity: pressed ? 0.85 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={t('customers.location.done')}
              >
                <Text style={styles.doneBtnText}>✕  {t('customers.location.done')}</Text>
              </Pressable>
            </View>
          </Modal>
        </>
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

      {/* ── Geocoding indicator ── */}
      {geocoding && (
        <View style={[styles.geocodingRow, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
          <ActivityIndicator size="small" color={c.interactive.primary} />
          <Text style={[styles.geocodingText, { color: c.text.secondary }]}>
            {t('customers.location.geocoding')}
          </Text>
        </View>
      )}

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

  // Address search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchBtnText: { fontSize: 16 },

  // Near-me suggestions
  nearMeRow:      { gap: 8 },
  nearMeLabel:    { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  nearMeChips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nearMeChip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    borderRadius:   99,
    borderWidth:    1,
    paddingHorizontal: 12,
    paddingVertical:    7,
    maxWidth:       170,
  },
  nearMeChipIcon: { fontSize: 13 },
  nearMeChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
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
  geocodingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8,
  },
  geocodingText: { fontSize: 12 },

  // Expand button overlay on thumbnail
  expandBtn: {
    position: 'absolute',
    top: 8,
    end: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtnText: { color: '#fff', fontSize: 16 },

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

  // Full-screen modal
  fullScreen: { flex: 1, backgroundColor: '#000' },
  fullScreenHint: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  fullScreenHintText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
  doneBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default LocationPicker;
