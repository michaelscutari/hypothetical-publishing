# Hypothetical Publishing Accounting System
[![Quality Check](https://github.com/michaelscutari/hypothetical-publishing/actions/workflows/check.yml/badge.svg)](https://github.com/michaelscutari/hypothetical-publishing/actions/workflows/check.yml)

A web based **Book Publishing Accounting System** designed to help small publishers track books, sales records, and author royalty payments.

### Team (Bletsch of Fresh Air): 
Ana Stanisavljevic  
Michael Scutari  
Daniel Rodriguez-Florido  
Paula Barrow  

**Duke University – ECE 458 Senior Design Project**

## Development Setup
Choose one of the following workflows:
- Local development (recommended for day-to-day work)
- Docker (optional for consistency with prod)

### Local Development (Recommended)
Prereqs:
- **Node.js ≥ 22.12.0**
- **Java 21** (Temurin recommended)
- npm
- git

This repository pins the Node version using `.nvmrc`.

Backend:
```bash
cd backend
./gradlew bootRun
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

URLs:
- Frontend: http://localhost:5173
- Backend health: http://localhost:8080/api/health

### Docker (Optional)
Prereqs: Docker + Docker Compose

Create a `.env` file (values can be anything for now):
```env
DB_USERNAME=bookpublishing
DB_PASSWORD=change-me
```

Start the dev stack:
```bash
docker compose --profile dev up --build
```

URLs:
- Frontend: http://localhost
- Backend health: http://localhost/api/health

### Tests and Formatting
With `just` (optional helper):
```bash
just check
just test
just test-backend
just test-frontend
just lint
just format
```

Without `just`:
```bash
cd backend && ./gradlew test
cd frontend && npm test -- --run
```

### CI Required Checks
PRs are expected to pass:
- Frontend lint + tests
- Backend format check + tests

### Updating the OpenAPI Contract
Rule of thumb:
If you touch the backend API,

cd backend
./gradlew bootRun
curl http://localhost:8080/v3/api-docs.yaml > openapi.yaml

cd frontend
npm run generate-api

then commit those changes.

This way, the frontend will receive the generate code for the new backend features while being totally agnostic to them.