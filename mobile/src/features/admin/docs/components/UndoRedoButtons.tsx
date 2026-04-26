import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useDocsStore } from '@/src/features/admin/docs/hooks/useDocsStore';

interface Props {
  isDark: boolean;
}

const UndoRedoButtons: React.FC<Props> = ({ isDark }) => {
  const undo    = useDocsStore((s) => s.undo);
  const redo    = useDocsStore((s) => s.redo);
  const canUndo = useDocsStore((s) => s.past.length > 0);
  const canRedo = useDocsStore((s) => s.future.length > 0);

  if (!canUndo && !canRedo) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>

      {/* Undo */}
      <Pressable
        onPress={undo}
        disabled={!canUndo}
        hitSlop={4}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 10,
          backgroundColor: !canUndo
            ? (isDark ? '#1e293b' : '#f1f5f9')
            : pressed
            ? '#1d4ed8'
            : '#3b82f6',
          opacity: canUndo ? 1 : 0.45,
        })}
      >
        <Text style={{
          fontSize: 17,
          lineHeight: 21,
          marginRight: 4,
          color: canUndo ? '#fff' : (isDark ? '#475569' : '#94a3b8'),
        }}>
          ↩
        </Text>
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: canUndo ? '#fff' : (isDark ? '#475569' : '#94a3b8'),
        }}>
          Undo
        </Text>
      </Pressable>

      {/* Redo */}
      <Pressable
        onPress={redo}
        disabled={!canRedo}
        hitSlop={4}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 10,
          backgroundColor: !canRedo
            ? (isDark ? '#1e293b' : '#f1f5f9')
            : pressed
            ? '#6d28d9'
            : '#8b5cf6',
          opacity: canRedo ? 1 : 0.45,
        })}
      >
        <Text style={{
          fontSize: 17,
          lineHeight: 21,
          marginRight: 4,
          color: canRedo ? '#fff' : (isDark ? '#475569' : '#94a3b8'),
        }}>
          ↪
        </Text>
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: canRedo ? '#fff' : (isDark ? '#475569' : '#94a3b8'),
        }}>
          Redo
        </Text>
      </Pressable>

    </View>
  );
};

export default UndoRedoButtons;
