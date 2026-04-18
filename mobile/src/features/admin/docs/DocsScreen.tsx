import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Pressable, TextInput,
  useWindowDimensions, Animated,
} from 'react-native';
import { useUiStore } from '../../../stores/uiStore';
import { useDirection } from '../../../providers/DirectionProvider';
import { useDocsStore, useCurrentDoc } from './hooks/useDocsStore';
import DocTreeSidebar from './components/DocTreeSidebar';
import DocEditor from './components/DocEditor';
import DocPreview from './components/DocPreview';
import BlockPalette from './components/BlockPalette';
import UndoRedoButtons from './components/UndoRedoButtons';
import ContentSearchModal from './components/ContentSearchModal';
import TemplatesModal from './components/TemplatesModal';
import { useBlockTemplates } from './hooks/useBlockTemplates';
import { exportDocToPdf } from './utils/exportDocPdf';

// ── Save status indicator ─────────────────────────────────────────────────────

const SaveIndicator: React.FC<{ status: string; isDark: boolean }> = ({ status, isDark }) => {
  if (status === 'idle') return null;
  const cfg: Record<string, { text: string; color: string; bg: string }> = {
    saving: { text: 'Saving…', color: '#f59e0b', bg: '#fffbeb' },
    saved:  { text: '✓ Saved', color: '#10b981', bg: '#f0fdf4' },
    error:  { text: '✗ Error', color: '#ef4444', bg: '#fef2f2' },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: isDark ? c.color + '22' : c.bg,
    }}>
      <Text style={{ fontSize: 11, color: c.color, fontWeight: '700' }}>{c.text}</Text>
    </View>
  );
};

// ── Inline title editor ───────────────────────────────────────────────────────

