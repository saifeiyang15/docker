# 部署指南

本文档详细说明如何将飞行棋游戏部署到阿里云服务器 8.130.166.199。

## 部署前准备

### 1. 服务器要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+ 或 CentOS 7+)
- **内存**: 至少 2GB RAM
- **存储**: 至少 10GB 可用空间
- **网络**: 公网 IP 地址

### 2. 安装 Docker

#### Ubuntu/Debian
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 设置稳定版仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### CentOS/RHEL
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker Engine
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 安装 Docker Compose

```bash
# 下载 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 4. 配置防火墙

```bash
# Ubuntu/Debian (使用 ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw enable

# CentOS/RHEL (使用 firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

## 部署方式

### 方式一：使用一键部署脚本（推荐）

#### 1. 在本地机器上执行

```bash
# 确保脚本有执行权限
chmod +x deploy.sh

# 执行部署脚本
./deploy.sh
```

脚本会自动完成以下操作：
1. 检查必要工具（ssh, scp）
2. 打包项目文件
3. 上传到服务器
4. 在服务器上构建和启动容器
5. 清理临时文件

#### 2. 部署过程说明

部署脚本会：
- 将项目文件打包为 tar.gz
- 通过 SCP 上传到服务器 `/tmp` 目录
- SSH 连接到服务器执行部署命令
- 解压文件到 `/opt/flight-chess-game`
- 使用 `docker-compose.prod.yml` 构建并启动容器
- 等待服务启动完成

#### 3. 验证部署

部署完成后，访问以下地址验证：
- 前端: http://8.130.166.199
- 后端 API: http://8.130.166.199:8080/api/auth/validate

### 方式二：手动部署

#### 1. 上传项目文件

```bash
# 方法 1: 使用 SCP
scp -r . root@8.130.166.199:/opt/flight-chess-game

# 方法 2: 使用 rsync（推荐，支持增量同步）
rsync -avz --exclude='node_modules' \
           --exclude='target' \
           --exclude='build' \
           --exclude='.git' \
           ./ root@8.130.166.199:/opt/flight-chess-game/

# 方法 3: 使用 Git
# 在服务器上执行
cd /opt
git clone <repository-url> flight-chess-game
```

#### 2. SSH 登录服务器

```bash
ssh root@8.130.166.199
cd /opt/flight-chess-game
```

#### 3. 配置环境变量（可选）

```bash
# 创建 .env 文件
cat > .env << EOF
MYSQL_ROOT_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
EOF
```

#### 4. 启动服务

```bash
# 构建并启动所有服务
docker-compose -f docker-compose.prod.yml up -d --build

# 查看启动日志
docker-compose -f docker-compose.prod.yml logs -f
```

#### 5. 验证服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该看到三个容器都在运行：
# - flight-chess-mysql
# - flight-chess-backend
# - flight-chess-frontend
```

## 配置说明

### 环境变量配置

在 `docker-compose.prod.yml` 中可以配置以下环境变量：

```yaml
environment:
  # MySQL 配置
  MYSQL_ROOT_PASSWORD: root123456  # 建议修改为强密码
  
  # Spring Boot 配置
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/flight_chess
  SPRING_DATASOURCE_USERNAME: root
  SPRING_DATASOURCE_PASSWORD: root123456  # 与 MySQL 密码一致
  SPRING_PROFILES_ACTIVE: prod
```

### 端口映射

默认端口映射：
- **80**: 前端 Nginx 服务
- **8080**: 后端 Spring Boot API
- **3306**: MySQL 数据库（仅容器内部访问）

如需修改端口，编辑 `docker-compose.prod.yml`：
```yaml
services:
  frontend:
    ports:
      - "80:80"  # 修改为 "8888:80" 将前端映射到 8888 端口
```

### 数据持久化

MySQL 数据存储在 Docker Volume 中：
```yaml
volumes:
  mysql_data:
    driver: local
```

数据位置：`/var/lib/docker/volumes/flight-chess-game_mysql_data/_data`

## 监控和维护

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f mysql

# 查看最近 100 行日志
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart backend

# 重新构建并重启
docker-compose -f docker-compose.prod.yml up -d --build
```

### 停止服务

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml stop

# 停止并删除容器（保留数据）
docker-compose -f docker-compose.prod.yml down

