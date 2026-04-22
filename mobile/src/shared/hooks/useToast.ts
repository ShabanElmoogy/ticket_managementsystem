import Toast from 'react-native-toast-message';

/**
 * useToast — typed toast helpers for success, error, and info.
 *
 * Usage:
 *   const toast = useToast();
 *   toast.success('Saved!');
 *   toast.error('Something went wrong');
 *   toast.info('No changes to save');
 */
export function useToast() {
  return {
    success: (message: string, title?: string) =>
      Toast.show({
        type:           'success',
        text1:          title ?? message,
        text2:          title ? message : undefined,
        visibilityTime: 3000,
        position:       'bottom',
      }),

    error: (message: string, title?: string) =>
      Toast.show({
        type:           'error',
        text1:          title ?? message,
        text2:          title ? message : undefined,
        visibilityTime: 4000,
        position:       'bottom',
      }),

    info: (message: string, title?: string) =>
      Toast.show({
        type:           'info',
        text1:          title ?? message,
        text2:          title ? message : undefined,
        visibilityTime: 3000,
        position:       'bottom',
      }),

    hide: () => Toast.hide(),
  };
}
