# PR #105 Review: Ev2 Book and Sale Schema

**Branch:** `feature/hand_sold` | **Author:** Danny1021
**Scope:** 38 files, +1283/-351

---

## Part 1: Changes to Existing Code

*What was modified from Ev1, and is anything broken, regressed, or misaligned with the Ev2 spec?*

### 1.1 Book Entity (`Book.java`)

**What Ev2 requires (def 15):**
- `royaltyRate` renamed to "distributor author royalty rate" (default 50%), new "handsold author royalty rate" (default 20%)
- New fields: series/position (optional, unique combo), cover price (required), print cost (required), cover image (optional, actual file)
- Author changes from free-text to a FK reference to an Author entity (def 18)

**What the PR does:**
- `royaltyRate` -> `distributorAuthorRoyaltyRate` + `handsoldAuthorRoyaltyRate`
- Adds `seriesName`, `seriesPosition`, `coverPrice`, `printCost`, `coverImage` (as a String URL)
- Adds validation annotations (`@Min`, `@Max`, `@DecimalMin`, `@DecimalMax`, `@Positive`, `@PositiveOrZero`)
- Leaves author as free-text with a `// TODO: Map as foreign key to author table` comment

**Assessment:**
- GOOD: Explicit imports replace wildcards - cleaner
- GOOD: Validation annotations on `publicationYear` (`@Min(1900)`), `publicationMonth` (`@Min(1) @Max(12)`) didn't exist before - nice addition
- **BUG: `coverImage` column uses camelCase** - `@Column(name = "coverImage")` while every other column in the project uses snake_case (`cover_price`, `print_cost`, `isbn_13`). Should be `cover_image`. Will cause issues when a migration moves from `ddl-auto=create` to `update` or `validate`
- **SPEC GAP: No `@UniqueConstraint` on (seriesName, seriesPosition).** Def 15 explicitly says "the combination of series and position number must be unique." Without this, two books can claim to be position 3 in "Lord of the Rings." This is a DB-level constraint that should be on the `@Table` annotation
- **SPEC GAP: No contiguous position enforcement.** Def 15 says "position numbers within a series should be contiguous." This is harder (application-level logic), but there's no validation whatsoever currently
- **DEFERRED: Author still free-text.** The TODO is fine since PR #106 (Author Management) handles this, but it means this PR's schema will need a second migration when authors land. The current `author` String column will need to become a FK to an `authors` table. Worth noting for merge order planning

### 1.2 Sale Entity (`Sale.java`)

**What Ev2 requires (def 16):**
- New `saleSource` field: distributor or handsold (required)
- `quantitySold`: changed from "non-negative" to "positive integer" (zero is no longer allowed)
- `publisherRevenue`: non-negative; computed for handsold, input for distributor
- `authorRoyalty`: non-negative; always computed, no longer overridable
- New `comment` field (max 256 chars)

**What the PR does:**
- Adds `saleSource` (enum, `@Enumerated(EnumType.STRING)`) and `comment`
- Adds explicit `@Column(name = ...)` to all fields
- **Removes `@PositiveOrZero` from `publisherRevenue` and `authorRoyalty`**
- Leaves `quantitySold` as `@PositiveOrZero`

**Assessment:**
- GOOD: Explicit column names are a consistency improvement over relying on Hibernate's naming strategy
- **SPEC MISS: `quantitySold` should be `@Positive`, not `@PositiveOrZero`.** Ev2 strikes through "May be zero if the user wishes to make clear a lack of sales" and changes "non-negative" to "positive" in def 16. Both `Sale.java` and `SaleRequest.java` still use `@PositiveOrZero`. This means the system will accept 0-quantity sales when the spec forbids it
- **CONCERN: `@PositiveOrZero` removed from money fields.** Ev2 def 16 still says "non-negative monetary value" for both publisher revenue and author royalty. For handsold sales where `coverPrice < printCost`, the computed `publisherRevenue` becomes negative, violating the spec. Either the entity should keep `@PositiveOrZero` on these fields, or Book should validate `coverPrice >= printCost`

### 1.3 SaleService (`SaleService.java`)

