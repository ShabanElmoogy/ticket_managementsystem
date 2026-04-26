import React from 'react';
import { View } from 'react-native';
import ViewToggle from './ViewToggle';
import VerticalDivider from './VerticalDivider';
import type { AdminView } from '@/src/stores/uiStore';

interface Props {
  /** @deprecated — child components read theme internally via useThemeColors() */
  isDark?: boolean;
  /** Left side — view toggle */
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  /** Right side — any action buttons */
  actions: React.ReactNode;
}

/**
 * Generic admin screen toolbar — ViewToggle on the left, action buttons on the right.
 * Used in Reports, and any other admin screen with a view switcher + actions.
 */
const AdminToolbar: React.FC<Props> = ({ view, onViewChange, actions }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <ViewToggle current={view} onChange={onViewChange} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <VerticalDivider />
      {actions}
    </View>
  </View>
);

export default AdminToolbar;
