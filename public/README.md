# 数据总览大屏：构建、打包与部署手册

本文只描述当前实际使用的服务器环境：

| 服务器环境 | 部署方式 | 前端端口 | 启动命令 |
| --- | --- | --- | --- |
| Linux，有 Docker、有网络 | Docker 自动模式 | 80 | `sh start.sh` |
| Linux，有 Docker、无网络 | Docker 离线模式 | 80 | `sh start.sh --mode offline` |
| Windows，无 Docker | 随包原生 Nginx | 80 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1` |

交付包统一在开发/维护电脑上构建。目标服务器只校验、解压、配置和启动，**服务器上不执行 `npm ci`、`npm run build` 或 `npm run package`**。

## 1. 开发电脑：从源码生成交付包

### 1.1 第一次拿到源码

需要 Node.js 22 或更高版本。首次安装依赖需要网络或完整的 npm 缓存。

```sh
git clone --branch off git@172.16.20.107:pku-cs/data-overview-screnn.git
cd data-overview-screnn
node --version
npm ci
```

Windows 使用 nvm 时：

```powershell
nvm install 22.20.0
nvm use 22.20.0
node --version
npm ci
```

仓库必须完整包含 `.offline-images/` 和 `.offline-native/`。正常修改页面和发版时不需要重新下载 Docker 镜像或 Nginx。

### 1.2 构建模式

构建模式决定前端使用哪套 `.env`，与服务器有没有网络无关。

| 配置 | 生成可直接上传的完整 `dist` | 生成压缩包和 SHA256 |
| --- | --- | --- |
| development（当前使用） | `npm run build:dev` | `npm run package -- development` |
| production | `npm run build` | `npm run package` |
| test | `npm run build:test` | `npm run package -- test` |

当前使用 development 配置，推荐执行：

```sh
npm run type-check
npm run package -- development
```

输出：

```text
artifacts/dashboard-development.tar.gz
artifacts/dashboard-development.tar.gz.sha256
```

继续执行 `npm run build:dev` 也可以，生成的完整 `dist/` 可直接上传。必须上传 `dist` 内全部内容，不能只上传 `index.html` 和 `assets/`。

`npm run package -- development` 会重新执行 development 构建，再将完整 `dist` 压缩并生成 SHA256；它和 `npm run build:dev` 使用同一套前端配置，不会自动切换成 production。

一个完整交付包同时包含：

- 前端页面、静态资源和业务文案；
- Linux Docker 在线/离线启动脚本；
- Linux AMD64、ARM64 离线 Nginx 镜像；
- Windows 原生 Nginx 运行包和启动脚本；
- 本部署手册。

所有 `VITE_` 配置都可能进入浏览器产物，不能写服务端密钥。`API_PROXY_TARGET` 仅用于本地 Vite 调试；部署后的后端地址由 Nginx 配置决定。

## 2. Linux 服务器：Docker 部署

### 2.1 检查服务器

Linux 服务器需要本机 Docker Engine、`sh`、`tar` 和 `sha256sum`。后端默认在同机 `127.0.0.1:8080`，前端使用 80 端口。

```sh
docker info
uname -m
ss -lntp | grep ':80 ' || echo '80 port is free'
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}'
```

### 2.2 上传、校验和解压

把 `dashboard-development.tar.gz` 和 `.sha256` 一起上传，例如放到 `/opt/releases/`，然后执行：

```sh
cd /opt/releases
sha256sum -c dashboard-development.tar.gz.sha256
mkdir -p /opt/dashboard-new
tar -xzf dashboard-development.tar.gz -C /opt/dashboard-new
cd /opt/dashboard-new
ls -l start.sh deploy/nginx.offline.conf index.html
```

如果上传的是 `dist` 目录，确保 `/opt/dashboard/` 下直接存在 `start.sh`、`index.html`、`deploy/`、`images/` 和 `native-runtime/`，不要多套一层 `dist`。

### 2.3 配置后端

Linux Docker 使用：

```text
deploy/nginx.offline.conf
```

默认配置：

```nginx
upstream dashboard_backend {
    server 127.0.0.1:8080 max_fails=1 fail_timeout=5s;
}

