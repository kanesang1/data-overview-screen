# 部署验证

运行流程回归测试（模拟 Docker，测试不会下载镜像或修改真实容器）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tests/deploy.ps1
```

```sh
sh tests/deploy.sh
```

每套覆盖：严格离线不 pull、自动离线回退、ECR 回退、在线成功、在线失败不 load、外来同名容器保护、架构不匹配、校验失败、离线包缺失，以及在线部署不依赖离线包。Windows 测试在 artifacts 下创建带空格的临时目录；Linux 使用临时目录并在结束时清理。

模拟不能验证 Docker 实际挂载和宿主网络。发布前应另行执行 `npm run package` 并解压，使用专用测试容器名和空闲端口，在目标平台实测：

1. offline 启动，首页、`/health`、`/config/dashboard-labels.json` 返回 200。
2. `/images/nginx-linux-amd64.tar`、`/deploy/nginx.windows.conf`、`/start.ps1` 等交付文件返回 404。
3. 指定可信可达源后 online 启动；指定不可达源后 auto 回退。
4. 同名重复部署成功，错误配置/校验失败时旧容器保留。
5. 从真实客户端验证后端登录、数据及管理平台跳转；测试结束删除自己的测试容器。

本次开发环境实测 Windows PowerShell 5.1 + Docker Desktop Linux AMD64：offline、online（ECR）、auto 网络失败回退和重复部署通过，HTTP 200/404 检查通过。Linux 流程测试在 Linux 容器中通过，Nginx 配置单独校验；原生 Linux Docker Engine、ARM64 硬件和现场业务后端仍需部署方验收。
