import React from 'react';
import { View } from 'react-native';
import ViewToggle from './ViewToggle';
import VerticalDivider from './VerticalDivider';
import type { AdminView } from '../../stores/uiStore';

interface Props {
  isDark: boolean;
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
const AdminToolbar: React.FC<Props> = ({ isDark, view, onViewChange, actions }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <ViewToggle current={view} onChange={onViewChange} isDark={isDark} />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <VerticalDivider isDark={isDark} />
      {actions}
    </View>
  </View>
);

export default AdminToolbar;
