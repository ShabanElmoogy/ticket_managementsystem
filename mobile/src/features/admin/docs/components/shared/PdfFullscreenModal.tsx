import React from 'react';
import {
  Modal, View, Text, Pressable, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PdfViewer from './PdfViewer';

interface Props {
  visible: boolean;
  url: string;
  name?: string;
  isDark: boolean;
  onClose: () => void;
}

const PdfFullscreenModal: React.FC<Props> = ({ visible, url, name, isDark, onClose }) => {
  const { width, height } = useWindowDimensions();

  const bg      = isDark ? '#0f172a' : '#f8fafc';
  const headerBg = isDark ? '#1e293b' : '#fff';
  const border  = isDark ? '#334155' : '#e2e8f0';
  const text    = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={headerBg} />
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          backgroundColor: headerBg,
          borderBottomWidth: 1, borderBottomColor: border,
        }}>
          <View style={{
            width: 34, height: 40, borderRadius: 6,
            backgroundColor: '#dc262618', borderWidth: 1.5, borderColor: '#dc262644',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 18 }}>📄</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: text }} numberOfLines={1}>
            {name || url.split('/').pop() || 'PDF Document'}
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed
                ? (isDark ? '#334155' : '#f1f5f9')
                : (isDark ? '#1e293b' : '#f8fafc'),
              borderWidth: 1, borderColor: border,
            })}
          >
            <Text style={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b' }}>✕</Text>
          </Pressable>
        </View>

        {/* Full-screen PDF viewer */}
        <PdfViewer
          url={url}
          width={width}
          height={height - 80} // subtract header height
          isDark={isDark}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default PdfFullscreenModal;
