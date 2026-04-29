import React from 'react';
import { View, Text, Platform } from 'react-native';
import type { TextBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: TextBlock; colors: PreviewColors; }

// ── Web fallback — strip HTML tags, render plain text ─────────────────────────

const PreviewTextWeb: React.FC<Props> = ({ block, colors }) => {
  const color = block.settings?.color ?? colors.textColor;
  const plain = block.html?.replace(/<[^>]+>/g, '') ?? '';
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 14, lineHeight: 22, color }}>{plain}</Text>
    </View>
  );
};

// ── Native — RichEditor preserves bold/italic/links/lists ─────────────────────

const PreviewTextNative: React.FC<Props> = ({ block, colors }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RichEditor } = require('react-native-pell-rich-editor');
  const color = block.settings?.color ?? colors.textColor;
  const align = block.settings?.align ?? 'left';

  return (
    <View style={{ marginBottom: 8 }}>
      <RichEditor
        initialContentHTML={block.html}
        disabled
        editorStyle={{
          backgroundColor: 'transparent',
          color,
          contentCSSText: `font-size:14px;line-height:1.6;font-family:-apple-system,sans-serif;text-align:${align};padding:0;margin:0;`,
        }}
        style={{ backgroundColor: 'transparent', minHeight: 24 }}
        useContainer={false}
        scrollEnabled={false}
      />
    </View>
  );
};

const PreviewText: React.FC<Props> = (props) =>
  Platform.OS === 'web'
    ? <PreviewTextWeb {...props} />
    : <PreviewTextNative {...props} />;

export default PreviewText;
