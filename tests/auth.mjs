import { build } from 'esbuild'
import assert from 'node:assert/strict'
import axios from 'axios'
import { pathToFileURL } from 'node:url'

await build({
  stdin: { contents: "export * from './src/api/auth.ts'; export * from './src/api/http.ts'", resolveDir: process.cwd() },
  outfile: 'artifacts/auth-test.mjs', bundle: true, platform: 'node', format: 'esm',
  packages: 'external', alias: { '@': './src' },
  define: { 'import.meta.env': JSON.stringify({ VITE_SCREEN_LOGIN_USERNAME: 'test', VITE_SCREEN_LOGIN_PASSWORD: 'test' }) },
})
const values = new Map()
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
const auth = await import(pathToFileURL(process.cwd() + '/artifacts/auth-test.mjs'))
let logins = 0
axios.defaults.adapter = async config => {
  logins++
  await new Promise(resolve => setTimeout(resolve, 10))
  return { data: { code: 200, data: { token: 'fresh-' + logins } }, status: 200, statusText: 'OK', headers: {}, config }
}
values.set('access_token', 'existing')
assert.equal(await auth.ensureAccessToken(), 'existing')
assert.equal(logins, 0)
values.clear()
assert.deepEqual(await Promise.all([auth.ensureAccessToken(), auth.ensureAccessToken()]), ['fresh-1', 'fresh-1'])
assert.equal(logins, 1)

for (const business401 of [false, true]) {
  values.set('access_token', 'expired')
  let requests = 0
  const before = logins
  auth.apiClient.defaults.adapter = async config => {
    requests++
    const expired = config.headers.get('Authorization') === 'Bearer expired'
    if (expired && !business401) {
      throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { status: 401, data: {}, headers: {}, config })
    }
    return { data: { code: expired ? 401 : 200 }, status: 200, headers: {}, config }
  }
  const results = await Promise.all([auth.http.get('/test'), auth.http.get('/test')])
  assert.ok(results.every(result => result.code === 200))
  assert.equal(logins, before + 1)
  assert.equal(requests, 4)
}
let attempts = 0
auth.apiClient.defaults.adapter = async config => {
  attempts++
  throw new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { status: 401, data: {}, headers: {}, config })
}
await assert.rejects(auth.http.get('/test'))
assert.equal(attempts, 2)
globalThis.window = { location: { href: 'http://localhost/?token=entry&returnUrl=keep' }, history: { state: null, replaceState: (_state, _title, url) => { assert.equal(url.searchParams.get('token'), null); assert.equal(url.searchParams.get('returnUrl'), 'keep') } } }
auth.captureEntryToken()
assert.equal(auth.readAccessToken(), 'entry')
console.log('PASS: entry token, cached token, single-flight login, HTTP/business 401 refresh, bounded retries')
