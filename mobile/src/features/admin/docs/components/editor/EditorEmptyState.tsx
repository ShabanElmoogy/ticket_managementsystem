import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  isDark: boolean;
  hasDoc: boolean;
}

const EditorEmptyState: React.FC<Props> = ({ isDark, hasDoc }) => (
  <View className="flex-1 items-center justify-center p-10">
    <View
      className="w-18 h-18 rounded-2xl items-center justify-center mb-4"
      style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}
    >
      <Text className="text-4xl">{hasDoc ? '✏️' : '📄'}</Text>
    </View>
    <Text
      className="text-lg font-bold text-center mb-2"
      style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
    >
      {hasDoc ? 'Document is empty' : 'No document selected'}
    </Text>
    <Text
      className="text-sm text-center leading-5"
      style={{ color: isDark ? '#64748b' : '#94a3b8' }}
    >
      {hasDoc
        ? 'Tap a block type below to start adding content'
        : 'Open the sidebar to select or create a document'}
    </Text>
  </View>
);

export default EditorEmptyState;
