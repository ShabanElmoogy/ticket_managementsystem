import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  children?: React.ReactNode;
  footer:    React.ReactNode;
}

/**
 * SettingsPanelLayout — scrollable content area with a fixed footer button.
 * Use this as the root of every settings panel that has a Save button.
 *
 * Usage:
 *   <SettingsPanelLayout footer={<AppButton ...>Save</AppButton>}>
 *     <SettingsCard ...>...</SettingsCard>
 *   </SettingsPanelLayout>
 */
const SettingsPanelLayout: React.FC<Props> = ({ children, footer }) => {
  const c = useThemeColors();
  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <View style={[styles.footer, { backgroundColor: c.surface.primary, borderTopColor: c.border.primary }]}>
        {footer}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 8 },
  footer:  { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
});

export default SettingsPanelLayout;
