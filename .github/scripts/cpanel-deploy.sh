#!/usr/bin/env bash
# Deploy 1 gói lên hosting cPanel qua SSH, tráo thư mục + tự quay về bản cũ nếu app không sống.
#   bash cpanel-deploy.sh <tên-ngắn> <thư-mục-app-trên-hosting> <file.tar.gz>
#   VD: bash cpanel-deploy.sh web mayqueen-web web.tar.gz
# Cần biến môi trường: SSH_HOST, SSH_PORT, SSH_USER, SSH_KEY (private key), HEALTH_URL (link kiểm tra sống).
set -euo pipefail

NAME="$1"      # web | api
APP_DIR="$2"   # thư mục app trong home (đúng "Application root" trong Setup Node.js App)
TARBALL="$3"

: "${SSH_HOST:?thiếu CPANEL_SSH_HOST}" "${SSH_USER:?thiếu CPANEL_SSH_USER}" "${SSH_KEY:?thiếu secret CPANEL_SSH_KEY}"
SSH_PORT="${SSH_PORT:-22}"

mkdir -p ~/.ssh
# bỏ ký tự \r (dán khoá từ Windows) — có \r thì ssh báo "invalid format"
printf '%s\n' "$SSH_KEY" | tr -d '\r' > ~/.ssh/deploy_key
chmod 600 ~/.ssh/deploy_key
if ! ssh-keygen -y -f ~/.ssh/deploy_key >/dev/null 2>&1; then
  echo "::error::Secret CPANEL_SSH_KEY không phải khoá bí mật hợp lệ — dán lại TOÀN BỘ file mayqueen_deploy (không phải file .pub), gồm cả dòng -----BEGIN... và -----END...-----"
  exit 1
fi

echo "▶ Kết nối SSH $SSH_USER@$SSH_HOST:$SSH_PORT…"
for i in 1 2 3; do
  ssh-keyscan -T 15 -p "$SSH_PORT" -H "$SSH_HOST" >> ~/.ssh/known_hosts 2>/dev/null && [ -s ~/.ssh/known_hosts ] && break
  sleep 5
done
if [ ! -s ~/.ssh/known_hosts ]; then
  echo "::error::Không kết nối được cổng SSH $SSH_PORT của $SSH_HOST từ GitHub — kiểm tra CPANEL_SSH_HOST / CPANEL_SSH_PORT, hoặc nhờ hosting mở SSH cho IP của GitHub Actions"
  exit 1
fi
SSH=(ssh -i ~/.ssh/deploy_key -p "$SSH_PORT" -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=15 "$SSH_USER@$SSH_HOST")
if ! "${SSH[@]}" 'mkdir -p ~/.deploy'; then
  echo "::error::Hosting từ chối đăng nhập SSH (sai khoá / sai user). Kiểm tra: khoá công khai đã có trong ~/.ssh/authorized_keys trên hosting, CPANEL_SSH_USER = mayqueen, CPANEL_SSH_KEY đúng file mayqueen_deploy"
  exit 1
fi

echo "▶ Gửi gói $TARBALL ($(du -h "$TARBALL" | cut -f1)) lên hosting…"
scp -i ~/.ssh/deploy_key -P "$SSH_PORT" -o BatchMode=yes "$TARBALL" "$SSH_USER@$SSH_HOST:.deploy/$NAME.tar.gz"

# Lệnh chạy TRÊN hosting
remote() { "${SSH[@]}" "NAME='$NAME' APP_DIR='$APP_DIR' bash -s" ; }

