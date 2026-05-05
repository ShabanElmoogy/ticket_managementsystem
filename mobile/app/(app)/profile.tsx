import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/constants/theme';
import { PaletteSelector } from '@/src/shared/components/display';
import { Spacing, Radius, FontSize, FontWeight, BorderWidth } from '@/src/constants/tokens';
import { useOnboardingStore } from '@/src/features/onboarding/store/onboardingStore';

export default function ProfileScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear the onboarding completion flag. You will see the onboarding screen on next launch.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            router.replace('/(auth)/onboarding' as any);
          },
        },
      ],
    );
  };

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

      {/* Dev / Settings section */}
      <View style={[styles.section, { backgroundColor: c.surface.primary, borderColor: c.border.primary }]}>
        <Text style={[styles.sectionTitle, { color: c.text.secondary }]}>App Settings</Text>
        <Pressable
          onPress={handleResetOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Reset onboarding"
          style={({ pressed }: { pressed: boolean }) => [
            styles.settingsRow,
            {
              backgroundColor: pressed ? c.surface.elevated : 'transparent',
              borderRadius: Radius.lg,
            },
          ]}
        >
          <View style={[styles.settingsIconWrap, { backgroundColor: c.intent.infoSurface }]}>
            <Ionicons name="refresh-outline" size={18} color={c.interactive.primary} />
          </View>
          <Text style={[styles.settingsLabel, { color: c.text.primary }]}>
            Reset Onboarding
          </Text>
          <Ionicons name="chevron-forward-outline" size={16} color={c.text.muted} />
        </Pressable>
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
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.sm,
  },
  settingsIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
});
