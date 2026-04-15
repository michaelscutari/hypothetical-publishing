# Deployment Guide

This guide walks through deploying the application to a production server from scratch.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- [Docker Engine](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/) (v2+)
- Git
- A domain name pointed at your server (the prod config uses `hypotheticalpublishing.colab.duke.edu`)

No other runtime dependencies are needed. Java, Node.js, and PostgreSQL all run inside containers.

## SSL Certificate

The production Nginx config expects Let's Encrypt certificates. Install certbot and obtain a cert before starting the app:

```bash
sudo apt update && sudo apt install -y certbot
sudo certbot certonly --standalone -d hypotheticalpublishing.colab.duke.edu
```

This places certs at `/etc/letsencrypt/live/hypotheticalpublishing.colab.duke.edu/`. The docker-compose file mounts this directory into the Nginx container.

To set up auto-renewal:

```bash
sudo certbot renew --dry-run
```

Certbot installs a systemd timer for automatic renewal by default.

## Clone and Configure

```bash
git clone <repo-url>
cd hypothetical-publishing
cp .env.example .env
```

Edit `.env` with production values:

| Variable               | Notes                                                    |
|------------------------|----------------------------------------------------------|
| `DB_USERNAME`          | PostgreSQL username                                      |
| `DB_PASSWORD`          | Use a strong, random password                            |
| `JWT_SECRET`           | Use a long random string (e.g. `openssl rand -hex 32`)   |
| `JWT_EXPIRATION_HOURS` | Token lifetime in hours (default: `24`)                  |
| `ADMIN_PASSWORD`       | Password for the default admin account                   |
| `CURRENCY_API_APP_ID`  | Open Exchange Rates app-id (free tier works)             |
| `PUBLISHER_NAME`       | Display name shown in UI + report headers (§4.2.2)       |
| `PUBLISHER_SHORT_NAME` | Compact label used in the dashboard header               |
| `PUBLISHER_LOGO_URL`   | Path served for the logo (defaults to `/branding/logo.svg`) |

You also need to set the Spring profile. Add this to `.env`:

```
SPRING_PROFILES_ACTIVE=prod
```

This enables secure cookies, disables Swagger UI, and turns off SQL logging.

## Deploy

```bash
docker compose --profile prod up --build -d
```

This builds and starts all production services:
- **db**: PostgreSQL 16 with a persistent volume
- **backend**: Spring Boot JAR (built from source in a multi-stage Docker build)
- **frontend-prod**: Static React build served by Nginx
- **nginx-prod**: Reverse proxy with SSL termination

## Verify

Check that all containers are running:

```bash
docker compose --profile prod ps
```

Check backend logs:

```bash
docker compose --profile prod logs backend
```

Hit the health endpoint:

```bash
curl -k https://hypotheticalpublishing.colab.duke.edu/api/health
```

## Database

There are no migrations. Hibernate manages the schema automatically with `ddl-auto=update`. When the backend starts, it compares the JPA entities to the existing tables and applies any changes (adding columns, creating new tables). It will not drop columns or tables.

Data is stored in a Docker volume called `postgres_data`. This volume persists across container restarts and rebuilds.

To completely wipe the database and start fresh:

```bash
docker compose --profile prod down -v
```

The `-v` flag deletes the `postgres_data` volume. The next `docker compose up` will create a new empty database and Hibernate will recreate the schema.

## Disaster Recovery

To restore the system from a backup after a fresh deploy:

1. Complete the deployment steps above so the application is running with an empty database.
2. Set up the backup system following the [Backup Admin Guide](backup-admin-guide.md) (rclone config, `.env` variables).
3. Pull backups from Google Drive:

```bash
just backup pull
```

4. Restore from the desired backup:

```bash
just backup list
just backup restore backup-2026-03-24.dump
```

The backend does not need to be restarted after a restore.

For full details on the backup system, see the [Backup Admin Guide](backup-admin-guide.md).

## White-Label Rebranding (§4.2.2)

The system can be rebadged for other publishers without code changes. Three env vars control the visible branding:

| Variable               | Purpose                                                                 |
|------------------------|-------------------------------------------------------------------------|
| `PUBLISHER_NAME`       | Full publisher name — shown on the login page, browser tab, and royalty report PDF header |
| `PUBLISHER_SHORT_NAME` | Compact label shown next to the logo in the dashboard header            |
| `PUBLISHER_LOGO_URL`   | Path to the logo asset served by the frontend (default `/branding/logo.svg`) |

**To change the publisher name / short name:**

1. Edit `.env` on the server and set the three variables.
2. Restart: `docker compose --profile prod up -d` (no rebuild needed — the backend reads them on startup and serves them via `GET /api/config/branding`; the frontend re-fetches on next page load).

**To replace the logo:**

1. Place the new logo at `frontend/public/branding/logo.svg` (SVG recommended — displays crisply at any size from 32px header icons to 80px report PDF headers). PNG is also fine.
2. Rebuild the frontend image: `docker compose --profile prod up --build -d frontend-prod`.
3. If you prefer a different path than `/branding/logo.svg`, set `PUBLISHER_LOGO_URL` to that path and ensure the asset is served from it.

The defaults produce Hypothetical Publishing branding with no `.env` changes required.

## Updating

To deploy new changes:

```bash
git pull
docker compose --profile prod up --build -d
```

Docker Compose rebuilds only the containers whose source changed. The database volume is preserved across rebuilds.
