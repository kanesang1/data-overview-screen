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

右上角“管理平台”按钮优先使用 `window.location.search` 中的 `returnUrl` 参数，
通过 `window.location.assign` 在当前标签页回到管理端，不额外拼接 token。
例如：`http://localhost:5173/?token=example&returnUrl=https%3A%2F%2Fadmin.example.com%2F#/`。

直接打开或收藏大屏时，可在对应环境文件（或 `.env.development.local` / `.env.test.local`）
中设置 `VITE_ADMIN_URL=https://admin.example.com/` 作为兜底地址。该配置在构建时注入，
修改后需重启开发服务或重新打包。两者都未提供时，点击按钮提示“请从管理端进入”；
地址必须为完整的 HTTP(S) URL。

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

Compose 构建时会自动选择对应的 Nginx 配置。容器通过
`host.docker.internal:host-gateway` 访问服务器本机的 `8080` 后端服务，不依赖服务器公网 IP。

从完整源码直接部署开发环境时，默认使用服务器 `80` 端口：

```bash
docker compose --profile dev up -d --build
```

如需改为其他端口：

```bash
DEV_PORT=8081 docker compose --profile dev up -d --build
```

测试环境部署到宿主机 `8082` 端口：

```bash
docker compose --profile test up -d --build
```

也可以同时部署：

```bash
docker compose --profile dev --profile test up -d --build
```

健康检查地址为 `/health`。服务器防火墙或云安全组需放行所使用的宿主机端口。

## 使用打包产物部署到服务器

`npm run build:dev` 会在 `dist/deploy` 中自动生成服务器所需的 Compose 和 Nginx 配置。

每次发布流程：

1. 在开发机重新构建：

   ```bash
   npm install
   npm run build:dev
   ```

2. 将 `dist` 目录中的全部内容上传到服务器 `/opt/dashboard`。可以使用 MobaXterm 上传，
   或在 PowerShell 中运行：

   ```powershell
   scp -r .\dist\* root@8.148.14.229:/opt/dashboard/
   ```

3. 登录服务器，执行自动部署脚本：

   ```bash
   cd /opt/dashboard
   bash deploy.sh
   ```

   脚本默认部署开发环境并使用服务器 80 端口。需要覆盖时可以传入环境变量：

   ```bash
   WEB_PORT=8081 NGINX_ENV=dev bash deploy.sh
   ```

   脚本会自动校验部署文件、拉取镜像、更新容器、等待健康检查并验证 API 代理；失败时
   自动输出最近 100 行容器日志。

4. 验证发布：

   ```bash
   docker compose ps
   curl -f http://127.0.0.1/health
   curl -f http://127.0.0.1/api/bi/data-source
   ```

5. 如需查看日志或回退前排查：

   ```bash
   docker compose logs --tail=100 dashboard
   ```

后续仅修改 `config/dashboard-labels.json` 时不需要重建或重启容器，上传该文件并刷新页面即可。

## 打包后修改界面文案

界面标题、接口字段中文名称和单位按页面模块配置在：

```text
public/config/dashboard-labels.json
```

构建后对应文件为 `dist/config/dashboard-labels.json`。配置按 `leftTop`、`leftBottom`、
`rightTop`、`rightBottom`、`centerOverview` 和 `centerTree` 等模块划分；已接入接口的字段键尽量保持与后端
DTO 一致，未接入接口的模块只配置标题，不包含 mock 数据。

通过本项目的 Docker Compose 部署时，该配置会从宿主机只读挂载到容器中。修改宿主机的
`public/config/dashboard-labels.json` 后刷新页面即可生效，无需重新构建镜像。