**What Ev2 requires:**
- Distributor sales: `publisherRevenue` = user input; `authorRoyalty = distributorRate * publisherRevenue`
- Handsold sales: `publisherRevenue = (coverPrice - printCost) * qty`; `authorRoyalty = handsoldRate * publisherRevenue`
- Royalty cannot be overridden (Ev1 allowed it, Ev2 strikes it through)

**What the PR does:**
- Refactors into `resolvePublisherRevenue()`, `resolveAuthorRoyaltyRate()`, `computeAuthorRoyalty()`
- Removes royalty override support
- Computes revenue server-side for handsold sales

**Assessment:**
- GOOD: Clean refactor. The three helper methods map directly to the spec's three-step computation
- CORRECT: Royalty override removal matches Ev2 (def 16 strikes through "but can be overridden")
- **DEAD CODE: `SaleSource.getRoyaltyRate(Book)` is never called.** The enum defines polymorphic rate dispatch, but `resolveAuthorRoyaltyRate()` uses if/else. Either use `request.saleSource().getRoyaltyRate(book)` (which is why it was presumably written) or strip the enum to a plain enum. Currently both exist and do the same thing
- MINOR: Redundant null checks on `saleSource` in service methods (`@NotNull` on the DTO already prevents null). Defensive programming, not harmful

### 1.4 SaleRequest DTO

**Assessment:**
- GOOD: `isPublisherRevenueValidForSource()` cross-field validation matches the spec exactly - distributor requires revenue, handsold must omit it
- GOOD: `@Size(max = 256)` on comment matches def 16
- **SPEC MISS (same as 1.2):** `quantitySold` still `@PositiveOrZero`, should be `@Positive`

### 1.5 BookController

**Assessment:**
- Defaults match spec: distributor 50%, handsold 20%
- Hardcoded `new BigDecimal("0.5")` and `new BigDecimal("0.2")` in two places each (create + update). Pre-existing pattern but now 4 magic numbers instead of 2. Constants would be better
- Follows existing controller patterns (no mapper, direct entity build)

### 1.6 Dev Properties (`application-dev.properties`)

- **MUST REVERT before merge:** `ddl-auto=create` drops all tables on every restart. Fine for testing the migration but cannot stay

### 1.7 Frontend - SaleCreate / SaleEdit

**What Ev2 changes (req 3.3, 3.4.1):**
- Royalty override removed ("This author royalty cannot be edited" / "This value cannot be overridden")
- Sale source selection governs revenue input vs. computation
- Req 3.3 says publisher revenue editable only "if sale source is distributor"
- Req 3.3: "Implementors may elect to allow the sale source to be modified or not; if so, the revenue/royalty inputs and math should be updated automatically"

**Assessment:**
- CORRECT: Override removal matches Ev2 spec exactly
- CORRECT: SaleEdit allows sale source to be changed (the optional path), and revenue/royalty update automatically
- CORRECT: Publisher revenue disabled for handsold, read-only royalty
- MINOR UX: Switching distributor->handsold->distributor loses the manually-entered revenue. Acknowledged in PR description

### 1.8 Tests

