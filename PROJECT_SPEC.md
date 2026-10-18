# Virtual Try-On Web App Specification

## Product Overview
A lightweight, zero-budget, one-page AI virtual try-on web application.

1. **User Input**: The user uploads full-body photos (front photo required, left/right side optional in later phases).
2. **Product Selection**: The user adds a product (clothes, shoes, etc.) via image upload, product link, or text description.
3. **Try-On Output**: The app extracts the product and shows the result: the product worn on the user's photo, alongside similar product recommendations.

---

## Architectural & Budget Constraints
- **Zero Budget**: Operates entirely within free tiers.
- **Frontend**: React + Vite + TypeScript, hosted on Firebase Hosting (Spark plan - free).
- **Backend Edge Proxy**: Cloudflare Worker (free tier).
  - All secret keys (e.g., Hugging Face access tokens) live strictly in Worker secrets / environment variables.
  - Zero API keys exposed to the client.
- **Storage & Privacy**:
  - **No user photo persistence**: Photos are sent from the browser to the Worker, processed in memory/ephemeral streaming, returned to the browser, and immediately discarded.
  - No Firebase Storage or Cloud Functions used (to strictly avoid Blaze plan requirements).
  - Explicit privacy consent checkbox before any photo upload.
  - Dedicated Privacy Policy.
  - Telemetry/Analytics strictly free of images, URLs of uploaded photos, or any PII.
- **Try-On AI Engine**:
  - Free Hugging Face Space running an open try-on model (default: `yisol/IDM-VTON` or `zhengchong/CatVTON`).
  - Modularized behind an isolated engine adapter function (`runTryOn`) to allow swapping models or providers without breaking changes.
- **Rate Limiting & Quotas**:
  - Per-user daily quota (3 try-ons per day) tracked in Firestore (Spark plan free tier) via Firebase Auth (anonymous or email).
  - Edge rate limiting on the Cloudflare Worker.
- **Monetization & Ads**:
  - Affiliate links on "similar products".
  - Designated placeholder reserved for Google AdSense integration.

---

## Phased Implementation Roadmap
- **Phase 1: Project Setup (Current Phase)**
  - Scaffold repository with `/web` (React + Vite + TS) and `/worker` (Cloudflare Worker).
  - Setup `.env.example`, `PROJECT_SPEC.md`, `firebase.json`, and setup documentation in `README.md`.
  - Frontend: Front photo upload (client-side resize to max 1024px), product image upload, "Try On" CTA, loading & error states, result area, AdSense placeholder, and GA4 telemetry (`upload_started`, `tryon_completed`, `tryon_failed`).
  - Worker: `POST /tryon` endpoint accepting images, validating MIME types and file sizes, calling the Hugging Face try-on Space, and returning the result image with CORS restricted to domain.
- **Phase 2: Firebase Auth & Daily Quotas (Deferred)**
  - Anonymous/Email Firebase Auth (Spark tier).
  - Firestore usage counter tracking per-user daily try-on limit (max 3/day).
- **Phase 3: Product Links & Text Descriptions (Deferred)**
  - Add URL scraping / product metadata extraction or text prompt guidance.
- **Phase 4: Similar Products & Affiliate Integration (Deferred)**
  - Product recommendation cards with affiliate link attribution.
- **Phase 5: Side-Angle Photos, Privacy Policy Page & UI Polish (Deferred)**
  - Multi-angle upload support (left/right profile).
  - Full dedicated Privacy Policy view and polish.
