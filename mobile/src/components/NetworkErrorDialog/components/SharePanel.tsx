import React, { useRef, useState } from 'react';
import { View, Text } from 'react-native';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import { PanelCard, ActionRow } from '@/src/shared/components';
import { WA_GREEN, WA_GREEN_DARK, SUPPORT_WHATSAPP_NUMBER } from '../constants';
import { buildShareText, shareToWhatsApp } from '../utils';
import ErrorCard from './ErrorCard';
import type { ErrorState } from '../types';

interface Props {
  error:       ErrorState;
  accentColor: string;
  icon:        string;
  /** @deprecated — component reads theme internally */
  isDark?:     boolean;
  onClose:     () => void;
}

const SharePanel: React.FC<Props> = ({ error, accentColor, icon, onClose }) => {
  const cardRef = useRef<View>(null);
  const [sharingWA,  setSharingWA]  = useState(false);
  const [sharingImg, setSharingImg] = useState(false);
  const c      = useThemeColors();
  const isDark = useIsDark();

  const busy = sharingWA || sharingImg;

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
          <View style={{ padding: 20, backgroundColor: c.surface.secondary }}>
            <ErrorCard error={error} accentColor={accentColor} icon={icon} />
          </View>
        </ViewShot>
      </View>

      <PanelCard
        title="Share Error Report"
        titleIcon="📤"
        onClose={onClose}
      >
        {/* WhatsApp row */}
        <ActionRow
          badgeContent={<Text style={{ fontSize: 19 }}>💬</Text>}
          badgeColor={WA_GREEN}
          badgeGlow
          title={sharingWA ? 'Opening WhatsApp…' : 'Send to Support'}
          subtitle={SUPPORT_WHATSAPP_NUMBER}
          rightSlot={!sharingWA ? whatsAppBadge : undefined}
          pressedBg={c.intent.successSurface}
          onPress={handleWhatsAppShare}
          loading={sharingWA}
          disabled={busy}
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: c.border.primary, marginHorizontal: 14 }} />

        {/* Screenshot row */}
        <ActionRow
          badgeContent={<Text style={{ fontSize: 19 }}>🖼️</Text>}
          badgeColor={c.surface.elevated}
          title={sharingImg ? 'Capturing…' : 'Share Screenshot'}
          subtitle="Save or send to any app"
          rightSlot={<Text style={{ fontSize: 18, color: c.text.secondary }}>›</Text>}
          onPress={handleImageShare}
          loading={sharingImg}
          disabled={busy}
        />
      </PanelCard>
    </View>
  );
};

export default SharePanel;
