#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# backup.sh — pg_dump-based backup with staggered retention
#
# Usage:
#   ./scripts/backup.sh              # run a backup now
#   ./scripts/backup.sh run          # same as above
#
#   ./scripts/backup.sh push         # upload backups to Google Drive
#   ./scripts/backup.sh pull         # download backups from Google Drive
#
# Future subcommands (added in later PRs):
#   ./scripts/backup.sh list         # list available backups
#   ./scripts/backup.sh restore <f>  # restore from a backup file
#   ./scripts/backup.sh validate <f> # validate a backup file
# ---------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-book_publishing}"
DB_USER="${DB_USERNAME:-}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
SMTP_FROM="${SMTP_FROM:-}"
SMTP_PASSWORD="${SMTP_PASSWORD:-}"
SMTP_TO="${SMTP_TO:-}"
BACKUP_ENV="${BACKUP_ENV:-dev}"

ACTION="${1:-run}"
TARGET="${2:-}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

log()  { echo "[backup] $(date -u '+%Y-%m-%d %H:%M:%S UTC') $*"; }
err()  { log "ERROR: $*" >&2; }
die()  { err "$@"; exit 1; }

require_env() {
    if [[ -z "${!1:-}" ]]; then
        die "Required environment variable $1 is not set"
    fi
}

# Send an email alert via Gmail SMTP + app password. Skips if not configured.
send_alert() {
    local subject="$1"
    local body="$2"

    if [[ -z "$SMTP_FROM" || -z "$SMTP_PASSWORD" || -z "$SMTP_TO" ]]; then
        log "SMTP not configured — skipping alert"
        return
    fi

    log "Sending alert: $subject"
    curl -s --url "smtps://smtp.gmail.com:465" \
        --user "${SMTP_FROM}:${SMTP_PASSWORD}" \
        --mail-from "$SMTP_FROM" \
        --mail-rcpt "$SMTP_TO" \
        -T <(printf "From: %s\nTo: %s\nSubject: %s\n\n%s\n" \
            "$SMTP_FROM" "$SMTP_TO" "$subject" "$body") \
        && log "Alert sent" \
        || log "WARNING: Failed to send alert email"
}

# Run a pg command. Inside a container, connect over the network to DB_HOST.
# From the host, use docker exec into the db container (no network needed).
pg_cmd() {
    local cmd="$1"; shift
    if [[ -f /.dockerenv ]]; then
        "$cmd" -h "$DB_HOST" -U "$DB_USER" "$@"
    else
        local container
        container="$(docker compose ps -q db)"
        docker exec "$container" "$cmd" -U "$DB_USER" "$@"
    fi
}

# ---------------------------------------------------------------------------
# run — create a backup, promote if applicable, prune old backups
# ---------------------------------------------------------------------------

cmd_run() {
    require_env DB_USERNAME

    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

    local today
    today="$(date -u '+%Y-%m-%d')"
    local daily_file="$BACKUP_DIR/daily/backup-${today}.dump"

    # 1. Dump
    log "Starting pg_dump for $DB_NAME ..."
    if ! pg_cmd pg_dump -Fc "$DB_NAME" > "$daily_file"; then
        rm -f "$daily_file"
        die "pg_dump failed"
    fi

    local size
    size="$(du -h "$daily_file" | cut -f1)"
    log "Dump complete: $daily_file ($size)"

    # 2. Validate
    if command -v pg_restore > /dev/null 2>&1; then
        log "Validating dump ..."
        if ! pg_restore --list "$daily_file" > /dev/null 2>&1; then
            die "Dump validation failed — file may be corrupted"
        fi
        log "Validation passed"
    else
        log "pg_restore not found on host — skipping validation"
    fi

    # 3. Promote to weekly (Sunday = 0 in date +%w on Linux, 7 on some systems)
    local dow
    dow="$(date -u '+%w')"
    if [[ "$dow" -eq 0 ]]; then
        cp "$daily_file" "$BACKUP_DIR/weekly/backup-${today}.dump"
        log "Promoted to weekly"
    fi

    # 4. Promote to monthly (1st of month)
    local dom
    dom="$(date -u '+%d')"
    if [[ "$dom" -eq 1 ]]; then
        cp "$daily_file" "$BACKUP_DIR/monthly/backup-${today}.dump"
        log "Promoted to monthly"
    fi

    # 5. Prune
    prune "daily"   7
    prune "weekly"  4
    prune "monthly" 12

    # 6. Push to remote (if rclone is available and configured)
    if command -v rclone > /dev/null 2>&1 && [[ -n "$RCLONE_REMOTE" ]]; then
        cmd_push
    else
        log "rclone not configured — skipping remote upload"
    fi

    log "Backup complete"
}

# ---------------------------------------------------------------------------
# prune — keep only the N most recent dumps in a tier directory
# ---------------------------------------------------------------------------

prune() {
    local tier="$1"
    local keep="$2"
    local dir="$BACKUP_DIR/$tier"

    local count
    count="$(find "$dir" -name 'backup-*.dump' | wc -l | tr -d ' ')"

    if [[ "$count" -le "$keep" ]]; then
        return
    fi

    local to_delete
    to_delete=$(ls -1 "$dir"/backup-*.dump | sort -r | tail -n +"$((keep + 1))")
    for f in $to_delete; do
        log "Pruning $f"
        rm -f "$f"
    done
}

# ---------------------------------------------------------------------------
# push — upload local backups to Google Drive (copy-only, never deletes remote)
# ---------------------------------------------------------------------------

cmd_push() {
    if ! command -v rclone > /dev/null 2>&1; then
        die "rclone is not installed"
    fi
    require_env RCLONE_REMOTE

    log "Uploading backups to $RCLONE_REMOTE ..."
    rclone copy "$BACKUP_DIR" "$RCLONE_REMOTE" --log-level INFO
    log "Upload complete"
}

# ---------------------------------------------------------------------------
# pull — download backups from Google Drive to local
# ---------------------------------------------------------------------------

cmd_pull() {
    if ! command -v rclone > /dev/null 2>&1; then
        die "rclone is not installed"
    fi
    require_env RCLONE_REMOTE

    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

    log "Downloading backups from $RCLONE_REMOTE ..."
    rclone copy "$RCLONE_REMOTE" "$BACKUP_DIR" --log-level INFO
    log "Download complete"
}

# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

# Run with alerting — sends success/failure email after cmd_run
run_with_alert() {
    local output
    if output=$(cmd_run 2>&1); then
        echo "$output"
        send_alert "[backup/$BACKUP_ENV] SUCCESS $(date -u '+%Y-%m-%d')" "$output"
    else
        echo "$output"
        send_alert "[backup/$BACKUP_ENV] FAILED $(date -u '+%Y-%m-%d')" "$output"
        exit 1
    fi
}

case "$ACTION" in
    run)      run_with_alert ;;
    push)     cmd_push ;;
    pull)     cmd_pull ;;
    *)        die "Unknown action: $ACTION (expected: run, push, pull)" ;;
esac
