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

### OpenAPI Code Generation

The frontend TypeScript API client is auto-generated from the backend's OpenAPI spec.

**Adding/Updating API Endpoints:**

1. Annotate your controller class with `@Tag`:
   ```java
   @Tag(name = "Books", description = "Book management endpoints")
   @RestController
   public class BookController { ... }
   ```

2. Annotate each endpoint method with `@Operation`:
   ```java
   @Operation(operationId = "getBookById", summary = "Get a book by ID")
   @GetMapping("/api/books/{id}")
   public ResponseEntity<Book> getBook(@PathVariable Long id) { ... }
   ```

3. Regenerate the TypeScript client:

   > **Important:** The backend must be running before running `just api`. It fetches the OpenAPI spec from the live server.

   ```bash
   # With Docker (recommended)
   just api

   # Without Docker (local backend on port 8080)
   API_DOCS_URL=http://localhost:8080/api-docs just api
   ```

4. The generated client will be in `frontend/src/api/generated/`:
   - `services/BooksService.ts` (from `@Tag(name = "Books")`)
   - Method `getBookById()` (from `@Operation(operationId = "getBookById")`)

**Key Annotations:**
| Annotation | Purpose | Example |
|------------|---------|---------|
| `@Tag` | Service name grouping | `@Tag(name = "Auth")` → `AuthService` |
| `@Operation` | Method name | `operationId = "login"` → `login()` |
| `@Schema` | DTO field docs | `@Schema(description = "Username")` |

**Useful URLs (dev only):**
- OpenAPI JSON: http://localhost:8080/api-docs
- Swagger UI: http://localhost:8080/swagger-ui.html

> **Note:** CI validates that generated code is up-to-date. If the check fails, run `just api` and commit the changes.

### CI Required Checks
PRs are expected to pass:
- Frontend lint + tests
- Backend format check + tests

## Book Management

The book management module provides CRUD operations for books in the publishing catalog.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List books (paginated, sortable, searchable) |
| GET | `/api/books/{id}` | Get book by ID |
| POST | `/api/books` | Create a new book |
| PUT | `/api/books/{id}` | Update a book |
| DELETE | `/api/books/{id}` | Delete a book |

### Query Parameters (GET /api/books)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 25 | Page size |
| showAll | boolean | false | Return all records (ignores pagination) |
| query | string | - | Search across title, author, ISBN (dashes ignored) |
| authorId | long | - | Filter by author ID |
| sortField | string[] | - | Fields to sort by (multi-sort) |
| sortDirection | string[] | asc | Sort directions per field (asc/desc) |

### Book Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| title | string | Yes | Not blank |
| authorId | long | Yes | Must reference an existing author |
| isbn13 | string | Yes | Valid ISBN-13 format (unique) |
| isbn10 | string | No | Valid ISBN-10 format if provided (unique) |
| publicationYear | int | Yes | 1900-2100 |
| publicationMonth | int | Yes | 1-12 |
| distributorAuthorRoyaltyRate | decimal | No | 0.0-1.0, defaults to 0.50 |
| handsoldAuthorRoyaltyRate | decimal | No | 0.0-1.0, defaults to 0.20 |
| seriesName | string | No | Series name (max 256 chars) |
| seriesPosition | int | No | Required if seriesName is set; positive integer |
| coverPrice | decimal | Yes | >= 0, must be >= printCost |
| printCost | decimal | Yes | >= 0 |
