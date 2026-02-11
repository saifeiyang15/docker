#!/bin/bash

# 停止本地开发环境

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}停止所有服务...${NC}"

# 停止前端
if [ -f "frontend.pid" ]; then
    PID=$(cat frontend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓ 前端已停止${NC}"
    fi
    rm -f frontend.pid
fi

# 停止后端
if [ -f "backend.pid" ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓ 后端已停止${NC}"
    fi
    rm -f backend.pid
fi

# 停止 MySQL
if docker ps | grep -q flight-chess-mysql; then
    docker stop flight-chess-mysql
    docker rm flight-chess-mysql
    echo -e "${GREEN}✓ MySQL 已停止${NC}"
fi

echo -e "${GREEN}所有服务已停止${NC}"
