import React from 'react';
import { View } from 'react-native';
import { RichEditor } from 'react-native-pell-rich-editor';
import type { TextBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props { block: TextBlock; colors: PreviewColors; }

/**
 * Renders the HTML content of a TextBlock using RichEditor in read-only mode.
 * This preserves bold, italic, links, lists etc. from the rich text editor.
 */
const PreviewText: React.FC<Props> = ({ block, colors }) => {
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
          contentCSSText: `
            font-size: 14px;
            line-height: 1.6;
            font-family: -apple-system, sans-serif;
            text-align: ${align};
            padding: 0;
            margin: 0;
          `,
        }}
        style={{ backgroundColor: 'transparent', minHeight: 24 }}
        useContainer={false}
        scrollEnabled={false}
      />
    </View>
  );
};

export default PreviewText;
