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

```sh
npm run build              # dist：前端、双架构镜像、校验、Windows/Linux 脚本和文档
npm run package            # 重新构建，输出 artifacts/dashboard-production.tar.gz 和 SHA256
npm run package -- test    # 测试环境交付包
```

仓库直接保存 `.offline-images/` 的两份镜像归档和 SHA256（普通 Git 二进制文件，不依赖 Git LFS）。正常克隆后可以直接构建，构建不调用 Docker、不联网下载镜像。**只有维护者更新基础镜像时**才执行 `npm run prepare:images`，并将两份归档、校验和 manifest 一起提交。源码离线构建仍需事先具备 Node 和 npm 依赖。

## 部署已构建的 dist

| 目标机器 | 自动：先拉镜像，失败回退离线 | 强制离线 |
| --- | --- | --- |
| Linux + 本机 Docker Engine | `sh start.sh` | `sh start.sh --mode offline` |
| Windows + Docker Desktop Linux 引擎 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1` | `powershell -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Mode offline` |

在解压后的目录内执行，默认端口 8082。部署机无需 Node/npm/Compose；Docker 和 Windows 的 WSL2 等运行环境须提前安装好。Windows 原生容器模式、Windows Server 上的 Docker Desktop 不在本方案支持范围；Windows Server 请使用 Linux 虚拟机并按 Linux 流程部署。

历史 `dist.rar` 是旧版产物，**不要再用它交付**。以当前提交执行 `npm run package` 生成的包为准；生成的 `dist/`、`artifacts/` 不入 Git。
