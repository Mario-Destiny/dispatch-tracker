# Veritrack

Every delivery, verified and tracked.

Veritrack gives every delivery a status, a rider, and a tracking code your customer can check themselves. It is built for small vendors and informal dispatch riders in Nigeria.

## What it does

- **Vendors** create deliveries, pick an online rider (with a suggested best rider), and send customers a tracking link over WhatsApp.
- **Riders** set their availability, join a company fleet with an invite code, and update delivery status.
- **Companies** manage a fleet of riders from one dashboard.
- **Customers** track a delivery with a code, with no app to download.
- **Trust layer:** verified businesses, customer ratings, and completion rates.

## Tech

React, TypeScript, Vite, Supabase, deployed on Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Create a `.env` file with:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Build

```bash
npm run build
```

The build also saves search-friendly HTML for the public pages (`scripts/prerender.mjs`).

## Contact

veritrackapp@gmail.com
