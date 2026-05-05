import React from 'react';
import { ScrollView, View, Platform } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { useDeviceInfoSections } from './hooks/useDeviceInfoSections';
import DeviceInfoHeader from './components/DeviceInfoHeader';
import SectionCard from './components/SectionCard';

const DeviceInfoScreen: React.FC = () => {
  const c = useThemeColors();
  const sections = useDeviceInfoSections();

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
      <DeviceInfoHeader osVersion={Platform.Version} />

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s) => (
          <View key={s.title}>
            <SectionCard section={s} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default DeviceInfoScreen;
