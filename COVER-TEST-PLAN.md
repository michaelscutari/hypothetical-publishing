# Cover Image Feature - Manual Test Plan

All tests via Swagger UI (`/swagger-ui.html`). Log in via the frontend first so the auth cookie is set.

---

## 1. Upload Cover (Happy Path)

1. Find a book ID (e.g. from `GET /api/books`)
2. `POST /api/books/{id}/cover` — attach a **JPEG** file
3. Expect **200** `{"message": "Cover uploaded successfully"}`
4. Open `http://localhost/api/books/{id}/cover` in a browser tab — full-size image renders
5. Open `http://localhost/api/books/{id}/cover/thumbnail` — smaller version renders
6. Repeat with a **PNG** — should replace the old cover

## 2. Upload Rejected — Invalid Files

1. Upload a `.txt` file — expect **400** (unsupported content type)
2. Upload a `.pdf` — expect **400**
3. Rename a `.txt` to `.jpg` and upload — expect **400** (magic bytes check catches it)
4. Upload with empty/no file — expect **400**

## 3. Upload to Non-Existent Book

1. `POST /api/books/99999/cover` with any image — expect **404**

## 4. Get Cover — None Exists

1. Pick a book that has **no** cover
2. `GET /api/books/{id}/cover` — expect **404**
3. `GET /api/books/{id}/cover/thumbnail` — expect **404**

## 5. Delete Cover

1. Upload a cover to a book, confirm via `GET .../cover` it works
2. `DELETE /api/books/{id}/cover` — expect **204**
3. `GET /api/books/{id}/cover` — now **404**
4. `GET /api/books/{id}` — `hasCover` is `false`

## 6. Delete Cover — Already None

1. Pick a book with no cover
2. `DELETE /api/books/{id}/cover` — expect **204** (no error, idempotent)

## 7. Import from OpenLibrary (Happy Path)

1. Pick a book with an ISBN. Check the cover exists on OpenLibrary first:
   `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false` in browser
2. `POST /api/books/{id}/cover/import` — expect **200**
3. `GET /api/books/{id}/cover` — displays the imported cover

## 8. Import from OpenLibrary — No Cover Available

1. Find/use a book with an ISBN that has **no** OpenLibrary cover (the URL above returns 404)
2. `POST /api/books/{id}/cover/import` — expect **502**

## 9. hasCover in List & Detail Responses

1. `GET /api/books` — check books without covers have `"hasCover": false`
2. Upload a cover to one book
3. `GET /api/books` again — that book now has `"hasCover": true`
4. `GET /api/books/{id}` (detail) — also shows `"hasCover": true`
5. Delete the cover
6. Re-check both endpoints — back to `"hasCover": false`

## 10. coverImageUrl in Lookup

1. `GET /api/books/lookup?isbn={isbn}` for an ISBN **not** already in the system
2. Response includes `coverImageUrl` like `https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg?default=false`
3. Opening that URL in browser shows the cover (or 404 if OL doesn't have one)

## 11. Replace Existing Cover

1. Upload a JPEG to a book
2. Upload a PNG to the **same** book
3. `GET /api/books/{id}/cover` — new image displays
4. Check response `Content-Type` header is `image/png` (not `image/jpeg`)

## 12. File Size Limits

1. Upload a ~5MB image — should succeed
2. Upload an 11MB+ image — should be rejected by nginx/Spring (413 or 400)
