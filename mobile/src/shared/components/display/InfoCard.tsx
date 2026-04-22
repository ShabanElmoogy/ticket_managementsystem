import React from 'react';
import { View, Text } from 'react-native';

export interface InfoCardSection {
  /** Optional label shown above the content in uppercase */
  label?: string;
  /** Text content — or pass a pre-serialised string */
  content: string;
  /** Use monospace font (e.g. for JSON / stack traces) */
  mono?: boolean;
  /** Max lines before truncation (default: unlimited) */
  maxLines?: number;
}

export interface InfoCardProps {
  /** Coloured top stripe + icon badge tint */
  accentColor: string;
  /** Emoji or short string shown in the icon badge */
  icon:        string;
  /** Bold primary heading */
  title:       string;
  /** Smaller coloured subtitle below the title */
  subtitle?:   string;
  /** Main body text shown in the message box */
  message?:    string;
  /** Extra detail sections rendered below the message */
  sections?:   InfoCardSection[];
  /** Small caption shown bottom-right (e.g. timestamp) */
  caption?:    string;
  isDark?:     boolean;
}

/**
 * InfoCard — generic card used for error reports, audit entries,
 * debug snapshots, or any structured info that needs a screenshot-friendly layout.
 *
 * Used by NetworkErrorDialog's ErrorCard and can be reused anywhere.
 */
const InfoCard: React.FC<InfoCardProps> = ({
  accentColor,
  icon,
  title,
  subtitle,
  message,
  sections = [],
  caption,
  isDark = false,
}) => {
  const cardBg  = isDark ? '#1e293b' : '#ffffff';
  const textPri = isDark ? '#f1f5f9' : '#0f172a';
  const textSec = isDark ? '#94a3b8' : '#64748b';
  const msgBg   = isDark ? '#0f172a' : '#f8fafc';
  const border  = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{
      backgroundColor: cardBg,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: border,
      minWidth: 300,
    }}>
      {/* Accent stripe */}
      <View style={{ height: 5, backgroundColor: accentColor }} />

      <View style={{ padding: 20 }}>

        {/* Header — icon badge + title + subtitle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: accentColor + '18',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 22 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: textPri }}>{title}</Text>
            {!!subtitle && (
              <Text style={{ fontSize: 12, fontWeight: '600', color: accentColor }}>{subtitle}</Text>
            )}
          </View>
        </View>

        {/* Message box */}
        {!!message && (
          <View style={{
            backgroundColor: msgBg, borderRadius: 10,
            borderWidth: 1, borderColor: border,
            padding: 12, marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, color: textSec, lineHeight: 20 }}>{message}</Text>
          </View>
        )}

        {/* Extra sections */}
        {sections.map((section, i) => (
          <View
            key={i}
            style={{
              backgroundColor: msgBg, borderRadius: 10,
              borderWidth: 1, borderColor: border,
              padding: 12, marginBottom: 12,
            }}
          >
            {!!section.label && (
              <Text style={{
                fontSize: 10, fontWeight: '700', color: textSec,
                marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {section.label}
              </Text>
            )}
            <Text
              style={{
                fontSize: 11, color: textSec, lineHeight: 17,
                fontFamily: section.mono ? 'monospace' : undefined,
              }}
              numberOfLines={section.maxLines}
            >
              {section.content}
            </Text>
          </View>
        ))}

        {/* Caption (e.g. timestamp) */}
        {!!caption && (
          <Text style={{
            fontSize: 10,
            color: isDark ? '#475569' : '#cbd5e1',
            textAlign: 'right',
          }}>
            {caption}
          </Text>
        )}

      </View>
    </View>
  );
};

export default InfoCard;
