import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { loadDashboardLabels } from '@/config/dashboard-labels'
import './styles/index.css'

async function bootstrap() {
  await loadDashboardLabels()
  createApp(App).use(router).mount('#app')
}

void bootstrap()
