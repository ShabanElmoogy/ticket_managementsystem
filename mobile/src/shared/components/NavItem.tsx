import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface NavItemProps {
  /** Icon emoji or text */
  icon: string;
  /** Item label */
  label: string;
  /** Text color */
  color?: string;
  /** RTL mode */
  isRtl?: boolean;
  /** Show divider before item */
  dividerBefore?: boolean;
  /** On press handler */
  onPress?: () => void;
}

/**
 * NavItem component - navigation item with icon and label
 * RTL-aware: icon always before text, but aligned to right in RTL
 */
const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  color = '#fff',
  isRtl = false,
  dividerBefore = false,
  onPress,
}) => {
  return (
    <>
      {dividerBefore && (
        <View style={styles.divider} />
      )}
      <Pressable
        style={[
          styles.container,
          {
            justifyContent: isRtl ? 'flex-end' : 'flex-start',
          },
        ]}
        onPress={onPress}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          <Text
            style={[
              styles.label,
              {
                color,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginHorizontal: 16,
    marginVertical: 4,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 12,
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: 'right',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    justifyContent: 'space-between',
  },
});

export default NavItem;
