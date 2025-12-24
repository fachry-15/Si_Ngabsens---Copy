const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// WAJIB: Tambahkan 'tflite' agar file model bisa dimuat ke dalam aplikasi
config.resolver.assetExts.push('tflite');

module.exports = config;