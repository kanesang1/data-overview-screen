import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const root = resolve(import.meta.dirname, '..')
const dir = resolve(root, '.offline-images')
await mkdir(dir, { recursive: true })
// Connected build machine only. The target server never runs this script.
for (const arch of ['amd64', 'arm64']) {
  const image = process.env.OFFLINE_IMAGE_SOURCE || 'nginx:1.27-alpine'
  const tag = 'nginx:1.27-alpine'
  const target = resolve(dir, 'nginx-linux-' + arch + '.tar')
  execFileSync('docker', ['pull', '--platform', 'linux/' + arch, image], { stdio: 'inherit' })
  execFileSync('docker', ['tag', image, tag], { stdio: 'inherit' })
  execFileSync('docker', ['save', '-o', target + '.tmp', tag], { stdio: 'inherit' })
  await rename(target + '.tmp', target)
  await writeFile(target + '.sha256', createHash('sha256').update(await readFile(target)).digest('hex') + '\n')
}
