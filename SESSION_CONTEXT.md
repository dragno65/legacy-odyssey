# Legacy Odyssey - Session Context (March 2, 2026)

## What Was Done This Session
Migrated ALL content from the static website (www.eowynhoperagno.com, hosted on GitHub Pages)
into the Supabase database so the mobile app and Railway-hosted website share the same data.

## Migration Summary
**Script:** `scripts/migrate-website-content.js`
**What was migrated:**
- **Book record** - Updated birth details (6:08 PM, 6lbs 9oz, Scottsdale Shea, "Brave & Beautiful")
- **Hero image** - Downloaded from website slider, uploaded to Supabase Storage
- **Birth Story** - Full Dad and Mom narratives with Dad's photo
- **11 Month photos** - All downloaded and uploaded to Supabase Storage
- **4 Family Members** - Papa Roni, Nan, Memere, Pepere with full stories, meta data, and photos
- **4 Celebrations** - St. Patrick's Day, Easter, Halloween, Christmas with photos and stories

**20 images total** downloaded from the website and uploaded to Supabase Storage.
All old test data (generic "Mom's Name", "Dad's Name", etc.) was replaced with real content.

## API Verification (all confirmed working on Railway)
- `GET /api/books/mine` → Eowyn Hope Ragno, correct birth info, 11/12 months with photos
- `GET /api/books/mine/family` → 4 real family members with photos and stories
- `GET /api/books/mine/celebrations` → 4 holidays with photos
- `GET /api/books/mine/birth` → Full Dad and Mom narratives
- `GET /api/books/mine/months` → 11 months with photos, 1 without (month 12)
- `GET /api/families/mine` → Returns family with childName "Eowyn Ragno", hasBook: true

## Key Discovery: Website vs Railway
- **www.eowynhoperagno.com** → Hosted on GitHub Pages (IPs 185.199.x.x), static site
- **Railway app** → legacy-odyssey-production-a9d1.up.railway.app, dynamic database-driven
- The mobile app connects to Railway, so migrated data is immediately available
- To make the dynamic site live at eowynhoperagno.com, DNS needs to change from GitHub Pages to Railway

## Key Database Records
- Family ID: fb16691d-7ea4-4c93-9827-ffe8904ced6b
- Auth User ID: ef8926bc-908a-43f0-afb3-2117913b85b9
- Email: dragno65@hotmail.com
- Book ID: 501e0807-d950-4004-8b4c-9b0f0ce0c910
- Subdomain: eowynragno
- Custom Domain: eowynhoperagno.com
- Book Password: legacy

## Supabase Storage Structure
All images now stored in the `photos` bucket with paths like:
- `{familyId}/hero/hero.jpg`
- `{familyId}/birth/dad-with-baby.png`
- `{familyId}/months/month-{1-11}.jpg`
- `{familyId}/family/{paparoni|nan|memere|pepere}.jpg`
- `{familyId}/celebrations/{holiday-name}.{ext}`

## Previous Session Changes (still in effect)
1. Token refresh + session restore (mobile/src/api/client.js)
2. AuthContext rewrite with multi-family support (mobile/src/auth/AuthContext.js)
3. Multi-Book Dashboard with switcher (mobile/src/screens/DashboardScreen.js)
4. Backend multi-book support (requireAuth.js, families.js, auth.js, server.js)
5. Families endpoint fix (removed non-existent `plan` column)

## Git Info
- All code pushed to: github.com/dragno65/legacy-odyssey (main branch)
- PAT: stored in .env (not committed)

## Credentials
- All credentials stored in .env file and Railway env vars (not in repo)
- Railway API: legacy-odyssey-production-a9d1.up.railway.app
- Stripe (test mode): configured on Railway with 6 price IDs

## What User Should Do Now
1. Open the mobile app
2. Log out (Settings > Logout)
3. Log back in with dragno65@hotmail.com
4. All sections should now show the real content from the website

## Remaining Tasks
1. **Verify mobile app shows migrated content** - user needs to log out/in
2. **Point eowynhoperagno.com DNS to Railway** - currently points to GitHub Pages
3. Test the new success page end-to-end (another test checkout)
4. Set up welcome email with Resend (user wants to defer)
5. Set up www.legacyodyssey.com DNS (CNAME record)
6. UI/UX polish on mobile app (page-by-page review)
7. Final production APK + app store submission (Google $25, Apple $99/yr)

## EAS Build
- Latest APK: https://expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d00f6de8-00fc-4089-b27f-d40cc9b37504
- Build profile: preview (outputs APK)
- Expo account: dragno65
