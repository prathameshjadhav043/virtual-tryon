# FitCraft AI - One-Page AI Virtual Try-On Studio (Zero Budget)

A production-ready, zero-budget AI virtual try-on application. Built with **React 18 + Vite + TypeScript** on the frontend, an edge **Cloudflare Worker** as a secure proxy, and open-source diffusion models (default: **IDM-VTON** on Hugging Face Spaces) via `@gradio/client`.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |       Client Browser (React + Vite)   |
                      |  - HTML5 Canvas Resize (max 1024px)   |
                      |  - Privacy Consent Checkbox           |
                      |  - Google Analytics 4 (Sanitized)     |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS POST /tryon
                                          | (multipart/form-data)
                                          v
                      +---------------------------------------+
                      |  Cloudflare Worker Edge Proxy (Free)  |
                      |  - Origin / CORS Filtering            |
                      |  - MIME & Size Validation (<= 10MB)   |
                      |  - Secrets Guard (HF_TOKEN in worker) |
                      |  - Pluggable Engine Adapter           |
                      +-------------------+-------------------+
                                          |
                                          | In-Memory Stream via @gradio/client
                                          v
                      +---------------------------------------+
                      | Hugging Face Space (yisol/IDM-VTON)   |
                      |  - Open Diffusion Model Inference     |
                      |  - Returns rendered image             |
                      +---------------------------------------+
```

### Strict Zero-Storage & Zero-Budget Guarantees
- **No Disk or Database Storage for Photos**: User photos are downscaled in client browser RAM, forwarded in-memory via Cloudflare Worker, processed by the model, and discarded immediately.
- **Spark Plan Safe**: No Firebase Cloud Storage or Cloud Functions are used, keeping the app strictly within the free Firebase Spark plan.
- **Privacy-Preserving Telemetry**: Google Analytics 4 tracks only operational telemetry (`upload_started`, `tryon_completed`, `tryon_failed`). No image URLs, filenames, or user identifiers are ever recorded.

---

## Repository Structure

```
virtual-tryon/
├── PROJECT_SPEC.md              # Full architectural & product specification
├── README.md                    # Setup, running, testing & deployment guide
├── .env.example                 # Root environment variable template
├── .gitignore                   # Universal Git ignore rules
├── firebase.json                # Firebase Hosting configuration (targets web/dist)
├── .firebaserc                  # Firebase project alias
├── web/                         # React 18 + Vite + TypeScript frontend
│   ├── .env.example             # Frontend environment variables
│   ├── package.json             # Frontend dependencies
│   ├── vite.config.ts           # Vite configuration
│   ├── tsconfig.json            # TypeScript configuration
│   ├── index.html               # Main HTML entry with meta tags & fonts
│   └── src/
│       ├── App.tsx              # Main one-page try-on UI
│       ├── index.css            # Dark/vibrant modern design system
│       ├── components/
│       │   ├── UploadDropzone.tsx     # Drag & drop uploader with canvas resize
│       │   ├── ConsentBanner.tsx      # Mandatory privacy consent checkbox
│       │   ├── ResultSection.tsx      # Result showcase, comparison & download
│       │   ├── AdSensePlaceholder.tsx # Marked Google AdSense slots
│       │   └── PrivacyPolicyModal.tsx # Zero-storage privacy policy
│       └── lib/
│           ├── image-processor.ts     # HTML5 Canvas client-side downscaling
│           ├── firebase.ts            # Firebase app & GA4 initialization
│           └── analytics.ts           # Privacy-safe GA4 telemetry events
└── worker/                      # Cloudflare Worker Edge Proxy
    ├── package.json             # Worker dependencies (@gradio/client, wrangler)
    ├── wrangler.jsonc           # Wrangler configuration (nodejs_compat enabled)
    ├── tsconfig.json            # Worker TypeScript configuration
    ├── .dev.vars.example        # Local development secrets template
    └── src/
        ├── index.ts             # POST /tryon endpoint, validation & CORS
        ├── types.ts             # TypeScript definitions
        └── engine/
            └── index.ts         # Pluggable try-on engine (IDM-VTON via @gradio/client)
```

---

## Quickstart: Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Configure Local Secrets

**Worker (`/worker`):**
```bash
cd worker
cp .dev.vars.example .dev.vars
```
Edit `worker/.dev.vars`:
```ini
ALLOWED_ORIGIN=http://localhost:5173
HF_SPACE=yisol/IDM-VTON
HF_TOKEN=hf_your_token_here # Optional, but recommended for avoiding anonymous queues
```

**Frontend (`/web`):**
```bash
cd ../web
cp .env.example .env.local
```
Edit `web/.env.local`:
```ini
VITE_TRYON_WORKER_URL=http://localhost:8787
# Add your Firebase credentials (optional for Phase 1 local UI testing)
```

### 3. Start the Development Servers

Open two terminal windows:

**Terminal 1 (Cloudflare Worker):**
```bash
cd worker
npm run dev
# Worker starts at http://localhost:8787
```

**Terminal 2 (Frontend):**
```bash
cd web
npm run dev
# Frontend starts at http://localhost:5173
```

Visit **http://localhost:5173** in your browser.

---

## How to Test Each Component

### Test 1: Cloudflare Worker Health Check
Run in terminal:
```bash
curl -i http://localhost:8787/health
```
Expected output:
```json
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173

