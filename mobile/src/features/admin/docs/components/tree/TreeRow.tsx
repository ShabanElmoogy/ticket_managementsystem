import React, { useState, useRef } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import type { TreeNode, FolderNode, DocRefNode } from '../../types/types';
import type { TreeSidebarProps } from './types';
import { INDENT_PX } from './types';
import IconPickerModal from './IconPickerModal';
import IconBtn from './IconBtn';
import { useDirection } from '../../../../../providers/DirectionProvider';

interface Props {
  node: TreeNode;
  depth: number;
  p: TreeSidebarProps;
}

/**
 * Single tree row — mirrors web ListItem pattern:
 *  - position:relative wrapper so actions can be position:absolute right:4
 *  - paddingRight:52 on the Pressable reserves space so title never overlaps actions
 *  - Actions have sidebarBg background so they float cleanly over the title
 *  - Web: opacity:0 on actions, shows on hover → Mobile: always visible
 *  - Web: double-click to rename → Mobile: long-press
 *  - Web: borderBottom-only rename input → Mobile: same
 */
const TreeRow: React.FC<Props> = ({ node, depth, p }) => {
  const [renaming, setRenaming]     = useState(false);
  const [renameVal, setRenameVal]   = useState(node.title);
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { isRtl } = useDirection();   // ← reads from DirectionProvider, not I18nManager

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

  const isRTL = isRtl;

  // web: pl: 1.5 + depth*1.5 + 2.5 ≈ 12 + depth*12
  const rowPL = 12 + depth * INDENT_PX;

  return (
    <View>
      {/* position:relative so actions can be absolute-right */}
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={handlePress}
          onLongPress={startRename}
          style={({ pressed }) => ({
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            ...(isRTL
              ? { paddingEnd: rowPL, paddingStart: 82 }
              : { paddingStart: rowPL, paddingEnd: 82 }),
            paddingVertical: 5,
            marginHorizontal: 4,
            marginVertical: 1,
            borderRadius: 6,
            minHeight: 32,
            backgroundColor: pressed ? hoverBg : isCurrentDoc ? selectedBg : 'transparent',
          })}
        >
          {/* Folder icon — tappable to open emoji picker */}
          {isFolder && (
            <Pressable
              onPress={() => setPickerOpen(true)}
              hitSlop={4}
              style={{ marginEnd: 6, width: 30, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, lineHeight: 18 }}>
                {(node as FolderNode).icon ?? (isExpanded ? '📂' : '📁')}
              </Text>
            </Pressable>
          )}

          {/* Doc icon — web: DescriptionIcon 14px */}
          {isDoc && (
            <View style={{ marginEnd: 6, width: 30, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 13, lineHeight: 16, color: isCurrentDoc ? '#3b82f6' : textMuted }}>
                📄
              </Text>
            </View>
          )}

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
                flex: 1, fontSize: 12, lineHeight: 16,
                color: textMain,
                // web: borderBottom only, no box
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
                flex: 1, fontSize: 12, lineHeight: 16,
                fontWeight: isCurrentDoc ? '600' : isFolder ? '500' : '400',
                color: isCurrentDoc ? '#3b82f6' : textMain,
                paddingStart : 10
              }}
            >
              {node.title}
            </Text>
          )}

          {/* Folder chevron — end side, flips with RTL */}
          {isFolder && !renaming && (
            <Text style={{ fontSize: 10, color: textMuted, marginStart: 4, opacity: 0.6 }}>
              {isExpanded ? '▾' : (isRTL ? '◂' : '▸')}
            </Text>
          )}
        </Pressable>

        {/* Actions — absolute end side, flips with RTL */}
        {!renaming && (
          <View
            style={{
              position: 'absolute',
              ...(isRTL ? { left: 4 } : { right: 4 }),
              top: 0, bottom: 0,
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              backgroundColor: sidebarBg,
              borderRadius: 6,
              paddingHorizontal: 2,
            }}
          >
            {isFolder && (
              <IconBtn onPress={() => p.onAddDoc(node.id)} color={textMuted} hoverBg={hoverBg}>
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

            {/* Separator between copy/add and delete */}
            <View style={{
              width: 3, height: 16, marginHorizontal: 7,
              backgroundColor: p.isDark ? '#334155' : '#e2e8f0',
            }} />

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

      {/* Icon picker modal */}
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

      {/* Children — web: Collapse → plain conditional render */}
      {isFolder && isExpanded && (
        <View>
          {(node as FolderNode).children.length === 0 ? (
            // web: empty folder shows add-subfolder + add-doc + "Empty folder"
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingStart: rowPL + INDENT_PX,
                paddingVertical: 4,
                paddingEnd: 8,
              }}
            >
              <IconBtn onPress={() => p.onAddFolder(node.id)} color={textMuted} hoverBg={hoverBg}>
                📁
              </IconBtn>
              <IconBtn onPress={() => p.onAddDoc(node.id)} color={textMuted} hoverBg={hoverBg}>
                📄
              </IconBtn>
              <Text style={{ fontSize: 11, color: textMuted, fontStyle: 'italic', marginStart: 4 }}>
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

export default TreeRow;
