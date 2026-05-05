import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

interface Props {
  visible: boolean;
  current?: string;
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Web equivalent: MUI Popover containing the emoji grid */
const IconPickerModal: React.FC<Props> = ({
  visible, current, onSelect, onClear, onClose,
}) => {
  const c = useThemeColors();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: c.surface.card,
            borderRadius: 12, padding: 16, width: 240,
            elevation: 12,
            shadowColor: c.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 12,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: c.text.primary, marginBottom: 10 }}>
            Choose folder icon
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {FOLDER_ICONS.map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => { onSelect(emoji); onClose(); }}
                style={{
                  width: 36, height: 36, margin: 2,
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, borderWidth: 2,
                  borderColor: current === emoji ? c.interactive.primary : 'transparent',
                  backgroundColor: c.surface.elevated,
                }}
              >
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {current ? (
            <Pressable
              onPress={() => { onClear(); onClose(); }}
              style={{ marginTop: 10, paddingVertical: 6, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, color: c.intent.error }}>Remove icon</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default IconPickerModal;
