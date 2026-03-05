#!/usr/bin/env bash
# Discord 알림 템플릿 — 사이클 스크립트에서 source로 포함
# 사용법: source .tmp/discord-template.sh
#
# 내부적으로 Node.js CLI(scripts/ops/notify-cycle.mjs)에 위임합니다.
# 레거시 send_discord / send_discord_embed 함수도 유지합니다.

DISCORD_WEBHOOK="https://discord.com/api/webhooks/1472003797932052582/NpPRubEzC1FjIhwCpZf9WZKc8jDgqbYdVslXCfJnX_ZquR_-VmSWdXY0LMfrumsMs33N"

# Export webhook so the Node CLI can use it
export FLOWHR_DISCORD_NOTIFICATION_WEBHOOK="${FLOWHR_DISCORD_NOTIFICATION_WEBHOOK:-$DISCORD_WEBHOOK}"

NOTIFY_CLI="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/scripts/ops/notify-cycle.mjs"

send_discord() {
  local CONTENT="$1"
  CONTENT="${CONTENT:0:1990}"
  local JSON
  JSON=$(PYTHONUTF8=1 python -c "import json,sys; print(json.dumps({'content': sys.argv[1]}))" "$CONTENT" 2>/dev/null) \
    || JSON="{\"content\":\"${CONTENT}\"}"
  curl -s -H "Content-Type: application/json" -d "$JSON" "$DISCORD_WEBHOOK" > /dev/null 2>&1 || true
}

send_discord_embed() {
  local TITLE="$1" DESC="$2" COLOR="$3" FIELDS="${4:-}"
  # Try Node CLI first (supports fields), fall back to curl
  if [ -f "$NOTIFY_CLI" ] && command -v node > /dev/null 2>&1; then
    if [ -n "$FIELDS" ]; then
      node "$NOTIFY_CLI" cycle-start --title "$TITLE" --description "$DESC" --fields "$FIELDS" 2>/dev/null && return 0
    fi
  fi
  # Fallback: original curl approach
  local FOOTER="FlowHR Codex | $(date '+%Y-%m-%d %H:%M')"
  local JSON
  JSON=$(PYTHONUTF8=1 python -c "
import json,sys
print(json.dumps({'embeds':[{
  'title': sys.argv[1],
  'description': sys.argv[2],
  'color': int(sys.argv[3]),
  'footer': {'text': sys.argv[4]}
}]}))
" "$TITLE" "$DESC" "$COLOR" "$FOOTER" 2>/dev/null)
  curl -s -H "Content-Type: application/json" -d "$JSON" "$DISCORD_WEBHOOK" > /dev/null 2>&1 || true
}

# Node CLI 래퍼 함수
notify_cycle_start() {
  node "$NOTIFY_CLI" cycle-start "$@" 2>/dev/null || send_discord_embed "$@"
}

notify_wi_start() {
  node "$NOTIFY_CLI" wi-start "$@" 2>/dev/null || send_discord "$@"
}

notify_wi_complete() {
  node "$NOTIFY_CLI" wi-complete "$@" 2>/dev/null || send_discord "$@"
}

notify_cycle_complete() {
  node "$NOTIFY_CLI" cycle-complete "$@" 2>/dev/null || send_discord_embed "$@"
}

# 양식 규칙:
# - 사이클 시작: send_discord_embed "📊 Cycle N: 한국어 제목" "WI-XXXX~YYYY (총 N개)" "3447003" '[{"name":"WI-0950","value":"✅ 직원 초대","inline":true}]'
# - WI 시작:    send_discord "⏳ [N/총] WI-XXXX 한국어 설명 시작"
# - WI 완료:    send_discord "✅ WI-XXXX 한국어 설명 완료 (N/총)"
# - WI 실패:    send_discord "❌ WI-XXXX 실패"
# - 사이클 완료: send_discord_embed "✅ Cycle N 완료: 한국어 제목" "성공 N / 실패 N / 총 N" "3066993" '[{"name":"WI-0950","value":"✅ 직원 초대","inline":true}]'
# - 사이클 실패: send_discord_embed "⚠️ Cycle N 완료 (일부 실패)" "성공 N / 실패 N / 총 N" "15158332"
