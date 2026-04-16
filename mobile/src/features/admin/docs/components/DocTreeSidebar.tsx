import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import type { TreeNode, FolderNode, DocRefNode, Doc } from '../types/types';
import { isFolder } from '../utils/treeUtils';

// ── Emoji icon picker ─────────────────────────────────────────────────────────

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

const IconPicker: React.FC<{
  visible: boolean; current?: string;
  onSelect: (icon: string) => void; onClear: () => void;
  onClose: () => void; isDark: boolean;
}> = ({ visible, current, onSelect, onClear, onClose, isDark }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderRadius: 16, padding: 18, width: 260,
          shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
        }}
        onPress={() => {}}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 12 }}>
          Choose folder icon
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {FOLDER_ICONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => { onSelect(emoji); onClose(); }}
              style={({ pressed }) => ({
                width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, borderWidth: 2,
                borderColor: current === emoji ? '#3b82f6' : 'transparent',
                backgroundColor: pressed
                  ? '#3b82f620'
                  : current === emoji
                  ? '#3b82f610'
                  : isDark ? '#334155' : '#f1f5f9',
              })}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
        {current && (
          <Pressable
            onPress={() => { onClear(); onClose(); }}
            style={{
              marginTop: 12, alignItems: 'center', paddingVertical: 8,
              borderRadius: 8, backgroundColor: '#fef2f2',
            }}
          >
            <Text style={{ fontSize: 13, color: '#ef4444', fontWeight: '600' }}>Remove icon</Text>
          </Pressable>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tree: TreeNode[]; docs: Doc[];
  currentDocId: string | null; selectedTreeId: string | null;
  expanded: Record<string, boolean>; isDark: boolean;
  onSelectDoc: (docId: string, nodeId: string) => void;
  onSelectFolder: (nodeId: string) => void;
  onToggleExpand: (id: string) => void;
  onAddFolder: (parentId: string | null) => void;
  onAddDoc: (parentId: string | null) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSetFolderIcon: (id: string, icon: string) => void;
  onDuplicateDoc: (docId: string) => void;
}

// ── Tree node row ─────────────────────────────────────────────────────────────

const TreeRow: React.FC<{ node: TreeNode; depth: number; props: Props }> = ({ node, depth, props }) => {
  const { isDark, expanded, currentDocId, selectedTreeId } = props;
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.title);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isCurrentDoc = node.type === 'doc' && (node as DocRefNode).docId === currentDocId;
  const isSelected   = selectedTreeId === node.id;
  const isExpanded   = expanded[node.id];
  const isActive     = isCurrentDoc || isSelected;

  const handlePress = () => {
    if (node.type === 'doc') {
      props.onSelectDoc((node as DocRefNode).docId, node.id);
    } else {
      props.onSelectFolder(node.id);
      props.onToggleExpand(node.id);
    }
  };

  const commitRename = () => {
    if (renameVal.trim()) props.onRename(node.id, renameVal.trim());
    setRenaming(false);
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        onLongPress={() => {
          setRenaming(true);
          setRenameVal(node.title);
          setTimeout(() => inputRef.current?.focus(), 60);
        }}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center',
          paddingLeft: 10 + depth * 14,
          paddingRight: 6, paddingVertical: 7,
          marginHorizontal: 6, marginVertical: 1,
          borderRadius: 8,
          backgroundColor: isActive
            ? (isDark ? 'rgba(59,130,246,0.18)' : 'rgba(59,130,246,0.1)')
            : pressed
            ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')
            : 'transparent',
        })}
      >
        {/* Folder expand arrow */}
        {node.type === 'folder' ? (
          <Text style={{ fontSize: 9, color: isDark ? '#475569' : '#94a3b8', width: 12, marginRight: 3 }}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        ) : (
          <View style={{ width: 12, marginRight: 3 }} />
        )}

        {/* Icon */}
        <Pressable
          onPress={node.type === 'folder' ? () => setIconPickerOpen(true) : undefined}
          hitSlop={4}
          style={{ marginRight: 7 }}
        >
          <Text style={{ fontSize: 16 }}>
            {node.type === 'folder'
              ? ((node as FolderNode).icon ?? (isExpanded ? '📂' : '📁'))
              : '📄'}
          </Text>
        </Pressable>

        {/* Title / rename input */}
        {renaming ? (
          <TextInput
            ref={inputRef}
            value={renameVal}
            onChangeText={setRenameVal}
            onBlur={commitRename}
            onSubmitEditing={commitRename}
            autoFocus
            style={{
              flex: 1, fontSize: 13,
              color: isDark ? '#e2e8f0' : '#0f172a',
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
              borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1.5, borderColor: '#3b82f6',
            }}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={{
              flex: 1, fontSize: 13,
              color: isCurrentDoc ? '#3b82f6' : isDark ? '#e2e8f0' : '#1e293b',
              fontWeight: isCurrentDoc ? '600' : '400',
            }}
          >
            {node.title}
          </Text>
        )}

        {/* Action buttons */}
        {!renaming && (
          <View style={{ flexDirection: 'row', gap: 1, marginLeft: 2 }}>
            {node.type === 'folder' && (
              <>
                <Pressable
                  onPress={() => props.onAddDoc(node.id)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? '#3b82f620' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 13 }}>📄</Text>
                </Pressable>
                <Pressable
                  onPress={() => props.onAddFolder(node.id)}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: pressed ? '#3b82f620' : 'transparent',
                  })}
                >
                  <Text style={{ fontSize: 13 }}>📁</Text>
                </Pressable>
              </>
            )}
            {node.type === 'doc' && (
              <Pressable
                onPress={() => props.onDuplicateDoc((node as DocRefNode).docId)}
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: pressed ? '#3b82f620' : 'transparent',
                })}
              >
                <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#9ca3af' }}>⧉</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => props.onDelete(node.id)}
              hitSlop={6}
              style={({ pressed }) => ({
                width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? '#fef2f2' : 'transparent',
              })}
            >
              <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Icon picker */}
      {node.type === 'folder' && (
        <IconPicker
          visible={iconPickerOpen}
          current={(node as FolderNode).icon}
          onSelect={(icon) => props.onSetFolderIcon(node.id, icon)}
          onClear={() => props.onSetFolderIcon(node.id, '')}
          onClose={() => setIconPickerOpen(false)}
          isDark={isDark}
        />
      )}

      {/* Children */}
      {node.type === 'folder' && isExpanded && (
        <View>
          {(node as FolderNode).children.map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} props={props} />
          ))}
        </View>
      )}
    </View>
  );
};

