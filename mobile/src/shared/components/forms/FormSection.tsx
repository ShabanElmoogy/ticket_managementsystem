/**
 * FormSection — groups related form fields under a titled, collapsible card.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * FEATURES
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Section title with optional emoji icon + horizontal divider
 *   - Card wrapper with border and subtle shadow
 *   - Optional collapse/expand toggle (collapsible prop)
 *   - Collapsed state shows only the header — content hidden
 *   - hasError forces the section open so validation errors are always visible
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() internally. Do NOT use inside a <Modal>.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   CustomerForm — Basic Info, Company, Subscription sections
 *   UserForm     — form field grouping
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   // Basic
 *   <FormSection title="Basic Info" icon="👤">
 *     <AppTextInput label="Name" ... />
 *   </FormSection>
 *
 *   // Collapsible (starts expanded)
 *   <FormSection title="Company" icon="🏢" collapsible>
 *     <AppTextInput label="Company" ... />
 *   </FormSection>
 *
 *   // Collapsible, starts collapsed
 *   <FormSection title="Advanced" icon="⚙️" collapsible defaultCollapsed>
 *     <AppTextInput label="Notes" ... />
 *   </FormSection>
 *
 *   // Last section — no bottom margin
 *   <FormSection title="Subscription" icon="💳" last>
 *     ...
 *   </FormSection>
 *
 *   // Force open when a field inside has a validation error
 *   <FormSection title="Company" collapsible hasError={!!errors.company}>
 *     ...
 *   </FormSection>
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface FormSectionProps {
  title:             string;
  icon?:             string;
  children?:         React.ReactNode;
  /** Remove bottom margin — use on the last section in a form */
  last?:             boolean;
  /** Allow the section to be collapsed by tapping the header */
  collapsible?:      boolean;
  /**
   * Start in collapsed state (only applies when collapsible=true).
   * Note: only used as the initial value — changes after mount are ignored.
   */
  defaultCollapsed?: boolean;
  /**
   * Force section open when a field inside has a validation error.
   * When hasError transitions from false → true, the section expands
   * and stays expanded (collapsed state is reset to false).
   */
  hasError?:         boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
  title, icon, children,
  last             = false,
  collapsible      = false,
  defaultCollapsed = false,
  hasError         = false,
}) => {
  const c = useThemeColors();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // When a validation error appears inside this section, expand it
  // and keep it expanded so the user can see and fix the error.
  useEffect(() => {
    if (hasError && collapsed) {
      setCollapsed(false);
    }
  }, [hasError]); // eslint-disable-line react-hooks/exhaustive-deps

  const isCollapsed = collapsible && collapsed;
  const isExpanded  = !isCollapsed;

  return (
    <View style={[styles.section, !last && styles.sectionWithMargin]}>
      {/* ── Section header ── */}
      <Pressable
        onPress={collapsible ? () => setCollapsed(v => !v) : undefined}
        disabled={!collapsible}
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityLabel={title}
        accessibilityState={collapsible ? { expanded: isExpanded } : undefined}
        style={styles.header}
      >
        {icon && (
          <Text style={styles.icon} accessibilityElementsHidden>
            {icon}
          </Text>
        )}
        <Text style={[styles.title, { color: c.text.secondary }]}>{title}</Text>
        <View style={[styles.divider, { backgroundColor: c.border.primary }]} />
        {collapsible && (
          <MaterialIcons
            name={isCollapsed ? 'chevron-right' : 'expand-more'}
            size={20}
            color={c.text.muted}
            style={styles.chevron}
          />
        )}
      </Pressable>

      {/* ── Card content — hidden when collapsed ── */}
      {isExpanded && (
        <View style={[
          styles.card,
          {
            backgroundColor: c.surface.primary,
            borderColor:     c.border.primary,
            shadowColor:     c.shadow,
          },
        ]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    // No margin by default — sectionWithMargin adds spacing between sections
  },
  sectionWithMargin: {
    marginBottom: 20,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    marginBottom:      10,
    paddingHorizontal: 2,
  },
  icon: {
    fontSize: 13,
  },
  title: {
    fontSize:      FontSize.xs,
    fontWeight:    FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  divider: {
    flex:        1,
    height:      1,
    marginStart: 4,
  },
  chevron: {
    marginStart: 4,
  },
  card: {
    borderRadius:  Radius.xl,
    borderWidth:   1,
    padding:       16,
    paddingBottom: 4,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  4,
    elevation:     1,
  },
});

export default FormSection;
