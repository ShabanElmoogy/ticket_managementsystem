import React from 'react';
import { View, Text, Image } from 'react-native';
import type { ImageBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: ImageBlock; isDark: boolean; colors: PreviewColors; }

const PreviewImage: React.FC<Props> = ({ block, isDark, colors }) => (
  <View style={{ marginBottom: 12 }}>
    {block.url ? (
      <Image
        source={{ uri: block.url }}
        style={{ width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' }}
      />
    ) : (
      <View style={{
        height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      }}>
        <Text style={{ fontSize: 24 }}>🖼️</Text>
      </View>
    )}
    {block.caption ? (
      <Text style={{ fontSize: 12, color: colors.mutedColor, textAlign: 'center', marginTop: 4 }}>
        {block.caption}
      </Text>
    ) : null}
  </View>
);

export default PreviewImage;
