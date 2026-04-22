import React, { useRef } from 'react';
import { View, Text, TextInput } from 'react-native';
import ListEditor from './shared/ListEditor';
import type { NumberedListBlock } from '../../types/types';

interface Props {
  block:    NumberedListBlock;
  isDark:   boolean;
  onChange: (patch: Partial<NumberedListBlock>) => void;
}

const ACCENT = '#10b981';

const NumberedListEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const updateItem  = (idx: number, val: string) => {
    const items = [...block.items]; items[idx] = val; onChange({ items });
  };
  const addItem = (afterIdx?: number) => {
    const items    = [...block.items];
    const insertAt = afterIdx !== undefined ? afterIdx + 1 : items.length;
    items.splice(insertAt, 0, '');
    onChange({ items });
    setTimeout(() => inputRefs.current[insertAt]?.focus(), 50);
  };
  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return;
    onChange({ items: block.items.filter((_, i) => i !== idx) });
    setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 50);
  };

  // ── Number marker: rounded square badge with the item index ───────────────
  const renderMarker = (idx: number) => (
    <View style={{
      width: 26, height: 26, borderRadius: 8,
      backgroundColor: ACCENT + '20',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: ACCENT }}>{idx + 1}</Text>
    </View>
  );

  // ── Add-row marker: same badge with "+" ───────────────────────────────────
  const renderAddMarker = () => (
    <View style={{
      width: 26, height: 26, borderRadius: 8,
      backgroundColor: ACCENT + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 14, color: ACCENT, lineHeight: 16 }}>+</Text>
    </View>
  );

  return (
    <ListEditor
      title={block.title}
      items={block.items}
      isDark={isDark}
      accentColor={ACCENT}
      renderMarker={renderMarker}
      renderAddMarker={renderAddMarker}
      onTitleChange={(title) => onChange({ title })}
      onItemChange={updateItem}
      onAddItem={addItem}
      onRemoveItem={removeItem}
      inputRefs={inputRefs}
    />
  );
};

export default NumberedListEditor;
