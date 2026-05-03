/**
 * useAlert — replaces native Alert.alert with AlertDialog.
 *
 * Usage:
 *   const { showAlert, AlertNode } = useAlert();
 *
 *   // Render AlertNode once at the bottom of your component
 *   return <View>...{AlertNode}</View>
 *
 *   // Trigger
 *   showAlert({ title: 'Error', message: 'Something went wrong', icon: '❌' });
 *   showAlert({
 *     title: 'Confirm', message: 'Delete?', icon: '⚠️', accentColor: '#ef4444',
 *     actions: [
 *       { label: 'Delete', onPress: handleDelete, variant: 'primary' },
 *       { label: 'Cancel', onPress: () => {}, variant: 'cancel' },
 *     ]
 *   });
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertDialog, type AlertDialogAction } from '@/src/shared/components/dialogs';

interface AlertOptions {
  title:        string;
  message?:     string;
  icon?:        string;
  accentColor?: string;
  actions?:     AlertDialogAction[];
}

// Delay before clearing opts after close — allows dialog close animation to finish
const CLEAR_OPTS_DELAY_MS = 300;

export function useAlert() {
  const { t } = useTranslation();
  const [opts,    setOpts]    = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((options: AlertOptions) => {
    // Cancel any pending clear so opts don't disappear mid-open
    if (clearTimer.current) clearTimeout(clearTimer.current);
    setOpts(options);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    // Clear opts after animation completes so content doesn't flash during close
    clearTimer.current = setTimeout(() => setOpts(null), CLEAR_OPTS_DELAY_MS);
  }, []);

  const AlertNode = useMemo(() => {
    if (!opts) return null;
    return (
      <AlertDialog
        visible={visible}
        onClose={close}
        title={opts.title}
        message={opts.message}
        icon={opts.icon ?? 'ℹ️'}
        accentColor={opts.accentColor}
        actions={opts.actions ?? [{ label: t('common.ok'), onPress: close, variant: 'primary' }]}
      />
    );
  }, [visible, opts, close, t]);

  return { showAlert, AlertNode };
}
