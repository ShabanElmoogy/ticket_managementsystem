import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { PanelCard, ActionRow } from '@/src/shared/components';
import { WA_GREEN, WA_GREEN_DARK, SUPPORT_WHATSAPP_NUMBER } from '../constants';
import { buildShareText, shareToWhatsApp } from '../utils';
import ErrorCard from './ErrorCard';
import type { ErrorState } from '../types';

interface Props {
  error:       ErrorState;
  accentColor: string;
  icon:        string;
  isDark:      boolean;
  onClose:     () => void;
}

const SharePanel: React.FC<Props> = ({ error, accentColor, icon, isDark, onClose }) => {
  const cardRef = useRef<View>(null);
  const [sharingWA,  setSharingWA]  = useState(false);
  const [sharingImg, setSharingImg] = useState(false);

  const busy    = sharingWA || sharingImg;
  const border  = isDark ? '#334155' : '#e2e8f0';
  const textSec = isDark ? '#94a3b8' : '#64748b';

  // ── handlers ───────────────────────────────────────────────────────────────

  const handleWhatsAppShare = async () => {
    if (busy) return;
    setSharingWA(true);
    try {
      await shareToWhatsApp(SUPPORT_WHATSAPP_NUMBER, buildShareText(error));
      Toast.show({ type: 'success', text1: 'WhatsApp opened ✓', text2: 'Error report ready to send', position: 'bottom' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open WhatsApp', text2: 'Make sure WhatsApp is installed', position: 'bottom' });
    } finally {
      setSharingWA(false);
    }
  };

  const handleImageShare = async () => {
    if (busy) return;
    setSharingImg(true);
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Toast.show({ type: 'error', text1: 'Sharing not available on this device', position: 'bottom' });
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Error Report', UTI: 'public.png' });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not share screenshot', position: 'bottom' });
    } finally {
      setSharingImg(false);
    }
  };

  // ── right slot for WhatsApp row ────────────────────────────────────────────
  const whatsAppBadge = (
    <View style={{
      paddingHorizontal: 7, paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: WA_GREEN + '20',
      borderWidth: 1, borderColor: WA_GREEN + '50',
    }}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: WA_GREEN_DARK, letterSpacing: 0.3 }}>
        WhatsApp
      </Text>
    </View>
  );

  return (
    <View>
      {/* Off-screen capture target */}
      <View style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <ViewShot ref={cardRef as any} options={{ format: 'png', quality: 1 }}>
          <View style={{ padding: 20, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <ErrorCard error={error} accentColor={accentColor} icon={icon} isDark={isDark} />
          </View>
        </ViewShot>
      </View>

      <PanelCard
        title="Share Error Report"
        titleIcon="📤"
        onClose={onClose}
        isDark={isDark}
      >
        {/* WhatsApp row */}
        <ActionRow
          badgeContent={<Text style={{ fontSize: 19 }}>💬</Text>}
          badgeColor={WA_GREEN}
          badgeGlow
          title={sharingWA ? 'Opening WhatsApp…' : 'Send to Support'}
          subtitle={SUPPORT_WHATSAPP_NUMBER}
          rightSlot={!sharingWA ? whatsAppBadge : undefined}
          pressedBg={isDark ? '#0d2b1a' : '#f0fdf4'}
          onPress={handleWhatsAppShare}
          loading={sharingWA}
          disabled={busy}
          isDark={isDark}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: border, marginHorizontal: 14 }} />

        {/* Screenshot row */}
        <ActionRow
          badgeContent={<Text style={{ fontSize: 19 }}>🖼️</Text>}
          badgeColor={isDark ? '#334155' : '#e2e8f0'}
          title={sharingImg ? 'Capturing…' : 'Share Screenshot'}
          subtitle="Save or send to any app"
          rightSlot={<Text style={{ fontSize: 18, color: textSec }}>›</Text>}
          onPress={handleImageShare}
          loading={sharingImg}
          disabled={busy}
          isDark={isDark}
        />
      </PanelCard>
    </View>
  );
};

export default SharePanel;