server {
    listen 80;
}
```

后端也在本机且端口是 8080 时不需要修改。后端地址不同时，只修改 upstream 的 `server`，保留 `listen 80;`。

### 2.4 停止旧前端

先确认 80 端口占用者：

```sh
ss -lntp | grep ':80 '
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}\t{{.Status}}'
```

现场旧前端容器为 `data-overview-dev` 时：

```sh
docker stop data-overview-dev
ss -lntp | grep ':80 ' || echo '80 port is free'
```

不要停止 `data-resource-repo-backend`，它是 8080 端口的业务后端。新版验证成功前可保留已经停止的旧前端容器，以便回滚。

### 2.5 有网络服务器启动

```sh
cd /opt/dashboard-new
sh start.sh
```

默认 auto 模式先尝试 Docker Hub，再尝试公共 ECR；均失败时自动校验并加载包内离线镜像。如果要求在线拉取失败就停止，不允许回退：

```sh
sh start.sh --mode online
```

### 2.6 无网络服务器启动

```sh
cd /opt/dashboard-new
sh start.sh --mode offline
```

offline 模式不执行 `docker pull`，只校验并导入包内对应 CPU 架构的镜像。有网和无网模式使用相同 Nginx 配置，前端都是 80 端口。

### 2.7 验证

```sh
docker ps --filter name=data-overview-offline
docker logs --tail 100 data-overview-offline
curl -i http://127.0.0.1/health
curl -I http://127.0.0.1/
curl -i http://127.0.0.1/api/auth/login
```

浏览器访问：

```text
http://服务器IP/#/
```

首页和 `/health` 返回 200 只表示前端服务正常。API 502/504 表示后端地址、监听或网络异常；API 401/403 表示登录或权限异常。登录接口不应返回 Tomcat 的 HTML 400；当前配置使用合法 Host 转发，避免后端因上游组名包含下划线而拒绝请求。

## 3. Windows 服务器：无 Docker，原生 Nginx

Windows 服务器不安装 Docker、Docker Desktop、WSL、Node.js 或 npm。需要 PowerShell 5.1+，80 端口可用，后端默认在同机 `127.0.0.1:8080`。

### 3.1 上传、校验和解压

在 PowerShell 中进入上传目录后执行：

```powershell
$package = 'dashboard-development.tar.gz'
$expected = ((Get-Content ".\$package.sha256" -Raw).Trim() -split '\s+')[0]
$actual = (Get-FileHash ".\$package" -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw '交付包 SHA256 校验失败' }

New-Item -ItemType Directory -Force C:\Apps\dashboard-new | Out-Null
tar -xzf ".\$package" -C C:\Apps\dashboard-new
Set-Location C:\Apps\dashboard-new
Get-Item .\native.ps1, .\deploy\nginx.native.conf, .\index.html
```

### 3.2 配置后端

Windows 原生 Nginx 使用：

```text
deploy/nginx.native.conf
```

默认 upstream 是 `127.0.0.1:8080`，前端 `listen 80;`。后端在同机 8080 时无需修改；后端不在本机时改为实际内网 IP 或域名。

### 3.3 停止旧版并启动新版

旧版也是本项目原生 Nginx 时，进入旧目录停止：

```powershell
Set-Location C:\Apps\dashboard-old
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action stop
Get-NetTCPConnection -LocalPort 80 -State Listen -ErrorAction SilentlyContinue
```

返回为空表示 80 端口已释放。启动新版：

```powershell
Set-Location C:\Apps\dashboard-new
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1
```

查看状态、重载配置和停止：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action status
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action reload
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action stop
```

也可双击 `start-native.cmd` 启动。原生 Nginx 默认不是 Windows 服务，系统重启后需要重新启动，或由运维配置计划任务。

### 3.4 验证

```powershell
Invoke-WebRequest http://127.0.0.1/health -UseBasicParsing
Invoke-WebRequest http://127.0.0.1/ -UseBasicParsing
Get-Content .\logs\native-error.log -Tail 100 -ErrorAction SilentlyContinue
```

浏览器访问 `http://服务器IP/#/`。启动失败时检查 `logs/native-error.log` 和 80 端口占用：

```powershell
Get-NetTCPConnection -LocalPort 80 -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess
Get-Process -Id (Get-NetTCPConnection -LocalPort 80 -State Listen).OwningProcess
```

确认进程身份后使用旧服务自己的停止方式关闭，不要批量结束所有 `nginx.exe`。

## 4. 更新和回滚

新版本必须解压到独立目录，不要覆盖正在运行的旧目录。统一流程：

1. 校验并解压新包；
2. 核对后端地址与 `config/dashboard-labels.json`；
3. 停止旧版，释放 80 端口；
4. 在新目录启动并验证新版；
5. 稳定后再清理旧目录和旧容器。

Linux 回滚：

```sh
docker stop data-overview-offline
cd /opt/dashboard-old
sh start.sh --mode offline
```

Windows 回滚：

```powershell
Set-Location C:\Apps\dashboard-new
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action stop
Set-Location C:\Apps\dashboard-old
powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1
```

## 5. 现场配置和排错

展示文案位于 `config/dashboard-labels.json`。只修改显示值并保持 JSON 合法，保存后刷新浏览器即可；现场修改要同步回源码的 `public/config/dashboard-labels.json`，避免下次部署覆盖。

| 现象 | 检查 |
| --- | --- |
| 80 端口占用 | Linux：`ss -lntp \| grep ':80 '`；Windows：`Get-NetTCPConnection -LocalPort 80 -State Listen` |
| 首页打不开 | 服务状态、防火墙、安全组、80/TCP |
| 首页正常，API 502/504 | Nginx upstream、后端 8080、后端容器、防火墙 |
| 登录返回 HTML 400 | 检查是否使用最新 Nginx 配置；Host 不能是带下划线的 `dashboard_backend` |
| API 401/403 | 登录账号、密码、token、后端授权 |
| Linux 离线镜像校验失败 | 重新上传完整包和 SHA256，不要绕过校验 |
| Windows 原生启动失败 | `logs/native-error.log` |
| Windows 重启后页面不可用 | 重新执行 `native.ps1` 或检查计划任务 |

## 6. 更新离线运行资源

正常页面修改和发版不执行本节命令。只有升级基础 Nginx 镜像或原生运行包时，维护者才在有网络且具备 Docker 的电脑执行：

```sh
npm run prepare:images
npm run prepare:native
```

更新后必须将 `.offline-images/`、`.offline-native/` 中的运行包、manifest、许可证和 SHA256 一起提交，并重新打包和验收。
