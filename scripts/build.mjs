import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, delimiter, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// This entry point must also run on Node 16 so it can select a newer runtime.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const candidates = [
  process.env.BUILD_NODE,
  process.execPath,
  resolve(root, '.tools', 'node', process.platform === 'win32' ? 'node.exe' : 'node'),
].filter(Boolean)
const node = candidates.find(candidate => {
  if (!existsSync(candidate)) return false
  const result = spawnSync(candidate, ['-p', 'process.versions.node'], { encoding: 'utf8' })
  return result.status === 0 && Number(result.stdout.trim().split('.')[0]) >= 22
})

if (!node) {
  console.error('构建需要 Node.js 22 或更新版本。当前版本：' + process.version)
  console.error('请升级 Node，或将兼容本机的 Node 程序放到 .tools/node/，或设置 BUILD_NODE 为新版本 node 的绝对路径。')
  process.exit(1)
}

const mode = process.argv[2] || 'production'
if (!['production', 'development', 'test'].includes(mode)) {
  console.error('不支持的构建模式：' + mode)
  process.exit(1)
}
const extra = process.argv.slice(3)
const webOnly = extra.includes('--web-only')
// Keep Dockerfile's `npm run build:web -- --mode test` compatible.
const modeIndex = extra.indexOf('--mode')
const viteMode = modeIndex === -1 ? mode : extra[modeIndex + 1]
if (!['production', 'development', 'test'].includes(viteMode)) {
  console.error('不支持的 Vite 构建模式：' + viteMode)
  process.exit(1)
}
console.log('构建使用 Node：' + node)
function run(args) {
  const result = spawnSync(node, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, PATH: dirname(node) + delimiter + process.env.PATH },
  })
  if (result.error) console.error(result.error.message)
  if (result.status !== 0) process.exit(result.status || 1)
}
run([resolve(root, 'node_modules/vue-tsc/bin/vue-tsc.js'), '-b'])
run([resolve(root, 'node_modules/vite/bin/vite.js'), 'build', '--mode', viteMode])
if (!webOnly) run([resolve(root, 'scripts/prepare-deploy.mjs'), viteMode])
