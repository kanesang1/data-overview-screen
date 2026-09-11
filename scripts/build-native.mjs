import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const result = spawnSync(process.execPath, [resolve(root, 'scripts/build.mjs'), process.argv[2] || 'production', '--web-only'], { cwd: root, stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status || 1)
await import('./prepare-native-deploy.mjs')
