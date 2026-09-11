# 随源码交付的离线镜像

本目录中的 `nginx-linux-amd64.tar`、`nginx-linux-arm64.tar` 和对应 `.sha256` 直接纳入普通 Git，不使用 LFS。单份约 50 MB；首次克隆会下载这些文件。只读构建无需 Docker。

镜像来自 Docker Official Images，统一标签 `nginx:1.27-alpine`。默认先尝试 Docker Hub，失败尝试 `public.ecr.aws/docker/library/nginx:1.27-alpine`。分发说明：[Docker 官方公告](https://www.docker.com/blog/news-from-aws-reinvent-docker-official-images-on-amazon-ecr-public/)。镜像保留其原有第三方许可证；归档包含基础系统和 Nginx 软件，不代表由本项目拥有其版权。

维护者使用已启动 Linux 引擎的 Docker、Node.js 22+ 执行：

```sh
npm run prepare:images
npm run package
git add .offline-images
```

脚本校验拉取架构，导出两份归档，生成 SHA256 和 `manifest.json`（来源、image ID、registry digest）。提交时必须将所有文件作为一组提交。升级镜像版本须同步更新两个部署脚本、准备镜像脚本、Dockerfile 和相关文档，并重新测试两个平台。不要给不同 CPU 架构的相同归档复制改名。

SHA256 用来检查传输损坏，不能代替对源码仓库和镜像来源的信任。构建时验证归档，离线部署时再次验证。严格离线部署请显式选择 offline 模式，禁止尝试外部镜像源。
