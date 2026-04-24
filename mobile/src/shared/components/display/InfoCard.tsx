import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '../../../constants/theme';

export interface InfoCardSection {
  label?:    string;
  content:   string;
  mono?:     boolean;
  maxLines?: number;
}

export interface InfoCardProps {
  accentColor: string;
  icon:        string;
  title:       string;
  subtitle?:   string;
  message?:    string;
  sections?:   InfoCardSection[];
  caption?:    string;
  isDark?:     boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({
  accentColor, icon, title, subtitle, message, sections = [], caption,
}) => {
  const c = useThemeColors();
  return (
    <View style={{
      backgroundColor: c.surface.primary, borderRadius: Radius.xl,
      overflow: 'hidden', borderWidth: 1, borderColor: c.border.primary, minWidth: 300,
    }}>
      <View style={{ height: 5, backgroundColor: accentColor }} />
      <View style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ width: 44, height: 44, borderRadius: Radius.lg, backgroundColor: accentColor + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: FontSize['3xl'] }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: c.text.primary }}>{title}</Text>
            {!!subtitle && <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: accentColor }}>{subtitle}</Text>}
          </View>
        </View>

        {!!message && (
          <View style={{ backgroundColor: c.surface.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border.primary, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: FontSize.base, color: c.text.secondary, lineHeight: 20 }}>{message}</Text>
          </View>
        )}

        {sections.map((section, i) => (
          <View key={i} style={{ backgroundColor: c.surface.secondary, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border.primary, padding: 12, marginBottom: 12 }}>
            {!!section.label && (
              <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: c.text.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {section.label}
              </Text>
            )}
            <Text style={{ fontSize: FontSize.xs, color: c.text.secondary, lineHeight: 17, fontFamily: section.mono ? 'monospace' : undefined }} numberOfLines={section.maxLines}>
              {section.content}
            </Text>
          </View>
        ))}

        {!!caption && (
          <Text style={{ fontSize: FontSize.xs, color: c.text.muted, textAlign: 'right' }}>{caption}</Text>
        )}
      </View>
    </View>
  );
};

export default InfoCard;
