#!/bin/sh

echo "🚀 Bắt đầu quá trình Deploy Zero-Trust với Infisical..."

# Cài đặt Infisical CLI qua Alpine package manager (dành cho docker:cli container)
apk add --no-cache bash wget
wget -qO- 'https://artifacts-cli.infisical.com/setup.apk.sh' | sh
apk update && apk add infisical

infisical run --projectId "79601934-6801-4afa-a075-60fcc40d90f8" --env prod --path "/lobehub" -- docker compose -p internal-tools-lobehub-wxvqn9 -f ./docker-compose/deploy/docker-compose.yml up -d --build --remove-orphans

echo "✅ Deploy thành công!"
