
#!/bin/bash

# 部署脚本 - 请在 Linux 服务器上执行
# 使用方法: ./deploy.sh

set -e # 遇到错误立即停止

PROJECT_DIR="/var/www/lifeCoordinates"
echo "🚀 开始部署 Life Coordinates..."

# 1. 进入项目目录
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ 项目目录不存在: $PROJECT_DIR"
  exit 1
fi
cd $PROJECT_DIR

# 2. 拉取最新代码
echo "📥 拉取 Git 代码..."
# git pull origin main

# 3. 安装依赖
echo "📦 安装依赖..."
npm ci

# 4. 构建项目
echo "🏗️ 构建全站应用..."
npm run build

# 5. 重启后端服务 (PM2)
echo "🔄 重启后端 API 服务..."
pm2 reload deploy/ecosystem.config.cjs || pm2 start deploy/ecosystem.config.cjs

# 6. 重载 Nginx 配置
echo "web 重载 Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ 部署完成！"
