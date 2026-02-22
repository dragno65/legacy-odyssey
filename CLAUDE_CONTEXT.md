# Legacy Odyssey - Claude Session Context

> **Read this file at the start of every new session.** It contains everything needed to pick up where we left off.

## What Is This Project?

Legacy Odyssey is a **subscription SaaS baby book platform**. Parents use a **React Native mobile app** to fill in their baby's story (milestones, photos, recipes, letters, etc.), and family/friends view the finished book through a **web book viewer** at a custom domain (e.g., `eowynhoperagno.com`).

### Architecture

```
React Native Mobile App (Expo)
        │
        ▼
Express API Server (Railway)
        │
        ▼
Supabase (PostgreSQL DB + Storage)
        │
        ▼
EJS Web Book Viewer (served by Express)
```

---

## Repository Structure

```
legacy-odyssey/
├── src/                        # Express API server
│   ├── server.js               # Entry point (Express app setup)
│   ├── config/                 # DB client, Supabase config
│   ├── middleware/              # Auth, error handling, family resolution
│   │   ├── requireAuth.js      # JWT Bearer token auth
│   │   ├── requireAdmin.js     # Admin-only middleware
│   │   ├── requireBookPassword.js  # HMAC-SHA256 password gate for web viewer
│   │   ├── resolveFamily.js    # Resolves family by domain/subdomain/slug
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── api/
│   │   │   ├── auth.js         # Sign up, login, JWT issuance
│   │   │   ├── books.js        # CRUD for all book content (sections, photos, etc.)
│   │   │   ├── upload.js       # Photo upload to Supabase Storage
│   │   │   └── stripe.js       # Subscription management
│   │   ├── book.js             # Web book viewer routes (password gate, book pages)
│   │   ├── admin.js            # Admin panel routes
│   │   └── webhooks.js         # Stripe webhook handler
│   ├── services/               # Business logic layer
│   ├── utils/                  # Helpers
│   ├── views/                  # EJS templates
│   │   ├── book/               # Web book viewer pages (welcome, birth, months, etc.)
│   │   ├── layouts/            # Shared EJS layouts
│   │   ├── admin/              # Admin panel pages
│   │   └── marketing/          # Landing pages
│   └── public/                 # Static assets (CSS, JS, images)
│
├── mobile/                     # React Native app (Expo)
│   ├── App.js                  # Root: AuthProvider + NavigationContainer
│   ├── app.json                # Expo config
│   ├── eas.json                # EAS Build config
│   ├── package.json            # Expo 54, React 19.1, React Navigation 7
│   └── src/
│       ├── api/
│       │   └── client.js       # Axios client, SecureStore token, base URL config
│       ├── auth/
│       │   ├── AuthContext.js   # React Context for auth state
│       │   ├── LoginScreen.js  # Login UI
│       │   └── SignupScreen.js # Sign up UI
│       ├── screens/            # All app screens (listed below)
│       ├── components/
│       │   ├── PhotoPicker.js  # Image picker + upload component
│       │   └── LoadingOverlay.js
│       └── theme/
│           └── index.js        # Colors, spacing, typography, shadows
│
├── package.json                # Server dependencies
├── .env                        # Server env vars (not committed)
├── .env.example                # Template for env vars
├── app-screen-reference.html   # Visual annotated screenshots of all app pages
└── CLAUDE_CONTEXT.md           # This file
```

---

## Mobile App Screens (Navigation)

The app uses React Navigation with two stacks:

**Auth Stack** (unauthenticated):
- `Login` → LoginScreen.js
- `Signup` → SignupScreen.js

**App Stack** (authenticated or demo mode):
| Route Name | Screen File | Description |
|------------|-------------|-------------|
| `Dashboard` | DashboardScreen.js | Main hub with cards for each section |
| `ChildInfo` | ChildInfoScreen.js | Baby's name, DOB, weight, length, city, hospital, photo |
| `BeforeArrived` | BeforeScreen.js | Name origin, pregnancy story, cravings, wishes |
| `BirthStory` | BirthStoryScreen.js | Birth narrative, mom/dad photos |
| `ComingHome` | ComingHomeScreen.js | Coming home story, first visitors |
| `Months` | MonthsScreen.js | Grid of Month 1-12 cards |
| `MonthDetail` | MonthDetailScreen.js | Individual month: milestones, favorites, photo |
| `OurFamily` | FamilyScreen.js | List of family members |
| `FamilyMember` | FamilyMemberScreen.js | Add/edit individual family member |
| `YourFirsts` | FirstsScreen.js | First smile, first word, etc. |
| `Celebrations` | CelebrationsScreen.js | Birthday parties, holidays |
| `Letters` | LettersScreen.js | Letters to the child |
| `FamilyRecipes` | RecipesScreen.js | Family recipe collection |
| `TheVault` | VaultScreen.js | File uploads/document storage |
| `Settings` | SettingsScreen.js | Book password, preview, log out |
| `Preview` | PreviewScreen.js | WebView of the book viewer |

---

## Visual Screen Reference System

We created a **visual reference file** (`app-screen-reference.html`) with annotated screenshots of every screen. Each page is numbered and each UI element has a sub-label:

