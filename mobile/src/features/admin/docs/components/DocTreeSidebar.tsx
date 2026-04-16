import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal,
} from 'react-native';
import type { TreeNode, FolderNode, DocRefNode, Doc } from '../types/types';
import { isFolder } from '../utils/treeUtils';

// ── Emoji icon picker ─────────────────────────────────────────────────────────

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

const IconPicker: React.FC<{
  visible: boolean;
  current?: string;
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
  isDark: boolean;
}> = ({ visible, current, onSelect, onClear, onClose, isDark }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
      onPress={onClose}
    >
      <Pressable
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderRadius: 12,
          padding: 16,
          width: 240,
        }}
        onPress={() => {}}
      >
        <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#e2e8f0' : '#111', marginBottom: 10 }}>
          Choose folder icon
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {FOLDER_ICONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => { onSelect(emoji); onClose(); }}
              style={{
                width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
                borderWidth: 2,
                borderColor: current === emoji ? '#3b82f6' : 'transparent',
                backgroundColor: isDark ? '#334155' : '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 18 }}>{emoji}</Text>
            </Pressable>
          ))}
        </View>
        {current && (
          <Pressable
            onPress={() => { onClear(); onClose(); }}
            style={{ marginTop: 10, alignItems: 'center', paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, color: '#ef4444' }}>Remove icon</Text>
          </Pressable>
        )}
      </Pressable>
    </Pressable>
  </Modal>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  tree: TreeNode[];
  docs: Doc[];
  currentDocId: string | null;
  selectedTreeId: string | null;
  expanded: Record<string, boolean>;
  isDark: boolean;
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

const TreeRow: React.FC<{
  node: TreeNode;
  depth: number;
  props: Props;
}> = ({ node, depth, props }) => {
  const { isDark, expanded, currentDocId, selectedTreeId } = props;
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(node.title);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isSelected = selectedTreeId === node.id;
  const isCurrentDoc = node.type === 'doc' && (node as DocRefNode).docId === currentDocId;
  const isExpanded = expanded[node.id];

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

  const bg = isCurrentDoc || isSelected
    ? (isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)')
    : hovered
    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
    : 'transparent';

  return (
    <View>
      <Pressable
        onPress={handlePress}
        onLongPress={() => { setRenaming(true); setRenameVal(node.title); setTimeout(() => inputRef.current?.focus(), 50); }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: 8 + depth * 16,
          paddingRight: 8,
          paddingVertical: 6,
          backgroundColor: bg,
          borderRadius: 6,
          marginHorizontal: 4,
          marginVertical: 1,
        }}
      >
        {/* Expand arrow for folders */}
        {node.type === 'folder' && (
          <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#9ca3af', width: 14, marginRight: 2 }}>
            {isExpanded ? '▼' : '▶'}
          </Text>
        )}

        {/* Icon */}
        <Pressable
          onPress={node.type === 'folder' ? () => setIconPickerOpen(true) : undefined}
          style={{ marginRight: 6 }}
        >
          <Text style={{ fontSize: 15 }}>
            {node.type === 'folder'
              ? ((node as FolderNode).icon ?? (isExpanded ? '📂' : '📁'))
              : '📄'}
          </Text>
        </Pressable>

        {/* Title or rename input */}
        {renaming ? (
          <TextInput
            ref={inputRef}
            value={renameVal}
            onChangeText={setRenameVal}
            onBlur={commitRename}
            onSubmitEditing={commitRename}
            style={{
              flex: 1,
              fontSize: 13,
              color: isDark ? '#e2e8f0' : '#111',
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
              borderRadius: 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
            autoFocus
          />
        ) : (
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 13,
              color: isCurrentDoc
                ? '#3b82f6'
                : isDark ? '#e2e8f0' : '#1e293b',
              fontWeight: isCurrentDoc ? '600' : '400',
            }}
          >
            {node.title}
          </Text>
        )}

        {/* Action buttons — shown on hover or always on mobile */}
        {!renaming && (
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {node.type === 'folder' && (
              <>
                <Pressable
                  onPress={() => props.onAddDoc(node.id)}
                  style={{ padding: 4, borderRadius: 4 }}
                  hitSlop={4}
                >
                  <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>📄+</Text>
                </Pressable>
                <Pressable
                  onPress={() => props.onAddFolder(node.id)}
                  style={{ padding: 4, borderRadius: 4 }}
                  hitSlop={4}
                >
                  <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>📁+</Text>
                </Pressable>
              </>
            )}
            {node.type === 'doc' && (
              <Pressable
                onPress={() => props.onDuplicateDoc((node as DocRefNode).docId)}
                style={{ padding: 4, borderRadius: 4 }}
                hitSlop={4}
              >
                <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>⧉</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => props.onDelete(node.id)}
              style={{ padding: 4, borderRadius: 4 }}
              hitSlop={4}
            >
              <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Folder icon picker */}
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#1e293b' : '#e2e8f0',
      }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Documents
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            onPress={() => props.onAddDoc(null)}
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
              backgroundColor: '#3b82f6',
            }}
          >
            <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>+ Doc</Text>
          </Pressable>
          <Pressable
            onPress={() => props.onAddFolder(null)}
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
              backgroundColor: isDark ? '#334155' : '#e2e8f0',
            }}
          >
            <Text style={{ fontSize: 11, color: isDark ? '#e2e8f0' : '#475569', fontWeight: '600' }}>+ Folder</Text>
          </Pressable>
        </View>
      </View>

      {/* Tree */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 4 }}>
        {tree.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: isDark ? '#475569' : '#9ca3af' }}>No documents yet</Text>
            <Text style={{ fontSize: 11, color: isDark ? '#334155' : '#cbd5e1', marginTop: 4 }}>
              Tap "+ Doc" to create one
            </Text>
          </View>
        ) : (
          tree.map((node) => (
            <TreeRow key={node.id} node={node} depth={0} props={props} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default DocTreeSidebar;
