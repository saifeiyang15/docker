#!/bin/bash

# 飞行棋游戏一键直接部署脚本（不使用压缩包）
# 目标服务器：8.130.166.199
# 使用 rsync 直接同步文件

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
echo -e "${GREEN}飞行棋游戏一键直接部署脚本${NC}"
echo -e "${GREEN}目标服务器: ${SERVER_IP}${NC}"
echo -e "${GREEN}部署方式: rsync 直接同步${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否安装了必要的工具
check_requirements() {
    echo -e "${YELLOW}[1/5] 检查必要工具...${NC}"
    
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}错误: 未安装 ssh${NC}"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        echo -e "${RED}错误: 未安装 rsync${NC}"
        echo -e "${YELLOW}提示: macOS 可以使用 brew install rsync 安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 必要工具检查完成${NC}"
}

# 测试服务器连接
test_connection() {
    echo -e "${YELLOW}[2/5] 测试服务器连接...${NC}"
    
    if ssh -o ConnectTimeout=10 ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" &> /dev/null; then
        echo -e "${GREEN}✓ 服务器连接正常${NC}"
    else
        echo -e "${RED}错误: 无法连接到服务器 ${SERVER_IP}${NC}"
        echo -e "${YELLOW}请检查：${NC}"
        echo -e "  1. 服务器 IP 地址是否正确"
        echo -e "  2. SSH 密钥是否已配置"
        echo -e "  3. 服务器防火墙是否开放 SSH 端口"
        exit 1
    fi
}

# 在服务器上创建目录并安装必要工具
prepare_server() {
    echo -e "${YELLOW}[3/5] 准备服务器环境...${NC}"
    
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
        # CentOS/RHEL/Alibaba Cloud Linux
        yum install -y rsync
    elif command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        apt-get update && apt-get install -y rsync
    else
        echo "错误: 无法自动安装 rsync，请手动安装"
        exit 1
    fi
    echo "✓ rsync 安装完成"
else
    echo "✓ rsync 已安装"
fi

echo "检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "错误: 服务器未安装 Docker"
    echo "请先安装 Docker: curl -fsSL https://get.docker.com | sh"
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

# 使用 rsync 直接同步文件到服务器
sync_files() {
    echo -e "${YELLOW}[4/5] 同步项目文件到服务器...${NC}"
    echo -e "${BLUE}正在同步，请稍候...${NC}"
    
    # 使用 rsync 同步文件，排除不必要的文件和目录
    rsync -avz --progress \
        --exclude='node_modules/' \
        --exclude='target/' \
        --exclude='build/' \
        --exclude='.git/' \
        --exclude='.idea/' \
        --exclude='.vscode/' \
        --exclude='*.log' \
        --exclude='*.pid' \
        --exclude='*.tar.gz' \
        --exclude='.DS_Store' \
        --exclude='__pycache__/' \
        --exclude='*.pyc' \
        --delete \
        ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/
    
    echo -e "${GREEN}✓ 文件同步完成${NC}"
}

# 在服务器上部署应用
deploy_application() {
    echo -e "${YELLOW}[5/5] 在服务器上部署应用...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

PROJECT_NAME="flight-chess-game"
REMOTE_DIR="/opt/\${PROJECT_NAME}"

echo "进入项目目录..."
cd \${REMOTE_DIR}

echo "停止旧容器（如果存在）..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "清理未使用的 Docker 资源..."
docker system prune -f

echo "构建并启动容器..."
echo "这可能需要几分钟时间，请耐心等待..."
docker-compose -f docker-compose.prod.yml up -d --build

echo ""
echo "等待服务启动..."
echo "MySQL 初始化中..."
sleep 10

echo "后端服务启动中..."
sleep 20

echo "前端服务启动中..."
sleep 10

echo ""
echo "检查容器状态..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "检查服务健康状态..."
for i in {1..30}; do
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✓ 前端服务已就绪"
        break
    fi
    if [ \$i -eq 30 ]; then
        echo "警告: 前端服务启动超时，请检查日志"
    fi
    sleep 2
done

for i in {1..30}; do
    if curl -f http://localhost:8080/api/auth/validate > /dev/null 2>&1; then
        echo "✓ 后端服务已就绪"
        break
    fi
    if [ \$i -eq 30 ]; then
        echo "警告: 后端服务启动超时，请检查日志"
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
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}"
    echo ""
    echo -e "  查看容器状态:"
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod.yml ps${NC}"
    echo ""
    echo -e "  重启服务:"
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod.yml restart${NC}"
    echo ""
    echo -e "  停止服务:"
    echo -e "    ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}💡 提示：${NC}"
    echo -e "  - 首次访问可能需要等待 1-2 分钟"
    echo -e "  - 如遇问题，请查看容器日志"
    echo -e "  - 数据库数据持久化在 Docker volume 中"
    echo -e "${GREEN}========================================${NC}"
}

# 错误处理
error_handler() {
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}部署过程中出现错误！${NC}"
    echo -e "${RED}========================================${NC}"
    echo -e "${YELLOW}请检查：${NC}"
    echo -e "  1. 服务器连接是否正常"
    echo -e "  2. Docker 服务是否运行"
    echo -e "  3. 服务器磁盘空间是否充足"
    echo -e "  4. 防火墙是否开放 80 和 8080 端口"
    echo ""
    echo -e "${YELLOW}查看详细日志：${NC}"
    echo -e "  ssh ${SERVER_USER}@${SERVER_IP}"
    echo -e "  cd ${REMOTE_DIR}"
    echo -e "  docker-compose -f docker-compose.prod.yml logs"
    echo -e "${RED}========================================${NC}"
    exit 1
}

# 设置错误处理
trap error_handler ERR

# 主流程
main() {
    echo ""
    check_requirements
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

# 执行主流程
main
