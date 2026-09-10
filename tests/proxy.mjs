import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

// Usage: node tests/proxy.mjs <path to nginx executable>
const binary = process.argv[2]
if (!binary) throw new Error('Pass an Nginx executable for the integration test')
for (const name of ['native', 'offline', 'windows', 'dev', 'test']) {
  const config = await readFile(`deploy/nginx.${name}.conf`, 'utf8')
  assert.match(config, /location \/api\/\s*\{/)
  assert.match(config, /proxy_set_header Authorization \$http_authorization;/)
  assert.doesNotMatch(config, /proxy_set_header Host \$proxy_host;/)
  assert.doesNotMatch(config, /8\.148\.14\.229/)
}
const calls = []
const backend = createServer(async (req, res) => {
  let body = ''
  for await (const chunk of req) body += chunk
  calls.push({ path: req.url, authorization: req.headers.authorization, body })
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ code: 200 }))
})
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve))
const front = createServer()
await new Promise(resolve => front.listen(0, '127.0.0.1', resolve))
const port = front.address().port
await new Promise(resolve => front.close(resolve))
const directory = resolve('artifacts/proxy-test-' + Date.now())
await mkdir(directory + '/logs', { recursive: true })
await copyFile('deploy/native.mime.types', directory + '/native.mime.types')
const config = (await readFile('deploy/nginx.native.conf', 'utf8'))
  .replace('127.0.0.1:8080', '127.0.0.1:' + backend.address().port)
  .replace('listen 80;', 'listen 127.0.0.1:' + port + ';')
await writeFile(directory + '/nginx.conf', config)
const args = ['-p', directory.replaceAll('\\', '/') + '/', '-c', 'nginx.conf']
const run = extra => {
  const result = spawnSync(resolve(binary), [...args, ...extra], { windowsHide: true, encoding: 'utf8', timeout: 10000 })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
}
let started = false
try {
  run(['-t'])
  const child = spawn(resolve(binary), args, { windowsHide: true, stdio: 'ignore' })
  await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject) })
  child.unref()
  started = true
  const base = 'http://127.0.0.1:' + port
  for (let attempt = 0; ; attempt++) {
    try { await fetch(base + '/health'); break } catch (error) {
      if (attempt >= 30) throw error
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'test', password: 'test' }) })
  await fetch(base + '/api/dataset-assets/usage-summary', { headers: { Authorization: 'Bearer proxy-test' } })
  await fetch(base + '/api/bi/data-overview', { headers: { Authorization: 'Bearer proxy-test' } })
  assert.deepEqual(calls.map(call => call.path), ['/api/auth/login', '/api/dataset-assets/usage-summary', '/api/bi/data-overview'])
  assert.equal(JSON.parse(calls[0].body).username, 'test')
  assert.equal(calls[1].authorization, 'Bearer proxy-test')
  assert.equal(calls[2].authorization, 'Bearer proxy-test')
  console.log('PASS: production Nginx forwards login body, ranking token and existing BI routes to a same-machine backend')
} finally {
  if (started) run(['-s', 'quit'])
  backend.closeAllConnections()
  await new Promise(resolve => backend.close(resolve))
}
