# ConcreteMix Pro

Offline-first concrete quantity, mix, cost, material order and progress dashboard calculator for contractors, builders, owner-builders and onsite crews.

The app opens directly to the calculator, stores data locally, installs as a PWA, and works without a backend, login, cloud sync or live currency service.

## Run Locally

```powershell
cd "D:\Vincent\Documents\ConcreteMix Pro"
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3060](http://localhost:3060).

## Production Checks

```powershell
npm.cmd run typecheck
npm.cmd run build
```

## Included

- Mobile-first Next.js PWA with offline service worker.
- Volume calculator for slab, circle, column, beam, stair and custom volume.
- Purpose-based MPa, PSI, mix ratio and cement type recommendations.
- Built-in strength database from 5 MPa to 30 MPa+.
- Cement, sand, aggregate, water, bags, mixer loads and wheelbarrow estimates.
- Offline cost calculator with saved local pricing and currency symbol.
- Saved projects and locations with a Progress & Order Status Dashboard.
- Material order tracking for cement, sand, stone, additive and ready-mix.
- Combined order PDFs across selected project locations.
- Settings for theme, units, bag size, wastage, water-cement ratio, cement types, material costs and currency.
- Local-only persistence through browser storage.
- PDF/print export and native sharing where supported.
- Help and privacy pages for web and Play Store use.

## Architecture

- UI: `components/concrete-mix-pro.tsx`
- Service worker registration: `components/service-worker.tsx`
- Calculation engine: `lib/concrete/engine.ts`
- Concrete data and defaults: `lib/concrete/data.ts`
- Unit helpers: `lib/concrete/units.ts`
- Local storage: `lib/concrete/storage.ts`
- PDF/print export: `lib/concrete/pdf.ts`
- App routes: `app/page.tsx`, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`

## Deployment

Use a separate GitHub repository for this app. Do not push this project to the FieldConvert repository.

Recommended production domain:

```text
https://concretequantitymixandcostcalculator.vindk.com
```

Required Vercel environment variables:

```text
NEXT_PUBLIC_SITE_URL=https://concretequantitymixandcostcalculator.vindk.com
PRIMARY_HOST=concretequantitymixandcostcalculator.vindk.com
```
