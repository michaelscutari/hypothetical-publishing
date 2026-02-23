# Software Testing Plan (UI-Driven Checklist)

This document outlines a **manual, click-through testing plan** to verify that all functional requirements and edge cases are met. Each item should be validated through the application’s user interface.

Denote a checked and verified condition with a `Y` in the brackets; leave unverified conditions with nothing in the brackets.

---

## 1. Authentication, Security & Server Behavior

### 1.1 Pre-login access & HTTPS

- [ ] Navigate to the application base URL while logged out  
  - [ ] Only the login interface is accessible  
  - [ ] No books, sales, or admin views are accessible
- [ ] Manually navigate to a protected URL (e.g., `/books`, `/sales`, `/authors`)  
  - [ ] Redirected to login or access denied
- [ ] Confirm HTTPS usage  
  - [ ] URL begins with `https://`  
  - [ ] Browser shows secure/lock indicator (no “Not Secure”)

---

### 1.2 Admin user existence

- [ ] Log in as `admin` using the credentials configured during setup  
- [ ] Confirm that there is **no UI** to create additional users

---

### 1.3 Login & logout flow

- [ ] On login page, leave username empty with valid-ish password → validation error  
- [ ] On login page, leave password empty with valid-ish username → validation error  
- [ ] Enter correct username with wrong password → error, no login  
- [ ] Successful login redirects to **Book List** (required home page)  
- [ ] Click Logout:
  - [ ] User is returned to login page
  - [ ] Using browser Back does **not** reveal authenticated content
- [ ] Open two browser sessions/incognito:
  - [ ] Log in as `admin` in both → both sessions function correctly (supports multiple users/sessions)

---

### 1.4 Change password flow

- [ ] Navigate to **Change Password** page as `admin`
- [ ] Enter mismatched password and confirmation → error, no change  
- [ ] Enter invalid/too-short password (per policy) → validation error  
- [ ] Enter valid new password (twice, matching) → success message  
- [ ] Log out:
  - [ ] Old password fails  
  - [ ] New password succeeds

---

## 2. URL & Navigation (HTTP-Compliant Behavior)

### 2.1 Bookmarkable URLs

For each view below, perform the steps:

Views:
- [ ] Book List
- [ ] Book Detail (for a specific book)
- [ ] Sales List
- [ ] Sales Record Detail (for a specific record)
- [ ] Author Payments
- [ ] Sales Input Tool

Steps for each view:
- [ ] Copy URL, open in a new tab/window **while logged in** → same view loads  
- [ ] Log out and then open the URL → redirected to login page  
- [ ] After logging in from that state, confirm you are taken back to the bookmarked view (if implemented)

---

### 2.2 Browser navigation

- [ ] Navigate Book List → Book Detail → Edit Book → Save/Cancel → use browser Back:
  - [ ] Back navigates logically through previous views
- [ ] Do the same chain for Sales List → Sales Detail → Edit → Save/Cancel → Back  
- [ ] Do the same chain for Author Payments → Sales Detail → Back  
- [ ] Refresh (Cmd/Ctrl + R) on each view:
  - [ ] No unintended actions occur (no extra saves, deletions, or duplicates)

---

### 2.3 HTTP semantics

- [ ] Confirm that no destructive action happens just by visiting a URL or refreshing (i.e., GET is safe)  
- [ ] Confirm that actions like create, update, delete are only triggered via explicit form submissions or buttons (POST/PUT/DELETE semantics)

---

## 3. Book List View (Home Page)

### 3.1 Basic display

- [ ] After login, user is taken to the **Book List** view  
- [ ] Table shows the following columns:
  - [ ] Title  
  - [ ] Author  
  - [ ] ISBN-13  
  - [ ] ISBN-10  
  - [ ] Publication month/year  
  - [ ] Author royalty rate  
  - [ ] Total sales to date

---

### 3.2 Sorting

For each column, click the sort control (e.g., header):

- [ ] Sort by Title (ascending/descending)  
- [ ] Sort by Author (ascending/descending)  
- [ ] Sort by ISBN-13 (ascending/descending)  
- [ ] Sort by ISBN-10 (ascending/descending)  
- [ ] Sort by Publication month/year (chronological order)  
- [ ] Sort by Author royalty rate  
- [ ] Sort by Total sales to date

Visually confirm order changes appropriately each time.

---

### 3.3 Search & filter

Using the keyword search:

