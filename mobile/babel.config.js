module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // reanimated plugin must always be last
      'react-native-reanimated/plugin',
    ],
  };
};
