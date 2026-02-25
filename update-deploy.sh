#!/bin/bash

# 飞行棋游戏一键更新部署脚本
# 用于代码更新后快速部署到服务器
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
echo -e "${GREEN}飞行棋游戏一键更新部署脚本${NC}"
echo -e "${GREEN}目标服务器: ${SERVER_IP}${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查必要工具
check_requirements() {
    echo -e "${YELLOW}[1/5] 检查必要工具...${NC}"
    
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
    echo -e "${YELLOW}[2/5] 在本地构建前端...${NC}"
    
    cd frontend
    
    echo "构建生产版本..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo -e "${RED}错误: 前端构建失败，build 目录不存在${NC}"
        exit 1
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ 前端构建完成${NC}"
}

# 同步构建文件到服务器
sync_build_files() {
    echo -e "${YELLOW}[3/5] 同步构建文件到服务器...${NC}"
    
    # 同步前端构建文件
    rsync -avz --progress \
        frontend/build/ \
        ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/frontend/build/
    
    echo -e "${GREEN}✓ 构建文件同步完成${NC}"
}

# 同步其他更新的文件（如果有后端代码更新）
sync_other_files() {
    echo -e "${YELLOW}[4/5] 同步其他更新文件...${NC}"
    
    # 同步后端代码、配置文件等
    rsync -avz --progress \
        --exclude='node_modules/' \
        --exclude='target/' \
        --exclude='frontend/build/' \
        --exclude='.git/' \
        --exclude='.idea/' \
        --exclude='.vscode/' \
        --exclude='*.log' \
        --exclude='*.pid' \
        --exclude='*.tar.gz' \
        --exclude='.DS_Store' \
        backend/ \
        ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/backend/
    
    # 同步前端配置文件（nginx.conf、Dockerfile 等）
    rsync -avz --progress \
        frontend/nginx.conf \
        frontend/Dockerfile \
        frontend/Dockerfile.prod \
        ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/frontend/

    # 同步 docker-compose 配置（如果有更新）
    rsync -avz --progress \
        docker-compose.prod-prebuilt.yml \
        docker-compose.prod.yml \
        ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    
    echo -e "${GREEN}✓ 其他文件同步完成${NC}"
}

# 在服务器上重建并重启容器
restart_containers() {
    echo -e "${YELLOW}[5/5] 重建并重启容器...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/\${PROJECT_NAME}"

echo "进入项目目录..."
cd \${REMOTE_DIR}

echo "停止旧容器..."
docker-compose -f docker-compose.prod-prebuilt.yml down

echo "重新构建前端镜像（不使用缓存）..."
docker-compose -f docker-compose.prod-prebuilt.yml build --no-cache frontend

echo "如果后端有更新，也重新构建后端..."
docker-compose -f docker-compose.prod-prebuilt.yml build --no-cache backend

echo "启动所有容器..."
docker-compose -f docker-compose.prod-prebuilt.yml up -d

echo ""
echo "等待服务启动..."
sleep 20

echo ""
echo "检查容器状态..."
docker-compose -f docker-compose.prod-prebuilt.yml ps

echo ""
echo "更新部署完成！"

ENDSSH
    
    echo -e "${GREEN}✓ 容器重启完成${NC}"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 更新部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📱 访问地址：${NC}"
    echo -e "  🌐 前端页面: ${GREEN}http://${SERVER_IP}${NC}"
    echo -e "  🔧 后端 API: ${GREEN}http://${SERVER_IP}:8080${NC}"
    echo ""
    echo -e "${BLUE}💡 重要提示：${NC}"
    echo -e "  请清除浏览器缓存后访问（Ctrl+Shift+R 或 Cmd+Shift+R）"
    echo -e "  或使用无痕模式访问以查看最新更新"
    echo ""
    echo -e "${BLUE}📊 查看日志：${NC}"
    echo -e "  ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP}${NC}"
    echo -e "  ${YELLOW}cd ${REMOTE_DIR}${NC}"
    echo -e "  ${YELLOW}docker-compose -f docker-compose.prod-prebuilt.yml logs -f${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# 错误处理
error_handler() {
    echo ""
    echo -e "${RED}更新部署失败！请检查错误信息${NC}"
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
    sync_build_files
    echo ""
    sync_other_files
    echo ""
    restart_containers
    echo ""
    show_deployment_info
}

main
