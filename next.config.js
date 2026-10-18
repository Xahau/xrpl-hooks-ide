const { withPlausibleProxy } = require('next-plausible')

/** @type {import('next').NextConfig} */
// withPlausibleProxy serves the Plausible script and event endpoint from this origin (rewrites to
// plausible.io), so content blockers no longer fail the request and log errors in the console
module.exports = withPlausibleProxy()({
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
    return config
  }
})
