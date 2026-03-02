# Feature Guide: ISBN Lookup

## Overview

Books can be added by entering an ISBN (10 or 13) instead of filling out every field manually. The system looks up the book in [OpenLibrary](https://openlibrary.org/) and prefills the creation form. The user can edit any field before saving. If they cancel, nothing is created. Royalty rate defaults to 50%.

Manual book creation is still available for books not in OpenLibrary.

## Benefits

- Reduces manual data entry and typos when adding books that already exist in public catalogs.
- Populates both ISBN-10 and ISBN-13 when available, even if only one was provided.
- Falls back gracefully to manual entry when the external service is unavailable or the book isn't found.

## Design Decisions

**OpenLibrary as the external database.** Free, no API key required, and has broad ISBN coverage. The backend calls their `/api/books` endpoint directly via Java's built-in `HttpClient`.

**Accepts both ISBN-10 and ISBN-13.** The input is normalized (dashes and whitespace stripped) and checksums are validated before making any network request. This avoids wasting an API call on invalid input.

**Double existence check.** The system checks the local database before calling OpenLibrary (fast reject if we already have that ISBN). It also checks again after the lookup, because OpenLibrary may return a different ISBN variant (e.g., you search by ISBN-10 and the response includes an ISBN-13 that already exists locally).

**Fuzzy date parsing.** OpenLibrary returns publication dates in inconsistent formats ("March 2004", "2004-03-15", "2004", etc.). The parser handles all of these, extracting year and month where possible.

**Duplicate handling with navigation.** When a lookup finds the book already exists, the frontend shows a warning with a "View Book" button that links directly to the existing record, rather than just showing an error.

## Walkthrough

1. Navigate to the book creation page.
2. Click "Lookup by ISBN" to expand the search field.
3. Enter an ISBN-10 or ISBN-13 (dashes are fine).
4. Click "Lookup" (or press Enter).
5. On success, the form fields (title, author, ISBNs, publication date) are prefilled. Royalty rate defaults to 50%.
6. Edit any fields as needed, then click Save.

**Error cases:**
- Invalid ISBN format or checksum: inline error on the input field.
- Book not found in OpenLibrary: info notification, form stays empty for manual entry.
- ISBN already exists locally: warning notification with a link to the existing book.
- OpenLibrary unavailable: error notification, form stays empty for manual entry.

## Cover Art

Cover images can be managed in two ways:

- **Manual upload** during book create or edit. Accepted formats: JPEG, PNG, GIF, and WebP. A thumbnail is auto-generated on upload using Thumbnailator.
- **Import from OpenLibrary** on the book detail page. The system fetches the cover by ISBN from OpenLibrary's Covers API and stores it the same way as a manual upload.
