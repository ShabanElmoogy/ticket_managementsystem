import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, Pressable, TextInput,
  useWindowDimensions, Animated,
} from 'react-native';
import BlockPalette from '@/src/features/admin/docs/components/BlockPalette';
import ContentSearchModal from '@/src/features/admin/docs/components/ContentSearchModal';
import DocEditor from '@/src/features/admin/docs/components/DocEditor';
import DocPreview from '@/src/features/admin/docs/components/DocPreview';
import DocTreeSidebar from '@/src/features/admin/docs/components/DocTreeSidebar';
import TemplatesModal from '@/src/features/admin/docs/components/TemplatesModal';
import UndoRedoButtons from '@/src/features/admin/docs/components/UndoRedoButtons';
import { useBlockTemplates } from '@/src/features/admin/docs/hooks/useBlockTemplates';
import { useDocsStore, useCurrentDoc } from '@/src/features/admin/docs/hooks/useDocsStore';
import { exportDocToPdf } from '@/src/features/admin/docs/utils/exportDocPdf';
import { FeatureErrorBoundary } from '@/src/shared/components/feedback/ErrorBoundary';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors } from '@/src/constants/theme';

// ── Save status indicator ─────────────────────────────────────────────────────

const SaveIndicator: React.FC<{ status: string }> = ({ status }) => {
  const c = useThemeColors();
  if (status === 'idle') return null;
  const cfg: Record<string, { text: string; color: string; surface: string }> = {
    saving: { text: 'Saving…', color: c.intent.warning,  surface: c.intent.warningSurface },
    saved:  { text: '✓ Saved', color: c.intent.success,  surface: c.intent.successSurface },
    error:  { text: '✗ Error', color: c.intent.error,    surface: c.intent.errorSurface   },
  };
  const cfg_ = cfg[status];
  if (!cfg_) return null;
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
      backgroundColor: cfg_.surface,
    }}>
      <Text style={{ fontSize: 11, color: cfg_.color, fontWeight: '700' }}>{cfg_.text}</Text>
    </View>
  );
};

// ── Inline title editor ───────────────────────────────────────────────────────

const TitleEditor: React.FC<{
  title: string; onRename: (t: string) => void;
}> = ({ title, onRename }) => {
  const c = useThemeColors();
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
          color: c.text.primary,
          backgroundColor: c.surface.elevated,
          borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1.5, borderColor: c.border.focus,
        }}
      />
    );
  }

  return (
    <Pressable onPress={() => setEditing(true)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: c.text.primary, flex: 1 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 11, color: c.text.muted }}>✎</Text>
    </Pressable>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────

const DocsScreen: React.FC = () => {
  const c = useThemeColors();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const { isRtl: isRTL } = useDirection();

  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
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

  return (
    <FeatureErrorBoundary featureName="Docs">
      <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>

      {/* ── Header ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: c.surface.primary,
        borderBottomWidth: 1, borderBottomColor: c.border.primary,
        elevation: 2,
      }}>
        {!isWide && (
          <Pressable
            onPress={openSidebar}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
            })}
          >
            <Text style={{ fontSize: 17 }}>📁</Text>
          </Pressable>
        )}

        {currentDoc ? (
          <TitleEditor title={currentDoc.title} onRename={renameCurrentDoc} />
        ) : (
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: c.text.muted }}>
            Documentation
          </Text>
        )}

        <SaveIndicator status={saveStatus} />

        {/* Export PDF */}
        {currentDoc && (
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 4,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: pressed ? c.buttons.danger.pressed : c.buttons.danger.bg,
              opacity: exporting ? 0.6 : 1,
            })}
          >
            <Text style={{ fontSize: 13 }}>{exporting ? '⏳' : '📄'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.buttons.danger.text }}>
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
              backgroundColor: preview
                ? c.buttons.primary.bg
                : pressed ? c.surface.elevated : c.surface.tertiary,
            })}
          >
            <Text style={{ fontSize: 13 }}>{preview ? '✏️' : '👁'}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: preview ? c.buttons.primary.text : c.text.secondary }}>
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
              backgroundColor: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg,
            })}
          >
            <Text style={{ fontSize: 13 }}>💾</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: c.buttons.primary.text }}>Save</Text>
          </Pressable>
        )}

        {/* Undo / Redo */}
        {currentDoc && !preview && <UndoRedoButtons />}
      </View>

      {/* ── Body ── */}
      <View style={{ flex: 1, flexDirection: 'row' }}>

        {/* Wide: permanent sidebar */}
        {isWide && (
          <View style={{ width: 220 }}>
            <DocTreeSidebar
              tree={tree} docs={docs} currentDocId={currentDocId}
              selectedTreeId={selectedTreeId} expanded={expanded}
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
            <DocPreview blocks={currentDoc?.blocks ?? []} />
          ) : (
            <DocEditor
              blocks={currentDoc?.blocks ?? []}
              hasDoc={!!currentDoc}
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
            <BlockPalette onAdd={addBlock} horizontal
              templateCount={templates.length}
              onOpenTemplates={() => setTemplatesOpen(true)}
            />
          )}
        </View>

        {isWide && currentDoc && !preview && (
          <BlockPalette onAdd={addBlock} horizontal={false}
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
                shadowColor: c.shadow,
                shadowOffset: { width: isRTL ? -4 : 4, height: 0 },
                shadowOpacity: 1, shadowRadius: 12,
              }}
            >
              <DocTreeSidebar
                tree={tree} docs={docs} currentDocId={currentDocId}
                selectedTreeId={selectedTreeId} expanded={expanded}
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
        onClose={() => setSearchOpen(false)}
        onSelectDoc={(docId) => {
          setCurrentDocId(docId);
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
    </FeatureErrorBoundary>
  );
};

export default DocsScreen;
