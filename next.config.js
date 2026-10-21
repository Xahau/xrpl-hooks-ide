/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com']
  },
  async headers() {
    // required for SharedArrayBuffer (multithreaded clangd wasm)
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }
        ]
      }
    ]
  },
  webpack(config, { isServer }) {
    config.resolve.alias['vscode'] = require.resolve(
      '@codingame/monaco-languageclient/lib/vscode-compatibility'
    )
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    config.module.rules.push({
      test: [/\.md$/, /\.h$/, /hook-bundle\.js$/],
      use: 'raw-loader'
    })
    return config
  }
}
