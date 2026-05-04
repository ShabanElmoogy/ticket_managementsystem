/**
 * Minimal react-native mock for Jest (Node environment).
 * tokens.ts imports Platform.select — this stub returns the 'default' branch.
 */
const Platform = {
  OS: 'ios',
  select: (obj) => obj.ios ?? obj.default ?? Object.values(obj)[0],
};

module.exports = { Platform };