- [ ] Search by **full title** → relevant book(s) shown  
- [ ] Search by **partial title** → subset of books shown  
- [ ] Search by **author name** → books by that author shown  
- [ ] Search by **ISBN-13** → correct book shown (with and without dashes)  
- [ ] Search by **ISBN-10** → correct book shown (with and without dashes)  
- [ ] Search by nonsense/random text → empty result list, with “no results” or similar messaging (no crash)

---

### 3.4 Navigation to other views

From Book List:

- [ ] Clicking on a book row/title navigates to the **Book Detail** view for that book  
- [ ] Clicking “Create new book” (or similar) navigates to the **Book Creation** view

---

### 3.5 Pagination behavior

(Requires enough books to create multiple pages)

- [ ] Pagination controls appear when book count exceeds one page  
- [ ] Navigating between pages remains responsive (performance does not degrade with total number of books)  
- [ ] If a “Show All” or similar exists:
  - [ ] It loads the full list
  - [ ] You can switch back to paginated view afterward

---

## 4. Book Detail View

### 4.1 Basic details & totals

From a book’s detail page:

- [ ] Title, author(s), ISBN-13, ISBN-10, publication month/year, and author royalty rate are all shown and correct  
- [ ] A list of **all sales records for this book** is displayed (similar to the sales listing view)  
- [ ] Totals displayed:
  - [ ] Total publisher revenue (sum of revenue from records for this book)  
  - [ ] Total unpaid author royalty  
  - [ ] Total paid author royalty  
  - [ ] Total author royalty (paid + unpaid)

After performing some changes:

- [ ] Add a new sales record for this book → totals update correctly  
- [ ] Modify an existing sales record → totals update correctly  
- [ ] Mark some sales as paid → unpaid and paid totals update correctly

---

### 4.2 Navigation from book detail

- [ ] “Edit”/“Modify” button navigates to **Book Modification** view  
- [ ] “Delete” button triggers a **confirmation dialog** (see book deletion section)  
- [ ] “Add sales record” or similar:
  - [ ] Either opens inline sales record creation or navigates to a proper sales creation view tied to this book

---

## 5. Book Creation

### 5.1 Normal creation

- [ ] Open the **Create New Book** page  
- [ ] Enter valid:
  - [ ] Title  
  - [ ] Author(s)  
  - [ ] ISBN-13  
  - [ ] ISBN-10  
  - [ ] Publication month/year (using date/month picker)  
  - [ ] Author royalty rate (leave at default 50%)
- [ ] Save:
  - [ ] New book appears in Book List  
  - [ ] New book can be opened in Book Detail

---

### 5.2 Validation & edge cases

Attempt to save invalid or edge-case inputs:

- [ ] Empty title → validation error, no save  
- [ ] Empty author → validation error, no save  
- [ ] Invalid ISBN-13 (wrong length, invalid chars) → validation error  
- [ ] Invalid ISBN-10 (wrong length, invalid chars) → validation error  
- [ ] Publication date in the future (if disallowed) → consistent behavior (either blocked or clearly allowed)  
- [ ] Negative royalty rate → rejected  
- [ ] Royalty rate > 100% → rejected  
- [ ] Royalty rate = 0% → accepted or rejected, but behavior is consistent and clear  
- [ ] Extremely long title/author strings → UI still works (text may wrap/truncate without breaking layout)

---

### 5.3 Date input assistance

- [ ] Publication date/month/year selection uses a **date picker** or date UI, not raw, unvalidated text only

---

### 5.4 External database import (if implemented)

- [ ] On “Create Book” via ISBN-only flow:
  - [ ] Enter valid ISBN-13 or ISBN-10 and trigger external import  
  - [ ] Fields are auto-populated from external DB  
  - [ ] Modify one of the imported fields, then save:
    - [ ] Edited value is preserved  
  - [ ] Start import but cancel/abort before saving:
    - [ ] No new book appears in system

---

## 6. Book Modification

### 6.1 Basic modification

From a book’s detail view:

- [ ] Change title, author, and publication date  
- [ ] Change author royalty rate (e.g., 50% → 60%)  
- [ ] Save:
  - [ ] Book List and Book Detail show updated data

---

### 6.2 Non-retroactive royalty rule

- [ ] Ensure a book has royalty rate 50%
- [ ] Create a sales record for this book with publisher revenue = 100:
  - [ ] Default author royalty = 50
- [ ] Change book royalty rate from 50% → 60%
- [ ] Create another sales record with publisher revenue = 100:
  - [ ] Default author royalty = 60
- [ ] Confirm:
  - [ ] The original record still shows author royalty = 50  
  - [ ] Only future records use the new rate

