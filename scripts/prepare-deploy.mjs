import { copyFile, mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
await mkdir(resolve(dist, 'deploy'), { recursive: true })
await mkdir(resolve(dist, 'images'), { recursive: true })
for (const arch of ['amd64', 'arm64']) {
  const name = 'nginx-linux-' + arch + '.tar'
  const source = resolve(root, '.offline-images', name)
  try { await stat(source) } catch { throw new Error('Missing tracked offline image: ' + source + '. Restore .offline-images from Git, or run npm run prepare:images on a connected build computer.') }
  const expected = (await readFile(source + '.sha256', 'utf8')).trim()
  const actual = createHash('sha256').update(await readFile(source)).digest('hex')
  if (actual !== expected) throw new Error('Offline image checksum mismatch: ' + source)
  await copyFile(source, resolve(dist, 'images', name))
  await writeFile(resolve(dist, 'images', name + '.sha256'), actual + '  ' + name + '\n')
}
for (const name of ['deploy.sh', 'start.sh', 'deploy.ps1', 'start.ps1', 'start.cmd']) {
  const content = (await readFile(resolve(root, 'deploy', name), 'utf8')).replace(/\r\n/g, '\n')
  await writeFile(resolve(dist, name), name.endsWith('.sh') ? content : content.replace(/\n/g, '\r\n'), { mode: 0o755 })
}
await copyFile(resolve(root, 'deploy/nginx.offline.conf'), resolve(dist, 'deploy/nginx.offline.conf'))
await copyFile(resolve(root, 'deploy/nginx.windows.conf'), resolve(dist, 'deploy/nginx.windows.conf'))
console.log('Deployment dist ready: Linux/Windows scripts, amd64/arm64 offline images, checksums, documentation and website included.')
await import('./prepare-native-deploy.mjs')
