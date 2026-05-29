#!/bin/bash
echo "Đang kết nối tới Infisical API..."

AUTH_RESPONSE=$(curl -s -X POST https://infisical.jemmia.vn/api/v1/auth/universal-auth/login \
  -H "Content-Type: application/json" \
  -d '{"clientId": "'$INFISICAL_CLIENT_ID'", "clientSecret": "'$INFISICAL_CLIENT_SECRET'"}')

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | jq -r .accessToken)

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "Lỗi: Sai Client ID hoặc Secret!"
  exit 1
fi

SECRETS_RESPONSE=$(curl -s -X GET "https://infisical.jemmia.vn/api/v3/secrets/raw?environment=prod&workspaceId=79601934-6801-4afa-a075-60fcc40d90f8&secretPath=/lobehub" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "$SECRETS_RESPONSE" | jq -r '.secrets[] | "\(.secretKey)=\(.secretValue)"' > .env

echo "Đã kéo thành công file .env từ Infisical!"