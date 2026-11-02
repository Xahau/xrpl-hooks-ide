/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: '/', destination: '/develop', permanent: false }]
  },
  // Serve the Plausible script and event endpoint from this origin so content blockers no longer
  // fail the request and log errors in the console (same paths next-plausible's proxy used)
  async rewrites() {
    return [
      { source: '/js/script.:ext*.js', destination: 'https://plausible.io/js/script.:ext*.js' },
      { source: '/proxy/api/event', destination: 'https://plausible.io/api/event' }
    ]
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
