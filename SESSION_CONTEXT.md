# Legacy Odyssey - Session Context (March 3, 2026)

## Project Overview
Legacy Odyssey is a subscription SaaS baby book platform. Users create digital baby books
via a mobile app (React Native / Expo), and the content is published as a public website
(EJS templates on Express). Backend is hosted on Railway, database is Supabase (PostgreSQL).

## What Was Done This Session (March 3)

### 1. Section Visibility Control (deployed)
- **`src/services/bookService.js`** — Added `computeVisibleSections(data)` function that
  dynamically determines which sections have meaningful content (text, photos)
- **`src/routes/api/books.js`** — Added `GET /api/books/mine/sections` and
  `PUT /api/books/mine/sections` endpoints for reading/overriding section visibility
- **`src/views/layouts/book.ejs`** — Each section wrapped in `<% if (visibleSections.key) { %>`
- **`src/views/book/sidebar.ejs`** — Nav items conditionally rendered based on visibility
- Content-based approach: no new DB column needed (gracefully handles missing `visible_sections` JSONB column)

### 2. Photo Deletion in Mobile App (in APK)
- **`mobile/src/components/PhotoPicker.js`** — Added "Remove Photo" option to action sheet
- Added `extractStoragePath(url)` helper to parse Supabase public URLs
- Calls `DELETE /api/photos/:storagePath` then clears parent state

### 3. Website Sections Management Screen (in APK)
- **`mobile/src/screens/ManageSectionsScreen.js`** (NEW) — 10 section toggles with Switch components
- Fetches from `GET /api/books/mine/sections`, saves via `PUT /api/books/mine/sections`
- **`mobile/src/screens/DashboardScreen.js`** — Added "Website Sections" card (🌐 icon)
- Registered in `mobile/App.js`

### 4. Multi-Website Switching (deployed + in APK)
- **Problem**: `families.auth_user_id` has a UNIQUE constraint, can't add column via PostgREST
- **Solution**: Create additional families with `auth_user_id = NULL`, link via
  Supabase Auth `user_metadata.linked_family_ids` array
- **`src/middleware/requireAuth.js`** — New `getUserFamilyIds(user)` checks both
  `auth_user_id` match AND `user_metadata.linked_family_ids`
- **`src/routes/api/families.js`** — Updated `GET /mine` to use accessible family IDs;
  Added `POST /api/families` to create new websites (family + book + metadata link)
- **`src/services/familyService.js`** — Added `findAllByAuthUserId()`
- **`mobile/src/screens/DashboardScreen.js`** — "Sites" button always visible;
  "New Website" gold button added to switcher modal
- **`mobile/src/screens/NewWebsiteScreen.js`** (NEW) — Form for subdomain/custom domain/display name
- **`mobile/App.js`** — Registered NewWebsite screen

### 5. Test Data Created
- **Second family**: `a71cbf4b-5abe-4530-bc1d-7544af8e45af`
  - Subdomain: `legacyodyssy` (intentionally misspelled per user)
  - Custom domain: `legacyodyssy.com`
  - Display name: Legacy Odysyy Test
  - Book ID: `39f7e7bb-dce0-4490-b7a0-74ebb259e892` (seeded with defaults)
  - Linked via `user_metadata.linked_family_ids` on auth user

## Key Database Records

### Primary Family (Eowyn's Book)
- Family ID: `fb16691d-7ea4-4c93-9827-ffe8904ced6b`
- Book ID: `501e0807-d950-4004-8b4c-9b0f0ce0c910`
- Subdomain: `eowynragno`
- Custom Domain: `eowynhoperagno.com`
- Auth User ID: `ef8926bc-908a-43f0-afb3-2117913b85b9`
- Email: `dragno65@hotmail.com`
- Book Password: `legacy`

### Second Family (Test Site)
- Family ID: `a71cbf4b-5abe-4530-bc1d-7544af8e45af`
- Book ID: `39f7e7bb-dce0-4490-b7a0-74ebb259e892`
- Subdomain: `legacyodyssy`
- Custom Domain: `legacyodyssy.com`
- Auth User ID: NULL (linked via user_metadata)
- Email: `dragno65+legacyodyssy@hotmail.com`
- Book Password: `legacy`

## Infrastructure

