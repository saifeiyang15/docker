#!/bin/bash

# 本地开发环境启动脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}飞行棋游戏 - 本地开发环境启动${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查必要工具
check_tools() {
    echo -e "${YELLOW}检查必要工具...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}错误: 未安装 Docker${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: 未安装 Node.js${NC}"
        echo -e "${YELLOW}请访问 https://nodejs.org 安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}错误: 未安装 Maven${NC}"
        echo -e "${YELLOW}请访问 https://maven.apache.org 安装 Maven${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ 工具检查完成${NC}"
}

# 启动 MySQL
start_mysql() {
    echo -e "${YELLOW}启动 MySQL 数据库...${NC}"
    
    # 检查是否已有 MySQL 容器在运行
    if docker ps | grep -q flight-chess-mysql; then
        echo -e "${GREEN}✓ MySQL 已在运行${NC}"
    else
        # 停止并删除旧容器
        docker rm -f flight-chess-mysql 2>/dev/null || true
        
        # 启动新容器
        docker run -d \
            --name flight-chess-mysql \
            -p 3306:3306 \
            -e MYSQL_ROOT_PASSWORD=root123456 \
            -e MYSQL_DATABASE=flight_chess \
            -v $(pwd)/mysql/init:/docker-entrypoint-initdb.d \
            mysql:8.0
        
        echo -e "${YELLOW}等待 MySQL 启动...${NC}"
        sleep 20
        echo -e "${GREEN}✓ MySQL 启动完成${NC}"
    fi
}

# 启动后端
start_backend() {
    echo -e "${YELLOW}启动 Spring Boot 后端...${NC}"
    
    cd backend
    
    # 检查是否已编译
    if [ ! -f "target/flight-chess-game-1.0.0.jar" ]; then
        echo -e "${YELLOW}首次运行，正在编译后端（可能需要几分钟）...${NC}"
        mvn clean package -DskipTests
    fi
    
    # 后台启动 Spring Boot
    nohup mvn spring-boot:run > ../backend.log 2>&1 &
    echo $! > ../backend.pid
    
    cd ..
    echo -e "${GREEN}✓ 后端启动中，日志: backend.log${NC}"
}

# 启动前端
start_frontend() {
    echo -e "${YELLOW}启动 React 前端...${NC}"
    
    cd frontend
    
    # 检查是否已安装依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}首次运行，正在安装依赖（可能需要几分钟）...${NC}"
        npm install --legacy-peer-deps
    fi
    
    # 后台启动 React
    nohup npm start > ../frontend.log 2>&1 &
    echo $! > ../frontend.pid
    
    cd ..
    echo -e "${GREEN}✓ 前端启动中，日志: frontend.log${NC}"
}

# 显示信息
show_info() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}启动完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}访问地址：${NC}"
    echo -e "  前端: ${GREEN}http://localhost:4000${NC}"
    echo -e "  后端: ${GREEN}http://localhost:8080${NC}"
    echo -e ""
    echo -e "${YELLOW}测试账号：${NC}"
    echo -e "  用户名: ${GREEN}admin / player1 / player2${NC}"
    echo -e "  密码: ${GREEN}password${NC}"
    echo -e ""
    echo -e "${YELLOW}查看日志：${NC}"
    echo -e "  后端: ${GREEN}tail -f backend.log${NC}"
    echo -e "  前端: ${GREEN}tail -f frontend.log${NC}"
    echo -e ""
    echo -e "${YELLOW}停止服务：${NC}"
    echo -e "  ${GREEN}./stop-local.sh${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# 主流程
main() {
    check_tools
    start_mysql
    start_backend
    sleep 5
    start_frontend
    sleep 3
    show_info
}

main
