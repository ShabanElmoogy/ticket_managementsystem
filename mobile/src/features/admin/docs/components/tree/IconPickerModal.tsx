import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

interface Props {
  visible: boolean;
  current?: string;
  isDark: boolean;
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Web equivalent: MUI Popover containing the emoji grid */
const IconPickerModal: React.FC<Props> = ({
  visible, current, isDark, onSelect, onClear, onClose,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
    >
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderRadius: 12, padding: 16, width: 240,
          elevation: 12,
          shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2, shadowRadius: 12,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 10 }}>
          Choose folder icon
        </Text>

        {/* web: flexWrap + gap:0.5 (4px) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {FOLDER_ICONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => { onSelect(emoji); onClose(); }}
              style={{
                width: 36, height: 36, margin: 2,
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 6, borderWidth: 2,
                borderColor: current === emoji ? '#3b82f6' : 'transparent',
                backgroundColor: isDark ? '#334155' : '#f1f5f9',
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
            <Text style={{ fontSize: 12, color: '#ef4444' }}>Remove icon</Text>
          </Pressable>
        ) : null}
      </Pressable>
    </Pressable>
  </Modal>
);

export default IconPickerModal;