restart_cmd='
# Tắt tiến trình Node còn chạy code của bản cũ (thư mục làm việc nằm trong ~/.deploy/<tên>-prev hoặc -failed).
# LiteSpeed không tự tắt chúng sau khi khởi động lại → chiếm chỗ trong giới hạn 100 tiến trình / luồng của tài khoản
# (đầy thì app mới không khởi động được, site báo 508) và có thể vẫn trả lời bằng code cũ.
stop_old() {
  for p in /proc/[0-9]*; do
    cwd=$(readlink "$p/cwd" 2>/dev/null) || continue
    case "$cwd" in
      "$HOME/.deploy/$NAME-prev"*|"$HOME/.deploy/$NAME-failed"*) kill "${p#/proc/}" 2>/dev/null || true ;;
    esac
  done
}
restart_app() {
  # CloudLinux Node.js Selector; không có lệnh này thì dùng cách chuẩn của Passenger (tmp/restart.txt)
  cloudlinux-selector restart --json --interpreter nodejs --app-root "$APP_DIR" >/dev/null 2>&1 || true
  mkdir -p "$HOME/$APP_DIR/tmp" && touch "$HOME/$APP_DIR/tmp/restart.txt"
  stop_old
}'

echo "▶ Giải nén + tráo bản mới…"
remote <<EOF
set -euo pipefail
$restart_cmd
APP="\$HOME/\$APP_DIR"; NEW="\$HOME/.deploy/\$NAME-new"; PREV="\$HOME/.deploy/\$NAME-prev"
rm -rf "\$NEW"; mkdir -p "\$NEW"
tar -xzf "\$HOME/.deploy/\$NAME.tar.gz" -C "\$NEW"
# giữ file riêng của hosting (cấu hình bí mật, rewrite của cPanel) — không nằm trong gói build
for f in .env .htaccess; do if [ -f "\$APP/\$f" ]; then cp -p "\$APP/\$f" "\$NEW/\$f"; fi; done
rm -rf "\$PREV"
if [ -d "\$APP" ]; then mv "\$APP" "\$PREV"; fi
mv "\$NEW" "\$APP"
rm -f "\$HOME/.deploy/\$NAME.tar.gz"
restart_app
echo "  đã tráo bản mới vào \$APP (bản cũ: \$PREV)"
EOF

echo "▶ Kiểm tra app sống: $HEALTH_URL"
# Gọi TỪ CHÍNH HOSTING (qua SSH), ép tên miền về IP máy chủ (--resolve): kiểm tra đúng app vừa deploy mà không phụ
# thuộc DNS / mạng quốc tế của GitHub (tên miền .vn mới tạo: máy chủ DNS ở Mỹ có thể còn nhớ "chưa có bản ghi"
# hàng giờ → GitHub báo lỗi kết nối dù khách ở Việt Nam vẫn vào bình thường).
HC_HOST=$(printf '%s' "$HEALTH_URL" | sed -E 's#^[a-z]+://([^/:]+).*#\1#')
HC_IP=$(getent ahostsv4 "$SSH_HOST" 2>/dev/null | awk 'NR==1{print $1}')
HC_IP=${HC_IP:-$SSH_HOST}
for i in $(seq 1 12); do
  code=$("${SSH[@]}" "curl -s -o /dev/null -w '%{http_code}' --max-time 20 --resolve '$HC_HOST:443:$HC_IP' --resolve '$HC_HOST:80:$HC_IP' '$HEALTH_URL'" 2>/dev/null || true)
  code=${code:-000}
  if [ "$code" = "200" ]; then
    echo "✓ Deploy $NAME thành công (HTTP 200)"
    exit 0
  fi
  if [ "$code" = "508" ]; then
    echo "  lần $i: HTTP 508 — tài khoản hosting chạm giới hạn tài nguyên (tiến trình / RAM), chờ giải phóng…"
  else
    echo "  lần $i: HTTP $code — chờ app khởi động…"
  fi
  sleep 10
done

echo "::error::App $NAME không phản hồi 200 sau khi deploy → quay về bản cũ"
remote <<EOF
set -euo pipefail
$restart_cmd
APP="\$HOME/\$APP_DIR"; PREV="\$HOME/.deploy/\$NAME-prev"; BAD="\$HOME/.deploy/\$NAME-failed"
if [ -d "\$PREV" ]; then
  rm -rf "\$BAD"; mv "\$APP" "\$BAD"; mv "\$PREV" "\$APP"; restart_app
  echo "  đã khôi phục bản cũ; bản lỗi để ở \$BAD (xem \$BAD/stderr.log)"
fi
EOF
exit 1
