#!/bin/bash

# 修复部署脚本 - 确保飞行棋项目在 80 端口运行

set -e

SERVER_IP="8.130.166.199"
SERVER_USER="root"
PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}修复飞行棋项目部署${NC}"
echo -e "${GREEN}目标: 确保项目在 80 端口运行${NC}"
echo -e "${GREEN}========================================${NC}"

# 在服务器上执行修复操作
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo "========================================="
echo "步骤 1: 检查并停止占用 80 端口的服务"
echo "========================================="

# 查找占用 80 端口的进程
PORT_80_PID=$(lsof -ti:80 2>/dev/null || echo "")

if [ ! -z "$PORT_80_PID" ]; then
    echo "发现 80 端口被占用，PID: $PORT_80_PID"
    
    # 检查是否是 nginx
    if ps -p $PORT_80_PID -o comm= | grep -q nginx; then
        echo "停止系统 nginx 服务..."
        systemctl stop nginx 2>/dev/null || service nginx stop 2>/dev/null || true
        systemctl disable nginx 2>/dev/null || true
    fi
    
    # 检查是否是 apache
    if ps -p $PORT_80_PID -o comm= | grep -q httpd; then
        echo "停止 Apache 服务..."
        systemctl stop httpd 2>/dev/null || service httpd stop 2>/dev/null || true
        systemctl disable httpd 2>/dev/null || true
    fi
    
    # 如果还在运行，强制停止
    PORT_80_PID=$(lsof -ti:80 2>/dev/null || echo "")
    if [ ! -z "$PORT_80_PID" ]; then
        echo "强制停止占用 80 端口的进程..."
        kill -9 $PORT_80_PID 2>/dev/null || true
    fi
else
    echo "80 端口未被占用"
fi

sleep 2

echo ""
echo "========================================="
echo "步骤 2: 检查项目是否存在"
echo "========================================="

if [ ! -d "$REMOTE_DIR" ]; then
    echo "错误: 项目目录不存在: $REMOTE_DIR"
    echo "请先运行 deploy.sh 上传项目文件"
    exit 1
fi

cd $REMOTE_DIR
echo "项目目录存在: $REMOTE_DIR"

echo ""
echo "========================================="
echo "步骤 3: 停止所有旧容器"
echo "========================================="

# 停止并删除所有相关容器
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 确保容器都已停止
docker stop flight-chess-frontend flight-chess-backend flight-chess-mysql 2>/dev/null || true
docker rm flight-chess-frontend flight-chess-backend flight-chess-mysql 2>/dev/null || true

echo "旧容器已清理"

echo ""
echo "========================================="
echo "步骤 4: 清理 Docker 资源"
echo "========================================="

docker system prune -f
echo "Docker 资源清理完成"

echo ""
echo "========================================="
echo "步骤 5: 重新构建并启动容器"
echo "========================================="

# 使用 docker-compose 启动
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "等待容器启动..."
sleep 30

echo ""
echo "========================================="
echo "步骤 6: 检查容器状态"
echo "========================================="

docker-compose -f docker-compose.prod.yml ps

echo ""
echo "========================================="
echo "步骤 7: 验证 80 端口"
echo "========================================="

# 检查 80 端口
if lsof -i:80 | grep -q LISTEN; then
    echo "✓ 80 端口正在监听"
    lsof -i:80 | grep LISTEN
else
    echo "✗ 80 端口未监听"
    echo "查看前端容器日志:"
    docker logs flight-chess-frontend --tail 50
    exit 1
fi

echo ""
echo "========================================="
echo "步骤 8: 测试访问"
echo "========================================="

# 测试本地访问
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ 本地访问成功 (HTTP $HTTP_CODE)"
else
    echo "✗ 本地访问失败 (HTTP $HTTP_CODE)"
fi

echo ""
echo "========================================="
echo "部署修复完成！"
echo "========================================="
echo "访问地址: http://8.130.166.199"
echo "后端 API: http://8.130.166.199:8080"
echo ""
echo "如果仍然无法访问，请检查:"
echo "1. 服务器防火墙是否开放 80 端口"
echo "2. 阿里云安全组是否开放 80 端口"
echo ""
echo "查看容器日志:"
echo "  docker logs flight-chess-frontend"
echo "  docker logs flight-chess-backend"
echo "  docker logs flight-chess-mysql"
echo "========================================="

ENDSSH

echo -e "${GREEN}修复脚本执行完成！${NC}"
echo -e "${YELLOW}请访问: ${GREEN}http://8.130.166.199${NC}"
