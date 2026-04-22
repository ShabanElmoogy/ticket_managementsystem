import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { AppTextInput } from '@/src/shared/components';

export interface ListEditorProps {
  title?:    string;
  items:     string[];
  isDark:    boolean;
  accentColor: string;
  /** Renders the left marker for each item (bullet circle or number badge) */
  renderMarker: (index: number) => React.ReactNode;
  /** Renders the "add" button's left marker (matches renderMarker style) */
  renderAddMarker: () => React.ReactNode;
  onTitleChange: (title: string) => void;
  onItemChange:  (index: number, value: string) => void;
  onAddItem:     (afterIndex?: number) => void;
  onRemoveItem:  (index: number) => void;
  /** Forwarded refs array so parent can focus inputs after add/remove */
  inputRefs: React.MutableRefObject<(TextInput | null)[]>;
}

/**
 * ListEditor — shared list editing UI used by BulletedListEditor and NumberedListEditor.
 *
 * - Title: AppTextInput (label, clear button, focus ring)
 * - Item rows: raw TextInput (intentionally borderless/minimal inline style)
 * - Marker appearance injected via renderMarker so bullet vs numbered styles
 *   stay in the feature-specific wrappers.
 */
const ListEditor: React.FC<ListEditorProps> = ({
  title, items, isDark, accentColor,
  renderMarker, renderAddMarker,
  onTitleChange, onItemChange, onAddItem, onRemoveItem,
  inputRefs,
}) => {
  const textColor        = isDark ? '#e2e8f0' : '#1e293b';
  const placeholderColor = isDark ? '#334155' : '#cbd5e1';

  return (
    <View style={{ gap: 6 }}>

      {/* Title — AppTextInput: gets focus ring, clear button, label */}
      <AppTextInput
        value={title ?? ''}
        onChangeText={onTitleChange}
        placeholder="List title (optional)…"
        showClearButton
        onClear={() => onTitleChange('')}
        containerStyle={{ marginBottom: 4 }}
      />

      {/* Item rows — raw TextInput: borderless, inline, minimal */}
      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

          {/* Left marker (bullet or number) */}
          {renderMarker(idx)}

          {/* Inline text input — no border, no label, no padding chrome */}
          <TextInput
            ref={(r) => { inputRefs.current[idx] = r; }}
            value={item}
            onChangeText={(v) => onItemChange(idx, v)}
            placeholder={`Item ${idx + 1}…`}
            placeholderTextColor={placeholderColor}
            onSubmitEditing={() => onAddItem(idx)}
            submitBehavior="blurAndSubmit"
            style={{
              flex: 1, fontSize: 14, lineHeight: 20,
              color: textColor,
              paddingVertical: 6,
            }}
          />

          {/* Remove button */}
          <Pressable
            onPress={() => onRemoveItem(idx)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 24, height: 24, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? '#fef2f2' : 'transparent',
            })}
          >
            <Text style={{ fontSize: 13, color: '#ef4444' }}>✕</Text>
          </Pressable>
        </View>
      ))}

      {/* Add item row */}
      <Pressable
        onPress={() => onAddItem()}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 8, paddingHorizontal: 4,
          borderRadius: 8, marginTop: 2,
          backgroundColor: pressed ? accentColor + '10' : 'transparent',
        })}
      >
        {renderAddMarker()}
        <Text style={{ fontSize: 13, color: accentColor, fontWeight: '600' }}>Add item</Text>
      </Pressable>

    </View>
  );
};

export default ListEditor;
