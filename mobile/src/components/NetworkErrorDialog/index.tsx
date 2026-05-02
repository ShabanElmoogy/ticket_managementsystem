import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { networkEvents } from '@/src/services/api/networkEvents';
import { useThemeColors } from '@/src/constants/theme';
import { AlertDialog, DialogButton } from '@/src/shared/components';
import ErrorExtraBanner from './components/ErrorExtraBanner';
import SharePanel       from './components/SharePanel';
import ShareTrigger     from './components/ShareTrigger';
import { statusColor, statusIcon, statusLabel } from './utils';
import type { ErrorState } from './types';

const NetworkErrorDialog: React.FC = () => {
  const c           = useThemeColors();
  const { t }       = useTranslation();
  const [visible,       setVisible]       = useState(false);
  const [retrying,      setRetrying]      = useState(false);
  const [error,         setError]         = useState<ErrorState | null>(null);
  const [shareExpanded, setShareExpanded] = useState(false);

  // ── dismiss (OK — fully clears error state + notifies listeners) ─────────
  const dismiss = useCallback(() => {
    networkEvents.emitOkPress();
    setVisible(false);
    setRetrying(false);
    setError(null);
    setShareExpanded(false);
  }, []);

  // ── close (Cancel — hides dialog but keeps error state) ───────────────────
  const close = useCallback(() => {
    setVisible(false);
    setShareExpanded(false);
  }, []);

  // ── event listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubNetwork = networkEvents.onError((msg) => {
      setError((prev) => ({
        kind:      'network',
        title:     t('errors.network.message'),
        subtitle:  t('errors.network.message'),
        message:   msg,
        count:     prev?.kind === 'network' ? prev.count + 1 : 1,
        timestamp: new Date().toLocaleString(),
      }));
      setRetrying(false);
      setShareExpanded(false);
      setVisible(true);
    });

    const unsubApi = networkEvents.onApiError((status, message, details) => {
      setError({
        kind:      'api',
        title:     statusLabel(status),
        subtitle:  `HTTP ${status}`,
        message,
        status,
        details,
        count:     1,
        timestamp: new Date().toLocaleString(),
      });
      setRetrying(false);
      setShareExpanded(false);
      setVisible(true);
    });

    const unsubSuccess = networkEvents.onRetrySuccess((savedCount) => {
      setRetrying(true);
      setVisible(true);
      setTimeout(() => {
        dismiss();
        Toast.show({
          type:           'success',
          text1:          t('errors.actions.retry'),
          text2:          `${savedCount} pending request${savedCount > 1 ? 's' : ''} saved successfully`,
          visibilityTime: 3500,
          position:       'bottom',
        });
      }, 600);
    });

    return () => { unsubNetwork(); unsubApi(); unsubSuccess(); };
  }, [dismiss, t]);

  const accentColor = retrying ? '#10b981' : statusColor(error?.status);
  const icon        = retrying ? '🔄'      : statusIcon(error?.status);

  // ── extra slot: banner + share panel ──────────────────────────────────────
  const extra = (
    <>
      <ErrorExtraBanner error={error} retrying={retrying} />

      {shareExpanded && error && !retrying && (
        <SharePanel
          error={error}
          accentColor={accentColor}
          icon={icon}
          onClose={() => setShareExpanded(false)}
        />
      )}
    </>
  );

  // ── actions override: Share | OK | Cancel — one row ───────────────────────
  const actionsOverride = error && !retrying ? (
    <View style={{ flexDirection: 'row', width: '100%', gap: 10, alignItems: 'stretch' }}>

      {/* Share — left */}
      <ShareTrigger
        onPress={() => setShareExpanded((v) => !v)}
        style={{ flex: 1, backgroundColor: c.surface.secondary, borderWidth: 1.5, borderColor: c.border.secondary }}
        labelStyle={{ color: c.text.secondary }}
      />

      {/* OK + Cancel — right side */}
      <View style={{ flex: 2, flexDirection: 'row', gap: 8 }}>

        {/* OK — accent filled */}
        <DialogButton
          label={t('common.ok')}
          icon="check"
          onPress={dismiss}
          style={{ flex: 1, backgroundColor: accentColor }}
          labelStyle={{ color: '#ffffff' }}
        />

        {/* Cancel — subtle bordered */}
        <DialogButton
          label={t('common.cancel')}
          icon="close"
          onPress={close}
          style={{ flex: 1, backgroundColor: c.surface.secondary, borderWidth: 1.5, borderColor: c.border.secondary }}
          labelStyle={{ color: c.text.secondary }}
        />

      </View>
    </View>
  ) : undefined;

  return (
    <AlertDialog
      visible={visible}
      onClose={close}
      accentColor={accentColor}
      icon={icon}
      title={retrying ? t('errors.actions.retry') : (error?.title ?? t('errors.generic.title'))}
      subtitle={retrying ? undefined : error?.subtitle}
      message={retrying ? undefined : (error?.message ?? t('errors.unexpected.message'))}
      extra={extra}
      actions={retrying ? [] : undefined}
      actionsOverride={actionsOverride}
    />
  );
};

export default NetworkErrorDialog;
