#!/bin/bash

echo "🚀 Bắt đầu quá trình Deploy Zero-Trust với Infisical..."

wget -qO- https://github.com/Infisical/infisical/releases/latest/download/infisical_linux_amd64.tar.gz | tar xz -C /tmp infisical

chmod +x /tmp/infisical

/tmp/infisical run --projectId "79601934-6801-4afa-a075-60fcc40d90f8" --env prod --path "/lobehub" -- docker compose -p internal-tools-lobehub-wxvqn9 -f ./docker-compose/deploy/docker-compose.yml up -d --build --remove-orphans

echo "✅ Deploy thành công!"