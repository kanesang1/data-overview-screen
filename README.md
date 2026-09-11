# 数据总览大屏

Vue 3 + TypeScript + Vite。源码维护、构建及 Windows/Linux 在线/离线部署的完整说明见 **[部署与维护手册](public/README.md)**；该手册随构建进入 `dist/README.md`。

## 从源码开始

```sh
git clone --branch off git@172.16.20.107:pku-cs/data-overview-screnn.git
cd data-overview-screnn
node --version
npm ci
npm run dev
```

Node.js 要求 22 或更新版本。Windows 已使用 nvm 的机器可执行 `nvm install 22.20.0`、`nvm use 22.20.0`，再确认 `node --version`。首次安装依赖需要联网或预先准备完整的 npm 缓存。

## 构建和交付

### 无 Docker：原生 Nginx 离线部署

仓库 `.offline-native/` 包含 Windows Nginx、Linux AMD64/ARM64 Nginx 及必要运行库、校验文件和许可证，随源码一起拉取。目标机器无需安装 Docker、Node.js、npm 或系统 Nginx。

```sh
npm ci                       # 开发电脑首次安装依赖，需要网络或完整 npm 缓存
npm run package:native       # artifacts/dashboard-native-production.tar.gz 和 SHA256
npm run package:native -- test # 测试环境原生交付包
```

完整解压后，在交付目录执行：

| 操作 | Windows PowerShell | Linux |
| --- | --- | --- |
| 启动 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1` | `sh native.sh start` |
| 状态 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action status` | `sh native.sh status` |
| 重载配置 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action reload` | `sh native.sh reload` |
| 停止 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1 -Action stop` | `sh native.sh stop` |

Windows 也可双击 `start-native.cmd`。默认访问 `http://服务器IP/`（80 端口），在 `deploy/nginx.native.conf` 修改 `listen` 端口及 upstream 后端地址（默认 `127.0.0.1:8080`），保存后重载。启动过程不联网，不调用 Docker。

原生 Nginx 是后台进程，默认不注册系统服务或开机自启。Linux 需要常见系统工具、`curl` 或 `wget`，部署目录须可写且允许执行；Windows 需要 PowerShell 5.1+。详细前置条件、解包、升级回退与日志位置见 [原生部署完整说明](public/README.md#原生-nginx-离线部署无-docker)。

### 完整包：同时包含 Docker 与原生入口

```sh
npm run build              # dist：前端、Docker 镜像、原生运行包、脚本和文档
npm run build:dev          # 使用 development 配置生成同样完整的 dist
npm run package            # 重新构建，输出 artifacts/dashboard-production.tar.gz 和 SHA256
npm run package -- development # development 配置的压缩交付包和 SHA256
npm run package -- test    # 测试环境交付包
```

直接交付完整 `dist/` 与交付 `artifacts/*.tar.gz` 都受支持。`package` 会先执行对应模式的 build，再把 `dist` 压缩并生成 SHA256；它不是另一套部署方式。当前使用 development 配置时，可继续执行 `npm run build:dev` 后交付 `dist/`，或执行 `npm run package -- development` 获得便于传输和校验的等价压缩包。

仓库直接保存 `.offline-images/` 的两份镜像归档和 SHA256（普通 Git 二进制文件，不依赖 Git LFS）。正常克隆后可以直接构建，构建不调用 Docker、不联网下载镜像。**只有维护者更新基础镜像时**才执行 `npm run prepare:images`，并将两份归档、校验和 manifest 一起提交。源码离线构建仍需事先具备 Node 和 npm 依赖。

## 部署已构建的 dist

| 目标机器 | 部署方式 | 启动命令 |
| --- | --- | --- |
| Linux + Docker + 有网 | 自动模式（拉取失败会回退到包内镜像） | `sh start.sh` |
| Linux + Docker + 离线 | 强制使用包内镜像 | `sh start.sh --mode offline` |
| Windows + 无 Docker | 使用包内原生 Nginx | `powershell -NoProfile -ExecutionPolicy Bypass -File .\native.ps1` |

上述 start 脚本用于 Linux Docker，在解压后的目录内执行，默认端口 80；`auto`、`online` 和 `offline` 模式均使用该端口。Linux 目标机须提前安装 Docker Engine。Windows 目标机不使用 Docker、Docker Desktop 或 WSL，选择上面的原生 Nginx 入口，默认同样使用 80 端口。Windows Server 使用原生方案仍须根据实际系统兼容性验收。

历史 `dist.rar` 是旧版产物，**不要再用它交付**。以当前提交执行 `npm run package` 生成的包为准；生成的 `dist/`、`artifacts/` 不入 Git。