---

## 7. Book Deletion

### 7.1 Delete book without sales

- [ ] Create a test book with **no sales records**  
- [ ] Click Delete from Book Detail:
  - [ ] Confirmation dialog clearly shows book title and author(s)  
  - [ ] Clicking Cancel: book remains  
  - [ ] Clicking Confirm: book is deleted
- [ ] Book no longer appears on Book List  
- [ ] Direct URL to its detail view returns an error or redirect (book no longer accessible)

---

### 7.2 Delete book with sales

- [ ] Create a book and associate one or more sales records with it  
- [ ] Click Delete on this book:
  - [ ] Confirmation dialog warns that this book has existing sales records  
  - [ ] Confirm deletion:
    - [ ] Either:
      - [ ] Sales records are removed, or  
      - [ ] Sales records remain but clearly indicate the book was deleted (whatever your design is)
- [ ] System clearly communicates what happened to historical records in the UI  
- [ ] No inconsistent references remain (e.g., broken links, null labels) in sales or author views

---

## 8. Sales Record List View

### 8.1 Basic display

- [ ] Navigate to **Sales List** view  
- [ ] Confirm columns:
  - [ ] Book title  
  - [ ] Book author  
  - [ ] Month/year  
  - [ ] Quantity sold  
  - [ ] Publisher revenue  
  - [ ] Author royalty  
  - [ ] Visual indicator (color + shape) for paid vs unpaid status

---

### 8.2 Sorting

- [ ] Confirm default sort is **month/year descending** (newest first)  
- [ ] Test sorting by:
  - [ ] Book title  
  - [ ] Book author  
  - [ ] Month/year  
  - [ ] Quantity sold  
  - [ ] Publisher revenue  
  - [ ] Author royalty  
  - [ ] Paid/unpaid indicator (if sortable)

---

### 8.3 Date range filter

- [ ] Filter sales to a specific date range:
  - [ ] Only records in that period are shown  
- [ ] Set start date after end date (if UI allows):
  - [ ] Either validation error or empty results (but not a crash)  
- [ ] Filter to a period with **no sales**:
  - [ ] Empty list with a clear “no results” message

---

### 8.4 Navigation

From Sales List:

- [ ] Click on a sales record → goes to **Sales Record Detail/Modify** view  
- [ ] Click on book title → goes to **Book Detail**  
- [ ] Use link/button to **Sales Input Tool** → navigates correctly

---

### 8.5 Pagination

(Requires enough sales records)

- [ ] Pagination controls appear as expected  
- [ ] Navigating through pages is responsive and not dependent on total record count  
- [ ] “Show All” (if present) loads full list, then you can return to paginated view

---

## 9. Author Payments View

### 9.1 Grouping & subtotals

- [ ] Navigate to **Author Payments** view  
- [ ] Confirm:
  - [ ] Records are grouped by author  
  - [ ] Within each author group, records are ordered by month/year descending  
- [ ] For each author:
  - [ ] Unpaid subtotal equals sum of **unpaid** author royalties in that group

---

### 9.2 Mark all as paid

For an author with multiple unpaid records:

- [ ] Click the “Mark all as paid” (or equivalent) control  
- [ ] Confirmation dialog asks you to confirm  
- [ ] After confirming:
  - [ ] All of that author’s unpaid records now appear as **paid**  
  - [ ] Unpaid subtotal becomes 0 (or disappears) for that author  
  - [ ] Sales List reflects updated paid status  
  - [ ] Book Detail totals update accordingly

---

### 9.3 Navigation

From Author Payments:

- [ ] Clicking on a row’s sales record details goes to **Sales Record Detail/Modify**  
- [ ] Clicking on a book title goes to **Book Detail**  
- [ ] Link/button to **Sales Input Tool** works correctly

---

## 10. Sales Record Detail/Modify View

### 10.1 Viewing and editing fields

Open a sales record detail view:

- [ ] All fields visible:
  - [ ] Month/year  
  - [ ] Book reference (assisted selection)  
  - [ ] Quantity sold  
  - [ ] Publisher revenue  
  - [ ] Author royalty  
  - [ ] Author-paid status
- [ ] Edit fields:
  - [ ] Change month/year  
  - [ ] Change book reference  
  - [ ] Change quantity sold  
  - [ ] Change publisher revenue  
  - [ ] Override author royalty → appears visually distinct from default  
  - [ ] Toggle author-paid on/off
- [ ] Save:
  - [ ] Changes reflected in Sales List, Book Detail totals, and Author Payments view

