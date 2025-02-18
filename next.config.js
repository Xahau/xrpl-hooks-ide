const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com']
  },
  webpack(config, { isServer }) {
    config.resolve.alias['vscode'] = require.resolve(
      '@codingame/monaco-languageclient/lib/vscode-compatibility'
    )
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    config.module.rules.push({
      test: [/\.md$/, /hook-bundle\.js$/],
      use: 'raw-loader'
    })
    if (!isServer) {
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/esbuild-wasm/esbuild.wasm'),
              to: path.resolve(__dirname, 'public/esbuild.wasm')
            }
          ]
        })
      );
    }
    return config
  }
}
