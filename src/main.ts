import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadDashboardLabels } from '@/config/dashboard-labels'
import './styles/index.css'
import { captureEntryToken, ensureAccessToken } from '@/api/auth'

async function bootstrap() {
  captureEntryToken()
  await Promise.all([loadDashboardLabels(), ensureAccessToken().catch(() => {
    console.error('[大屏登录] 登录失败，模块加载时可重试')
  })])
  createApp(App).use(router).mount('#app')
}

void bootstrap()
