import axios from 'axios'
import { appConfig } from '@/config/env'

let pendingLogin: Promise<string> | undefined

export function readAccessToken(): string | null {
  return localStorage.getItem('access_token')
}

/** 管理端通过 URL 传入的 token 优先于本地缓存。 */
export function captureEntryToken() {
  const url = new URL(window.location.href)
  const token = url.searchParams.get('token') || url.searchParams.get('access_token')
  if (token) {
    localStorage.setItem('access_token', token)
    url.searchParams.delete('token')
    url.searchParams.delete('access_token')
    window.history.replaceState(window.history.state, '', url)
  }
}

/** 独立客户端避免登录请求触发自身的鉴权重试。 */
export function login(): Promise<string> {
  if (!pendingLogin) {
    pendingLogin = (async () => {
      const username = import.meta.env.VITE_SCREEN_LOGIN_USERNAME
      const password = import.meta.env.VITE_SCREEN_LOGIN_PASSWORD
      if (!username || !password) throw new Error('未配置大屏登录账号')
      const response = await axios.post('/api/auth/login', { username, password }, { timeout: appConfig.apiTimeout })
      const body = response.data as { code: number; data?: { token?: string } }
      if (body.code !== 200 || !body.data?.token) throw new Error('大屏登录失败')
      localStorage.setItem('access_token', body.data.token)
      return body.data.token
    })().finally(() => { pendingLogin = undefined })
  }
  return pendingLogin
}

export function ensureAccessToken(): Promise<string> {
  const token = readAccessToken()
  return token ? Promise.resolve(token) : login()
}

/** 较晚返回的旧请求复用已刷新的 token，避免重复登录。 */
export function renewAccessToken(rejectedToken?: string): Promise<string> {
  const current = readAccessToken()
  if (current && current !== rejectedToken) return Promise.resolve(current)
  localStorage.removeItem('access_token')
  return login()
}
