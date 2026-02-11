# 飞行棋游戏项目

一个基于 React + TypeScript + Spring Boot + MySQL 的在线飞行棋游戏，支持多人在线对战。

## 项目架构

```
.
├── backend/                # Spring Boot 后端
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/example/game/
│   │       │       ├── controller/    # REST API 控制器
│   │       │       ├── service/       # 业务逻辑层
│   │       │       ├── model/         # 数据模型
│   │       │       ├── repository/    # 数据访问层
│   │       │       ├── security/      # 安全认证
│   │       │       └── config/        # 配置类
│   │       └── resources/
│   │           └── application.yml    # 应用配置
│   ├── pom.xml                        # Maven 依赖配置
│   └── Dockerfile                     # 后端 Docker 镜像
│
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API 服务
│   │   ├── types/         # TypeScript 类型定义
│   │   ├── utils/         # 工具函数
│   │   └── styles/        # CSS 样式
│   ├── public/
│   ├── package.json       # NPM 依赖配置
│   ├── Dockerfile         # 前端 Docker 镜像
│   └── nginx.conf         # Nginx 配置
│
├── mysql/                 # MySQL 数据库
│   └── init/
│       └── init.sql       # 数据库初始化脚本
│
├── docker-compose.yml     # 本地开发环境配置
├── docker-compose.prod.yml # 生产环境配置
└── deploy.sh              # 一键部署脚本
```

## 主要功能

### 用户系统
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT 身份认证
- ✅ 用户信息管理

### 游戏功能
- ✅ 创建游戏房间
- ✅ 加入游戏房间
- ✅ 房间列表查看
- ✅ 实时游戏对战（WebSocket）
- ✅ 游戏状态同步
- ✅ 游戏记录统计

## 技术栈

### 后端
- **框架**: Spring Boot 3.2.0
- **语言**: Java 17
- **构建工具**: Maven
- **数据库**: MySQL 8.0
- **ORM**: Spring Data JPA
- **安全**: Spring Security + JWT
- **实时通信**: WebSocket (STOMP)

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **路由**: React Router v6
- **HTTP 客户端**: Axios
- **实时通信**: SockJS + STOMP
- **构建工具**: Create React App

### 部署
- **容器化**: Docker + Docker Compose
- **Web 服务器**: Nginx
- **数据库**: MySQL 8.0

## 快速开始

### 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- （可选）Node.js 18+ 和 Maven 3.9+（用于本地开发）

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd flight-chess-game
```

2. **启动所有服务**
```bash
docker-compose up -d --build
```

3. **访问应用**
- 前端: http://localhost:4000
- 后端 API: http://localhost:8080

4. **查看日志**
```bash
docker-compose logs -f
```

5. **停止服务**
```bash
docker-compose down
```

### 生产环境部署

#### 方式一：使用一键部署脚本（推荐）

1. **配置服务器信息**
   
   编辑 `deploy.sh` 文件，确认服务器 IP 和用户名：
   ```bash
   SERVER_IP="8.130.166.199"
   SERVER_USER="root"
   ```

2. **确保服务器已安装 Docker 和 Docker Compose**

3. **执行部署脚本**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **访问应用**
   - 前端: http://8.130.166.199
   - 后端 API: http://8.130.166.199:8080

#### 方式二：手动部署

1. **上传项目到服务器**
```bash
scp -r . root@8.130.166.199:/opt/flight-chess-game
```

2. **SSH 登录服务器**
```bash
ssh root@8.130.166.199
cd /opt/flight-chess-game
```

3. **启动服务**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **查看服务状态**
```bash
docker-compose -f docker-compose.prod.yml ps
```

## 测试账号

系统预置了以下测试账号：

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | password | 管理员账号 |
| player1 | password | 测试玩家1 |
| player2 | password | 测试玩家2 |

注：密码已使用 BCrypt 加密存储

## API 文档

### 认证接口

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "email": "string (optional)",
  "nickname": "string (optional)"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "string",
  "userId": number,
  "username": "string",
  "nickname": "string"
}
```

### 游戏接口

#### 创建房间
```
POST /api/game/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "roomName": "string",
  "creatorId": number
}
```

#### 获取房间列表
```
GET /api/game/rooms
Authorization: Bearer <token>
```

#### 加入房间
```
POST /api/game/rooms/{roomCode}/join
Authorization: Bearer <token>
```

#### 开始游戏
```
POST /api/game/rooms/{roomCode}/start
Authorization: Bearer <token>
```

## 常见问题

### 1. 容器启动失败

**问题**: MySQL 容器启动失败
**解决**: 检查端口 3306 是否被占用
```bash
lsof -i :3306
```

### 2. 前端无法连接后端

**问题**: 跨域错误或连接超时
**解决**: 
- 检查 `frontend/.env.production` 中的 API 地址配置
- 确保后端服务已启动并可访问

### 3. WebSocket 连接失败

**问题**: 游戏实时功能不可用
**解决**:
- 检查防火墙设置，确保 8080 端口开放
- 确认 WebSocket 配置正确

### 4. 数据库连接失败

**问题**: 后端无法连接数据库
**解决**:
- 等待 MySQL 容器完全启动（约 30 秒）
- 检查数据库密码配置是否一致

## 维护命令

### 查看容器日志
```bash
# 查看所有容器日志
docker-compose logs -f

# 查看特定容器日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 数据备份
```bash
# 备份 MySQL 数据
docker exec flight-chess-mysql mysqldump -uroot -proot123456 flight_chess > backup.sql

# 恢复数据
docker exec -i flight-chess-mysql mysql -uroot -proot123456 flight_chess < backup.sql
```

### 清理资源
```bash
# 停止并删除所有容器
docker-compose down

# 删除所有容器和数据卷
docker-compose down -v

# 清理未使用的 Docker 资源
docker system prune -a
```

## 性能优化建议

1. **数据库优化**
   - 为常用查询字段添加索引
   - 定期清理过期数据
   - 配置合适的连接池大小

2. **前端优化**
   - 启用 Gzip 压缩（已配置）
   - 使用 CDN 加速静态资源
   - 实现代码分割和懒加载

3. **后端优化**
   - 使用 Redis 缓存热点数据
   - 实现 API 限流
   - 优化数据库查询

## 安全建议

1. **生产环境必须修改**
   - 数据库密码
   - JWT 密钥
   - 管理员账号密码

2. **启用 HTTPS**
   - 配置 SSL 证书
   - 强制 HTTPS 访问

3. **防火墙配置**
   - 仅开放必要端口（80, 443, 8080）
   - 限制数据库端口访问

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。
