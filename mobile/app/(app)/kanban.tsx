import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

export default function KanbanScreen() {
  const c = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface.secondary }}>
      <Text style={{ fontSize: 32, marginBottom: 12 }}>🗂️</Text>
      <Text style={{ fontSize: 18, fontWeight: '600', color: c.text.primary }}>Kanban Board</Text>
      <Text style={{ fontSize: 14, color: c.text.muted, marginTop: 8 }}>Coming soon</Text>
    </View>
  );
}