const TitleEditor: React.FC<{
  title: string; isDark: boolean; onRename: (t: string) => void;
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
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1.5, borderColor: '#3b82f6',
        }}
      />
    );
  }

  return (
    <Pressable onPress={() => setEditing(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#f1f5f9' : '#0f172a', flex: 1 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 11, color: isDark ? '#475569' : '#94a3b8' }}>✎</Text>
    </Pressable>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const DocsScreen: React.FC = () => {
  const { colorMode } = useUiStore();
  const isDark = colorMode === 'dark';
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { isRtl: isRTL } = useDirection();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const { templates, saveTemplate, deleteTemplate, instantiateTemplate } = useBlockTemplates();

  const DRAWER_W  = Math.min(260, width * 0.78);
  const slideAnim = useRef(new Animated.Value(isRTL ? DRAWER_W : -DRAWER_W)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  };
  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: isRTL ? DRAWER_W : -DRAWER_W,
      duration: 200, useNativeDriver: true,
    }).start(() => setSidebarOpen(false));
  };

  // ── Store selectors ────────────────────────────────────────────────────────
  const tree           = useDocsStore((s) => s.tree);
  const docs           = useDocsStore((s) => s.docs);
  const currentDocId   = useDocsStore((s) => s.currentDocId);
  const selectedTreeId = useDocsStore((s) => s.selectedTreeId);
  const expanded       = useDocsStore((s) => s.expanded);
  const preview        = useDocsStore((s) => s.preview);
  const saveStatus     = useDocsStore((s) => s.saveStatus);

  const loadAll           = useDocsStore((s) => s.loadAll);
  const setCurrentDocId   = useDocsStore((s) => s.setCurrentDocId);
  const setSelectedTreeId = useDocsStore((s) => s.setSelectedTreeId);
  const setPreview        = useDocsStore((s) => s.setPreview);
  const addBlock          = useDocsStore((s) => s.addBlock);
  const addBlocks         = useDocsStore((s) => s.addBlocks);
  const insertBlock       = useDocsStore((s) => s.insertBlock);
  const updateBlock       = useDocsStore((s) => s.updateBlock);
  const removeBlock       = useDocsStore((s) => s.removeBlock);
  const duplicateBlock    = useDocsStore((s) => s.duplicateBlock);
  const moveBlock         = useDocsStore((s) => s.moveBlock);
  const reorderBlocks     = useDocsStore((s) => s.reorderBlocks);
  const toggleExpand      = useDocsStore((s) => s.toggleExpand);
  const addFolder         = useDocsStore((s) => s.addFolder);
  const addDocUnder       = useDocsStore((s) => s.addDocUnder);
  const renameNode        = useDocsStore((s) => s.renameNode);
  const deleteNodeAndDocs = useDocsStore((s) => s.deleteNodeAndDocs);
  const setFolderIcon     = useDocsStore((s) => s.setFolderIcon);
  const duplicateDoc      = useDocsStore((s) => s.duplicateDoc);
  const saveCurrentDoc    = useDocsStore((s) => s.saveCurrentDoc);
  const renameCurrentDoc  = useDocsStore((s) => s.renameCurrentDoc);

  const currentDoc = useCurrentDoc();

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async () => {
    if (!currentDoc || exporting) return;
    setExporting(true);
    try {
      await exportDocToPdf(currentDoc);
    } catch (e) {
      if (__DEV__) console.error('PDF export failed:', e);
    } finally {
      setExporting(false);
    }
  };

  const bg          = isDark ? '#0f172a' : '#f8fafc';
  const headerBg    = isDark ? '#1e293b' : '#fff';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: headerBg,
        borderBottomWidth: 1, borderBottomColor: borderColor,
        elevation: 2,
      }}>
        {!isWide && (
          <Pressable
            onPress={openSidebar}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? (isDark ? '#475569' : '#e2e8f0') : (isDark ? '#334155' : '#f1f5f9'),
            })}
          >
            <Text style={{ fontSize: 17 }}>📁</Text>
          </Pressable>
        )}

        {currentDoc ? (
          <TitleEditor title={currentDoc.title} isDark={isDark} onRename={renameCurrentDoc} />
        ) : (
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: isDark ? '#475569' : '#94a3b8' }}>
            Documentation
          </Text>
        )}

        <SaveIndicator status={saveStatus} isDark={isDark} />

        {/* Export PDF */}
        {currentDoc && (
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: pressed ? '#dc2626' : '#ef4444',
              opacity: exporting ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 13 }}>{exporting ? '⏳' : '📄'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
              {exporting ? 'Exporting…' : 'PDF'}
            </Text>
          </Pressable>
        )}

        {/* Preview / Edit toggle */}
        {currentDoc && (
          <Pressable
            onPress={() => setPreview(!preview)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: preview ? '#3b82f6'
                : pressed ? (isDark ? '#475569' : '#e2e8f0')
                : (isDark ? '#334155' : '#f1f5f9'),
            })}
          >
            <Text style={{ fontSize: 13 }}>{preview ? '✏️' : '👁'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: preview ? '#fff' : (isDark ? '#e2e8f0' : '#374151') }}>
              {preview ? 'Edit' : 'Preview'}
            </Text>
          </Pressable>
        )}

        {/* Save */}
        {currentDoc && !preview && (
          <Pressable
            onPress={saveCurrentDoc}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: pressed ? '#2563eb' : '#3b82f6',
            })}
          >
            <Text style={{ fontSize: 13 }}>💾</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>Save</Text>
          </Pressable>
        )}

        {/* Undo / Redo */}
        {currentDoc && !preview && <UndoRedoButtons isDark={isDark} />}
      </View>

      {/* ── Body ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Wide: permanent sidebar */}
        {isWide && (
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
              onSearch={() => setSearchOpen(true)}
            />
          </View>
        )}

        {/* Editor / Preview */}
        <View style={{ flex: 1 }}>
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
              onReorderBlocks={reorderBlocks}
              onSaveBlockAsTemplate={(block) => saveTemplate(block.type + ' template', [block])}
            />
          )}
          {currentDoc && !preview && (
            <BlockPalette onAdd={addBlock} isDark={isDark} horizontal
              templateCount={templates.length}
              onOpenTemplates={() => setTemplatesOpen(true)}
            />
          )}
        </View>

        {isWide && currentDoc && !preview && (
          <BlockPalette onAdd={addBlock} isDark={isDark} horizontal={false}
            templateCount={templates.length}
            onOpenTemplates={() => setTemplatesOpen(true)}
          />
        )}

        {/* Compact drawer */}
        {!isWide && sidebarOpen && (
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, overflow: 'hidden' }}
            pointerEvents="box-none"
          >
            <Pressable
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
              onPress={closeSidebar}
            />
            <Animated.View
              style={{
                position: 'absolute', top: 0, bottom: 0,
                ...(isRTL ? { right: 0 } : { left: 0 }),
                width: DRAWER_W,
                transform: [{ translateX: slideAnim }],
                elevation: 16,
                shadowColor: '#000',
                shadowOffset: { width: isRTL ? -4 : 4, height: 0 },
                shadowOpacity: 0.25, shadowRadius: 12,
              }}
            >
              <DocTreeSidebar
                tree={tree} docs={docs} currentDocId={currentDocId}
                selectedTreeId={selectedTreeId} expanded={expanded} isDark={isDark}
                onSelectDoc={(docId, nodeId) => { setCurrentDocId(docId); setSelectedTreeId(nodeId); closeSidebar(); }}
                onSelectFolder={setSelectedTreeId}
                onToggleExpand={toggleExpand}
                onAddFolder={addFolder} onAddDoc={addDocUnder}
                onRename={renameNode} onDelete={deleteNodeAndDocs}
                onSetFolderIcon={setFolderIcon} onDuplicateDoc={duplicateDoc}
                onSearch={() => { closeSidebar(); setSearchOpen(true); }}
              />
            </Animated.View>
          </View>
        )}
      </View>

      {/* Templates modal */}
      <TemplatesModal
        visible={templatesOpen}
        templates={templates}
        isDark={isDark}
        onClose={() => setTemplatesOpen(false)}
        onDelete={deleteTemplate}
        onUse={(template) => {
          const blocks = instantiateTemplate(template);
          addBlocks(blocks);
        }}
      />

      {/* Content search modal */}
      <ContentSearchModal
        visible={searchOpen}
        docs={docs}
        isDark={isDark}
        onClose={() => setSearchOpen(false)}
        onSelectDoc={(docId) => {
          setCurrentDocId(docId);
          // find the tree node id for this doc
          const findNodeId = (nodes: typeof tree): string | null => {
            for (const n of nodes) {
              if (n.type === 'doc' && (n as any).docId === docId) return n.id;
              if (n.type === 'folder') {
                const found = findNodeId((n as any).children);
                if (found) return found;
              }
            }
            return null;
          };
          const nodeId = findNodeId(tree);
          if (nodeId) setSelectedTreeId(nodeId);
        }}
      />
    </View>
  );
};

export default DocsScreen;
