import React from 'react';
import { ScrollView, View, Platform } from 'react-native';
import { useUiStore } from '../../stores/uiStore';
import { useDeviceInfoSections } from './hooks/useDeviceInfoSections';
import DeviceInfoHeader from './components/DeviceInfoHeader';
import SectionCard from './components/SectionCard';

const DeviceInfoScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark   = colorMode === 'dark';
  const sections = useDeviceInfoSections();
  const bg       = isDark ? '#0f172a' : '#f8fafc';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <DeviceInfoHeader isDark={isDark} osVersion={Platform.Version} />

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((s) => (
          <SectionCard key={s.title} section={s} isDark={isDark} />
        ))}
      </ScrollView>
    </View>
  );
};

export default DeviceInfoScreen;
