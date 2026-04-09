# CI/CD 自动化部署配置

## 概述

配置 GitHub Actions 实现 push 代码到 main 分支后自动部署到服务器。

## 需要配置的 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|-------------|------|--------|
| `DOCKER_USERNAME` | Docker Hub 用户名 | `yourusername` |
| `DOCKER_PASSWORD` | Docker Hub 密码/Token | `xxxxx` |
| `SERVER_HOST` | 服务器 IP 地址 | `123.456.78.90` |
| `SERVER_USER` | 服务器 SSH 用户名 | `root` |
| `SERVER_SSH_KEY` | 服务器 SSH 私钥 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH 端口（可选，默认22） | `22` |
| `SERVER_DEPLOY_PATH` | 部署路径 | `/srv/todolist` |

## 配置步骤

### 1. 生成 SSH 密钥对

在服务器上生成（如果已有可跳过）：

```bash
ssh-keygen -t ed25519 -C "github-deploy"
```

### 2. 配置服务器 SSH 公钥

```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

### 3. 测试 SSH 连接

确保从 GitHub Actions 的 runner 能连接到你的服务器。

### 4. 服务器上准备部署目录

```bash
mkdir -p /srv/todolist
cd /srv/todolist
# 初始上传 docker-compose.yml 和 .env 文件
```

### 5. 推送代码触发部署

```bash
git push origin main
```

部署会自动触发，可以在 GitHub 仓库的 Actions 标签页查看进度。

## 工作流程说明

1. **构建镜像** - 在 GitHub Actions 构建 Docker 镜像
2. **推送镜像** - 推送到 Docker Hub（使用 sha 作为版本标签）
3. **服务器拉取** - 服务器通过 SSH 执行 `docker compose pull`
4. **重启服务** - 执行 `docker compose up -d --build` 重启容器
5. **清理旧镜像** - `docker image prune -f` 清理不需要的镜像

## 注意事项

- 确保服务器防火墙开放了 SSH 端口（默认22）
- Docker Hub 免费账号有拉取次数限制（每6小时100-200次）
- 建议在 Docker Hub 设置 repository access 为 public，或使用私有仓库
