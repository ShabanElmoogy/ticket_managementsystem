import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useDocsStore } from '@/src/features/admin/docs/hooks/useDocsStore';
import { useThemeColors } from '@/src/constants/theme';

const UndoRedoButtons: React.FC = () => {
  const undo    = useDocsStore((s) => s.undo);
  const redo    = useDocsStore((s) => s.redo);
  const canUndo = useDocsStore((s) => s.past.length > 0);
  const canRedo = useDocsStore((s) => s.future.length > 0);
  const c       = useThemeColors();

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
            ? c.surface.elevated
            : pressed
            ? c.buttons.primary.pressed
            : c.buttons.primary.bg,
          opacity: canUndo ? 1 : 0.45,
        })}
      >
        <Text style={{
          fontSize: 17,
          lineHeight: 21,
          marginRight: 4,
          color: canUndo ? c.text.inverse : c.text.muted,
        }}>
          ↩
        </Text>
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: canUndo ? c.text.inverse : c.text.muted,
        }}>
          Undo
        </Text>
      </Pressable>

      {/* Redo — uses a distinct violet color to differentiate from Undo */}
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
            ? c.surface.elevated
            : pressed
            ? c.interactive.primaryPressed
            : c.interactive.primary,
          opacity: canRedo ? 1 : 0.45,
        })}
      >
        <Text style={{
          fontSize: 17,
          lineHeight: 21,
          marginRight: 4,
          color: canRedo ? c.text.inverse : c.text.muted,
        }}>
          ↪
        </Text>
        <Text style={{
          fontSize: 12,
          fontWeight: '700',
          color: canRedo ? c.text.inverse : c.text.muted,
        }}>
          Redo
        </Text>
      </Pressable>

    </View>
  );
};

export default UndoRedoButtons;
