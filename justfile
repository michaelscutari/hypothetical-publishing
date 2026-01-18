test:
    cd backend && ./gradlew test
    cd frontend && npm run test -- --run

test-backend:
    cd backend && ./gradlew test

test-frontend:
    cd frontend && npm run test -- --run

lint:
    cd backend && ./gradlew spotlessCheck
    cd frontend && npm run lint

format:
    cd backend && ./gradlew spotlessApply
    cd frontend && npm run format

check: format lint test
