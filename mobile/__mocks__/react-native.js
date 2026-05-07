/**
 * React Native mock for Jest (Node environment).
 *
 * Exports all commonly used RN components and APIs as stubs.
 * The TS language server uses this file for type resolution — it must
 * export every member that components import, or TS will report false errors.
 */

const React = require('react');

const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios ?? obj.default ?? Object.values(obj)[0],
};

// Stub component factory
const stub = (name) => {
  const C = ({ children }) => children ?? null;
  C.displayName = name;
  return C;
};

const View         = stub('View');
const Text         = stub('Text');
const TextInput    = stub('TextInput');
const ScrollView   = stub('ScrollView');
const FlatList     = stub('FlatList');
const Pressable    = stub('Pressable');
const TouchableOpacity = stub('TouchableOpacity');
const Modal        = stub('Modal');
const Image        = stub('Image');
const ActivityIndicator = stub('ActivityIndicator');
const SafeAreaView = stub('SafeAreaView');

const StyleSheet = {
  create: (styles) => styles,
  flatten: (style) => style,
  hairlineWidth: 1,
};

const Animated = {
  Value: class { constructor(v) { this._value = v; } },
  View: stub('Animated.View'),
  Text: stub('Animated.Text'),
  timing: () => ({ start: () => {}, stop: () => {} }),
  spring: () => ({ start: () => {}, stop: () => {} }),
  loop:   (a) => a,
  sequence: (a) => a[0],
  parallel: (a) => a[0],
};

const Dimensions = {
  get: () => ({ width: 375, height: 812 }),
  addEventListener: () => ({ remove: () => {} }),
};

const Alert = {
  alert: () => {},
};

const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
};

const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
};

const Linking = {
  openURL: () => Promise.resolve(),
};

module.exports = {
  Platform,
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  AppState,
  Keyboard,
  Linking,
  useWindowDimensions: () => ({ width: 375, height: 812 }),
  useColorScheme: () => 'light',
};
