/**
 * CustomerLocationMap.tsx
 *
 * Read-only map view for the CustomerDetailScreen.
 * Modal-safe: does NOT call useThemeColors() — colors are passed via the
 * `style` prop from the parent.
 *
 * Tapping the map opens the device's default maps application.
 *
 * Feature: customer-map-location
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Linking = require('react-native').Linking as {
  canOpenURL: (url: string) => Promise<boolean>;
  openURL:    (url: string) => Promise<void>;
};

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

interface CustomerLocationMapProps {
  latitude:      number;
  longitude:     number;
  customerName?: string;
  style?:        ViewStyle;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMapsUrl(latitude: number, longitude: number, customerName?: string): string {
  if (Platform.OS === 'ios') {
    return `maps://0,0?q=${latitude},${longitude}`;
  }
  const label = encodeURIComponent(customerName ?? '');
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
}

async function openInMaps(latitude: number, longitude: number, customerName?: string): Promise<void> {
  const url = buildMapsUrl(latitude, longitude, customerName);

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else if (Platform.OS === 'ios') {
      // Fallback to Apple Maps web URL
      await Linking.openURL(`https://maps.apple.com/?q=${latitude},${longitude}`);
    }
  } catch {
    // Silently fail — no toast available here (Modal-safe component)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerLocationMap: React.FC<CustomerLocationMapProps> = ({
  latitude,
  longitude,
  customerName,
  style,
}) => {
  const handlePress = () => {
    openInMaps(latitude, longitude, customerName);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${customerName ?? 'location'} in maps`}
    >
      {MapView ? (
        <MapView
          style={styles.map}
          scrollEnabled={false}
          zoomEnabled={false}
          pointerEvents="none"
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta:  0.01,
            longitudeDelta: 0.01,
          }}
        >
          {Marker && (
            <Marker coordinate={{ latitude, longitude }} />
          )}
        </MapView>
      ) : null}
    </Pressable>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 200,
  },
  map: {
    flex: 1,
  },
});

export default CustomerLocationMap;
