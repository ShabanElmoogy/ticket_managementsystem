import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
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
  isDark:   boolean;
  onChange: (patch: Partial<TextBlock>) => void;
}

// ── Web fallback — plain textarea, no window dependency ───────────────────────

const TextBlockEditorWeb: React.FC<Props> = ({ block, isDark, onChange }) => {
  const borderC = isDark ? '#334155' : '#e2e8f0';
  const editorBg = isDark ? '#0f172a' : '#fafafa';
  const textColor = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <View style={{ borderRadius: 10, borderWidth: 1.5, borderColor: borderC, minHeight: 120, backgroundColor: editorBg, padding: 12 }}>
      <Text style={{ color: textColor, fontSize: 13 }}>
        {block.html?.replace(/<[^>]+>/g, '') || 'Rich text editor not available on web.'}
      </Text>
    </View>
  );
};

// ── Native editor — lazy require to avoid window at module level ──────────────

const TextBlockEditorNative: React.FC<Props> = ({ block, isDark, onChange }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { RichEditor, RichToolbar, actions } = require('react-native-pell-rich-editor');

  const editorRef = useRef<any>(null);
  const align     = block.settings?.align ?? 'left';
  const color     = block.settings?.color ?? (isDark ? '#e2e8f0' : '#1e293b');

  const handleChange = useCallback((html: string) => {
    onChange({ html });
  }, [onChange]);

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    onChange({ settings: { ...block.settings, align: newAlign } });
    if (newAlign === 'left')   editorRef.current?.commandDOM('document.execCommand("justifyLeft")');
    if (newAlign === 'center') editorRef.current?.commandDOM('document.execCommand("justifyCenter")');
    if (newAlign === 'right')  editorRef.current?.commandDOM('document.execCommand("justifyRight")');
  };

  const handleColorChange = (c: string) => {
    onChange({ settings: { ...block.settings, color: c } });
    editorRef.current?.setForeColor(c);
  };

  const editorBg  = isDark ? '#0f172a' : '#fafafa';
  const borderC   = isDark ? '#334155' : '#e2e8f0';
  const toolbarBg = isDark ? '#1e293b' : '#f8fafc';
  const iconTint  = isDark ? '#94a3b8' : '#64748b';

  return (
    <View style={{ gap: 8 }}>
      {/* Formatting toolbar */}
      <View style={{ borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: borderC }}>
        <RichToolbar
          editor={editorRef}
          selectedIconTint="#3b82f6"
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
              style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: align === a.key ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc') }}
            >
              <Text style={{ fontSize: 13, color: align === a.key ? '#fff' : iconTint }}>{a.icon}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, flexDirection: 'row', alignItems: 'center' }}>
          {TEXT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => handleColorChange(c)}
              style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, borderWidth: 2.5, borderColor: color === c ? '#fff' : 'transparent' }}
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
            placeholderColor: isDark ? '#334155' : '#cbd5e1',
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