{"status":"ok","service":"virtual-tryon-worker","space":"yisol/IDM-VTON"}
```

### Test 2: Input Validation (MIME & File Size)
Sending an invalid file type:
```bash
curl -i -X POST http://localhost:8787/tryon \
  -F "person_image=@README.md;type=text/markdown" \
  -F "garment_image=@README.md;type=text/markdown"
```
Expected output:
```json
HTTP/1.1 415 Unsupported Media Type
{"success":false,"error":"Unsupported person image format: text/markdown. Allowed: JPEG, PNG, WebP.","code":"UNSUPPORTED_PERSON_IMAGE_TYPE"}
```

### Test 3: Client-Side Downscaling (1024px)
1. Open http://localhost:5173.
2. Upload a large camera photo (e.g. 4000x3000px, 8MB).
3. Check the dropzone badge: it will immediately show that the image was resized to `1024 × 768px` and reduced from `~8MB` to `~300KB` on client-side canvas before any network transmission.

### Test 4: Privacy Consent Validation
1. Upload both images without checking the consent box.
2. The "Generate Virtual Try-On" button remains disabled until you check the consent checkbox.

### Test 5: End-to-End Try-On Flow
1. Upload a front photo and garment.
2. Check the consent box.
3. Click **Generate Virtual Try-On**.
4. The loading indicator displays progressive updates while IDM-VTON runs.
5. The result renders in the comparison view with side-by-side or solo preview and download option.

---

## Manual Steps You Must Complete

### Step 1: Hugging Face User Access Token (Free)
1. Go to [Hugging Face](https://huggingface.co/) and create a free account (if you don't have one).
2. Go to **Settings -> Access Tokens -> Create new token**.
3. Choose **Read** permissions.
4. Copy the token (`hf_...`).
5. (Optional) You can duplicate `yisol/IDM-VTON` to your own free ZeroGPU Space if you want dedicated queue priority.

### Step 2: Cloudflare Worker Setup & Secrets
1. Create a free account at [Cloudflare](https://dash.cloudflare.com/).
2. In terminal, authenticate Wrangler:
   ```bash
   cd worker
   npx wrangler login
   ```
3. Set your production secrets in Cloudflare:
   ```bash
   npx wrangler secret put HF_TOKEN
   # Paste your Hugging Face token when prompted

   npx wrangler secret put ALLOWED_ORIGIN
   # Set to your Firebase Hosting domain (e.g. https://your-project.web.app)
   ```
4. Deploy the Worker:
   ```bash
   npx wrangler deploy
   ```
5. Copy your deployed Worker URL (e.g. `https://virtual-tryon-worker.<your-subdomain>.workers.dev`).

### Step 3: Firebase Hosting & GA4 Setup (Free Spark Plan)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Enable **Google Analytics** during project creation (free).
3. When the project is ready, click **Web** (`</>`) to register a web app.
4. Copy the `firebaseConfig` keys into `web/.env`:
   ```ini
   VITE_TRYON_WORKER_URL=https://virtual-tryon-worker.<your-subdomain>.workers.dev
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-app
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=1:...
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
5. Build the web app and deploy to Firebase Hosting:
   ```bash
   cd web
   npm run build
   cd ..
   npx firebase-tools login
   npx firebase-tools use --add your-app
   npx firebase-tools deploy --only hosting
   ```

---

## Swapping Try-On Models Later
All model inference is strictly isolated behind one function in [worker/src/engine/index.ts](file:///Users/prathamesh/Documents/GitHub/virtual-tryon/worker/src/engine/index.ts):
```typescript
export async function runTryOn(
  personBlob: Blob,
  garmentBlob: Blob,
  env: Env,
  options?: TryOnOptions
): Promise<TryOnResult>
```
To swap from `IDM-VTON` to `CatVTON`, `Kolors`, or a self-hosted endpoint, update only this function without touching any frontend or routing code.

---

## Roadmap
- [x] **Phase 1: Project Setup (Completed)**
- [ ] **Phase 2: Firebase Auth & Daily Quota (Deferred)**
- [ ] **Phase 3: Product Link & Text Description Extraction (Deferred)**
- [ ] **Phase 4: Similar Products with Affiliate Links (Deferred)**
- [ ] **Phase 5: Side-Angle Photos & Polish (Deferred)**
