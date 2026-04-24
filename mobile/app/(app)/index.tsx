import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const c     = useThemeColors();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface.secondary }}>
      <Text style={{ fontSize: FontSize['4xl'], fontWeight: FontWeight.extrabold, color: c.text.primary }}>
        {t('dashboard.title')}
      </Text>
    </View>
  );
}
