import { mkdir, readFile, writeFile, copyFile, cp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
await mkdir(resolve(dist, 'native-runtime'), { recursive: true })
await mkdir(resolve(dist, 'deploy'), { recursive: true })
const manifest = JSON.parse(await readFile(resolve(root, '.offline-native/manifest.json'), 'utf8'))
for (const runtime of manifest.runtimes) {
  if (!/^[a-zA-Z0-9_.-]+$/.test(runtime.file)) throw new Error('Invalid runtime filename')
  const source = resolve(root, '.offline-native', runtime.file)
  const data = await readFile(source)
  const checksum = createHash('sha256').update(data).digest('hex')
  if (checksum !== runtime.sha256) throw new Error('Native runtime checksum mismatch: ' + source)
  await copyFile(source, resolve(dist, 'native-runtime', runtime.file))
  await writeFile(resolve(dist, 'native-runtime', runtime.file + '.sha256'), checksum + '  ' + runtime.file + '\n')
}
await copyFile(resolve(root, '.offline-native/manifest.json'), resolve(dist, 'native-runtime/manifest.json'))
await cp(resolve(root, '.offline-native/licenses'), resolve(dist, 'native-runtime/licenses'), { recursive: true })
for (const name of ['native.sh', 'native.ps1', 'start-native.cmd']) {
  const content = (await readFile(resolve(root, 'deploy', name), 'utf8')).replace(/\r\n/g, '\n')
  await writeFile(resolve(dist, name), name.endsWith('.sh') ? content : content.replace(/\n/g, '\r\n'), { mode: 0o755 })
}
await copyFile(resolve(root, 'deploy/nginx.native.conf'), resolve(dist, 'deploy/nginx.native.conf'))
await copyFile(resolve(root, 'deploy/native.mime.types'), resolve(dist, 'deploy/native.mime.types'))
console.log('Native offline deployment ready: no Docker/Node/npm needed on the target.')
