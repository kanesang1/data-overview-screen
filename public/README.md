# 数据总览大屏：Docker 完全离线部署

## 1. 直接部署

适用：Linux x86_64 或 ARM64，已经安装并启动 Docker 20.10 或更新版本，当前用户有 Docker 使用权限。无需 Node.js、npm、Nginx、Docker Compose、curl，也无需连接互联网。Docker 使用本机 daemon，勿将 DOCKER_HOST 指向其他服务器。

将整个 dist 目录复制到服务器（例如 /opt/dashboard），在目录内执行：

```sh
sh start.sh
# 等效：sh deploy.sh
```

默认访问 **http://服务器IP:8082/**。服务器有图形桌面时可将 start.sh 设为可执行后选择“在终端中运行”；无桌面服务器使用上面的命令。脚本结束后容器在后台继续运行，Docker 重启后自动恢复。

脚本自动识别 Docker 的 CPU 架构、导入随包镜像、检查 Nginx 配置、启动容器，并检查首页、健康端点和文案文件。不会执行 docker pull，也不会在服务器安装软件。业务接口的鉴权失败不会误报为部署失败。

默认容器名 data-overview-offline。重复执行会替换该脚本创建的同名容器，不会替换管理平台等其他容器。同名容器不属于本部署时会停止并提示。

## 2. dist 文件

```text
dist/
├── start.sh                        一键启动入口
├── deploy.sh                       离线导入和启动脚本
├── README.md
├── index.html
├── assets/
├── config/dashboard-labels.json
├── deploy/nginx.offline.conf        端口和主备后端配置
└── images/
    ├── nginx-linux-amd64.tar        x64 离线镜像
    ├── nginx-linux-amd64.tar.sha256
    ├── nginx-linux-arm64.tar        ARM64 离线镜像
    └── nginx-linux-arm64.tar.sha256
```

请完整复制目录。镜像文件不能只留在开发电脑。HTTP 服务仅开放页面、assets 和文案文件，不会暴露镜像、脚本或部署配置。

## 3. 后端与端口

修改 deploy/nginx.offline.conf，然后重新执行 sh start.sh：

```nginx
upstream dashboard_backend {
    server 127.0.0.1:8080 max_fails=1 fail_timeout=5s;
    server 8.148.14.229:8080 backup;
}
```

优先请求同机 8080 端口；连接失败、超时、502/503/504 时尝试备用地址，主服务短暂避让 5 秒后重新尝试。401/403/404 不切换。不开启非幂等请求重试。完全离线时公网备用地址不可达，必须启动同机业务后端才能显示真实数据，本包只包含前端和 Web 服务。

容器使用 Linux host 网络，所以 127.0.0.1 就是服务器本机。后端若也在 Docker 中，须将后端端口发布到宿主机 8080，或自行调整代理地址。主备服务应提供相同接口和鉴权方式。

默认 listen 8082，避免与后端 8080 和管理平台常用端口冲突。可直接修改 listen 数值，确保端口未占用且允许客户端访问。host 网络无需再配置 Docker 端口映射。

## 4. 修改界面标题、字段名称和单位

在服务器编辑 `/opt/dashboard/config/dashboard-labels.json`。例如修改页面标题时，找到下面这一段，只修改 `title` 的值：

```json
"pageHeader": {
  "title": "业务数据总览",
  "platform": "管理平台"
}
```

这是局部片段，不要用它替换整个文件。保存后刷新浏览器即可，无需打包或重启容器。

| 配置位置 | 对应内容 |
| --- | --- |
| `pageHeader` | 页面标题、管理平台按钮文字 |
| `leftTop` / `leftBottom` | 左上 / 左下模块 |
| `rightTop` / `rightBottom` | 右上 / 右下模块 |
| `centerOverview` / `centerTree` | 中间概览 / 树形展示模块 |
| `common` | 共用字段名称和单位 |

修改前备份原文件。只修改显示值，保留英文键名和层级。JSON 必须使用英文双引号，不能写注释，最后一项后不能多加逗号。此文件不修改接口数据，修改单位文字也不会自动换算数值。显示异常时恢复备份后刷新。

现场修改后，请同步回源码的 `public/config/dashboard-labels.json`，避免下次发布覆盖。

## 5. 管理平台返回地址

右上角“管理平台”按钮优先读取页面地址的 `returnUrl` 参数，并在当前标签页跳转。管理端生成链接时，对返回地址进行 URL 编码，例如：

```text
http://大屏地址/?returnUrl=https%3A%2F%2Fadmin.example.com%2F#/
```

返回地址必须是完整的 HTTP(S) 地址。按钮不会额外拼接 token。未传参数时使用构建时的 `VITE_ADMIN_URL`；两者都没有时提示“请从管理端进入”。修改兜底地址需要修改源码环境配置并重新打包，修改服务器上的 `.env` 不会改变已构建的页面。

## 6. 更新、停止与排错

更新前备份整个旧目录，保留现场修改的 Nginx 和文案配置；将新版完整复制后执行 sh start.sh。回退时恢复旧目录并执行同一命令。上传期间请安排维护窗口，避免新旧页面文件混用。

```sh
docker ps -a --filter name=data-overview-offline
docker logs --tail 100 data-overview-offline
docker exec data-overview-offline nginx -t
docker stop data-overview-offline
docker start data-overview-offline
```

页面无法访问：检查日志中的端口占用或配置错误，以及防火墙。页面正常但无数据：检查后端服务和登录凭证。401/403 是鉴权问题；502/504 是后端连接问题。内核、Docker 或 CPU 过旧而无法启动 Alpine 镜像时，需要根据服务器实际信息制作对应基础镜像，不能保证任意 Linux 版本均兼容。

## 7. 开发电脑打包

构建入口会检查 Node 版本：支持 Node.js 22 或更新版本；若当前终端版本较旧，会尝试使用项目内 `.tools/node/node.exe`（Windows）或 `.tools/node/node`（Linux）。也可通过 `BUILD_NODE` 指定新版本 Node 的绝对路径。当前开发电脑已准备项目内运行程序，直接执行 `npm run build` 即可，无需切换系统 Node。此运行程序仅用于开发构建，不需要复制到离线服务器。其他开发电脑需自行准备兼容的 Node；`.tools` 不纳入 Git。

首次在联网且具备 Docker、Node.js 和 npm 的开发电脑准备镜像：

```sh
npm ci
npm run prepare:images
npm run build
# 也可使用 npm run build:dev / npm run build:test
```

镜像缓存于 .offline-images，后续构建直接复制缓存并验证 SHA256，不重复下载；缺少任一架构镜像或校验失败时构建明确失败，避免交付无法离线启动的残缺包。npm run build:web 仅用于传统 Dockerfile 的内部前端构建，不是离线交付命令。

部署说明源文件为 public/README.md，构建时自动复制到 dist。前端资源均随包加载；管理平台返回地址仍需通过 returnUrl 指向内网管理平台，或在打包前配置 VITE_ADMIN_URL。

本次交付镜像通过 DaoCloud 的 Docker Hub 公共缓存获取 nginx:1.27-alpine，已校验镜像层及归档 SHA256。若开发电脑无法直连 Docker Hub，可在运行 prepare:images 前设置 OFFLINE_IMAGE_SOURCE=docker.m.daocloud.io/library/nginx:1.27-alpine；运行脚本仍统一使用包内 nginx:1.27-alpine 标签。
