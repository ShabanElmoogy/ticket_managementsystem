import React from 'react';
import {
  View, Text, Pressable, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
  StyleSheet, useWindowDimensions,
  type NativeSyntheticEvent, type TextInputFocusEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../../../shared/components';
import { useScrollToInput } from '../../../shared/hooks/useScrollToInput';
import { useUiStore } from '../../../stores/uiStore';

export interface AdminFormModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  children: React.ReactNode;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({
  open, title, onClose, onSubmit, submitting = false, children,
}) => {
  const { colorMode, direction } = useUiStore();
  const isDark = colorMode === 'dark';
  const isRtl  = direction === 'rtl';
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Scroll the focused input into view above the keyboard
  const { scrollRef, onInputFocus } = useScrollToInput();

  const maxSheetHeight = screenHeight * 0.85;

  /**
   * Inject onFocus into every AppTextInput / TextInput child.
   * Keeps form components clean — they don't need to know about scrolling.
   */
  const childrenWithScroll = injectFocusHandler(children, onInputFocus);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* KAV lifts the sheet above the keyboard */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View
            style={[
              styles.sheet,
              {
                maxHeight: maxSheetHeight,
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                direction: isRtl ? 'rtl' : 'ltr',
              },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            {/* Header — fixed, never scrolls */}
            <View style={[
              styles.header,
              { borderBottomColor: isDark ? '#334155' : '#f1f5f9' },
            ]}>
              <Text style={[styles.headerTitle, { color: isDark ? '#f1f5f9' : '#111827' }]}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: isDark ? '#334155' : '#f3f4f6' }]}
              >
                <Text style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: 16 }}>✕</Text>
              </Pressable>
            </View>

            {/* Scrollable content */}
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              scrollEventThrottle={16}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 32 },
              ]}
            >
              {childrenWithScroll}

              <AppButton
                variant="contained"
                color="primary"
                fullWidth
                loading={submitting}
                loadingText="Saving…"
                onPress={onSubmit}
                style={{ marginTop: 16 }}
              >
                Save
              </AppButton>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ── Inject onFocus into all input descendants ─────────────────────────────────

type FocusHandler = (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;

function injectFocusHandler(
  children: React.ReactNode,
  onFocus: FocusHandler,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const el   = child as React.ReactElement<any>;
    const name = (el.type as any)?.displayName ?? (el.type as any)?.name ?? '';

    // TextInput or any component that accepts onFocus + onChangeText (AppTextInput)
    const isInput =
      name === 'TextInput' ||
      name === 'AppTextInput' ||
      (el.props?.onChangeText !== undefined && el.props?.value !== undefined);

    if (isInput) {
      return React.cloneElement(el, {
        onFocus: (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
          onFocus(e);
          el.props.onFocus?.(e);
        },
      });
    }

    // Recurse into containers
    if (el.props?.children) {
      return React.cloneElement(el, {
        children: injectFocusHandler(el.props.children, onFocus),
      });
    }

    return child;
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
});

export default AdminFormModal;
