import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { PaletteSelector } from '@/src/shared/components/display';
import { Spacing, Radius, FontSize, FontWeight, BorderWidth } from '@/src/constants/tokens';

export default function ProfileScreen() {
  const c = useThemeColors();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.surface.secondary }}
      contentContainerStyle={styles.container}
    >
      {/* Avatar placeholder */}
      <View style={[styles.avatarSection, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
        <View style={[styles.avatar, { backgroundColor: c.interactive.primary }]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={[styles.name, { color: c.text.primary }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: c.text.muted }]}>Coming soon</Text>
      </View>

      {/* Palette selector section */}
      <View style={[styles.section, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
        <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>Accent Color</Text>
        <PaletteSelector resolvedColors={c} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.thin,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
  },
  name: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    fontSize: FontSize.base,
    marginTop: Spacing.xs,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: BorderWidth.thin,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
