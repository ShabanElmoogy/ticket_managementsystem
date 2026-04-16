/**
 * DocTreeSidebar — React Native replica of web/src/components/admin/docs/components/DocTreeSidebar.tsx
 *
 * Web → Mobile mapping:
 *  - MUI Box/List/ListItem/ListItemButton  → View / Pressable
 *  - MUI IconButton (small, p:0.25)        → 24×24 Pressable
 *  - Hover opacity trick (.tree-actions)   → actions always visible (no hover on mobile)
 *  - Actions float absolute-right with sidebarBg → same with position:'absolute', right:4
 *  - paddingRight:48 on row reserves space for actions → same
 *  - Double-click to rename                → long-press to rename
 *  - Collapse animation                    → plain conditional render (no animation needed)
 *  - Popover for icon picker               → Modal (fade)
 *  - depth * 1.5 * 8px = 12px per level   → depth * 12
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, TextInput, Modal,
} from 'react-native';
import type { TreeNode, FolderNode, DocRefNode, Doc } from '../types/types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const INDENT_PX = 12; // matches web: depth * 1.5 * 8px

const FOLDER_ICONS = [
  '📁','📂','📚','📖','📝','📋','📌','📎','🗂️','🗃️',
  '💼','🎯','🚀','⭐','🔥','💡','🔧','🎨','🌐','🏠',
  '🔒','🔓','📊','📈','🎓','🏆','💎','🌟','⚡','🎪',
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Icon picker modal  (web uses MUI Popover — we use Modal)
// ─────────────────────────────────────────────────────────────────────────────

const IconPickerModal: React.FC<{
  visible: boolean;
  current?: string;
  isDark: boolean;
  onSelect: (icon: string) => void;
  onClear: () => void;
  onClose: () => void;
}> = ({ visible, current, isDark, onSelect, onClear, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
    >
      <Pressable
        onPress={() => {}}
        style={{
          backgroundColor: isDark ? '#1e293b' : '#fff',
          borderRadius: 12,
          padding: 16,
          width: 240,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: 10 }}>
          Choose folder icon
        </Text>
        {/* Grid — web uses flexWrap + gap:0.5 (4px) */}
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

// ─────────────────────────────────────────────────────────────────────────────
// Small icon button  (web: MUI IconButton size="small" sx={{ p: 0.25 }})
// ─────────────────────────────────────────────────────────────────────────────

const IconBtn: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
  color?: string;
  hoverBg?: string;
}> = ({ onPress, children, color, hoverBg = 'rgba(0,0,0,0.06)' }) => (
  <Pressable
    onPress={onPress}
    hitSlop={6}
    style={({ pressed }) => ({
      width: 24, height: 24,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: pressed ? hoverBg : 'transparent',
    })}
  >
    <Text style={{ fontSize: 13, color: color ?? '#64748b', lineHeight: 16 }}>
      {children}
    </Text>
  </Pressable>
);

// ─────────────────────────────────────────────────────────────────────────────
// Tree row  (recursive)
// ─────────────────────────────────────────────────────────────────────────────

