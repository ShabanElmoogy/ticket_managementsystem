import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Clipboard } from 'react-native';
import Toast, { BaseToast, ErrorToast, type BaseToastProps } from 'react-native-toast-message';

// ── Toast item component ──────────────────────────────────────────────────────

interface ToastItemProps extends BaseToastProps {
  accentColor: string;
  icon:        string;
  showCopy?:   boolean;
}

const ToastItem: React.FC<ToastItemProps> = ({
  text1, text2, accentColor, icon, showCopy = false, onPress,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const content = [text1, text2].filter(Boolean).join('\n');
    Clipboard.setString(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable onPress={onPress} style={[styles.container, { borderLeftColor: accentColor }]}>
      {/* Left accent bar + icon */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {text1 ? (
          <Text style={styles.text1} numberOfLines={2}>{text1}</Text>
        ) : null}
        {text2 ? (
          <Text style={styles.text2} numberOfLines={2}>{text2}</Text>
        ) : null}
      </View>

      {/* Copy button — only on success */}
      {showCopy && (
        <Pressable onPress={handleCopy} style={styles.copyBtn} hitSlop={8}>
          <Text style={{ fontSize: 16 }}>{copied ? '✅' : '📋'}</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

// ── Toast config — pass to <Toast /> in root layout ───────────────────────────

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastItem
      {...props}
      accentColor="#10b981"
      icon="✅"
      showCopy
    />
  ),

  error: (props: BaseToastProps) => (
    <ToastItem
      {...props}
      accentColor="#ef4444"
      icon="❌"
      showCopy
    />
  ),

  info: (props: BaseToastProps) => (
    <ToastItem
      {...props}
      accentColor="#3b82f6"
      icon="ℹ️"
    />
  ),
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderLeftWidth: 5,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  text1: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  text2: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  copyBtn: {
    padding: 4,
  },
});
