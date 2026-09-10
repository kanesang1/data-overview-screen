import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const mode = process.argv[2] || 'production'
if (!['production', 'development', 'test'].includes(mode)) throw new Error('Mode must be production, development or test')
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}
run(process.execPath, [resolve(root, 'scripts/build.mjs'), mode])
await mkdir(resolve(root, 'artifacts'), { recursive: true })
const name = `dashboard-${mode}.tar.gz`
const target = resolve(root, 'artifacts', name)
run('tar', ['-czf', target, '-C', resolve(root, 'dist'), '.'])
await writeFile(target + '.sha256', createHash('sha256').update(await readFile(target)).digest('hex') + '  ' + name + '\n')
console.log('Delivery archive: ' + target)
