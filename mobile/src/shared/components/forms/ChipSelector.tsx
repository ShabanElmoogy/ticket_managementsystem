import React from 'react';
import { View } from 'react-native';
import ChipTitle   from './ChipTitle';
import ChipRows    from './ChipRows';
import ChipTiles   from './ChipTiles';
import type { ChipOption } from './ChipOption';

export interface ChipSelectorProps<T extends string = string> {
  options:   ChipOption<T>[];
  value:     T | null;
  onChange:  (value: T) => void;
  label?:    string;
  disabled?: boolean;
  layout?:   'rows' | 'tiles';
}

function ChipSelector<T extends string = string>({
  options, value, onChange, label, disabled = false, layout = 'rows',
}: ChipSelectorProps<T>) {
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <ChipTitle title={label} />}
      {layout === 'tiles'
        ? <ChipTiles options={options} value={value} onChange={onChange} disabled={disabled} />
        : <ChipRows  options={options} value={value} onChange={onChange} disabled={disabled} />
      }
    </View>
  );
}

export default ChipSelector;
