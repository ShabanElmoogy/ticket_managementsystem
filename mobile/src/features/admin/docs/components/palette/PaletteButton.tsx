import React from 'react';
import { Text, Pressable } from 'react-native';
import type { BlockType } from '../../types/types';
import type { BlockDef } from './blockTypes';
import IconBadge from './IconBadge';

interface Props {
  def: BlockDef;
  onAdd: (type: BlockType) => void;
  btnBg: string;
  btnBorder: string;
  labelColor: string;
  iconSize: number;
  labelFontSize: number;
  /** horizontal: fixed minWidth + horizontal padding; vertical: full width */
  variant: 'horizontal' | 'vertical';
}

/**
 * Single block type button — used in both horizontal strip and vertical sidebar.
 */
const PaletteButton: React.FC<Props> = ({
  def, onAdd, btnBg, btnBorder, labelColor, iconSize, labelFontSize, variant,
}) => {
  const { type, icon, label, color, isEmoji } = def;

  return (
    <Pressable
      onPress={() => onAdd(type)}
      style={({ pressed }) => ({
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: 10,
        backgroundColor: pressed ? color + '22' : btnBg,
        borderWidth: 1.5,
        borderColor: pressed ? color + '88' : btnBorder,
        ...(variant === 'horizontal'
          ? { paddingHorizontal: 10, paddingVertical: 7, minWidth: 56 }
          : { paddingVertical: 8 }),
      })}
    >
      <IconBadge icon={icon} color={color} isEmoji={isEmoji} size={iconSize} />
      <Text style={{ fontSize: labelFontSize, fontWeight: '600', color: labelColor, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
};

export default PaletteButton;
