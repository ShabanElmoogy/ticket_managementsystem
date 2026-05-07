/**
 * FileAttachmentList — file list panel with upload zone and file rows.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. AttachmentsTab.tsx — file list panel in the Ticket Detail screen
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LAYOUT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ╭──────────────────────────────────────────────────────────╮
 * │  Files  (3)                                              │
 * │  ┌─────────────────────────────────────────────────┐    │
 * │  │  ⬆  Drop or browse files (max 5, 10 MB each)   │    │
 * │  └─────────────────────────────────────────────────┘    │
 * │  ████████████████████████  (upload progress bar)        │
 * │  ┌──────────────────────────────────────────────────┐   │
 * │  │ 🖼  screenshot.png   42 KB   [selected]    [🗑]  │   │
 * │  │ 📄  report.pdf       1.2 MB                [🗑]  │   │
 * │  └──────────────────────────────────────────────────┘   │
 * ╰──────────────────────────────────────────────────────────╯
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE EXAMPLES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * <FileAttachmentList
 *   attachments={attachments}
 *   onUpload={handleUpload}
 *   onDelete={handleDelete}
 *   onSelect={setSelectedAttachment}
 *   selectedId={selectedAttachment?.id}
 *   readonly={false}
 *   uploading={isUploading}
 *   uploadProgress={uploadProgress}
 *   resolvedColors={c}
 * />
 *
 * // Read-only (no upload zone, no delete buttons)
 * <FileAttachmentList
 *   attachments={attachments}
 *   onSelect={setSelectedAttachment}
 *   selectedId={selectedAttachment?.id}
 *   readonly
 *   resolvedColors={c}
 * />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Radius, FontSize, FontWeight, Spacing } from '@/src/constants/tokens';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Attachment } from '@/src/services/api/types/attachment';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_FILES = 5;
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType === 'application/pdf') return 'document-text-outline';
  if (mimeType.startsWith('video/')) return 'videocam-outline';
  if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive-outline';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document-outline';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'grid-outline';
  return 'attach-outline';
}

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface FileAttachmentListProps {
  /** List of uploaded attachments. */
  attachments: Attachment[];
  /** Called with selected DocumentPicker assets when user picks files. */
  onUpload?: (files: DocumentPicker.DocumentPickerAsset[]) => Promise<void>;
  /** Called with attachment ID when user presses delete. */
  onDelete?: (attachmentId: string) => void;
  /** Called when user selects a file for preview. */
  onSelect: (attachment: Attachment) => void;
  /** Currently selected attachment ID (highlighted in the list). */
  selectedId?: string;
  /** Hides upload zone and delete buttons. */
  readonly: boolean;
  /** Shows a progress bar when true. */
  uploading?: boolean;
  /** Upload progress 0–100. */
  uploadProgress?: number;
  /** Resolved theme colors from the parent (Modal-safe pattern). */
  resolvedColors: ThemeColors;
  /** Extra style merged onto the root container. */
  style?: ViewStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const FileAttachmentList: React.FC<FileAttachmentListProps> = ({
  attachments,
  onUpload,
  onDelete,
  onSelect,
  selectedId,
  readonly,
  uploading = false,
  uploadProgress = 0,
  resolvedColors: c,
  style,
}) => {
  const handlePickFiles = useCallback(async () => {
    if (!onUpload || readonly) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      // Filter by size and limit count
      const validFiles = result.assets
        .filter((f) => (f.size ?? 0) <= MAX_SIZE_BYTES)
        .slice(0, MAX_FILES);

      if (validFiles.length > 0) {
        await onUpload(validFiles);
      }
    } catch {
      // DocumentPicker errors are non-critical — user cancelled or permission denied
    }
  }, [onUpload, readonly]);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="attach-outline" size={16} color={c.text.secondary} />
        <Text style={[styles.headerTitle, { color: c.text.primary }]}>Files</Text>
        {attachments.length > 0 && (
          <View
            style={[
              styles.countBadge,
              { backgroundColor: `${c.interactive.primary}18` },
            ]}
          >
            <Text style={[styles.countText, { color: c.interactive.primary }]}>
              {attachments.length}
            </Text>
          </View>
        )}
      </View>

      {/* Upload zone — hidden in readonly mode */}
      {!readonly && (
        <Pressable
          onPress={handlePickFiles}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Upload files"
          style={({ pressed }: { pressed: boolean }) => [
            styles.uploadZone,
            {
              borderColor: pressed
                ? c.interactive.primary
                : c.border.secondary,
              backgroundColor: pressed
                ? `${c.interactive.primary}08`
                : c.surface.secondary,
              opacity: uploading ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={24}
            color={c.interactive.primary}
          />
          <Text style={[styles.uploadTitle, { color: c.interactive.primary }]}>
            {uploading ? 'Uploading...' : 'Drop or browse files'}
          </Text>
          <Text style={[styles.uploadSubtitle, { color: c.text.muted }]}>
            Max {MAX_FILES} files · {formatFileSize(MAX_SIZE_BYTES)} each
          </Text>
        </Pressable>
      )}

      {/* Upload progress bar */}
      {uploading && (
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: c.border.primary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: c.interactive.primary,
                width: `${Math.min(100, Math.max(0, uploadProgress))}%`,
              },
            ]}
          />
        </View>
      )}

      {/* File list */}
      {attachments.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="attach-outline" size={32} color={c.text.muted} />
          <Text style={[styles.emptyText, { color: c.text.muted }]}>
            No files attached
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.fileList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {attachments.map((attachment) => {
            const isSelected = attachment.id === selectedId;
            const isImage = isImageMime(attachment.mimeType);
            const iconName = getFileIcon(attachment.mimeType);

            return (
              <Pressable
                key={attachment.id}
                onPress={() => onSelect(attachment)}
                accessibilityRole="button"
                accessibilityLabel={`Select file: ${attachment.originalName}`}
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.fileRow,
                  {
                    backgroundColor: isSelected
                      ? `${c.interactive.primary}12`
                      : pressed
                      ? c.interactive.pressed
                      : 'transparent',
                    borderColor: isSelected
                      ? `${c.interactive.primary}44`
                      : c.border.primary,
                    borderStartWidth: isSelected ? 3 : 0,
                  },
                ]}
              >
                {/* Thumbnail or icon */}
                <View
                  style={[
                    styles.thumbnail,
                    { backgroundColor: c.surface.secondary },
                  ]}
                >
                  {isImage ? (
                    <Image
                      source={{ uri: attachment.url }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                      accessibilityLabel={attachment.originalName}
                    />
                  ) : (
                    <Ionicons
                      name={iconName as any}
                      size={20}
                      color={c.text.secondary}
                    />
                  )}
                </View>

                {/* File info */}
                <View style={styles.fileInfo}>
                  <Text
                    style={[styles.fileName, { color: c.text.primary }]}
                    numberOfLines={1}
                  >
                    {attachment.originalName}
                  </Text>
                  <Text style={[styles.fileSize, { color: c.text.muted }]}>
                    {formatFileSize(attachment.size)}
                  </Text>
                </View>

                {/* Delete button */}
                {!readonly && onDelete && (
                  <Pressable
                    onPress={() => onDelete(attachment.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${attachment.originalName}`}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.deleteButton,
                      {
                        backgroundColor: pressed
                          ? c.intent.errorSurface
                          : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={14}
                      color={c.intent.error}
                    />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  countBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  uploadTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  uploadSubtitle: {
    fontSize: FontSize.xs,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: 8,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
  fileList: {
    maxHeight: 300,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: 4,
    gap: 10,
  },
  thumbnail: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  fileSize: {
    fontSize: FontSize.xs,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default FileAttachmentList;
