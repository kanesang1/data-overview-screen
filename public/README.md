# 数据总览大屏：源码维护、打包与部署

## 1. 选择流程

**拿到源码**：准备 Node.js 22+ → `npm ci` → 修改与验证 → `npm run package` → 交付 `artifacts/dashboard-production.tar.gz` 及 SHA256。

**拿到交付包**：准备目标机器运行环境 → 解压整个包 → 配置后端 → 根据操作系统执行启动脚本。部署机无需 Node、npm、Nginx 或 Compose，也不编译源码。

| 模式 | 行为 | Linux 参数 | Windows 参数 |
| --- | --- | --- | --- |
| auto（默认） | 先拉 Docker Hub，失败尝试 ECR，再失败则校验并导入随包镜像 | `--mode auto` | `-Mode auto` |
| offline | 不执行 pull；强制校验、导入对应架构的随包镜像 | `--mode offline` | `-Mode offline` |
| online | 尝试在线源，失败即退出，不回退本地镜像 | `--mode online` | `-Mode online` |

严格隔离网请明确选择 offline，不等待网络超时。auto 根据实际拉取结果判断是否可联网，不靠 ping。`OFFLINE_IMAGE_SOURCE` 可指定自己的可信镜像地址；设置后在线模式仅尝试该地址。正常用户无需设置代理或环境变量。

这里“离线”指前端和 Web 服务无需互联网镜像仓库；展示业务数据仍需可访问的业务后端和有效登录凭证。本包不包含后端、数据库、管理平台、Docker 安装程序或 WSL 安装程序。

## 2. 目标机器准备

### Linux

本机 Docker Engine 20.10+，Linux AMD64/x86_64 或 ARM64/aarch64，具备 `sh`、`sha256sum`，当前用户有 Docker 权限。先运行 `docker info`，确认服务端可用。脚本使用 host 网络，仅支持本机原生 Docker Engine；不要连接远程 daemon，也不要在 Windows Git Bash 中运行此脚本。

### Windows

