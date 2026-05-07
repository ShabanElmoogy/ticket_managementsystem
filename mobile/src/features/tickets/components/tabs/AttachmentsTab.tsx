/**
 * AttachmentsTab — Attachments tab in the Ticket Detail screen.
 *
 * Shows FileAttachmentList + file preview panel (image/PDF/video/text/download).
 * Includes prev/next navigation and delete confirmation.
 *
 * ✅ MODAL SAFE — receives `resolvedColors` prop, no internal theme hook calls.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native') as any;
const Alert = RN.Alert as { alert: (title: string, message?: string, buttons?: any[]) => void };
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Spacing, Radius, FontSize, FontWeight } from '@/src/constants/tokens';
import FileAttachmentList from '@/src/shared/components/display/FileAttachmentList';
import type { ThemeColors } from '@/src/constants/tokens';
import type { Attachment } from '@/src/services/api/types/attachment';
import type { DocumentPickerAsset } from 'expo-document-picker';

// WebView — optional dependency
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  // not available
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function isPdfMime(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

function isTextMime(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface AttachmentsTabProps {
  ticketId: string;
  attachments: Attachment[];
  resolvedColors: ThemeColors;
  currentUserId: string;
  isAdmin: boolean;
  onUpload: (files: DocumentPickerAsset[]) => Promise<void>;
  onDelete: (attachmentId: string) => void;
  isUploading: boolean;
  uploadProgress?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  attachments,
  resolvedColors: c,
  isAdmin,
  onUpload,
  onDelete,
  isUploading,
  uploadProgress = 0,
}) => {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  // Load text content when a text/JSON file is selected
  useEffect(() => {
    if (!selectedAttachment) {
      setTextContent(null);
      return;
    }
    if (isTextMime(selectedAttachment.mimeType)) {
      setTextLoading(true);
      fetch(selectedAttachment.url)
        .then((r) => r.text())
        .then((text) => {
          setTextContent(text);
          setTextLoading(false);
        })
        .catch(() => {
          setTextContent('Failed to load file content.');
          setTextLoading(false);
        });
    } else {
      setTextContent(null);
    }
  }, [selectedAttachment]);

  // Reset zoom when selection changes
  useEffect(() => {
    setZoomLevel(1.0);
  }, [selectedAttachment]);

  const selectedIndex = selectedAttachment
    ? attachments.findIndex((a) => a.id === selectedAttachment.id)
    : -1;

  const handlePrev = () => {
    if (selectedIndex > 0) {
      setSelectedAttachment(attachments[selectedIndex - 1]);
    }
  };

  const handleNext = () => {
    if (selectedIndex < attachments.length - 1) {
      setSelectedAttachment(attachments[selectedIndex + 1]);
    }
  };

  const handleDeleteConfirm = (attachmentId: string) => {
    Alert.alert(
      'Delete Attachment',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(attachmentId);
            if (selectedAttachment?.id === attachmentId) {
              setSelectedAttachment(null);
            }
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    if (!selectedAttachment) return;
    try {
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      const fileUri =
        FileSystem.documentDirectory + selectedAttachment.originalName;
      await FileSystem.downloadAsync(selectedAttachment.url, fileUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      }
    } catch {
      // Silently fail — download errors are non-critical
    }
  };

  const renderPreview = () => {
    if (!selectedAttachment) {
      return (
        <View style={styles.emptyPreview}>
          <Ionicons name="attach-outline" size={40} color={c.text.muted} />
          <Text style={[styles.emptyText, { color: c.text.muted }]}>No files attached</Text>
        </View>
      );
    }

    const { mimeType, url, originalName } = selectedAttachment;

    if (isImageMime(mimeType)) {
      return (
        <View style={styles.previewContainer}>
          {/* Zoom controls */}
          <View
            style={[
              styles.zoomControls,
              { backgroundColor: c.surface.elevated, borderColor: c.border.primary },
            ]}
          >
            <Pressable
              onPress={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              style={styles.zoomButton}
              accessibilityLabel="Zoom out"
            >
              <Ionicons name="remove-outline" size={16} color={c.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => setZoomLevel(1.0)}
              style={styles.zoomButton}
              accessibilityLabel="Fit to screen"
            >
              <Ionicons name="scan-outline" size={16} color={c.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => setZoomLevel((z) => Math.min(3.0, z + 0.25))}
              style={styles.zoomButton}
              accessibilityLabel="Zoom in"
            >
              <Ionicons name="add-outline" size={16} color={c.text.primary} />
            </Pressable>
          </View>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={0.5}
            contentContainerStyle={styles.imageScrollContent}
          >
            <Image
              source={{ uri: url }}
              style={[
                styles.previewImage,
                { transform: [{ scale: zoomLevel }] },
              ]}
              resizeMode="contain"
              accessibilityLabel={originalName}
            />
          </ScrollView>
        </View>
      );
    }

    if (isPdfMime(mimeType) && WebView) {
      return (
        <WebView
          source={{ uri: url }}
          style={styles.webView}
          accessibilityLabel={`PDF: ${originalName}`}
        />
      );
    }

    if (isVideoMime(mimeType)) {
      return (
        <Video
          source={{ uri: url }}
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          accessibilityLabel={`Video: ${originalName}`}
        />
      );
    }

    if (isTextMime(mimeType)) {
      if (textLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.interactive.primary} />
          </View>
        );
      }
      return (
        <ScrollView
          style={[styles.textPreview, { backgroundColor: c.surface.secondary }]}
          contentContainerStyle={styles.textContent}
        >
          <Text
            style={[
              styles.textPreviewContent,
              { color: c.text.primary, fontFamily: 'monospace' },
            ]}
            selectable
          >
            {textContent ?? ''}
          </Text>
        </ScrollView>
      );
    }

    // Fallback — download button
    return (
      <View style={styles.downloadContainer}>
        <Ionicons name="document-outline" size={48} color={c.text.muted} />
        <Text style={[styles.downloadFileName, { color: c.text.primary }]}>
          {originalName}
        </Text>
        <Pressable
          onPress={handleDownload}
          accessibilityRole="button"
          accessibilityLabel="Download file"
          style={({ pressed }: { pressed: boolean }) => [
            styles.downloadButton,
            {
              backgroundColor: pressed
                ? c.interactive.primaryPressed
                : c.interactive.primary,
            },
          ]}
        >
          <Ionicons name="download-outline" size={16} color={c.text.inverse} />
          <Text style={[styles.downloadButtonText, { color: c.text.inverse }]}>
            Download
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.surface.primary }]}>
      {/* File list — top section */}
      <View
        style={[
          styles.fileListSection,
          { borderBottomColor: c.border.primary },
        ]}
      >
        <FileAttachmentList
          attachments={attachments}
          onUpload={onUpload}
          onDelete={isAdmin ? handleDeleteConfirm : undefined}
          onSelect={setSelectedAttachment}
          selectedId={selectedAttachment?.id}
          readonly={!isAdmin}
          uploading={isUploading}
          uploadProgress={uploadProgress}
          resolvedColors={c}
        />
      </View>

      {/* Preview panel — bottom section */}
      <View
        style={[
          styles.previewSection,
          { backgroundColor: c.surface.secondary },
        ]}
      >
        {/* Navigation bar */}
        {selectedAttachment && attachments.length > 1 && (
          <View
            style={[
              styles.navBar,
              {
                backgroundColor: c.surface.card,
                borderBottomColor: c.border.primary,
              },
            ]}
          >
            <Pressable
              onPress={handlePrev}
              disabled={selectedIndex <= 0}
              accessibilityLabel="Previous file"
              style={[styles.navButton, { opacity: selectedIndex <= 0 ? 0.3 : 1 }]}
            >
              <Ionicons name="chevron-back-outline" size={16} color={c.text.primary} />
            </Pressable>
            <Text style={[styles.navLabel, { color: c.text.secondary }]}>
              {selectedIndex + 1} / {attachments.length}
            </Text>
            <Pressable
              onPress={handleNext}
              disabled={selectedIndex >= attachments.length - 1}
              accessibilityLabel="Next file"
              style={[
                styles.navButton,
                { opacity: selectedIndex >= attachments.length - 1 ? 0.3 : 1 },
              ]}
            >
              <Ionicons name="chevron-forward-outline" size={16} color={c.text.primary} />
            </Pressable>
          </View>
        )}

        {/* Preview content */}
        <View style={styles.previewContent}>{renderPreview()}</View>
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fileListSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    maxHeight: 280,
  },
  previewSection: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  navButton: {
    padding: 4,
  },
  navLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  previewContent: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
  },
  zoomControls: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    margin: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  zoomButton: {
    padding: 8,
  },
  imageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  previewImage: {
    width: 300,
    height: 300,
  },
  webView: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
  },
  textPreview: {
    flex: 1,
  },
  textContent: {
    padding: Spacing.md,
  },
  textPreviewContent: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: Spacing.xl,
  },
  downloadFileName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  downloadButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
});

export default AttachmentsTab;
