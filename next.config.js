/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/', destination: '/develop', permanent: false }]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
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
      type: 'asset/source'
    })
    return config
  }
}
