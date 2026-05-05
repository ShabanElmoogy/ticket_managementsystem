import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { TextBlock } from '../../types/types';

const ALIGNS: Array<{ key: 'left' | 'center' | 'right'; icon: string }> = [
  { key: 'left',   icon: '⬅' },
  { key: 'center', icon: '↔' },
  { key: 'right',  icon: '➡' },
];

const TEXT_COLORS = [
  '#1e293b', '#1e40af', '#7c3aed', '#be185d',
  '#065f46', '#b45309', '#ef4444', '#64748b',
];

interface Props {
  block:    TextBlock;
  onChange: (patch: Partial<TextBlock>) => void;
}

// ── Web fallback ──────────────────────────────────────────────────────────────

const TextBlockEditorWeb: React.FC<Props> = ({ block, onChange }) => {
  const c = useThemeColors();
  return (
    <View style={{ borderRadius: 10, borderWidth: 1.5, borderColor: c.border.primary, minHeight: 120, backgroundColor: c.surface.secondary, padding: 12 }}>
      <Text style={{ color: c.text.primary, fontSize: 13 }}>
        {block.html?.replace(/<[^>]+>/g, '') || 'Rich text editor not available on web.'}
      </Text>
    </View>
  );
};

// ── Native editor ─────────────────────────────────────────────────────────────

const TextBlockEditorNative: React.FC<Props> = ({ block, onChange }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RichEditor, RichToolbar, actions } = require('react-native-pell-rich-editor');
  const c = useThemeColors();

  const editorRef = useRef<any>(null);
  const align     = block.settings?.align ?? 'left';
  const color     = block.settings?.color ?? c.text.primary;

  const handleChange = useCallback((html: string) => {
    onChange({ html });
  }, [onChange]);

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    onChange({ settings: { ...block.settings, align: newAlign } });
    if (newAlign === 'left')   editorRef.current?.commandDOM('document.execCommand("justifyLeft")');
    if (newAlign === 'center') editorRef.current?.commandDOM('document.execCommand("justifyCenter")');
    if (newAlign === 'right')  editorRef.current?.commandDOM('document.execCommand("justifyRight")');
  };

  const handleColorChange = (col: string) => {
    onChange({ settings: { ...block.settings, color: col } });
    editorRef.current?.setForeColor(col);
  };

  const editorBg  = c.surface.secondary;
  const borderC   = c.border.primary;
  const toolbarBg = c.surface.tertiary;
  const iconTint  = c.text.muted;

  return (
    <View style={{ gap: 8 }}>
      {/* Formatting toolbar */}
      <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: borderC }}>
        <RichToolbar
          editor={editorRef}
          selectedIconTint={c.interactive.primary}
          iconTint={iconTint}
          style={{ backgroundColor: toolbarBg, height: 44 }}
          actions={[
            actions.setBold, actions.setItalic, actions.setUnderline,
            actions.setStrikethrough, actions.insertBulletsList,
            actions.insertOrderedList, actions.insertLink,
            actions.undo, actions.redo,
          ]}
        />
      </View>

      {/* Alignment + color row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: borderC }}>
          {ALIGNS.map((a) => (
            <Pressable
              key={a.key}
              onPress={() => handleAlignChange(a.key)}
              style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: align === a.key ? c.interactive.primary : c.surface.tertiary }}
            >
              <Text style={{ fontSize: 13, color: align === a.key ? c.text.inverse : iconTint }}>{a.icon}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row', alignItems: 'center' }}>
          {TEXT_COLORS.map((col) => (
            <Pressable
              key={col}
              onPress={() => handleColorChange(col)}
              style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: col, borderWidth: 2.5, borderColor: color === col ? '#fff' : 'transparent' }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Rich text editor */}
      <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: borderC, minHeight: 120 }}>
        <RichEditor
          ref={editorRef}
          initialContentHTML={block.html}
          onChange={handleChange}
          placeholder="Start typing your paragraph…"
          editorStyle={{
            backgroundColor: editorBg, color,
            placeholderColor: c.border.secondary,
            contentCSSText: `font-size:15px;line-height:1.6;font-family:-apple-system,sans-serif;text-align:${align};padding:12px;min-height:80px;`,
          }}
          style={{ backgroundColor: editorBg, minHeight: 120 }}
          useContainer={false}
          autoCapitalize="sentences"
          autoCorrect
        />
      </View>
    </View>
  );
};

// ── Export — web gets fallback, native gets full editor ───────────────────────

const TextBlockEditor: React.FC<Props> = (props) =>
  Platform.OS === 'web'
    ? <TextBlockEditorWeb {...props} />
    : <TextBlockEditorNative {...props} />;

export default TextBlockEditor;
