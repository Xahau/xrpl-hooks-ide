import { createHash } from 'node:crypto'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync
} from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

// SHA-256 of the binaries; must be updated together with the binaries
const hashes = {
  'clangd.js': 'a7ff1c588eb5374783bbda84d949b92b8027c2381c786072448b96eba90c7027',
  'clangd.wasm': '0d71e7a7f8e6dd369cb2a0b22cc4016d649f370e5b905adb6092536deb0ee019'
}
const base = process.env.CLANGD_WASM_BASE_URL || 'https://clangd.guyutongxue.site/wasm/'
const dir = new URL('../public/wasm/', import.meta.url)
mkdirSync(dir, { recursive: true })

// fetch both or neither, so a stale clangd.js is never paired with a new clangd.wasm
if (Object.keys(hashes).every(name => existsSync(new URL(name, dir)))) process.exit(0)

for (const [name, hash] of Object.entries(hashes)) {
  const file = new URL(name, dir)
  const tmp = `${fileURLToPath(file)}.tmp`
  try {
    console.log(`Fetching ${name}...`)
    const res = await fetch(new URL(name, base))
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp))
    const digest = createHash('sha256')
    await pipeline(createReadStream(tmp), digest)
    if (digest.digest('hex') !== hash) throw new Error('SHA-256 mismatch')
    renameSync(tmp, file)
  } catch (err) {
    rmSync(tmp, { force: true })
    console.error(
      `Failed to fetch ${name} (${err.message}); in-browser diagnostics will be unavailable.`
    )
    process.exit(0)
  }
}
