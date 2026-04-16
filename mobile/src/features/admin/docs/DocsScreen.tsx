import React, { useEffect, useState } from 'react';
import {
  View, Text, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { useUiStore } from '../../../stores/uiStore';
import { useDocsStore, useCurrentDoc } from './hooks/useDocsStore';
import DocTreeSidebar from './components/DocTreeSidebar';
import DocEditor from './components/DocEditor';
import DocPreview from './components/DocPreview';
import BlockPalette from './components/BlockPalette';

// ── Save status indicator ─────────────────────────────────────────────────────

const SaveIndicator: React.FC<{ status: string; isDark: boolean }> = ({ status, isDark }) => {
  if (status === 'idle') return null;
  const cfg = {
    saving: { text: 'Saving…', color: '#f59e0b' },
    saved:  { text: '✓ Saved',  color: '#10b981' },
    error:  { text: '✗ Error',  color: '#ef4444' },
  }[status] ?? { text: '', color: '' };

  return (
    <Text style={{ fontSize: 12, color: cfg.color, fontWeight: '600' }}>{cfg.text}</Text>
  );
};

// ── Inline title editor ───────────────────────────────────────────────────────

const TitleEditor: React.FC<{
  title: string;
  isDark: boolean;
  onRename: (t: string) => void;
}> = ({ title, isDark, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(title);

  useEffect(() => { setVal(title); }, [title]);

  if (editing) {
    return (
      <TextInput
        value={val}
        onChangeText={setVal}
        onBlur={() => { onRename(val.trim() || 'Untitled'); setEditing(false); }}
        onSubmitEditing={() => { onRename(val.trim() || 'Untitled'); setEditing(false); }}
        autoFocus
        style={{
          flex: 1, fontSize: 15, fontWeight: '700',
          color: isDark ? '#f1f5f9' : '#0f172a',
          backgroundColor: isDark ? '#334155' : '#f1f5f9',
          borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
        }}
      />
    );
  }

  return (
    <Pressable onPress={() => setEditing(true)} style={{ flex: 1 }}>
      <Text numberOfLines={1} style={{
        fontSize: 15, fontWeight: '700',
        color: isDark ? '#f1f5f9' : '#0f172a',
      }}>
        {title}
      </Text>
    </Pressable>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const DocsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Granular store selectors (avoid whole-store subscription) ──────────────
  const tree           = useDocsStore((s) => s.tree);
  const docs           = useDocsStore((s) => s.docs);
  const currentDocId   = useDocsStore((s) => s.currentDocId);
  const selectedTreeId = useDocsStore((s) => s.selectedTreeId);
  const expanded       = useDocsStore((s) => s.expanded);
  const preview        = useDocsStore((s) => s.preview);
  const saveStatus     = useDocsStore((s) => s.saveStatus);

  const loadAll            = useDocsStore((s) => s.loadAll);
  const setCurrentDocId    = useDocsStore((s) => s.setCurrentDocId);
  const setSelectedTreeId  = useDocsStore((s) => s.setSelectedTreeId);
  const setPreview         = useDocsStore((s) => s.setPreview);
  const addBlock           = useDocsStore((s) => s.addBlock);
  const insertBlock        = useDocsStore((s) => s.insertBlock);
  const updateBlock        = useDocsStore((s) => s.updateBlock);
  const removeBlock        = useDocsStore((s) => s.removeBlock);
  const duplicateBlock     = useDocsStore((s) => s.duplicateBlock);
  const moveBlock          = useDocsStore((s) => s.moveBlock);
  const toggleExpand       = useDocsStore((s) => s.toggleExpand);
  const addFolder          = useDocsStore((s) => s.addFolder);
  const addDocUnder        = useDocsStore((s) => s.addDocUnder);
  const renameNode         = useDocsStore((s) => s.renameNode);
  const deleteNodeAndDocs  = useDocsStore((s) => s.deleteNodeAndDocs);
  const setFolderIcon      = useDocsStore((s) => s.setFolderIcon);
  const duplicateDoc       = useDocsStore((s) => s.duplicateDoc);
  const saveCurrentDoc     = useDocsStore((s) => s.saveCurrentDoc);
  const renameCurrentDoc   = useDocsStore((s) => s.renameCurrentDoc);

  const currentDoc = useCurrentDoc();

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bg          = isDark ? '#0f172a' : '#f8fafc';
  const headerBg    = isDark ? '#1e293b' : '#fff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: headerBg,
        borderBottomWidth: 1, borderBottomColor: borderColor,
      }}>
        {!isWide && (
          <Pressable
            onPress={() => setSidebarOpen((v) => !v)}
            style={{
              width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 16 }}>📁</Text>
          </Pressable>
        )}

        {currentDoc ? (
          <TitleEditor
            title={currentDoc.title}
            isDark={isDark}
            onRename={(t) => renameCurrentDoc(t)}
          />
        ) : (
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
            Documentation
          </Text>
        )}

        <SaveIndicator status={saveStatus} isDark={isDark} />

        {currentDoc && (
          <Pressable
            onPress={() => setPreview(!preview)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
              backgroundColor: preview ? '#3b82f6' : (isDark ? '#334155' : '#f1f5f9'),
            }}
          >
            <Text style={{
              fontSize: 12, fontWeight: '600',
              color: preview ? '#fff' : (isDark ? '#e2e8f0' : '#374151'),
            }}>
              {preview ? '✏️ Edit' : '👁 Preview'}
            </Text>
          </Pressable>
        )}

        {currentDoc && !preview && (
          <Pressable
            onPress={() => saveCurrentDoc()}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#3b82f6' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Save</Text>
          </Pressable>
        )}
      </View>

      {/* ── Body ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {isWide ? (
          <View style={{ width: 220 }}>
            <DocTreeSidebar
              tree={tree} docs={docs} currentDocId={currentDocId}
              selectedTreeId={selectedTreeId} expanded={expanded} isDark={isDark}
              onSelectDoc={(docId, nodeId) => { setCurrentDocId(docId); setSelectedTreeId(nodeId); }}
              onSelectFolder={setSelectedTreeId}
              onToggleExpand={toggleExpand}
              onAddFolder={addFolder} onAddDoc={addDocUnder}
              onRename={renameNode} onDelete={deleteNodeAndDocs}
              onSetFolderIcon={setFolderIcon} onDuplicateDoc={duplicateDoc}
            />
          </View>
        ) : (
          <Modal visible={sidebarOpen} transparent animationType="slide" onRequestClose={() => setSidebarOpen(false)}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <View style={{ width: Math.min(280, width * 0.8) }}>
                <DocTreeSidebar
                  tree={tree} docs={docs} currentDocId={currentDocId}
                  selectedTreeId={selectedTreeId} expanded={expanded} isDark={isDark}
                  onSelectDoc={(docId, nodeId) => { setCurrentDocId(docId); setSelectedTreeId(nodeId); setSidebarOpen(false); }}
                  onSelectFolder={setSelectedTreeId}
                  onToggleExpand={toggleExpand}
                  onAddFolder={addFolder} onAddDoc={addDocUnder}
                  onRename={renameNode} onDelete={deleteNodeAndDocs}
                  onSetFolderIcon={setFolderIcon} onDuplicateDoc={duplicateDoc}
                />
              </View>
              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setSidebarOpen(false)} />
            </View>
          </Modal>
        )}

        <View style={{ flex: 1, flexDirection: 'column' }}>
          {preview ? (
            <DocPreview blocks={currentDoc?.blocks ?? []} isDark={isDark} />
          ) : (
            <DocEditor
              blocks={currentDoc?.blocks ?? []}
              hasDoc={!!currentDoc}
              isDark={isDark}
              onUpdateBlock={(id, patch) => updateBlock(id, patch)}
              onRemoveBlock={removeBlock}
              onDuplicateBlock={duplicateBlock}
              onMoveBlock={moveBlock}
              onInsertBlock={insertBlock}
            />
          )}

          {currentDoc && !preview && (
            <BlockPalette onAdd={addBlock} isDark={isDark} horizontal />
          )}
        </View>

        {isWide && currentDoc && !preview && (
          <BlockPalette onAdd={addBlock} isDark={isDark} horizontal={false} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default DocsScreen;
