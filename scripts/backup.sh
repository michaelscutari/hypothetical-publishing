#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# backup.sh — pg_dump-based backup with staggered retention
#
# Usage:
#   ./scripts/backup.sh              # run a backup now
#   ./scripts/backup.sh run          # same as above
#
# Future subcommands (added in later PRs):
#   ./scripts/backup.sh list         # list available backups
#   ./scripts/backup.sh restore <f>  # restore from a backup file
#   ./scripts/backup.sh validate <f> # validate a backup file
#   ./scripts/backup.sh push         # sync to Google Drive
#   ./scripts/backup.sh pull         # fetch from Google Drive
# ---------------------------------------------------------------------------

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB_HOST="${DB_HOST:-db}"
DB_NAME="${DB_NAME:-book_publishing}"
DB_USER="${DB_USERNAME:-}"

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
# Dispatch
# ---------------------------------------------------------------------------

case "$ACTION" in
    run)      cmd_run ;;
    *)        die "Unknown action: $ACTION (expected: run)" ;;
esac
