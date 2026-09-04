const timeout = Number(import.meta.env.VITE_API_TIMEOUT ?? 15000)

export const appConfig = Object.freeze({
  environment: import.meta.env.VITE_APP_ENV,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/bi/',
  apiTimeout: Number.isFinite(timeout) && timeout > 0 ? timeout : 15000,
})
