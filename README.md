# 数据总览大屏

基于 Vue 3、TypeScript、Vite、Axios 与 ECharts 的数据可视化大屏。

## API 与环境配置

浏览器统一请求 `/api/bi/`，开发时由 Vite、部署后由 Nginx 转发至：

```text
http://8.148.14.229:8080/api/bi/
```

环境文件：

- `.env.development`：开发环境
- `.env.test`：测试环境
- `.env.example`：配置示例

请求示例：

```ts
import { http } from '@/api'

const data = await http.get<MyResponse>('dashboard/overview', {
  params: { date: '2026-09-04' },
})
```

传入的接口路径不要重复书写 `api/bi`。完整请求会被组合为
`/api/bi/dashboard/overview`。

Axios 实例位于 `src/api/http.ts`，已配置请求超时、Bearer Token 注入和统一错误类型。
默认从 `localStorage.access_token` 读取 Token，也可以通过 `setAccessTokenGetter` 替换。

## 本地运行

```bash
npm install
npm run dev        # 开发环境，默认 http://localhost:5173
npm run dev:test   # 使用测试环境配置
```

构建命令：

```bash
npm run build:dev
npm run build:test
```

## Docker + Nginx 部署

Nginx 配置同样按环境隔离：

- `deploy/nginx.dev.conf`：开发环境，关闭静态资源缓存
- `deploy/nginx.test.conf`：测试环境，启用静态资源缓存

Compose 构建时会自动选择对应的 Nginx 配置。两套配置目前都将 API 转发到同一个后端地址，后续可以独立修改。

开发环境部署到宿主机 `8081` 端口：

```bash
docker compose --profile dev up -d --build
```

测试环境部署到宿主机 `8082` 端口：

```bash
docker compose --profile test up -d --build
```

也可以同时部署：

```bash
docker compose --profile dev --profile test up -d --build
```

访问地址分别为 `http://服务器IP:8081` 和 `http://服务器IP:8082`，健康检查地址为
`/health`。服务器防火墙或云安全组需放行相应端口。
