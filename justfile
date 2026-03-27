set dotenv-load

# show available commands
[private]
default:
    @just --list

# --- dev ---

# start containers (--build to rebuild, --force to recreate)
[group('dev')]
[arg('build', long, value='--build')]
[arg('force', long, value='--force-recreate')]
up profile="dev" build="" force="":
    docker compose --profile {{profile}} up -d {{build}} {{force}}

# stop all containers
[group('dev')]
down:
    docker compose down

# stop and destroy database volume
[group('dev')]
[confirm("This will delete the database volume. Continue?")]
nuke:
    docker compose down -v

# tail container logs
[group('dev')]
logs *service:
    docker compose logs -f {{service}}

# open psql shell
[group('dev')]
db:
    docker exec -it $(docker compose ps -q db) psql -U "$DB_USERNAME" -d book_publishing

# show container status
[group('dev')]
status:
    docker compose ps

# --- code quality ---

# regenerate api client
[group('code quality')]
api:
    cd frontend && npm run api:generate

# run all tests
[group('code quality')]
test:
    cd backend && ./gradlew test
    cd frontend && npm run test -- --run

# run backend tests only
[group('code quality')]
test-backend:
    cd backend && ./gradlew test

# run frontend tests only
[group('code quality')]
test-frontend:
    cd frontend && npm run test -- --run

# check formatting and lint
[group('code quality')]
lint:
    cd backend && ./gradlew spotlessCheck
    cd frontend && npm run lint

# auto-fix formatting
[group('code quality')]
format:
    cd backend && ./gradlew spotlessApply
    cd frontend && npm run format

# run all checks (api, format, lint, test)
[group('code quality')]
check: api format lint test

# --- backup ---

# database backup (run, list, validate, restore, push, pull)
[group('backup')]
backup *args:
    ./backup/backup.sh {{args}}
