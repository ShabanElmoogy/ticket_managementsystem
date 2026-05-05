import React from 'react';
import {
  Modal, View, Text, Pressable, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, useIsDark } from '@/src/constants/theme';
import PdfViewer from './PdfViewer';

interface Props {
  visible: boolean;
  url: string;
  name?: string;
  onClose: () => void;
}

const PdfFullscreenModal: React.FC<Props> = ({ visible, url, name, onClose }) => {
  const { width, height } = useWindowDimensions();
  const c      = useThemeColors();
  const isDark = useIsDark();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={c.surface.card} />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface.secondary }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: c.surface.card,
          borderBottomWidth: 1, borderBottomColor: c.border.primary,
        }}>
          <View style={{
            width: 34, height: 40, borderRadius: 6,
            backgroundColor: '#dc262618', borderWidth: 1.5, borderColor: '#dc262644',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18 }}>📄</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: c.text.primary }} numberOfLines={1}>
            {name || url.split('/').pop() || 'PDF Document'}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
              borderWidth: 1, borderColor: c.border.primary,
            })}
          >
            <Text style={{ fontSize: 16, color: c.text.muted }}>✕</Text>
          </Pressable>
        </View>

        {/* Full-screen PDF viewer */}
        <PdfViewer
          url={url}
          width={width}
          height={height - 80}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default PdfFullscreenModal;
