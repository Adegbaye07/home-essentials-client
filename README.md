# Home Essentials by Kamgol — Storefront

Next.js customer storefront — browse, cart, Paystack checkout, order tracking.

## Phase 0 status

Scaffold ready with recreate tab removed. Categories/pricing domain updates come in Phase 1–4. Brand gold `#AE7820` applied to theme tokens.

## Prerequisites

- Node 20+
- API running ([home-essentials-backend](../home-essentials-backend))

## Environment

Copy [`.env.local.example`](.env.local.example) to `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
```

## Run

```bash
npm install
npm run dev
```

Default: [http://localhost:3000](http://localhost:3000)