- GOOD: All math verified. Handsold test: `(20-5)*10 = 150` revenue, `150*0.10 = 15` royalty. Correct
- GOOD: Financial summary test: `1000*0.5 + 250*0.5 = 625` total royalty. Correct
- GOOD: `buildBookRequest()` helper reduces boilerplate
- NOTE: No test for zero-quantity rejection (because the constraint wasn't updated per 1.2)

### 1.9 OpenAPI Generated Types

- GOOD: `SaleRequest`/`SaleResponse` changed from type-only to value exports for runtime enum access. Necessary and correct

---

## Part 2: New Code - Fitness, Efficiency, and Requirements Coverage

### 2.1 Which Ev2 Requirements Does This PR Satisfy?

| Requirement | Status | Notes |
|---|---|---|
| **Def 9** - Publisher revenue split (distributor input vs. handsold computed) | **Done** | Math correct |
| **Def 10** - Dual royalty rates, no override | **Done** | Defaults correct (50%/20%) |
| **Def 15** - Dual royalty rates on Book | **Done** | |
| **Def 15** - Series/position fields | **Partial** | Fields exist but missing uniqueness constraint and contiguous validation |
| **Def 15** - Cover price + print cost | **Done** | |
| **Def 15** - Cover image | **Partial** | Stored as URL string. Spec says "web-viewable image file" with upload support (req 2.3.1.3: JPEG/GIF/PNG/WEBP). Req 2.3.2.3 says "must obtain a copy, not just hot link" |
| **Def 15** - Author as FK to Author entity | **Not done** | Expected - PR #106 handles Author entity |
| **Def 16** - Sale source field | **Done** | |
| **Def 16** - Quantity is positive (not zero) | **Not done** | Still `@PositiveOrZero` |
| **Def 16** - Revenue non-negative | **Regressed** | `@PositiveOrZero` removed from entity |
| **Def 16** - Royalty non-negative | **Regressed** | Same |
| **Def 16** - Comment field | **Done** | |
| **Req 2.1** - Book list shows series/position, cover thumbnail | **Partial** | PR TODO says columns not added yet. No thumbnail |
| **Req 2.1** - ISBN 10 removed from book list | **Not done** | Still in BookList columns |
| **Req 2.1.1** - Default sort {author, series/position, title} | **Not done** | |
| **Req 2.1.2** - Search covers series | **Not done** | |
| **Req 2.2** - Book detail shows large cover art | **Partial** | Shows cover image but it's a URL render, not an uploaded file |
| **Req 2.3.1** - Book creation with new fields | **Partial** | Has fields but cover is URL not upload, series has no constraints |
| **Req 2.3.1.1** - Author must be existing record with autocomplete | **Not done** | PR #106 |
| **Req 2.3.1.2** - Series create/select inline with position | **Partial** | Series is a plain text field, not a selectable entity |
| **Req 2.3.1.3** - Cover art file upload (JPEG/GIF/PNG/WEBP) | **Not done** | URL string only |
| **Req 1.14** - Thumbnail scaling (serve downsized images) | **Not done** | |
| **Req 3.1** - Sales list columns for sale source, comment | **Not done** | PR TODO acknowledges this |
| **Req 3.1.2** - Filter by author and sale source | **Not done** | |
| **Req 3.3** - Sale modify with source-aware revenue, comment | **Done** | |
| **Req 3.4.1** - Sale input tool with source, computed handsold revenue | **Done** | |
| **Req 3.5** - CSV import from Ingram Spark | **Not done** | Separate feature |
| **Req 5.x** - Author management | **Not done** | PR #106 |
| **Req 6.x** - Author royalty report | **Not done** | Separate feature |

### 2.2 How This Fits With the Rest of Ev2

**Merge order matters.** This PR and PR #106 (Author Management) both touch Book. Currently:
- This PR keeps `author` as a `String` column on Book
- PR #106 introduces an `Author` entity with name + email

When both merge, a second migration will need to:
1. Create the `authors` table
2. Populate it from distinct `books.author` values
3. Add `author_id` FK to `books`, backfill it
4. Drop the old `books.author` column

This PR should merge first (schema foundation), then PR #106 on top. But the `ddl-auto=create` will mask migration issues. Once both land, switching to `ddl-auto=update` or using Flyway/Liquibase will be important to validate the migration path actually works.

**Series management (req 2.6)** says series exist implicitly ("when all books of a series are modified such that none is a member, the series ceases to exist"). The current String-based `seriesName` + Integer `seriesPosition` approach actually supports this pattern well - no separate Series table needed. But it's missing:
- `@UniqueConstraint(columnNames = {"series_name", "series_position"})` on the `@Table` annotation
- The contiguous position check (could be application-level validation on save)
- Req 2.4.3's concern about position swapping (e.g., two books in a series getting their positions swapped requires relaxing the unique constraint temporarily, or using a deferred constraint)

**Cover image** is the biggest architectural gap. The current URL-string approach is a placeholder at best. Ev2 requires:
- File upload accepting JPEG/GIF/PNG/WEBP (req 2.3.1.3)
- Obtaining a copy from external DB lookup, not hotlinking (req 2.3.2.3)
- Thumbnail scaling for list views (req 1.14) - serve downsized version
- Full-size for detail views

This will need: a file storage solution (local disk or S3), a thumbnail generation pipeline, a new endpoint for serving images, and multipart upload support. The current `coverImage` String column can remain as the storage path/key, but everything around it needs to be built.

**CSV import (req 3.5)** will build on top of this PR's sale source + comment infrastructure. The import always sets `saleSource = DISTRIBUTOR` and populates `comment` with the Ingram Spark metadata string. The schema this PR establishes is correct for that use case.

**Author royalty report (req 6.1)** will need `saleSource` to compute "Quantity handsold" (req 6.1.6). This PR provides that data. The report will also need to break out by series (req 6.1.5), which this PR's series fields enable.

### 2.3 Code Quality of New Additions

**`SaleSource` enum** - Clean pattern but inconsistent. Has `getRoyaltyRate(Book)` polymorphic method that's never called because the service duplicates the logic with if/else. Pick one pattern. The enum approach is better (single responsibility, no conditional branching in service) but then `resolveAuthorRoyaltyRate()` in the service should be deleted.

**DataSeeder helpers** - Well-factored. `getValue()`, `emptyToNull()`, `parseBigDecimal()`, `parseInteger()`, `parseSaleSource()` are clean private static utilities. Defensive null handling throughout. The silent fallback to DISTRIBUTOR for unrecognized sale source strings is appropriate for seed data.

**Cross-field validation** (`SaleRequest.isPublisherRevenueValidForSource()`) - Textbook Jakarta Bean Validation. Good.

**Frontend revenue/royalty computation** - The `computePublisherRevenue()` and `computeRoyalty()` functions in SaleCreate.tsx are clear and efficient. No performance concerns. The pattern of recomputing on every relevant field change is standard React.

**No new efficiency problems introduced.** All new queries go through existing repository patterns. No new N+1 issues. The `@Formula` on Book for `totalSalesToDate` still works correctly with the new schema.

### 2.4 Style Consistency

The new code follows existing patterns well:
- Entity annotations match existing style (except the `coverImage` column name bug)
- DTO records follow the existing pattern of static `from()` factory methods
- Controller follows the existing build-entity-in-controller pattern
- Frontend forms use the same `TextField` + `Grid` + error handling pattern
- Tests use the same MockMvc integration + Mockito unit test approach

One inconsistency: `SaleCreate.tsx` uses `<TextField select>` for the sale source dropdown while `SaleEdit.tsx` uses `<Select>` with `<FormControl>` + `<InputLabel>`. Both work, but the different patterns in the same feature area is noticeable.

---

## Summary

### Must Fix Before Merge

| # | Item | Spec Ref |
|---|------|----------|
| 1 | `ddl-auto=create` -> revert to `update` | N/A (infra) |
| 2 | `coverImage` column name: `"coverImage"` -> `"cover_image"` | style consistency |
| 3 | `quantitySold`: `@PositiveOrZero` -> `@Positive` (Sale.java + SaleRequest.java) | def 16 |

### Should Fix Before Merge

| # | Item | Spec Ref |
|---|------|----------|
| 4 | Restore `@PositiveOrZero` on `publisherRevenue` and `authorRoyalty` in Sale.java, OR add `coverPrice >= printCost` validation on Book | def 16 ("non-negative monetary value") |
| 5 | Add `@UniqueConstraint(columnNames = {"series_name", "series_position"})` to Book `@Table` | def 15 |
| 6 | `SaleSource.getRoyaltyRate()` - use it or remove it | dead code |

### Known Gaps (OK to defer, tracked as follow-ups)

| # | Item | Spec Ref |
|---|------|----------|
| 7 | Cover image is URL string, not file upload with thumbnail support | req 2.3.1.3, 1.14 |
| 8 | Sales list missing `saleSource` + `comment` columns and source filter | req 3.1, 3.1.2 |
| 9 | Book list missing cover thumbnail, series in search, default sort changes | req 2.1 |
| 10 | Series position contiguity not enforced | def 15 |
| 11 | Author as FK (deferred to PR #106) | def 15/18 |
| 12 | ISBN 10 still shown in book list (Ev2 removes it) | req 2.1 |