使用符合 [Docker Desktop 系统要求](https://docs.docker.com/desktop/setup/install/windows-install/) 的 Windows 客户端，安装 Docker Desktop，启用硬件虚拟化、WSL2，切换为 **Linux containers** 并启动引擎。PowerShell 5.1+。通过 `docker info --format '{{.OSType}}/{{.Architecture}}'` 检查，必须返回 `linux/x86_64`、`linux/amd64` 或对应 ARM64 架构。

Windows 使用 Linux 镜像是因为 Docker Desktop 通过 Linux 虚拟机运行它们；不能切换到 Windows containers 后导入本包。Windows ARM64 还须安装适用于该架构且受支持的 Docker Desktop。

**全新离线 Windows 机器**：在联网准备阶段下载适配的 Docker Desktop 安装程序、WSL 安装包和所需系统组件，按组织流程安装、重启并验证引擎，然后再断网部署。单有本项目的 tar 镜像不能安装 Docker/WSL。Windows Server 不支持 Docker Desktop；可准备 Linux 虚拟机及 Docker Engine，在虚拟机内使用 Linux 流程，网络需允许客户端访问虚拟机 8082 端口。本项目没有提供 Windows 原生 Nginx/Windows 容器方案。

两种平台都需要预留解压、镜像导入及旧版备份空间，并允许用户访问部署端口。首次安装 Docker 的准备工作应在交付前完成。

## 3. 解包和启动

维护者也可以直接交付完整 `dist` 文件夹。不要只复制 `index.html`、不要在源码的 `deploy/` 目录执行启动脚本。

### Linux

```sh
sha256sum -c dashboard-production.tar.gz.sha256
mkdir -p /opt/dashboard
tar -xzf dashboard-production.tar.gz -C /opt/dashboard
cd /opt/dashboard
# 先按第 4 节配置后端
sh start.sh --mode offline   # 隔离环境
# 或 sh start.sh             # 默认先联网，失败回退
# 或 sh start.sh --mode online
```

默认访问 `http://服务器IP:8082/`。修改 `deploy/nginx.offline.conf` 的 `listen` 后重启，脚本会读取新端口。Linux host 网络无需 `-p` 端口映射。

### Windows（PowerShell）

```powershell
$expected = ((Get-Content .\dashboard-production.tar.gz.sha256 -Raw).Trim() -split '\s+')[0]
if ((Get-FileHash .\dashboard-production.tar.gz -Algorithm SHA256).Hash -ne $expected) { throw '交付包校验失败' }
New-Item -ItemType Directory -Force C:\Apps\dashboard
tar -xzf .\dashboard-production.tar.gz -C C:\Apps\dashboard
Set-Location C:\Apps\dashboard
# 先按第 4 节配置后端
powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Mode offline
# 自动模式：powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1
# 强制在线：powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Mode online
# 改宿主机端口：powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Mode offline -Port 8090
```

也可双击 `start.cmd` 使用默认 auto 模式；命令行执行 `start.cmd -Mode offline` 可强制离线。Bypass 仅对该次 PowerShell 进程有效，不修改全局策略；若组织策略禁止运行脚本，须按组织要求签名或放行脚本。

默认访问 `http://localhost:8082/`，其他电脑使用 Windows 宿主机 IP。Windows 使用端口映射和 `host.docker.internal`，无需开启 Docker Desktop host networking。将目录放在 Docker 可共享的本地磁盘上，路径包含空格也支持，启动后不能移动挂载目录。

启动脚本检查镜像架构、Nginx 配置、容器运行状态、`/health`、首页和文案 JSON。在线拉取失败、归档损坏、Nginx 配置失败时不删除旧容器；配置验证后才替换本脚本创建的同名容器。容器启动后的故障不会自动回滚，按第 7 节恢复旧版。

默认容器名 `data-overview-offline`，保留旧版名称以支持升级。自定义名称：Linux `--name dashboard-test`，Windows `-Name dashboard-test`；同时部署多个实例还需配置不同端口。同名容器没有本项目标签时脚本拒绝替换。Docker 重启后容器自动恢复；Windows 须确保 Docker Desktop 已启动，这不是 Windows 系统服务安装脚本。

## 4. 后端、端口和业务配置

| 目标 | 修改文件 | 默认后端 | 页面端口 |
| --- | --- | --- | --- |
| Linux | `deploy/nginx.offline.conf` | `127.0.0.1:8080`，host 网络下是 Linux 宿主机 | 修改文件的 `listen 8082;` |
| Windows | `deploy/nginx.windows.conf` | `host.docker.internal:8080`，指向 Windows 宿主机 | `-Port 8082`，映射到配置中的 listen 端口 |

后端不在本机时，将 upstream 中的 `server` 改成实际内网 IP 或可解析域名，例如 `server 192.168.1.20:8080 max_fails=1 fail_timeout=5s;`。后端在其他容器中时，先将业务端口发布到宿主机，或改为可达内网地址。Windows 后端须允许从 Docker Desktop 网络访问；仅监听回环地址或防火墙拦截时可能不可达。

默认只连接本机后端，不内置公网备用地址。需要主备时取消模板中的 backup 注释并填入真实地址。连接错误、超时和 502/503/504 可切换备用；401/403 不切换，不开启非幂等请求重试。修改后重新启动部署脚本。通过域名配置的后端须在容器内可解析，否则 Nginx 检查会失败。

浏览器 API 默认使用同源 `/api/bi/`，由 Nginx 转发。生产前端环境变量在构建时写入，目标机器修改 `.env` 不会改变已构建页面。首页检查成功不表示业务后端或登录验证已经通过。

## 5. 交付目录

```text
dashboard/                         # dist 的内容，解包后不要再套一层 dist
├── start.sh / deploy.sh            # Linux
├── start.ps1 / deploy.ps1          # Windows PowerShell
├── start.cmd                      # Windows 双击入口
├── README.md
├── index.html / assets/
├── config/dashboard-labels.json
├── deploy/nginx.offline.conf       # Linux 配置
├── deploy/nginx.windows.conf       # Windows 配置
└── images/
    ├── nginx-linux-amd64.tar
    ├── nginx-linux-amd64.tar.sha256
    ├── nginx-linux-arm64.tar
    └── nginx-linux-arm64.tar.sha256
```

脚本按 Docker 服务端 CPU 架构选择镜像，不能把 AMD64 的 tar 改名冒充 ARM64。离线模式即使本机已有同名镜像，也会验证并导入随包版本。在线模式拉取的标签可能更新，严格复现请使用经过验收的离线包。Nginx 只开放页面、assets 和文案 JSON，不公开镜像、配置和脚本。

## 6. 从源码维护与打包

### 环境与依赖

```sh
git clone --branch off git@172.16.20.107:pku-cs/data-overview-screnn.git
cd data-overview-screnn
node --version                 # 22 或更新
npm ci                        # 按 package-lock.json 安装，首次需要联网
npm run dev                   # 开发服务器
```

Windows nvm：`nvm install 22.20.0` → `nvm use 22.20.0` → `node --version`。Linux nvm：安装并切换 Node 22 后验证。构建入口也支持 `BUILD_NODE` 指向新版 node 的绝对路径，或 `.tools/node/node.exe` / `.tools/node/node`；仓库不附带 Node。

**源码离线构建**不同于**离线部署**：前者还需要 Node、npm 和依赖。维护者应在相同操作系统/CPU 的联网机器上为当前 lockfile 准备 npm 缓存，并实际验证 `npm ci --offline` 成功后再交付。不能跨 Windows/Linux 直接复制 node_modules，Vite 等依赖可能含平台专用二进制。通常推荐联网机器构建、隔离机器只部署。

### 修改内容

| 文件 | 维护内容 | 是否重新构建 |
| --- | --- | --- |
| `src/` | Vue 页面、逻辑、样式、接口处理 | 是 |
| `public/config/dashboard-labels.json` | 展示标题、字段名、单位 | 源码发布需构建；现场改交付包同名文件只需刷新 |
| `.env.production.local` | 本机生产配置，如 `VITE_ADMIN_URL` | 是，该文件不提交 |
| `.env.development` / `.env.test` | 开发/测试环境默认值 | 是 |
| `deploy/nginx.*.conf` | 对应部署方式的后端地址、Web 配置 | 源码发布需重新打包；现场改交付配置后重启 |
| `public/README.md` | 本部署手册 | 重新打包后自动进入 dist |

生产默认使用仓库 `.env.production`（同源 API）。可参考 `.env.example` 添加 `.env.production.local`。所有 `VITE_` 配置可能进入浏览器，不能写密钥。`API_PROXY_TARGET` 只用于 Vite 开发服务器，不控制生产 Nginx。

### 校验、构建和归档

```sh
npm run type-check
npm run build                  # 生产 dist，包含两种架构镜像
npm run build:dev              # 开发配置交付包
npm run build:test             # 测试配置交付包
npm run package                # 重新生产构建 + artifacts/dashboard-production.tar.gz 和 SHA256
npm run package -- test        # 重新测试构建 + artifacts/dashboard-test.tar.gz 和 SHA256
```

`package` 需要系统 `tar`（现代 Windows 和常见 Linux 已提供），同一模式重复运行会覆盖 artifacts 下的同名归档；正式发版请另存带版本号的目录，记录源码 commit、构建模式、现场配置及包的 SHA256。`npm run build:web` 仅生成网站，用于已有 Web 服务或传统 Dockerfile，**不生成完整离线部署包**。

### 镜像版本管理

`.offline-images/` 的两份 tar、校验文件与 manifest 直接提交 Git，不依赖 LFS。首次克隆会下载约 100 MB 原始归档。正常修改界面后执行 build/package 即可，**无需 Docker，也无需重复 prepare:images**。构建会验证两份归档；缺失/损坏时明确失败。

仅在更新基础镜像或修复损坏归档时，由联网维护者启动 Docker Linux 引擎并执行：

```sh
npm run prepare:images
npm run package
git add .offline-images
# 同时提交相关脚本/文档修改，审核后推送
```

默认镜像 `nginx:1.27-alpine`；Docker Hub 不可访问会尝试 [Docker 官方镜像的 ECR 分发源](https://www.docker.com/blog/news-from-aws-reinvent-docker-official-images-on-amazon-ecr-public/)。如需指定源：

```powershell
# Windows，仅当前会话生效
$env:OFFLINE_IMAGE_SOURCE = 'public.ecr.aws/docker/library/nginx:1.27-alpine'
npm run prepare:images
Remove-Item Env:OFFLINE_IMAGE_SOURCE
```

```sh
# Linux，仅本次命令生效
OFFLINE_IMAGE_SOURCE=public.ecr.aws/docker/library/nginx:1.27-alpine npm run prepare:images
```

准备脚本检查平台，输出来源、镜像 ID/digest 和 SHA256。必须一起提交两份 tar、校验和 manifest。SHA256 防止传输损坏，不是镜像安全审计。镜像升级需同步改准备脚本、Linux/Windows 部署脚本、Dockerfile、相关 Compose/文档引用并重新验收。

仓库历史 `dist.rar` 是旧包，不作为当前交付依据。新包由当前源码生成，`dist/` 和 `artifacts/` 不提交，避免出现多个不同版本的交付入口。

### 传统 Dockerfile / Compose

根目录 Dockerfile 和 docker-compose.yml 保留用于开发/测试的联网源码镜像构建：`docker compose --profile test up -d --build` 或 `--profile dev`。它们需要 Node 基础镜像与 npm 网络，使用 `nginx.test.conf` / `nginx.dev.conf`，不是本手册的离线交付入口。历史 `deploy/docker-compose.server.yml` 也不自动导入离线包；新交付统一用 start 脚本。

## 7. 日常维护、更新与回退

文案现场修改 `config/dashboard-labels.json` 后刷新浏览器即可。保持英文键名、层级和合法 JSON，只改显示值；单位文字不会换算数据。包括 `pageHeader`、`leftTop`、`leftBottom`、`rightTop`、`rightBottom`、`centerOverview`、`centerTree`、`common`。现场变更同步回源码 public 同名文件，防止下次发布覆盖。

管理平台按钮优先使用 URL 中经过编码的 `returnUrl`（完整 HTTP(S) 地址），例如 `http://大屏地址/?returnUrl=https%3A%2F%2Fadmin.example.com%2F#/`；未传时用构建时 `VITE_ADMIN_URL`。两者均未提供时页面提示从管理端进入，修改兜底值需要重新构建。

更新时将新包解压到独立版本目录，复制并核对现场后端/文案配置，安排维护窗口，在新目录运行启动脚本。旧目录保留；失败时在旧目录重新运行 `offline` 模式恢复旧页面与镜像。不在运行目录直接覆盖上传，避免新旧 assets 混用。脚本校验失败不会自动删除旧容器，但完成替换后不提供事务式自动回滚。

两种系统通用（自定义名称时替换）：

```sh
docker ps -a --filter name=data-overview-offline
docker logs --tail 100 data-overview-offline
docker exec data-overview-offline nginx -t
docker stop data-overview-offline
docker start data-overview-offline
```

停止不会删除目录或镜像。上线验收还需从实际客户端打开首页、登录后检查业务数据和管理平台跳转，并检查目标机防火墙；脚本的静态探活不会替代这些验收。

## 8. 常见故障

| 现象 | 处理 |
| --- | --- |
| Node 版本过旧 | 用 nvm 切换到 22+，重新打开终端检查 node --version |
| dockerDesktopLinuxEngine 管道不存在 | 启动 Docker Desktop，确认 Linux 引擎就绪；不要只确认 GUI 打开 |
| Docker 启动时 stale socket | 退出 Docker，备份本用户 LocalAppData/Docker/run 后重启；保留数据盘，不执行恢复出厂设置 |
| Docker Hub 超时 | auto 会尝试 ECR、再回退随包镜像；隔离网直接 offline |
| 离线 tar 缺失或 SHA256 不匹配 | 重新完整获取源码/交付包，不能删校验绕过；在线维护者可重新准备镜像 |
| Windows containers / 架构不匹配 | 使用 Linux 引擎，检查 Docker 服务端平台与包内架构 |
| 端口占用 | Windows 改 -Port；Linux 改对应 Nginx listen，然后重启 |
| 本机能打开，其他电脑不能 | 检查 Windows/Linux 防火墙、路由和虚拟机端口；脚本不自动修改防火墙 |
| 首页正常，业务 401/403 | 检查登录凭证与后端授权 |
| 业务 502/504 | 检查正确平台的 Nginx upstream、后端监听、防火墙和 DNS |
| Docker 无法挂载文件 | 确认使用本机 Docker、本地完整解压目录以及 Docker 文件共享权限 |

网络依据：[Docker Desktop 网络说明](https://docs.docker.com/desktop/features/networking/networking-how-tos/)、[Linux host 网络说明](https://docs.docker.com/engine/network/drivers/host/)。