### Supabase
- URL: `https://vesaydfwwdbbajydbzmq.supabase.co`
- Project ref: `vesaydfwwdbbajydbzmq`
- Keys in `.env`: `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- **Cannot run DDL** (ALTER TABLE, etc.) — no database password available
- Service role key works for PostgREST data operations only

### Railway
- App URL: `legacy-odyssey-production-a9d1.up.railway.app`
- Auto-deploys from GitHub main branch
- Both websites accessible:
  - `/book/eowynragno` (Eowyn's book with full migrated content)
  - `/book/legacyodyssy` (test site with default seed data)

### GitHub
- Repo: `https://github.com/dragno6565-ship-it/legacy-odyssey.git`
- Remote name: `origin`
- Branch: `main`
- Latest commit: `c7013b0` — Multi-website switching

### Expo / EAS Build
- Account: `dragno65`
- EXPO_TOKEN: Set in environment (use for CI builds)
- Latest APK: `https://expo.dev/artifacts/eas/dEWDhAKzbdohggvEofzuEy.apk`
- Build ID: `669d9a1f-6f28-4f7e-95df-47b0427bcd74`
- Build profile: `preview` (outputs APK)
- EAS project ID: `14daf713-2b41-4ac0-b413-1179afa6e6a9`

### DNS Status
- `www.eowynhoperagno.com` → GitHub Pages (IPs 185.199.x.x) — NOT yet pointing to Railway
- `legacyodyssy.com` → Not configured yet
- `legacyodyssey.com` → Not configured yet

## Database Schema Notes
- `families.auth_user_id` has UNIQUE constraint (cannot be dropped without DDL access)
- Workaround: Additional families use `auth_user_id = NULL` + `user_metadata.linked_family_ids`
- `books(family_id)` has UNIQUE index `idx_books_family` (1 book per family)
- `visible_sections JSONB` column NOT yet added to books table
- Script `scripts/drop-unique-constraint.js` has SQL to run when DB access is available:
  ```sql
  ALTER TABLE families DROP CONSTRAINT IF EXISTS families_auth_user_id_key;
  DROP INDEX IF EXISTS idx_books_family;
  CREATE INDEX IF NOT EXISTS idx_families_auth_user ON families(auth_user_id);
  CREATE INDEX IF NOT EXISTS idx_books_family_id ON books(family_id);
  ALTER TABLE books ADD COLUMN IF NOT EXISTS visible_sections JSONB DEFAULT '{}'::jsonb;
  ```

## Supabase Storage Structure
All images in `photos` bucket:
- `{familyId}/hero/hero.jpg`
- `{familyId}/birth/dad-with-baby.png`
- `{familyId}/months/month-{1-11}.jpg`
- `{familyId}/family/{paparoni|nan|memere|pepere}.jpg`
- `{familyId}/celebrations/{holiday-name}.{ext}`

## Previous Session Work (still in effect)
1. Railway deployment + Stripe integration (6 price IDs, checkout flow, success page)
2. Token refresh + session restore (`mobile/src/api/client.js`)
3. AuthContext rewrite with multi-family support (`mobile/src/auth/AuthContext.js`)
4. Families endpoint fix (removed non-existent `plan` column)
5. Website content migration — `scripts/migrate-website-content.js` (20 images, all DB records)

## Remaining Tasks
1. **Build new APK** — EAS build completed, download from URL above
2. **Run SQL in Supabase Dashboard** — Drop UNIQUE constraints, add visible_sections column
3. **Point eowynhoperagno.com DNS to Railway** — Currently on GitHub Pages
4. **Set up legacyodyssy.com DNS** — Point to Railway
5. **Set up www.legacyodyssey.com DNS** — CNAME to Railway
6. **Test checkout flow end-to-end** — Another test purchase
7. **Set up welcome email with Resend** — Deferred
8. **UI/UX polish on mobile app** — Page-by-page review
9. **App store submission** — Google Play ($25), Apple ($99/yr)

## Files Modified This Session
- `src/services/bookService.js` — computeVisibleSections, updated getFullBook
- `src/routes/api/books.js` — sections GET/PUT endpoints
- `src/views/layouts/book.ejs` — conditional section rendering
- `src/views/book/sidebar.ejs` — conditional nav items
- `src/middleware/requireAuth.js` — getUserFamilyIds, multi-family auth
- `src/routes/api/families.js` — updated GET /mine, added POST /
- `src/services/familyService.js` — findAllByAuthUserId
- `mobile/src/components/PhotoPicker.js` — Remove Photo option
- `mobile/src/screens/ManageSectionsScreen.js` (NEW) — section toggles
- `mobile/src/screens/NewWebsiteScreen.js` (NEW) — create website form
- `mobile/src/screens/DashboardScreen.js` — Sites button, New Website in modal
- `mobile/App.js` — registered ManageSections, NewWebsite screens
- `scripts/drop-unique-constraint.js` (NEW) — DB migration script
- `scripts/migrate-website-content.js` (previous session)
