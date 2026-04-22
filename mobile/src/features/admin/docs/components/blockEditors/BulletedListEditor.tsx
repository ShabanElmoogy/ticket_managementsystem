import React, { useRef } from 'react';
import { View, TextInput } from 'react-native';
import ListEditor from './shared/ListEditor';
import type { BulletedListBlock } from '../../types/types';

interface Props {
  block:    BulletedListBlock;
  isDark:   boolean;
  onChange: (patch: Partial<BulletedListBlock>) => void;
}

const ACCENT = '#10b981';

const BulletedListEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
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

  // ── Bullet marker: small filled circle inside a tinted ring ───────────────
  const renderMarker = (_idx: number) => (
    <View style={{
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: ACCENT + '20',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT }} />
    </View>
  );

  // ── Add-row marker: same ring with a "+" ──────────────────────────────────
  const renderAddMarker = () => (
    <View style={{
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: ACCENT + '20',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ACCENT }} />
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

export default BulletedListEditor;