---

### 10.2 Deleting a sales record

- [ ] Click Delete in Sales Record Detail:
  - [ ] Confirmation dialog appears  
  - [ ] Cancel → record remains  
  - [ ] Confirm → record is removed
- [ ] Record no longer appears in Sales List  
- [ ] Book totals and author subtotals update accordingly

---

### 10.3 Validation & edge cases

- [ ] Enter negative quantity → validation error  
- [ ] Enter quantity = 0 → either allowed or rejected (behavior should be consistent)  
- [ ] Enter negative publisher revenue → validation error  
- [ ] Enter very large quantity or revenue values → UI handles it without crashing

---

## 11. Sales Record Input Tool (Bulk Input)

### 11.1 Basic multi-record entry

- [ ] Open **Sales Input Tool**  
- [ ] Enter first record:
  - [ ] Set month/year  
  - [ ] Use assisted selection to choose book  
  - [ ] Enter quantity sold  
  - [ ] Enter publisher revenue  
  - [ ] Author royalty auto-populates as (rate × revenue)
- [ ] Add multiple records:
  - [ ] Month/year and/or book can “carry down” to next record if designed that way  
  - [ ] It is easy to change month/year or book for subsequent records

---

### 11.2 Assisted book selection in bulk tool

- [ ] Type partial book title → correct suggestions appear  
- [ ] Type ISBN-13 with dashes → correct suggestion  
- [ ] Type ISBN-13 without dashes → same result  
- [ ] Type ISBN-10 with or without dashes → correct suggestion  
- [ ] Minimal keystrokes/clicks required to select book

---

### 11.3 Author royalty override behavior

In bulk tool:

- [ ] After author royalty auto-populates, manually change it:
  - [ ] Overridden value is visually distinct (highlighted/marked)  
- [ ] Clear the override field:
  - [ ] Field reverts to computed (rate × revenue)

---

### 11.4 Keyboard navigation

- [ ] Use Tab to move between fields in a row  
- [ ] Use Tab/Enter pattern to quickly move to next record  
- [ ] Confirm you do not need to click “Add another” for each new record if the design specifies auto-adding rows

---

### 11.5 Review & commit

- [ ] Enter 3–5 records in the bulk tool  
- [ ] Use “Review” (if present) to inspect them before saving  
- [ ] Commit/Save:
  - [ ] All records appear in Sales List  
  - [ ] They appear in Book Detail under the correct books  
  - [ ] Author totals and book totals update correctly

---

### 11.6 Cancel/abandon

- [ ] Enter several records in bulk tool  
- [ ] Click Cancel or navigate away **before** committing:
  - [ ] Confirm no partial records were saved to the system

---

### 11.7 Validation & edge cases

In bulk input:

- [ ] Missing book selection → validation error  
- [ ] Missing month/year → validation error  
- [ ] Negative quantity or revenue → validation error  
- [ ] Extremely large values → handled without UI crash  
- [ ] Unusual date values (far past or far future) → consistent behavior

---

## 12. Consistency & Persistence

### 12.1 Cross-reference consistency

- [ ] Choose a book X  
- [ ] Create 5 sales records for book X through different entry paths (Book Detail + Bulk Tool)  
- [ ] In Book Detail for X:
  - [ ] All 5 records appear and show correct data  
- [ ] In Sales List:
  - [ ] All 5 records are visible and show the correct book title/author  
- [ ] In Author Payments:
  - [ ] The author’s unpaid/paid totals reflect the same records consistently

---

### 12.2 Persistence across server restart

- [ ] Create or modify several books and sales records  
- [ ] Stop and restart the application/server  
- [ ] Log back in:
  - [ ] All previously created/modified data is still present (persistent DB works)

---

## 13. Negative & Malicious Input Cases (Basic Hardening)

- [ ] In text fields (title, author, etc.), enter values like `<script>alert('x')</script>`:
  - [ ] UI does not execute code, and page does not break  
- [ ] Very long strings in text fields (e.g., >500 characters):
  - [ ] UI still renders properly (may wrap or truncate, but no crash)

---

## 14. Multi-Session / Concurrency (Light Check)

- [ ] Log in as `admin` in two separate browsers/sessions  
- [ ] In Session A:
  - [ ] Edit a book’s title and save  
- [ ] In Session B:
  - [ ] Refresh Book List → updated title appears  
- [ ] In Session A:
  - [ ] Add several sales records (via Bulk Tool)  
- [ ] In Session B:
  - [ ] Refresh Sales List → new records appear correctly

---
