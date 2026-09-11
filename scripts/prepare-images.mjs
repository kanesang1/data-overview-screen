import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const root = resolve(import.meta.dirname, '..')
const dir = resolve(root, '.offline-images')
await mkdir(dir, { recursive: true })
const metadata = []
// Connected build machine only. The target server never runs this script.
for (const arch of ['amd64', 'arm64']) {
  const tag = 'nginx:1.27-alpine'
  const target = resolve(dir, 'nginx-linux-' + arch + '.tar')
  const sources = process.env.OFFLINE_IMAGE_SOURCE
    ? [process.env.OFFLINE_IMAGE_SOURCE]
    : [tag, 'public.ecr.aws/docker/library/' + tag]
  let image
  for (const source of sources) {
    try {
      execFileSync('docker', ['pull', '--platform', 'linux/' + arch, source], { stdio: 'inherit' })
      image = source
      break
    } catch { console.error('Could not pull ' + source) }
  }
  if (!image) throw new Error('All image sources failed for linux/' + arch + '. Existing archives have not been replaced for this architecture.')
  execFileSync('docker', ['tag', image, tag], { stdio: 'inherit' })
  const [info] = JSON.parse(execFileSync('docker', ['image', 'inspect', tag], { encoding: 'utf8' }))
  if (info.Os !== 'linux' || info.Architecture !== arch) throw new Error('Image platform mismatch: ' + arch)
  execFileSync('docker', ['save', '-o', target + '.tmp', tag], { stdio: 'inherit' })
  const checksum = createHash('sha256').update(await readFile(target + '.tmp')).digest('hex')
  await rename(target + '.tmp', target)
  await writeFile(target + '.sha256', checksum + '\n')
  metadata.push({ platform: 'linux/' + arch, source: image, imageId: info.Id, repoDigests: info.RepoDigests, sha256: checksum })
}
await writeFile(resolve(dir, 'manifest.json'), JSON.stringify({ tag: 'nginx:1.27-alpine', images: metadata }, null, 2) + '\n')
console.log('Both offline images are ready. Commit .offline-images together with deployment changes.')
