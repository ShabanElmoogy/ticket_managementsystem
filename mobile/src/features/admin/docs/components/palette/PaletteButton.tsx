import React from 'react';
import { Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { BlockType } from '../../types/types';
import type { BlockDef } from './blockTypes';
import IconBadge from './IconBadge';

interface Props {
  def: BlockDef;
  onAdd: (type: BlockType) => void;
  iconSize: number;
  labelFontSize: number;
  variant: 'horizontal' | 'vertical';
}

const PaletteButton: React.FC<Props> = ({
  def, onAdd, iconSize, labelFontSize, variant,
}) => {
  const { type, icon, label, color, isEmoji } = def;
  const c = useThemeColors();

  return (
    <Pressable
      onPress={() => onAdd(type)}
      style={({ pressed }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 10,
        backgroundColor: pressed ? color + '22' : c.surface.card,
        borderWidth: 1.5,
        borderColor: pressed ? color + '88' : c.border.primary,
        ...(variant === 'horizontal'
          ? { paddingHorizontal: 10, paddingVertical: 7, minWidth: 56 }
          : { paddingVertical: 8 }),
      })}
    >
      <IconBadge icon={icon} color={color} isEmoji={isEmoji} size={iconSize} />
      <Text style={{ fontSize: labelFontSize, fontWeight: '600', color: c.text.muted, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
};

export default PaletteButton;
