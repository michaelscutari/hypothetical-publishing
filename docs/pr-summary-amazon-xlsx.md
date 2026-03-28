# PR Summary: Unified Sales Import + Amazon XLSX Support

## Context
Based on our recent discussions, this PR extends the existing **Ingram CSV import flow** to also support **Amazon KDP XLSX royalty reports**, while keeping the sales import experience unified in one endpoint and one frontend screen.

The key goal is to let ops preview and commit Amazon sales (print, ebook, KU) with clear row-level feedback, without regressing existing CSV behavior.

## What Changed

### 1) Unified import contract (backend + generated frontend API)
- Replaced `IngramImportRequest/Response` with `SalesImportRequest/Response`.
- Endpoint remains `POST /api/sales/import`, but now accepts either CSV or XLSX.
- Response is now split into:
  - `savedSales`
  - `parseErrors`
  - `validationErrors`
  - `warnings`
- New request field `acknowledgeWarnings` is required for non-preview commit when warnings exist.

### 2) Added Amazon XLSX parser
- New parser: `AmazonXlsxParser` + entry model `AmazonXlsxEntry`.
- Added Apache POI dependency (`poi-ooxml`) to read `.xlsx` files.
- Supported sheets:
  - `Paperback Royalty`
  - `Hardcover Royalty`
  - `eBook Royalty`
  - `KENP`
- Behavior highlights:
  - Parses sales period from sheet metadata.
  - Performs row-level validation and records parse/validation issues with `sheetName + rowNumber`.
  - Treats audiobook sheet rows as non-blocking warnings (`import.amazon.audiobook.notSupported`).
  - Handles locale-ish numeric formats (e.g., comma decimal values for royalty).

### 3) Sale mapping and lookup improvements
- `SaleService.importSales(...)` now dispatches parser by file type (`supports(contentType, filename)`).
- Added Amazon mapping logic:
  - Print rows resolve books by ISBN.
  - Ebook/KU rows resolve books by Amazon ebook ASIN.
  - Royalty currency is converted to USD before computing author royalty.
- Added `AmbiguousLookupException` and `BookService.findBookByAmazonEbookAsin(...)`:
  - Fails with explicit validation error if multiple books match one ASIN (`book.asin.multipleMatches`).

### 4) Domain validation updates
- `Sale.quantitySold` is now nullable at JPA column level to support KU rows.
- Added `@AssertTrue` invariant on `Sale`:
  - `KINDLE_UNLIMITED` requires `kenp` and forbids `quantitySold`.
  - Print/ebook formats require `quantitySold` and forbid `kenp`.

### 5) Frontend import UX updates
- Import page renamed from CSV-specific to file import.
- Added import mode toggle:
  - `CSV Import`
  - `Amazon XLSX Import`
- CSV mode still requires month/year picker.
- XLSX mode omits month/year (uses sheet sales period).
- Error dialog now shows parse errors, validation errors, and warnings with `Sheet / Row` context.
- Preview dialog surfaces warnings before commit.
- Commit sends warning acknowledgement flag.

### 6) Dev environment fix
- Updated `deployment/nginx-dev.conf` to strip conditional cache headers for Vite dev proxy (`If-None-Match`, `If-Modified-Since`) to reduce stale optimized dependency chunk issues.

## Files To Focus On During Review
- Backend import flow:
  - `backend/src/main/java/edu/duke/bookpublishing/sales/SaleService.java`
  - `backend/src/main/java/edu/duke/bookpublishing/sales/SaleController.java`
- Amazon parsing:
  - `backend/src/main/java/edu/duke/bookpublishing/sales/parser/AmazonXlsxParser.java`
  - `backend/src/main/java/edu/duke/bookpublishing/sales/parser/AmazonXlsxEntry.java`
  - `backend/src/main/java/edu/duke/bookpublishing/sales/parser/ParsingError.java`
  - `backend/src/main/java/edu/duke/bookpublishing/sales/parser/ParsedBatch.java`
- Book lookup behavior:
  - `backend/src/main/java/edu/duke/bookpublishing/books/BookService.java`
  - `backend/src/main/java/edu/duke/bookpublishing/books/BookRepository.java`
  - `backend/src/main/java/edu/duke/bookpublishing/exception/custom/AmbiguousLookupException.java`
- Frontend behavior:
  - `frontend/src/features/sales/SaleImport.tsx`
  - `frontend/src/api/generated/services/SalesService.ts`

## Test Coverage Added/Updated
- New tests:
  - `BookServiceTest` for ASIN lookup semantics.
  - `AmazonXlsxParserTest` for valid parse, missing-sheet failure, and number parsing edge cases.
- Updated tests:
  - `SaleServiceTest` for Amazon preview/commit flows, warning acknowledgement, and ambiguous ASIN handling.
  - `SaleControllerTest` for new multipart field and response keys.

### Tests run locally
Command run:

```bash
./gradlew test --tests edu.duke.bookpublishing.sales.SaleServiceTest --tests edu.duke.bookpublishing.sales.SaleControllerTest --tests edu.duke.bookpublishing.books.BookServiceTest --tests edu.duke.bookpublishing.sales.parser.AmazonXlsxParserTest
```

Result: **BUILD SUCCESSFUL**.

## Reviewer Checklist
- Verify backward compatibility expectations for existing CSV workflows (request keys + response keys in UI/API consumers).
- Confirm warning semantics are correct: preview allowed, commit blocked unless acknowledged.
- Confirm ASIN uniqueness assumptions are acceptable for catalog data and operations.
- Validate sale format invariants (`quantitySold` vs `kenp`) against existing data and migrations.
- Spot-check frontend error mapping for new backend error codes.
