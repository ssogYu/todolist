# CI/CD 自动化部署配置流程

## 概述

配置 GitHub Actions 实现 push 代码到 master 分支后自动部署到服务器。

## 配置步骤

### 第一步 修改 docker-compose.yml 文件

为了支持 CI/CD 自动拉取镜像，需要把 web 服务从 build 改为 image ：

```yaml
services:
  web:
    image: yourusername/todolist:latest
```

### 第二步 配置 GitHub Secrets

#### 2.1 创建 Docker Hub Access Token

- 登录 Docker Hub
- 点击右上角头像 → Account Settings
- 左侧菜单选 Security → Access Tokens
- 点击 Generate New Token
- Token 描述填写： github-actions-deploy
- 复制生成的 Token（ 只显示一次，务必保存

#### 2.2 生成服务器 SSH 密钥对

在 服务器上 执行

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key
```

连续回车（不设置密码），生成：

- 私钥： ~/.ssh/github_actions_key
- 公钥： ~/.ssh/github_actions_key.pub

#### 2.3 配置服务器 SSH 公钥

```bash
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
```

#### 2.4 在 GitHub 仓库添加 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 中添加以下 Secrets：

| Secret 名称          | 说明                     | 示例值                                   |
| -------------------- | ------------------------ | ---------------------------------------- |
| `DOCKER_USERNAME`    | Docker Hub 用户名        | `yourusername`                           |
| `DOCKER_PASSWORD`    | Docker Hub 密码/Token    | `xxxxx`                                  |
| `SERVER_HOST`        | 服务器 IP 地址           | `123.456.78.90`                          |
| `SERVER_USER`        | 服务器 SSH 用户名        | `root`                                   |
| `SERVER_SSH_KEY`     | 服务器 SSH 私钥          | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT`        | SSH 端口（可选，默认22） | `22`                                     |
| `SERVER_DEPLOY_PATH` | 部署路径                 | `/srv/todolist`                          |

#### 2.5 服务器准备部署目录 /srv/todolist

创建.env配置文件

```bash
POSTGRES_DB=todolist
POSTGRES_USER=postgres
POSTGRES_PASSWORD=你的数据库密码
JWT_SECRET=你的JWT密钥（随机字符串）
DOCKER_IMAGE=你的DockerHub用户名/spring-todo:latest
```

创建docker-compose.yml文件（见项目，也就是第一步中的docker-compose.yml文件）

#### 2.6 创建 GitHub Actions 工作流文件

在 GitHub 仓库根目录创建 .github/workflows/deploy.yml 文件，内容如下：

```yaml
name: Deploy to Server

on:
  push:
    branches:
      - master
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/todolist:latest .
          docker push ${{ secrets.DOCKER_USERNAME }}/todolist:latest

      - name: Deploy to server
        run: |
          ssh -i ~/.ssh/github_actions_key ${{ secrets.SERVER_HOST }} "docker compose pull"
          ssh -i ~/.ssh/github_actions_key ${{ secrets.SERVER_HOST }} "docker compose up -d --build"
          ssh -i ~/.ssh/github_actions_key ${{ secrets.SERVER_HOST }} "docker image prune -f"
```

### 第三步 推送代码触发部署

```bash
git push origin master
```

部署会自动触发，可以在 GitHub 仓库的 Actions 标签页查看进度。

## 工作流程说明

1. **构建镜像** - 在 GitHub Actions 构建 Docker 镜像
2. **推送镜像** - 推送到 Docker Hub（使用 sha 作为版本标签）
3. **服务器拉取** - 服务器通过 SSH 执行 `docker compose pull`
4. **重启服务** - 执行 `docker compose up -d --build` 重启容器
5. **清理旧镜像** - `docker image prune -f` 清理不需要的镜像

tips：也就是我推送代码项目是在github的虚拟服务器上构建镜像，然后上传到docker hub上去，最后我的服务器上拉取镜像，重启服务，清理旧镜像，执行构建，完成代码部署。

## 注意事项

- 确保服务器防火墙开放了 SSH 端口（默认22）
- Docker Hub 免费账号有拉取次数限制（每6小时100-200次）
- 建议在 Docker Hub 设置 repository access 为 public，或使用私有仓库
