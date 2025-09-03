# Auction House

A modern, responsive multi‑page Auction platform built with **Vite**, **vanilla ES Modules**, and **Tailwind CSS** consuming the **Noroff API v2 Auction House** endpoints. No front‑end frameworks (React/Vue/etc.) are used, complying with project technical restrictions.

## Deployment
Live application: 

## Features
- Public browsing & search of listings (keyword + tag filtering, active-only toggle, infinite scroll)
- Registration & login restricted to `@stud.noroff.no` emails
- Persistent auth (token + profile in storage) and guarded routes
- View & maintain user profile (bio, avatar, banner) and live credits visible in navbar
- Create, edit, delete listings with media gallery (multi-image via comma separated URLs) & deadline
- Detail page with bid history, highest bid, seller info, conditional bid form or login CTA
- Place bids on other users' listings with immediate UI refresh & credit update
- Dashboard: user listings, bids (with resolved listing data), wins, profile editor
- Mobile responsive navigation (hamburger + collapsible menu) with credits always accessible when authenticated
- Graceful fallback for unauthenticated users (can view and search listings, but must login to bid or create)
- Trailing slash clean URLs & directory-based routing for deployment parity (Vercel ready)

## Tech Stack
- **Language:** Vanilla JavaScript (ES Modules)
- **Build Tool:** Vite (multi-page, auto entry discovery)
- **Styling:** Tailwind CSS + small custom globals
- **API:** Noroff API v2 (Auth + Auction House) - listings, profiles, bids
- **State:** Lightweight custom store (simple subscription) + localStorage session helpers
- **Deployment Targets:** Vercel (primary). Compatible with Netlify / GitHub Pages with proper rewrites.

## Project Structure
```
index.html
login/ register/ listings/ user/dashboard/  (directory-based pages)
public/ favicon.svg vite.svg
src/
  api/ (HTTP + endpoint wrappers)
  auth/ (auth + guard + validators)
  pages/ (page controllers for each route)
  ui/ (header, footer, listing cards, feedback components)
  state/ (user, listings)
  utils/ (helpers: dates, currency, storage, upload, url)
  styles/ (tailwind, globals)
```

## Getting Started
### Prerequisites
- Node.js 18+ (ESM + Vite compatibility)

### Install
```
npm install
```

### Development
```
npm run dev
```
Visit the printed local URL (usually http://localhost:5173/). Pages are accessible via clean trailing-slash paths, e.g. `/` (listings), `/login/`.

### Build
```
npm run build
```
Outputs production assets to `dist/` (ready for Vercel / Netlify / static hosting).

### Preview Production Build
```
npm run preview
```

## Environment & Configuration
No custom env file is required for public Auction House endpoints. If an API key is later introduced, extend the auth module to inject headers via `http.js`.

## API Usage Summary
- Auth: register & login (restricted to `@stud.noroff.no`) -> stores access token & profile
- Listings: create, read (with `_bids`, `_seller` embeds), update, delete, bid
- Profiles: get profile (credits, listings, bids), update avatar/banner/bio
- Bids: placed through listings endpoint; bid history rendered newest-first


## Acknowledgements
- Noroff API v2 documentation
- Tailwind CSS
- Vite team

---
