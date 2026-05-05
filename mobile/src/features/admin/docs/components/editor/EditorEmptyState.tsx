import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

interface Props {
  hasDoc: boolean;
}

const EditorEmptyState: React.FC<Props> = ({ hasDoc }) => {
  const c = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        backgroundColor: c.surface.tertiary,
      }}>
        <Text style={{ fontSize: 36 }}>{hasDoc ? '✏️' : '📄'}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8, color: c.text.primary }}>
        {hasDoc ? 'Document is empty' : 'No document selected'}
      </Text>
      <Text style={{ fontSize: 14, textAlign: 'center', lineHeight: 20, color: c.text.muted }}>
        {hasDoc
          ? 'Tap a block type below to start adding content'
          : 'Open the sidebar to select or create a document'}
      </Text>
    </View>
  );
};

export default EditorEmptyState;
