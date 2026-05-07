/**
 * ProgrammingPanel — tabbed sub-panel for developer workflow data.
 *
 * Renders:
 *   - Purple "<> Programming Panel" header chip
 *   - SubTabBar with 3 tabs: TECHNICAL INFO / SOLUTION STEPS / CODE SNIPPETS
 *   - The active section component (TechnicalInfoSection, SolutionChecklistSection,
 *     or CodeSnippetsSection)
 *
 * Data is fetched via useProgrammingDetails. An inline ActivityIndicator is
 * shown in the panel header while fetching.
 *
 * canEdit is true when the current user is the assigned programmer or a
 * TENANT_ADMIN. The parent passes this down.
 *
 * This component appears:
 *   1. Inside TicketDetailScreen's Overview tab (when ticket is in a
 *      programming-phase status)
 *   2. Inside ProgrammingDetailPanel on the Programming screen
 */

import React, { useState } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SubTabBar } from '@/src/shared/components/layout/TabBar';
import TechnicalInfoSection     from './TechnicalInfoSection';
import SolutionChecklistSection from './SolutionChecklistSection';
import CodeSnippetsSection      from './CodeSnippetsSection';
import { useProgrammingDetails } from '../hooks/useProgrammingDetails';
import { useThemeColors } from '@/src/constants/theme';
import { FontSize, FontWeight, Radius, Spacing, Palette } from '@/src/constants/tokens';
import type { TabItem } from '@/src/shared/components/layout/TabBar';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_COLOR = Palette.violet600;

type ProgrammingTab = 'technical' | 'steps' | 'snippets';

const TABS: TabItem[] = [
  { id: 'technical', label: 'Technical Info',   icon: 'information-circle-outline' },
  { id: 'steps',     label: 'Solution Steps',   icon: 'checkmark-circle-outline'   },
  { id: 'snippets',  label: 'Code Snippets',    icon: 'code-slash-outline'         },
];

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

export interface ProgrammingPanelProps {
  /** The ticket ID whose programming details to fetch. */
  ticketId: string;
  /**
   * Whether the current user can edit programming details.
   * True for the assigned programmer and TENANT_ADMIN.
   */
  canEdit: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const ProgrammingPanel: React.FC<ProgrammingPanelProps> = ({ ticketId, canEdit }) => {
  const c = useThemeColors();
  const [activeTab, setActiveTab] = useState<ProgrammingTab>('technical');

  const {
    programming,
    isLoading,
    saveTechnicalInfo,
    isSavingTechnicalInfo,
    saveSolutionSteps,
    isSavingSolutionSteps,
    saveCodeSnippets,
    isSavingCodeSnippets,
  } = useProgrammingDetails(ticketId);

  // ── Render active section ──────────────────────────────────────────────────

  const renderSection = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={PANEL_COLOR} />
          <Text style={[styles.loadingText, { color: c.text.muted }]}>
            Loading programming details...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'technical':
        return (
          <TechnicalInfoSection
            programming={programming}
            canEdit={canEdit}
            onSave={async (payload) => { await saveTechnicalInfo(payload); }}
            isSaving={isSavingTechnicalInfo}
          />
        );

      case 'steps':
        return (
          <SolutionChecklistSection
            steps={programming?.solutionSteps ?? []}
            canEdit={canEdit}
            onSave={async (steps) => { await saveSolutionSteps(steps); }}
            isSaving={isSavingSolutionSteps}
          />
        );

      case 'snippets':
        return (
          <CodeSnippetsSection
            snippets={programming?.codeSnippets ?? []}
            canEdit={canEdit}
            onSave={async (snippets) => { await saveCodeSnippets(snippets); }}
            isSaving={isSavingCodeSnippets}
          />
        );

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.surface.card,
          borderColor: `${PANEL_COLOR}44`,
        },
      ]}
    >
      {/* Panel header chip */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: `${PANEL_COLOR}10`,
            borderBottomColor: `${PANEL_COLOR}33`,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.headerIconBadge,
              { backgroundColor: `${PANEL_COLOR}20` },
            ]}
          >
            <Ionicons name="code-slash-outline" size={14} color={PANEL_COLOR} />
          </View>
          <Text style={[styles.headerTitle, { color: PANEL_COLOR }]}>
            {'<>'} Programming Panel
          </Text>
        </View>

        {/* Loading indicator in header */}
        {isLoading && (
          <ActivityIndicator size="small" color={PANEL_COLOR} style={styles.headerSpinner} />
        )}
      </View>

      {/* Sub-tab bar */}
      <SubTabBar
        tabs={TABS}
        active={activeTab}
        onSelect={(id) => setActiveTab(id as ProgrammingTab)}
      />

      {/* Section content */}
      <View style={styles.sectionContainer}>
        {renderSection()}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    // Minimum height so the panel is usable even when empty
    minHeight: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIconBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
  headerSpinner: {
    marginStart: Spacing.sm,
  },
  sectionContainer: {
    flex: 1,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing['2xl'],
  },
  loadingText: {
    fontSize: FontSize.sm,
  },
});

export default ProgrammingPanel;