// ── Main sidebar ──────────────────────────────────────────────────────────────

const DocTreeSidebar: React.FC<Props> = (props) => {
  const { isDark, tree } = props;

  return (
    <View style={{
      flex: 1,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      borderRightWidth: 1,
      borderRightColor: isDark ? '#1e293b' : '#e2e8f0',
    }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 12, paddingTop: 14, paddingBottom: 10,
        borderBottomWidth: 1, borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
      }}>
        <Text style={{
          fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
          letterSpacing: 0.6, color: isDark ? '#475569' : '#94a3b8',
          marginBottom: 10,
        }}>
          Documents
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            onPress={() => props.onAddDoc(null)}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 4, paddingVertical: 7, borderRadius: 8,
              backgroundColor: pressed ? '#2563eb' : '#3b82f6',
            })}
          >
            <Text style={{ fontSize: 14 }}>📄</Text>
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>New Doc</Text>
          </Pressable>
          <Pressable
            onPress={() => props.onAddFolder(null)}
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 4, paddingVertical: 7, borderRadius: 8,
              backgroundColor: pressed
                ? (isDark ? '#475569' : '#d1d5db')
                : (isDark ? '#334155' : '#e5e7eb'),
            })}
          >
            <Text style={{ fontSize: 14 }}>📁</Text>
            <Text style={{ fontSize: 12, color: isDark ? '#e2e8f0' : '#374151', fontWeight: '600' }}>Folder</Text>
          </Pressable>
        </View>
      </View>

      {/* Tree */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 6 }} showsVerticalScrollIndicator={false}>
        {tree.length === 0 ? (
          <View style={{ padding: 24, alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 32 }}>📭</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#475569' : '#94a3b8', textAlign: 'center' }}>
              No documents yet
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center', lineHeight: 18 }}>
              Tap "New Doc" above to create your first document
            </Text>
          </View>
        ) : (
          tree.map((node) => (
            <TreeRow key={node.id} node={node} depth={0} props={props} />
          ))
        )}
      </ScrollView>

      {/* Footer hint */}
      <View style={{
        paddingHorizontal: 12, paddingVertical: 8,
        borderTopWidth: 1, borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
      }}>
        <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1', textAlign: 'center' }}>
          Long-press to rename
        </Text>
      </View>
    </View>
  );
};

export default DocTreeSidebar;
