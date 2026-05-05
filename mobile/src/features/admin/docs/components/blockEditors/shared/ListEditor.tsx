import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { AppTextInput } from '@/src/shared/components';

export interface ListEditorProps {
  title?:    string;
  items:     string[];
  accentColor: string;
  renderMarker: (index: number) => React.ReactNode;
  renderAddMarker: () => React.ReactNode;
  onTitleChange: (title: string) => void;
  onItemChange:  (index: number, value: string) => void;
  onAddItem:     (afterIndex?: number) => void;
  onRemoveItem:  (index: number) => void;
  inputRefs: React.MutableRefObject<(TextInput | null)[]>;
}

const ListEditor: React.FC<ListEditorProps> = ({
  title, items, accentColor,
  renderMarker, renderAddMarker,
  onTitleChange, onItemChange, onAddItem, onRemoveItem,
  inputRefs,
}) => {
  const c = useThemeColors();

  return (
    <View style={{ gap: 6 }}>
      <AppTextInput
        value={title ?? ''}
        onChangeText={onTitleChange}
        placeholder="List title (optional)…"
        showClearButton
        onClear={() => onTitleChange('')}
        containerStyle={{ marginBottom: 4 }}
      />

      {items.map((item, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {renderMarker(idx)}
          <TextInput
            ref={(r) => { inputRefs.current[idx] = r; }}
            value={item}
            onChangeText={(v) => onItemChange(idx, v)}
            placeholder={`Item ${idx + 1}…`}
            placeholderTextColor={c.border.secondary}
            onSubmitEditing={() => onAddItem(idx)}
            submitBehavior="blurAndSubmit"
            style={{
              flex: 1, fontSize: 14, lineHeight: 20,
              color: c.text.primary,
              paddingVertical: 6,
            }}
          />
          <Pressable
            onPress={() => onRemoveItem(idx)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 24, height: 24, borderRadius: 12,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? c.intent.errorSurface : 'transparent',
            })}
          >
            <Text style={{ fontSize: 13, color: c.intent.error }}>✕</Text>
          </Pressable>
        </View>
      ))}

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
