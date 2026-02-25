# 多阶段构建 - 构建阶段
FROM node:18-alpine AS build
WORKDIR /app

# 设置 npm 配置，增加内存限制和超时时间
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=false

# 复制 package.json 并安装依赖
COPY package.json package-lock.json* ./
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 100000 && \
    rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps --verbose && \
    npm install ajv@8.17.1 --legacy-peer-deps

# 复制源代码并构建
COPY . .
RUN npm run build

# 运行阶段 - 使用 nginx 提供静态文件服务
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 删除默认的 nginx 静态文件
RUN rm -rf ./*

# 复制构建好的文件
COPY --from=build /app/build .

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
