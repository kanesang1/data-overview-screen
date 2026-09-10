// Maintainer-only preparation. Targets and ordinary builds never invoke Docker or download files.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
const root = resolve(import.meta.dirname, '..')
const dir = resolve(root, '.offline-native')
await mkdir(resolve(dir, 'licenses'), { recursive: true })
const runtimes = []
async function download(url) {
  // curl uses the workstation's proxy configuration and CA store.
  return execFileSync('curl.exe'.replace('.exe', process.platform === 'win32' ? '.exe' : ''), ['--fail', '--location', '--silent', '--show-error', '--max-time', '120', url], { maxBuffer: 30 * 1024 * 1024 })
}
async function save(file, data, details) {
  const sha256 = createHash('sha256').update(data).digest('hex')
  await writeFile(resolve(dir, file), data)
  await writeFile(resolve(dir, file + '.sha256'), sha256 + '\n')
  runtimes.push({ file, sha256, ...details })
}
const windowsVersion = '1.28.3'
const windowsUrl = `https://nginx.org/download/nginx-${windowsVersion}.zip`
await save('nginx-windows.zip', await download(windowsUrl), { platform: 'windows-x86', version: windowsVersion, source: windowsUrl })
const images = JSON.parse(await readFile(resolve(root, '.offline-images/manifest.json'), 'utf8'))
for (const arch of ['amd64', 'arm64']) {
  const archive = resolve(root, `.offline-images/nginx-linux-${arch}.tar`)
  const entry = images.images.find(image => image.platform === 'linux/' + arch)
  if (!entry || createHash('sha256').update(await readFile(archive)).digest('hex') !== entry.sha256) throw new Error('Image checksum mismatch: ' + arch)
  execFileSync('docker', ['load', '-i', archive], { stdio: 'inherit' })
  // Dereference only the libraries needed by nginx. Avoid copying a whole rootfs
  // or relying on the host's glibc/dynamic loader. No container is needed at deployment.
  const loader = arch === 'amd64' ? 'x86_64' : 'aarch64'
  const files = [`lib/ld-musl-${loader}.so.1`, 'usr/lib/libpcre2-8.so.0', 'usr/lib/libssl.so.3', 'usr/lib/libcrypto.so.3', 'usr/lib/libz.so.1', 'usr/sbin/nginx', 'usr/share/licenses/nginx/COPYRIGHT']
  const data = execFileSync('docker', ['run', '--pull=never', '--rm', '--network', 'none', '--platform', 'linux/' + arch, '--entrypoint', 'tar', entry.imageId, '-chzf', '-', '-C', '/', ...files], { maxBuffer: 30 * 1024 * 1024 })
  const packages = execFileSync('docker', ['run', '--pull=never', '--rm', '--network', 'none', '--platform', 'linux/' + arch, '--entrypoint', 'apk', entry.imageId, 'info', '-v'], { encoding: 'utf8' }).trim().split('\n').filter(line => /^(nginx|musl|pcre2|libssl3|libcrypto3|zlib)-\d/.test(line))
  await save(`nginx-linux-${arch}.tar.gz`, data, { platform: 'linux/' + arch, imageId: entry.imageId, source: entry.source, packages })
}
const licenses = {
  'musl-COPYRIGHT': 'https://git.musl-libc.org/cgit/musl/plain/COPYRIGHT',
  'pcre2-LICENCE': 'https://raw.githubusercontent.com/PCRE2Project/pcre2/pcre2-10.43/LICENCE',
  'openssl-LICENSE': 'https://raw.githubusercontent.com/openssl/openssl/openssl-3.3.3/LICENSE.txt',
  'zlib-LICENSE': 'https://raw.githubusercontent.com/madler/zlib/v1.3.1/LICENSE',
}
for (const [name, url] of Object.entries(licenses)) await writeFile(resolve(dir, 'licenses', name), await download(url))
await writeFile(resolve(dir, 'manifest.json'), JSON.stringify({ runtimes, licenseSources: licenses }, null, 2) + '\n')
console.log('Native runtimes prepared; commit .offline-native as a complete set.')
