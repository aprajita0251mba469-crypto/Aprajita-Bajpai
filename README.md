# REFILL+ — Household Liquid Refill Marketplace

**Tagline:** *Refill More. Waste Less.*

REFILL+ is a full-stack household liquid refill marketplace built for students, hostel residents, and households around **DBS Global University, Dehradun**. Customers order everyday liquid essentials (Handwash, Dishwash Liquid, Floor Cleaner, Laundry Detergent) in flexible refill volumes (`250 ml`, `500 ml`, `1 Litre`) using their own containers or reusable Refill+ bottles.

---

## Key Features

- **Landing Page & Storefront**: Responsive hero, 4-product refill catalog with live volume pricing, How It Works flow, Sustainability Savings Estimator, sample testimonials (explicitly labeled as sample/demo), FAQ, and WhatsApp campus support.
- **Role-Protected Authentication**: Firebase Authentication (Google Sign-In + Email/Password & Forgot Password). Registration supports Customer/Admin role selection, while actual Admin access is strictly enforced server-side via Firestore Security Rules (`/admins/{uid}` allowlist and verified admin identity) — never granted merely by selecting Admin at signup.
- **Persistent Shopping Cart & Checkout**: Real-time Firestore-backed cart (`cart_items`), volume & container mode switching (`Own Container` vs `Reusable Container`), campus hostel/address presets, delivery time slots, and saved addresses.
- **Honest Payment Architecture**:
  - **Cash on Delivery (COD)**: Recorded as `pending_cod` (payable upon delivery).
  - **UPI Payment**: Generates UPI deep link & UTR reference submission (`verification_pending` until admin verifies).
  - **Razorpay**: Server-side `/api/payments/razorpay/*` endpoints using HMAC-SHA256 verification when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured; transparently reports unconfigured status otherwise without fake confirmations.
  - **Demo Test Payment Mode**: Explicitly labeled testing mode allowing both simulated confirmation and failure testing.
- **Order Tracking & History**: 6-stage visual progress tracker (`Order Placed` → `Order Confirmed` → `Preparing Refill` → `Out for Delivery` → `Delivered` / `Cancelled`), itemized receipts, cancellation in early stages, and one-click reorder.
- **Customer & Admin Dashboards**:
  - Customer Dashboard: Personal order KPIs, money saved, plastic bottles avoided, saved addresses, and profile editor.
  - Admin Dashboard: Revenue & volume analytics charts (Recharts), product & stock management (CRUD + pricing), order & UPI verification management, customer registry & admin approval workflow, and configurable sustainability assumptions.

---

## Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts
- **Backend / API**: Node.js + Express (`server.ts`) with Vite middleware in dev and static serving in production
- **Database & Auth**: Firebase Firestore + Firebase Authentication with hardened Eight-Pillar `firestore.rules` and `firebase-blueprint.json`

---

## Environment Variables

Copy `.env.example` and configure optional payment secrets as needed:

```env
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="MY_APP_URL"
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

Firebase client configuration is stored in `firebase-applet-config.json`.

---

## Local Development & Production Build

```bash
# Install dependencies
npm install

# Run full-stack development server on port 3000
npm run dev

# Type-check TypeScript
npm run lint

# Lint Firestore Security Rules
npx eslint firestore.rules

# Build production client bundle
npm run build

# Start production server
npm start
```

---

## Deployment Notes (Vercel / Cloud Run)

- For **Cloud Run / Node hosting**: Run `npm run build` followed by `npm start` (`NODE_ENV=production node server.ts` on `PORT=3000`).
- For **Vercel**: Configure `npm run build` with output directory `dist` (and optional `/api` serverless wrappers if deploying Razorpay endpoints on Vercel Functions), and ensure `firebase-applet-config.json` and Firebase Auth authorized domains include your deployment domain.
