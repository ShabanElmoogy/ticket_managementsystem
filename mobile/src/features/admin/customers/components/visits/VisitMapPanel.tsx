/**
 * VisitMapPanel.tsx
 * Collapsible map showing all customers with location as colored pins.
 * Tap a pin to select that customer.
 */

import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import s from './visits.styles';
import { SUB_CFG, getSubStatus } from './visits.types';
import type { Customer } from '@/src/services/api/types/index';

// react-native-maps — lazy require on native, stub on web
let MapView: any = null;
let Marker: any  = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker  = maps.Marker;
}

interface Props {
  customers:        Customer[];
  selectedId:       string | null;
  mapHeight:        number;
  collapsed:        boolean;
  loading:          boolean;
  mapRef:           React.RefObject<any>;
  initialRegion:    { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  onSelectCustomer: (id: string) => void;
  onToggleCollapse: (collapsed: boolean) => void;
}

const VisitMapPanel: React.FC<Props> = ({
  customers, selectedId, mapHeight, collapsed, loading,
  mapRef, initialRegion, onSelectCustomer, onToggleCollapse,
}) => {
  const c = useThemeColors();

  if (collapsed) {
    return (
      <Pressable
        onPress={() => onToggleCollapse(false)}
        style={[s.mapShowBar, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}
      >
        <Text style={{ fontSize: 16 }}>🗺️</Text>
        <Text style={[s.mapToggleText, { color: c.interactive.primary, flex: 1 }]}>
          Show map ({customers.length} customers)
        </Text>
        <Text style={{ color: c.text.muted, fontSize: 12 }}>▼</Text>
      </Pressable>
    );
  }

  return (
    <View style={[s.mapWrapper, { height: mapHeight }]}>
      {Platform.OS === 'web' ? (
        <View style={[s.mapFallback, { height: mapHeight, backgroundColor: c.surface.tertiary }]}>
          <Text style={{ fontSize: 28 }}>🗺️</Text>
          <Text style={[s.mapFallbackText, { color: c.text.secondary }]}>
            Map not available on web
          </Text>
        </View>
      ) : loading ? (
        <View style={[s.mapFallback, { height: mapHeight, backgroundColor: c.surface.tertiary }]}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {customers.map((cu) => {
            const cfg        = SUB_CFG[getSubStatus(cu)];
            const isSelected = cu.id === selectedId;
            return (
              <Marker
                key={cu.id}
                coordinate={{ latitude: cu.latitude!, longitude: cu.longitude! }}
                onPress={() => onSelectCustomer(cu.id)}
              >
                <View
                  style={[
                    s.pin,
                    {
                      backgroundColor: isSelected ? cfg.color : cfg.bg,
                      borderColor:     cfg.color,
                      borderWidth:     isSelected ? 2 : 1,
                      shadowColor:     cfg.color,
                      shadowOpacity:   isSelected ? 0.5 : 0.2,
                      shadowRadius:    isSelected ? 6 : 3,
                      elevation:       isSelected ? 6 : 2,
                      transform:       [{ scale: isSelected ? 1.15 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[s.pinLabel, { color: isSelected ? '#fff' : cfg.color }]}
                    numberOfLines={1}
                  >
                    {cu.name.split(' ')[0]}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>
      )}

      {/* Customer count badge */}
      <View style={[s.mapBadge, { backgroundColor: c.surface.primary + 'ee', borderColor: c.border.primary }]}>
        <Text style={[s.mapBadgeText, { color: c.text.secondary }]}>📍 {customers.length}</Text>
      </View>

      {/* Collapse button */}
      <Pressable
        onPress={() => onToggleCollapse(true)}
        style={[s.mapToggleBtn, { backgroundColor: c.surface.primary + 'ee', borderColor: c.border.primary }]}
      >
        <Text style={[s.mapToggleText, { color: c.text.secondary }]}>▲ Hide map</Text>
      </Pressable>
    </View>
  );
};

export default VisitMapPanel;
