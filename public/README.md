# 数据总览大屏：部署与维护说明

本文面向负责部署、接口联调和维护的后端人员。拿到打包文件后，服务器无需安装 Node.js，也无需运行 npm 命令。

## 1. 交付文件

大屏由 Nginx 提供静态页面访问，浏览器对 `/api/bi/` 的请求由 Nginx 转发给后端。

前端交付的 `dist` 是构建完成的发布目录，请将其中全部内容上传到服务器，不要只上传 `index.html`。本文以 Linux 服务器的 `/opt/dashboard` 为部署目录。

```text
/opt/dashboard/
├── README.md                       本说明
├── index.html                      页面入口
├── assets/                         页面程序、样式和图片
├── config/dashboard-labels.json    界面文案配置
├── deploy.sh                       自动部署脚本
└── deploy/
    ├── docker-compose.yml          容器配置
    ├── nginx.dev.conf              关闭静态资源缓存
    └── nginx.test.conf             部分静态资源缓存 7 天
```

其他图片目录也需要一起上传。

## 2. 首次部署

服务器需安装 Docker、Docker Compose V2 和 curl，启动 Docker 服务，并能拉取 `nginx:1.27-alpine` 镜像。确认对外端口未被占用，防火墙和安全组已放行。

```bash
# 以下命令在 Linux 服务器执行
 docker --version
 docker compose version
 curl --version
 mkdir -p /opt/dashboard
```

上传发布文件后，确认 `/opt/dashboard/index.html` 存在，再执行：

```bash
cd /opt/dashboard
bash deploy.sh
```

默认对外端口为 `80`，使用 `nginx.dev.conf`。浏览器访问 `http://服务器IP/`。

如需改为 `8082` 端口并使用测试环境的 Nginx 配置：

```bash
cd /opt/dashboard
WEB_PORT=8082 NGINX_ENV=test bash deploy.sh
```

浏览器访问 `http://服务器IP:8082/`。这些变量只对本次命令生效，后续部署需要再次传入相同值。`NGINX_ENV` 只选择 Nginx 配置，不会修改已打包进页面的前端环境参数。

当前容器名固定为 `data-overview-dev`，选择 test 时也不变。这套配置用于单实例部署，不能直接用它同时启动两套环境。

脚本会检查文件、拉取镜像、更新容器、等待健康检查，并检查页面、文案文件和 `/api/bi/data-source` 接口。失败时输出最近的容器日志。最后一步接口检查不携带登录凭证，如果接口要求鉴权而返回 401/403，脚本也会报失败，应结合接口响应判断原因。

## 3. 修改后端接口地址

默认请求路径：浏览器 → 大屏 `/api/bi/xxx` → Docker 宿主机的 `8080/api/bi/xxx`。

当前启用的 `deploy/nginx.dev.conf` 或 `deploy/nginx.test.conf` 中有：

```nginx
proxy_pass http://host.docker.internal:8080/api/bi/;
```

`host.docker.internal` 在本 Compose 配置中指向宿主机。后端需允许来自容器的连接，仅监听宿主机 `127.0.0.1` 可能导致容器无法访问。

如果后端在其他服务器或端口，修改主机和端口，保留接口路径及末尾斜杠。例如：

```nginx
proxy_pass http://192.168.1.10:8080/api/bi/;
```

修改后，使用原来的端口和环境重新执行部署命令。

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

## 6. 更新与回退

1. 记录当前 `WEB_PORT` 和 `NGINX_ENV`，将现有部署目录完整备份到另一个目录。
2. 上传新发布包的全部内容。对比并保留现场修改过的文案和 Nginx 后端地址。
3. 使用原来的端口和环境执行部署命令，验证页面和接口。
4. 需要回退时，将部署目录恢复为完整的上一版备份，再使用原来的端口和环境执行部署命令。

上传期间运行中的服务可能读到新旧混合文件，请安排维护窗口。现场配置变更应同步回源码并记录。

| 修改内容 | 生效方式 |
| --- | --- |
| `config/dashboard-labels.json` 文案 | 保存并刷新浏览器 |
| `README.md` 说明 | 保存文件，无需重启 |
| Nginx 代理地址、对外端口 | 使用对应端口和环境重新执行部署命令 |
| 页面逻辑、样式、构建环境参数 | 从源码重新打包并发布 |

## 7. 检查与排错

以下命令使用默认端口和环境。实际使用其他值时，请修改 Compose 命令中的变量及 curl 地址中的端口。

```bash
cd /opt/dashboard
WEB_PORT=80 NGINX_ENV=dev docker compose -f deploy/docker-compose.yml ps
WEB_PORT=80 NGINX_ENV=dev docker compose -f deploy/docker-compose.yml logs --tail=100 dashboard
docker exec data-overview-dev nginx -t
curl -i http://127.0.0.1/health
curl -i http://127.0.0.1/api/bi/data-source
```

Compose 文件位于 `deploy/` 下，不能在发布根目录直接执行不带 `-f` 的 `docker compose ps`。

| 现象 | 排查方式 |
| --- | --- |
| 页面打不开 | 检查容器、端口占用、防火墙和安全组，先在服务器请求 `/health` |
| `/health` 正常但没有数据 | 健康检查只说明 Nginx 存活，继续检查业务接口响应和后端日志 |
| 接口返回 502/504 | 检查后端服务、代理地址和端口，以及容器到后端的网络连接 |
| 接口返回 401/403 | 检查登录状态、请求的 Authorization 和后端鉴权规则 |
| 更新后空白或资源 404 | 确认发布包上传完整，尤其是 `assets/`，再强制刷新浏览器 |
| 修改文案未生效 | 确认修改的是服务器的 `config/dashboard-labels.json`，检查 JSON 格式并刷新 |
| 修改 Nginx 未生效 | 确认修改的是当前环境对应的配置，并重新执行部署命令 |

## 8. 如何维护本文档

唯一维护源文件是代码仓库中的 **`public/README.md`**，使用普通文本编辑器修改即可。打包会自动复制为 **`dist/README.md`**，随发布包交付。不要只修改 `dist/README.md`，下次打包会覆盖它。

部署命令、默认端口、后端地址、配置路径或脚本行为变化时，应在同一次代码变更中更新本文，并按说明核对实际文件和命令。不要在示例中写入真实 token、密码等凭证。

仅更新说明时，可把修改后的源文件复制到服务器部署目录的 `README.md`，无需重启；同时提交源码，确保下次发布带上最新版文档。

拿到源码需要自行打包时，在安装好 Node.js 22 和 npm 的机器上执行：

```bash
npm ci
npm run build:dev
# 或使用测试环境：npm run build:test
```

构建后交付 `dist` 的全部内容。