# 停止并删除容器和数据卷
docker-compose -f docker-compose.prod.yml down -v
```

### 数据备份

#### 备份数据库

```bash
# 备份到文件
docker exec flight-chess-mysql mysqldump \
  -uroot -proot123456 \
  flight_chess > backup_$(date +%Y%m%d_%H%M%S).sql

# 压缩备份
docker exec flight-chess-mysql mysqldump \
  -uroot -proot123456 \
  flight_chess | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### 恢复数据库

```bash
# 从备份文件恢复
docker exec -i flight-chess-mysql mysql \
  -uroot -proot123456 \
  flight_chess < backup.sql

# 从压缩文件恢复
gunzip < backup.sql.gz | docker exec -i flight-chess-mysql mysql \
  -uroot -proot123456 \
  flight_chess
```

### 更新应用

```bash
# 1. 上传新代码到服务器
rsync -avz ./ root@8.130.166.199:/opt/flight-chess-game/

# 2. SSH 登录服务器
ssh root@8.130.166.199
cd /opt/flight-chess-game

# 3. 重新构建并启动
docker-compose -f docker-compose.prod.yml up -d --build

# 4. 查看更新日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 性能优化

### 1. 数据库优化

```bash
# 进入 MySQL 容器
docker exec -it flight-chess-mysql mysql -uroot -proot123456

# 查看慢查询
SHOW VARIABLES LIKE 'slow_query%';

# 分析表
ANALYZE TABLE users;
ANALYZE TABLE game_rooms;
```

### 2. 应用监控

安装监控工具（可选）：

```bash
# 安装 Prometheus + Grafana
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3001:4000 \
  grafana/grafana
```

### 3. 日志管理

配置日志轮转：

```bash
# 创建 Docker 日志配置
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker
sudo systemctl restart docker
```

## 故障排查

### 问题 1: 容器无法启动

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看详细错误信息
docker-compose -f docker-compose.prod.yml logs <service-name>

# 检查端口占用
netstat -tulpn | grep -E '80|8080|3306'
```

### 问题 2: 数据库连接失败

```bash
# 检查 MySQL 容器是否运行
docker ps | grep mysql

# 测试数据库连接
docker exec flight-chess-mysql mysql -uroot -proot123456 -e "SELECT 1"

# 查看 MySQL 日志
docker logs flight-chess-mysql
```

### 问题 3: 前端无法访问后端

```bash
# 检查网络连通性
docker exec flight-chess-frontend ping backend

# 检查后端健康状态
curl http://localhost:8080/api/auth/validate

# 检查防火墙规则
sudo iptables -L -n
```

### 问题 4: 内存不足

```bash
# 查看系统资源使用
free -h
df -h

# 查看容器资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

## 安全加固

### 1. 修改默认密码

```bash
# 修改 MySQL root 密码
docker exec -it flight-chess-mysql mysql -uroot -proot123456
ALTER USER 'root'@'%' IDENTIFIED BY 'new_secure_password';
FLUSH PRIVILEGES;

# 更新配置文件中的密码
vim docker-compose.prod.yml
```

### 2. 配置 HTTPS

```bash
# 安装 Certbot
sudo apt-get install certbot

# 获取 SSL 证书
sudo certbot certonly --standalone -d yourdomain.com

# 配置 Nginx 使用 SSL
# 编辑 frontend/nginx.conf 添加 SSL 配置
```

### 3. 限制数据库访问

```bash
# 修改 MySQL 配置，仅允许容器内部访问
# 在 docker-compose.prod.yml 中移除端口映射
services:
  mysql:
    # ports:
    #   - "3306:3306"  # 注释掉此行
```

## 回滚策略

### 快速回滚

```bash
# 1. 停止当前版本
docker-compose -f docker-compose.prod.yml down

# 2. 恢复之前的代码
git checkout <previous-commit>

# 3. 重新部署
docker-compose -f docker-compose.prod.yml up -d --build
```

### 数据库回滚

```bash
# 1. 恢复数据库备份
docker exec -i flight-chess-mysql mysql \
  -uroot -proot123456 \
  flight_chess < backup_before_update.sql

# 2. 重启服务
docker-compose -f docker-compose.prod.yml restart
```

## 联系支持

如遇到部署问题，请：
1. 查看日志文件
2. 检查系统资源
3. 参考故障排查章节
4. 联系技术支持团队
