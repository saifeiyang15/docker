#!/bin/bash

# 飞行棋游戏预构建部署脚本
# 在本地构建前端，然后上传到服务器
# 目标服务器：8.130.166.199

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="8.130.166.199"
SERVER_USER="root"
PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}飞行棋游戏预构建部署脚本${NC}"
echo -e "${GREEN}目标服务器: ${SERVER_IP}${NC}"
echo -e "${GREEN}部署方式: 本地构建 + rsync 同步${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查必要工具
check_requirements() {
    echo -e "${YELLOW}[1/6] 检查必要工具...${NC}"
    
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}错误: 未安装 ssh${NC}"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        echo -e "${RED}错误: 未安装 rsync${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: 未安装 npm${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 必要工具检查完成${NC}"
}

# 本地构建前端
build_frontend() {
    echo -e "${YELLOW}[2/6] 在本地构建前端...${NC}"
    
    cd frontend
    
    echo "安装依赖..."
    npm install --legacy-peer-deps
    
    echo "构建生产版本..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo -e "${RED}错误: 前端构建失败，build 目录不存在${NC}"
        exit 1
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ 前端构建完成${NC}"
}

# 测试服务器连接
test_connection() {
    echo -e "${YELLOW}[3/6] 测试服务器连接...${NC}"
    
    if ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" &> /dev/null; then
        echo -e "${GREEN}✓ 服务器连接正常${NC}"
    else
        echo -e "${RED}错误: 无法连接到服务器 ${SERVER_IP}${NC}"
        exit 1
    fi
}

# 准备服务器环境
prepare_server() {
    echo -e "${YELLOW}[4/6] 准备服务器环境...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo "创建项目目录..."
mkdir -p ${REMOTE_DIR}

echo "检查并安装 rsync..."
if ! command -v rsync &> /dev/null; then
    echo "rsync 未安装，正在安装..."
    if command -v yum &> /dev/null; then
        yum install -y rsync
    elif command -v apt-get &> /dev/null; then
        apt-get update && apt-get install -y rsync
    fi
    echo "✓ rsync 安装完成"
fi

echo "检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "错误: 服务器未安装 Docker"
    exit 1
fi

echo "检查 Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: 服务器未安装 Docker Compose"
    exit 1
fi

echo "服务器环境准备完成"
ENDSSH
    
    echo -e "${GREEN}✓ 服务器环境准备完成${NC}"
}

# 同步文件到服务器
sync_files() {
    echo -e "${YELLOW}[5/6] 同步项目文件到服务器...${NC}"
    echo -e "${BLUE}正在同步，请稍候...${NC}"
    
    # 同步项目文件（包含构建好的前端）
    rsync -avz --progress \
        --exclude='node_modules/' \
        --exclude='target/' \
        --exclude='.git/' \
        --exclude='.idea/' \
        --exclude='.vscode/' \
        --exclude='*.log' \
        --exclude='*.pid' \
        --exclude='*.tar.gz' \
        --exclude='.DS_Store' \
        --delete \
        ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    
    echo -e "${GREEN}✓ 文件同步完成${NC}"
}

# 在服务器上部署
deploy_application() {
    echo -e "${YELLOW}[6/6] 在服务器上部署应用...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/\${PROJECT_NAME}"

echo "进入项目目录..."
cd \${REMOTE_DIR}

echo "停止旧容器..."
docker-compose -f docker-compose.prod-prebuilt.yml down 2>/dev/null || true

echo "清理 Docker 资源..."
docker system prune -f

echo "构建并启动容器..."
echo "（前端使用预构建版本，只需构建后端）"
docker-compose -f docker-compose.prod-prebuilt.yml up -d --build

echo ""
echo "等待服务启动..."
sleep 30

echo ""
echo "检查容器状态..."
docker-compose -f docker-compose.prod-prebuilt.yml ps

echo ""
echo "检查服务健康状态..."
for i in {1..20}; do
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✓ 前端服务已就绪"
        break
    fi
    sleep 2
done

for i in {1..20}; do
    if curl -f http://localhost:8080/api/auth/validate > /dev/null 2>&1; then
        echo "✓ 后端服务已就绪"
        break
    fi
    sleep 2
done

echo ""
echo "部署完成！"

ENDSSH
    
    echo -e "${GREEN}✓ 应用部署完成${NC}"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📱 访问地址：${NC}"
    echo -e "  🌐 前端页面: ${GREEN}http://${SERVER_IP}${NC}"
    echo -e "  🔧 后端 API: ${GREEN}http://${SERVER_IP}:8080${NC}"
    echo ""
    echo -e "${BLUE}👤 测试账号：${NC}"
    echo -e "  用户名: ${GREEN}admin${NC}"
    echo -e "  密码: ${GREEN}password${NC}"
    echo ""
    echo -e "${BLUE}📊 管理命令：${NC}"
    echo -e "  查看日志:"
    echo -e "    ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP}${NC}"
    echo -e "    ${YELLOW}cd ${REMOTE_DIR}${NC}"
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod-prebuilt.yml logs -f${NC}"
    echo ""
    echo -e "  重启服务:"
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod-prebuilt.yml restart${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# 错误处理
error_handler() {
    echo ""
    echo -e "${RED}部署失败！请检查错误信息${NC}"
    exit 1
}

trap error_handler ERR

# 主流程
main() {
    echo ""
    check_requirements
    echo ""
    build_frontend
    echo ""
    test_connection
    echo ""
    prepare_server
    echo ""
    sync_files
    echo ""
    deploy_application
    echo ""
    show_deployment_info
}

main
