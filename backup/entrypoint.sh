#!/usr/bin/env bash
set -euo pipefail

# Write env vars to a file that cron jobs can source, since cron
# does not inherit the container's environment on Alpine.
env | grep -E '^(DB_|BACKUP_|PGPASSWORD|RCLONE_|SMTP_)' > /etc/backup.env

# Wrap the backup script so cron jobs load the env
cat > /usr/local/bin/run-backup <<'WRAPPER'
#!/usr/bin/env bash
set -a
source /etc/backup.env
set +a
exec /backup/backup.sh "$@"
WRAPPER
chmod +x /usr/local/bin/run-backup

# Update crontab to call the wrapper
sed -i 's|/backup/backup.sh|/usr/local/bin/run-backup|' /etc/crontabs/root

echo "[backup] Starting cron scheduler ..."
exec crond -f -l 2
