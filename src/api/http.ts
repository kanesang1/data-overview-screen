import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { appConfig } from '@/config/env'

export interface ApiErrorData {
  message?: string
  [key: string]: unknown
}

export class ApiError<T = unknown> extends Error {
  constructor(
    message: string,
    public readonly status: number | undefined,
    public readonly data: T | undefined,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type TokenGetter = () => string | null | undefined
let getAccessToken: TokenGetter = () => localStorage.getItem('access_token')

/** 可在应用初始化时替换默认的 token 获取方式。 */
export function setAccessTokenGetter(getter: TokenGetter) {
  getAccessToken = getter
}

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: appConfig.apiTimeout,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorData>) => {
    const message =
      error.response?.data?.message ||
      (error.code === AxiosError.ECONNABORTED ? '接口请求超时' : error.message) ||
      '接口请求失败'

    return Promise.reject(
      new ApiError(message, error.response?.status, error.response?.data, error),
    )
  },
)

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T>(url, config).then((response) => response.data),
  post: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) =>
    apiClient.post<T, AxiosResponse<T>, D>(url, data, config).then((response) => response.data),
  put: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) =>
    apiClient.put<T, AxiosResponse<T>, D>(url, data, config).then((response) => response.data),
  patch: <T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>) =>
    apiClient.patch<T, AxiosResponse<T>, D>(url, data, config).then((response) => response.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config).then((response) => response.data),
}
