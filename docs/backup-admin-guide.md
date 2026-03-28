# Backup Admin Guide

Covers the configuration, operation, and restoration of the automated database backup system.

## Architecture

All application data — including cover image blobs — lives in PostgreSQL. A single `pg_dump` captures everything.

The system has two layers:

- **`backup/backup.sh`** — the backup script. Handles dump, retention, validation, Google Drive sync, alerting, and restore. Invoked manually via `just backup <command>` from any environment.
- **`backup/` Docker container** — a lightweight Alpine container that runs `backup.sh` on a cron schedule (daily, 2:00 AM UTC). Only starts under the `prod` Docker Compose profile.

**Retention:** 7 daily, 4 weekly (Sundays), 12 monthly (1st of month). Enforced locally after each backup run. Google Drive is append-only — old backups are uploaded but never deleted remotely, so Drive retains more than the minimum.

**Backup format:** PostgreSQL custom format (`pg_dump -Fc`). Compressed, supports selective and parallel restore.

## Prerequisites

- `rclone` installed on the server
- A dedicated Gmail account with 2FA enabled and an app password generated
- `just` command runner

## Configuration

### rclone (Google Drive)

```bash
rclone config
```

| Prompt | Value |
|--------|-------|
| New remote | `n` |
| Name | `gdrive` |
| Storage type | `drive` |
| Client ID | (blank) |
| Client secret | (blank) |
| Scope | `1` (full access) |
| Service account file | (blank) |
| Advanced config | `n` |
| Auto config | `y` on desktop, `n` on headless server |
| Shared Drive | `n` |

On a headless server, selecting `n` for auto config prints a URL. Open it in any browser, sign into the backup Gmail account, authorize, and paste the token back.

### Environment variables

Add to `.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `RCLONE_REMOTE` | rclone remote path | `gdrive:backups/prod` |
| `SMTP_FROM` | Gmail sender address | `backups@gmail.com` |
| `SMTP_PASSWORD` | Gmail app password (no spaces) | `abcdefghijklmnop` |
| `SMTP_TO` | Alert recipient | `team@example.com` |
| `BACKUP_ENV` | Label in alert subjects | `prod` |

The rclone config file must be accessible to the backup container. By default, `docker-compose.yml` mounts `${RCLONE_CONFIG:-./rclone.conf}` into the container.

### Starting the backup service

The backup container runs under the `prod` Docker Compose profile:

```bash
docker compose --profile prod up --build -d
```

It waits for the database health check before starting.

## Commands

| Command | Description |
|---------|-------------|
| `just backup` | Run a backup now (dump, validate, prune, push, alert) |
| `just backup list` | Show available backups with sizes |
| `just backup validate <file>` | Verify dump integrity via `pg_restore --list` |
| `just backup restore <file>` | Restore database (prompts for confirmation) |
| `just backup push` | Upload local backups to Google Drive |
| `just backup pull` | Download backups from Google Drive to local |

File arguments accept bare filenames (`backup-2026-03-24.dump`) or tier-prefixed paths (`daily/backup-2026-03-24.dump`). The script searches all tiers.

## Restore

### From a running system

```bash
just backup list
just backup restore backup-2026-03-24.dump
```

Uses `pg_restore --clean --if-exists`. Drops and recreates tables from the dump. The backend reconnects automatically — no restart needed.

### Disaster recovery (fresh server)

1. Deploy the application per the [Deployment Guide](deployment-guide.md).
2. Configure rclone and `.env` as described above.
3. Pull backups and restore:

```bash
just backup pull
just backup list
just backup restore backup-2026-03-24.dump
```

## Validation

```bash
just backup validate backup-2026-03-24.dump
```

Runs `pg_restore --list` against the dump, which reads the archive's table of contents without restoring. Fails if the file is corrupted or truncated. This check also runs automatically after each scheduled backup.

Requires `pg_restore` on the host. Always available inside the backup container.

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `rclone` 401 error on push/pull | OAuth token invalidated (password change, revocation) | `rclone config reconnect gdrive:` |
| SMTP "Login denied" | Bad app password, 2FA disabled, or spaces in password | Regenerate app password, ensure 2FA is on, remove spaces from `.env` |
| 0-byte `.dump` files | `pg_dump` failed (DB down, bad credentials) | Check `docker compose --profile prod logs backup`, delete empties with `find ./backups -name '*.dump' -empty -delete` |
| Backup container not starting | DB not healthy, missing `.env` vars, missing rclone config | Check `docker compose --profile prod logs backup` |

## Design Notes

- **`rclone copy` (not `sync`)** for uploads. Never deletes remote files, preventing accidental loss if local backups are wiped.
- **`RCLONE_REMOTE` is required**, not defaulted. Prevents dev environments from accidentally pushing to production's Drive folder.
