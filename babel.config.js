module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets-core/plugin', // Tambahkan ini untuk mendukung Vision Camera
      'react-native-reanimated/plugin',    // Tetap di baris paling bawah
    ],
  };
};