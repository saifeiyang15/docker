#!/bin/bash

# 飞行棋游戏一键部署脚本
# 目标服务器：8.130.166.199

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
SERVER_IP="8.130.166.199"
SERVER_USER="root"
PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}飞行棋游戏一键部署脚本${NC}"
echo -e "${GREEN}目标服务器: ${SERVER_IP}${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否安装了必要的工具
check_requirements() {
    echo -e "${YELLOW}检查必要工具...${NC}"
    
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}错误: 未安装 ssh${NC}"
        exit 1
    fi
    
    if ! command -v scp &> /dev/null; then
        echo -e "${RED}错误: 未安装 scp${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 必要工具检查完成${NC}"
}

# 打包项目文件
package_project() {
    echo -e "${YELLOW}打包项目文件...${NC}"
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    
    # 复制项目文件（排除不必要的文件）
    rsync -av --exclude='node_modules' \
              --exclude='target' \
              --exclude='build' \
              --exclude='.git' \
              --exclude='.idea' \
              --exclude='.vscode' \
              --exclude='*.log' \
              ./ ${TEMP_DIR}/
    
    # 创建压缩包
    tar -czf ${PROJECT_NAME}.tar.gz -C ${TEMP_DIR} .
    
    # 清理临时目录
    rm -rf ${TEMP_DIR}
    
    echo -e "${GREEN}✓ 项目打包完成: ${PROJECT_NAME}.tar.gz${NC}"
}

# 上传到服务器
upload_to_server() {
    echo -e "${YELLOW}上传文件到服务器...${NC}"
    
    # 上传压缩包
    scp ${PROJECT_NAME}.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/
    
    echo -e "${GREEN}✓ 文件上传完成${NC}"
}

# 在服务器上部署
deploy_on_server() {
    echo -e "${YELLOW}在服务器上部署应用...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/${PROJECT_NAME}"

echo "创建项目目录..."
mkdir -p ${REMOTE_DIR}

echo "解压项目文件..."
tar -xzf /tmp/${PROJECT_NAME}.tar.gz -C ${REMOTE_DIR}

echo "进入项目目录..."
cd ${REMOTE_DIR}

echo "检查 Docker 和 Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "错误: 服务器未安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: 服务器未安装 Docker Compose"
    exit 1
fi

echo "停止旧容器（如果存在）..."
docker-compose -f docker-compose.prod.yml down || true

echo "清理旧镜像..."
docker system prune -f

echo "构建并启动容器..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "等待服务启动..."
sleep 30

echo "检查容器状态..."
docker-compose -f docker-compose.prod.yml ps

echo "清理临时文件..."
rm -f /tmp/${PROJECT_NAME}.tar.gz

echo "部署完成！"
echo "前端访问地址: http://8.130.166.199"
echo "后端 API 地址: http://8.130.166.199:8080"

ENDSSH
    
    echo -e "${GREEN}✓ 服务器部署完成${NC}"
}

# 清理本地临时文件
cleanup() {
    echo -e "${YELLOW}清理本地临时文件...${NC}"
    rm -f ${PROJECT_NAME}.tar.gz
    echo -e "${GREEN}✓ 清理完成${NC}"
}

# 显示部署信息
show_info() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}访问地址：${NC}"
    echo -e "  前端: ${GREEN}http://${SERVER_IP}${NC}"
    echo -e "  后端 API: ${GREEN}http://${SERVER_IP}:8080${NC}"
    echo -e ""
    echo -e "${YELLOW}测试账号：${NC}"
    echo -e "  用户名: ${GREEN}admin${NC}"
    echo -e "  密码: ${GREEN}password${NC}"
    echo -e ""
    echo -e "${YELLOW}查看日志：${NC}"
    echo -e "  ssh ${SERVER_USER}@${SERVER_IP}"
    echo -e "  cd ${REMOTE_DIR}"
    echo -e "  docker-compose -f docker-compose.prod.yml logs -f"
    echo -e "${GREEN}========================================${NC}"
}

# 主流程
main() {
    check_requirements
    package_project
    upload_to_server
    deploy_on_server
    cleanup
    show_info
}

# 执行主流程
main