| Page | Screen | Labels |
|------|--------|--------|
| 1 | Login | 1-a (Status Bar) through 1-j (Bottom Tab Bar) |
| 2 | Sign Up | 2-a through 2-j |
| 3 (top) | Dashboard | 3-a through 3-i |
| 3 (bottom) | Dashboard (scrolled) | 3-j through 3-o |
| 4 (top) | Child Info | 4-a through 4-i |
| 4 (bottom) | Child Info (scrolled) | 4-j, 4-k |
| 5 | Before You Arrived | 5-a through 5-i |
| 6 | Birth Story | 6-a through 6-f |
| 7 | Coming Home | 7-a through 7-g |
| 8 | Month by Month | 8-a through 8-g |
| 9 | Month Detail (Month One) | 9-a through 9-g |
| 10 | Our Family | 10-a through 10-e |
| 11 | Your Firsts | 11-a through 11-e |
| 12 | Celebrations | 12-a through 12-f |
| 13 | Letters to You | 13-a through 13-e |
| 14 | Family Recipes | 14-a through 14-f |
| 15 | The Vault | 15-a through 15-h |
| 16 | Settings | 16-a through 16-i |

**Usage:** When the user says something like "change 3-d", that means the Child Info card on the Dashboard. Open `app-screen-reference.html` to see the full visual reference.

---

## Theme / Design System

```javascript
colors: {
  background: '#faf7f2',   // Warm cream
  dark: '#1a1510',          // Near-black (header bars)
  gold: '#c8a96e',          // Primary accent
  goldLight: '#d4bb8a',
  goldDark: '#b08e4a',
  textPrimary: '#2c2416',
  textSecondary: '#8a7e6b',
  card: '#f0e8dc',          // Card background
  white: '#ffffff',
  error: '#c0392b',
  errorLight: '#f8d7da',
  success: '#27ae60',
  border: '#e0d5c4',
  inputBg: '#ffffff',
  placeholder: '#b8ad9e',
}
```

Fonts: System serif for headings, System sans-serif for body. Web viewer uses Cormorant Garamond + Jost (Google Fonts).

---

## API Configuration

**Base URL logic** (`mobile/src/api/client.js`):
```
EXPO_PUBLIC_API_URL || API_URL || 'https://legacy-odyssey-production-a9d1.up.railway.app'
```

**Auth flow:** JWT Bearer tokens stored in expo-secure-store. Axios interceptor auto-attaches tokens.

**Demo mode:** "Browse Demo" button on login screen sets `isAuthenticated = true` with `isDemo = true` — allows browsing all screens without a real API connection. Data doesn't save in demo mode.

---

## Deployment Info

| Service | URL / ID |
|---------|----------|
| **Railway** (API server) | `legacy-odyssey-production-a9d1.up.railway.app` |
| **Railway CNAME** | `tdt5meaj.up.railway.app` |
| **Supabase project** | `vesaydfwwdbbajydbzmq` |
| **GitHub repo** | `github.com/dragno6565-ship-it/legacy-odyssey` |
| **GitHub (alt remote)** | `github.com/dragno65/legacy-odyssey` |
| **Domain** | `eowynhoperagno.com` / `legacyodyssey.com` |
| **Book URL** | `legacyodyssey.com/book/eowynragno` |
| **Book password** | `legacy` |
| **Latest APK** | `expo.dev/accounts/dragno65/projects/legacy-odyssey/builds/d9bc9bb2-1f33-47e5-8de1-ede6c21c0d66` |

---

## Deployment Plan (see plans/elegant-popping-pascal.md)

Phases A-G covering: fix server bugs → Supabase setup → Railway deploy → Stripe setup → mobile app update → DNS config → E2E test.

**Key bugs to fix:**
- `src/server.js` — Mount webhooks.js route
- `src/views/book/welcome.ejs` — Fix field names (birth_weight → birth_weight_lbs, etc.)
- `src/views/book/birth.ejs` — Fix photo field names (mom_photo_path → mom_photo_1)
- `src/views/marketing/success.ejs` — Render subdomain/tempPassword variables
- `mobile/src/api/client.js` — Update default API URL to Railway

---

## Current Status (Updated 2026-02-22)

### What's Done:
- Full mobile app built and functional (all 16 screens)
- Express API server built with all routes
- EJS web book viewer built
- Supabase DB tables created
- Railway deployment active
- DNS configured (eowynhoperagno.com → Railway)
- Visual screen reference system created (app-screen-reference.html)
- APK built and available on Expo

### What's In Progress:
- **Going through the app page by page** with the user to fix all UI/UX issues
- User is using the visual reference labels (1-a, 3-d, etc.) to point out what needs changing

### What's Remaining:
- Fix all UI/UX issues identified during page-by-page review
- Fix server bugs listed in deployment plan (Phase A)
- Set up Stripe account and webhook
- Build final production APK
- Full end-to-end test

---

## How to Run Locally

**Server:**
```bash
cd E:/Claude/legacy-odyssey
npm run dev
# Runs on http://localhost:3000
```

**Mobile app (Expo Web for testing):**
```bash
cd E:/Claude/legacy-odyssey/mobile
npx expo start --web --port 8082
# Runs on http://localhost:8082
# Use "Browse Demo" button to skip auth
```

**Serve reference files:**
```bash
cd E:/Claude/legacy-odyssey
python -m http.server 9876
# Access at http://localhost:9876/app-screen-reference.html
```

---

## Important Notes for Future Sessions

1. **The user's daughter is named Eowyn Hope Ragno** — this is the first real baby book being built
2. **The user prefers direct action** — don't ask unnecessary questions, just do the work
3. **Use the label system** — when discussing UI changes, reference elements by their page-label codes (e.g., "1-e" = email input on login)
4. **Expo Web for screenshots** — use `npx expo start --web --port 8082` with Chrome to view/screenshot the app. Set viewport to 430x932 for mobile simulation
5. **Demo mode** — click "Browse Demo" on the login screen to bypass auth for local testing
6. **The web book viewer is separate** from the mobile app — it's EJS templates served by Express at the book URL
