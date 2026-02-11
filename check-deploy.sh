#!/bin/bash

# 检查阿里云服务器部署状态脚本

set -e

SERVER_IP="8.130.166.199"
SERVER_USER="root"
REMOTE_DIR="/opt/flight-chess-game"

echo "========================================="
echo "检查服务器部署状态"
echo "========================================="

ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
echo "1. 检查 Docker 容器状态..."
docker ps -a | grep flight-chess

echo ""
echo "2. 检查 80 端口占用情况..."
lsof -i:80 || netstat -tlnp | grep :80

echo ""
echo "3. 检查项目目录..."
ls -la /opt/flight-chess-game/ 2>/dev/null || echo "项目目录不存在"

echo ""
echo "4. 检查 Docker Compose 服务..."
cd /opt/flight-chess-game 2>/dev/null && docker-compose -f docker-compose.prod.yml ps || echo "无法进入项目目录"

echo ""
echo "5. 查看前端容器日志（最后 20 行）..."
docker logs flight-chess-frontend --tail 20 2>/dev/null || echo "前端容器不存在或未运行"

ENDSSH

echo ""
echo "========================================="
echo "检查完成"
echo "========================================="