const TreeRow: React.FC<{ node: TreeNode; depth: number; p: Props }> = ({ node, depth, p }) => {
  const [renaming, setRenaming]     = useState(false);
  const [renameVal, setRenameVal]   = useState(node.title);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isDoc        = node.type === 'doc';
  const isFolder     = node.type === 'folder';
  const isCurrentDoc = isDoc && (node as DocRefNode).docId === p.currentDocId;
  const isExpanded   = !!p.expanded[node.id];

  // ── Colors ────────────────────────────────────────────────────────────────
  const sidebarBg  = p.isDark ? '#0f172a' : '#f8fafc';
  const hoverBg    = p.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const selectedBg = p.isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)';
  const textMuted  = p.isDark ? '#64748b' : '#94a3b8';
  const textMain   = p.isDark ? '#e2e8f0' : '#1e293b';

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePress = () => {
    if (isDoc) {
      p.onSelectDoc((node as DocRefNode).docId, node.id);
    } else {
      p.onSelectFolder(node.id);
      p.onToggleExpand(node.id);
    }
  };

  const startRename = () => {
    setRenameVal(node.title);
    setRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  const commitRename = () => {
    const v = renameVal.trim();
    if (v && v !== node.title) p.onRename(node.id, v);
    setRenaming(false);
  };

  // ── Row left padding (web: pl: 1.5 + depth*1.5 + 2.5 = 12 + depth*12) ───
  const rowPL = 12 + depth * INDENT_PX;

  return (
    <View>
      {/* ── Row ─────────────────────────────────────────────────────────── */}
      {/*
       * Web: position:relative, overflow:hidden
       * paddingRight:48 reserves space so title never overlaps action buttons
       * Actions are position:absolute right:4 with sidebarBg background
       */}
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={handlePress}
          onLongPress={startRename}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingLeft: rowPL,
            paddingRight: 52,   // reserve space for action buttons
            paddingVertical: 5,
            marginHorizontal: 4,
            marginVertical: 1,
            borderRadius: 6,
            minHeight: 32,
            backgroundColor: pressed
              ? hoverBg
              : isCurrentDoc
              ? selectedBg
              : 'transparent',
          })}
        >
          {/* ── Folder icon (absolute in web, inline here) ── */}
          {isFolder && (
            <Pressable
              onPress={() => setPickerOpen(true)}
              hitSlop={4}
              style={{ marginRight: 6, width: 18, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, lineHeight: 18 }}>
                {(node as FolderNode).icon ?? (isExpanded ? '📂' : '📁')}
              </Text>
            </Pressable>
          )}

          {/* ── Doc icon (web: DescriptionIcon, 14px) ── */}
          {isDoc && (
            <View style={{ marginRight: 6, width: 18, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, lineHeight: 16, color: isCurrentDoc ? '#3b82f6' : textMuted }}>
                📄
              </Text>
            </View>
          )}

          {/* ── Title / rename input ── */}
          {renaming ? (
            <TextInput
              ref={inputRef}
              value={renameVal}
              onChangeText={setRenameVal}
              onBlur={commitRename}
              onSubmitEditing={commitRename}
              autoFocus
              style={{
                flex: 1,
                fontSize: 12,
                lineHeight: 16,
                color: textMain,
                // web: borderBottom only, no box border
                borderBottomWidth: 1.5,
                borderBottomColor: '#3b82f6',
                paddingVertical: 1,
                paddingHorizontal: 0,
              }}
            />
          ) : (
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                flex: 1,
                fontSize: 12,
                lineHeight: 16,
                fontWeight: isCurrentDoc ? '600' : isFolder ? '500' : '400',
                color: isCurrentDoc ? '#3b82f6' : textMain,
              }}
            >
              {node.title}
            </Text>
          )}

          {/* ── Folder chevron (right side, like web's ExpandMore/Less) ── */}
          {isFolder && !renaming && (
            <Text style={{ fontSize: 10, color: textMuted, marginLeft: 4, opacity: 0.6 }}>
              {isExpanded ? '▾' : '▸'}
            </Text>
          )}
        </Pressable>

        {/* ── Action buttons — absolute right, always visible on mobile ──
         *  Web: opacity:0, shows on hover (.tree-actions)
         *  Mobile: always shown since there's no hover
         *  bgcolor: sidebarBg so they float cleanly over the title
         */}
        {!renaming && (
          <View
            style={{
              position: 'absolute',
              right: 4,
              top: 0,
              bottom: 0,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: sidebarBg,
              borderRadius: 4,
              paddingHorizontal: 1,
            }}
          >
            {isFolder && (
              <IconBtn
                onPress={() => p.onAddDoc(node.id)}
                color={textMuted}
                hoverBg={hoverBg}
              >
                +
              </IconBtn>
            )}
            {isDoc && (
              <IconBtn
                onPress={() => p.onDuplicateDoc((node as DocRefNode).docId)}
                color={textMuted}
                hoverBg={hoverBg}
              >
                ⧉
              </IconBtn>
            )}
            <IconBtn
              onPress={() => p.onDelete(node.id)}
              color="#ef4444"
              hoverBg={p.isDark ? '#3b1515' : '#fee2e2'}
            >
              ✕
            </IconBtn>
          </View>
        )}
      </View>

      {/* ── Icon picker modal ─────────────────────────────────────────────── */}
      {isFolder && (
        <IconPickerModal
          visible={pickerOpen}
          current={(node as FolderNode).icon}
          isDark={p.isDark}
          onSelect={(icon) => p.onSetFolderIcon(node.id, icon)}
          onClear={() => p.onSetFolderIcon(node.id, '')}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* ── Children (web: Collapse → plain conditional render) ─────────── */}
      {isFolder && isExpanded && (
        <View>
          {(node as FolderNode).children.length === 0 ? (
            /* Web: empty folder shows add-subfolder + add-doc + "Empty folder" */
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingLeft: rowPL + INDENT_PX,
                paddingVertical: 4,
                paddingRight: 8,
              }}
            >
              <IconBtn onPress={() => p.onAddFolder(node.id)} color={textMuted} hoverBg={hoverBg}>
                📁
              </IconBtn>
              <IconBtn onPress={() => p.onAddDoc(node.id)} color={textMuted} hoverBg={hoverBg}>
                📄
              </IconBtn>
              <Text style={{ fontSize: 11, color: textMuted, fontStyle: 'italic', marginLeft: 4 }}>
                Empty folder
              </Text>
            </View>
          ) : (
            (node as FolderNode).children.map((child) => (
              <TreeRow key={child.id} node={child} depth={depth + 1} p={p} />
            ))
          )}
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────

const DocTreeSidebar: React.FC<Props> = (props) => {
  const { isDark, tree } = props;

  const sidebarBg  = isDark ? '#0f172a' : '#f8fafc';
  const borderC    = isDark ? '#1e293b' : '#e2e8f0';
  const textMuted  = isDark ? '#64748b' : '#94a3b8';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <View style={{ flex: 1, backgroundColor: sidebarBg, borderRightWidth: 1, borderRightColor: borderC }}>

      {/* ── Header (web: px:1.5 py:1.25 + NotesIcon + label + 2 icon buttons) ── */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: borderC,
      }}>
        {/* NotesIcon equivalent */}
        <Text style={{ fontSize: 13, color: textMuted, marginRight: 6 }}>📝</Text>

        {/* "DOCUMENTS" label */}
        <Text style={{
          flex: 1,
          fontSize: 10, fontWeight: '700',
          textTransform: 'uppercase', letterSpacing: 0.5,
          color: textMuted,
        }}>
          Documents
        </Text>

        {/* New folder button (web: CreateNewFolderIcon) */}
        <Pressable
          onPress={() => props.onAddFolder(null)}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 26, height: 26, borderRadius: 4,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? hoverBg : 'transparent',
            marginRight: 2,
          })}
        >
          <Text style={{ fontSize: 14, color: textMuted }}>📁</Text>
        </Pressable>

        {/* New doc button (web: AddIcon) */}
        <Pressable
          onPress={() => props.onAddDoc(null)}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 26, height: 26, borderRadius: 4,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? hoverBg : 'transparent',
          })}
        >
          <Text style={{ fontSize: 18, color: textMuted, lineHeight: 22 }}>+</Text>
        </Pressable>
      </View>

      {/* ── Tree list ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 4 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tree.length === 0 ? (
          /* Web: "No documents yet" + outlined New Doc button */
          <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
              No documents yet
            </Text>
            <Pressable
              onPress={() => props.onAddDoc(null)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 6, borderWidth: 1,
                borderColor: pressed ? '#2563eb' : '#3b82f6',
                backgroundColor: pressed ? '#eff6ff' : 'transparent',
              })}
            >
              <Text style={{ fontSize: 13, color: '#3b82f6', marginRight: 4 }}>+</Text>
              <Text style={{ fontSize: 12, color: '#3b82f6', fontWeight: '600' }}>New Doc</Text>
            </Pressable>
          </View>
        ) : (
          tree.map((node) => (
            <TreeRow key={node.id} node={node} depth={0} p={props} />
          ))
        )}
      </ScrollView>

      {/* Footer hint */}
      <View style={{ paddingVertical: 6, alignItems: 'center', borderTopWidth: 1, borderTopColor: borderC }}>
        <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1' }}>
          Long-press to rename
        </Text>
      </View>
    </View>
  );
};

export default DocTreeSidebar;
