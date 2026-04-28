/**
 * useAlert — replaces native Alert.alert with AlertDialog.
 *
 * Usage:
 *   const { alert, AlertNode } = useAlert();
 *
 *   // In JSX — render AlertNode once at the bottom of your component
 *   return <View>...{AlertNode}</View>
 *
 *   // Trigger
 *   alert({ title: 'Error', message: 'Something went wrong', icon: '❌' });
 *   alert({ title: 'Confirm', message: 'Delete?', icon: '⚠️', accentColor: '#ef4444',
 *     actions: [
 *       { label: 'Delete', onPress: handleDelete, variant: 'primary' },
 *       { label: 'Cancel', onPress: () => {}, variant: 'cancel' },
 *     ]
 *   });
 */
import React, { useState, useCallback } from 'react';
import { AlertDialog, type AlertDialogAction } from '@/src/shared/components/dialogs';

interface AlertOptions {
  title:        string;
  message?:     string;
  icon?:        string;
  accentColor?: string;
  actions?:     AlertDialogAction[];
}

export function useAlert() {
  const [opts,    setOpts]    = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const alert = useCallback((options: AlertOptions) => {
    setOpts(options);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const AlertNode = (
    <AlertDialog
      visible={visible}
      onClose={close}
      title={opts?.title ?? ''}
      message={opts?.message}
      icon={opts?.icon ?? 'ℹ️'}
      accentColor={opts?.accentColor}
      actions={opts?.actions ?? [{ label: 'OK', onPress: close, variant: 'primary' }]}
    />
  );

  return { alert, AlertNode };
}
