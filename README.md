# Home Essentials by Kamgol — Storefront

Next.js customer app — shop, cart, Paystack checkout, and order tracking.

## Prerequisites

- Node 20+
- API running ([home-essentials-backend](../home-essentials-backend))
- Paystack **test** (or live) public key for checkout

## Environment

Create `.env.local` (not committed):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
```

Use your deployed API URL in production. Ensure API `CORS_ORIGINS` includes this storefront origin (local default port **3000**).

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000/store](http://localhost:3000/store).

## Routes

| Path | Purpose |
|------|---------|
| `/store` | Catalogue (category tabs; authenticity video plays on hover when set) |
| `/store/[id]` | PDP — video first (muted autoplay) when set; variant, size, piece/bundle or piece/dozen |
| `/cart` | Cart + customer details + Paystack |
| `/checkout` | Redirects to `/cart` |
| `/checkout/success` | Payment result; **Complete payment** if cancelled (`?pending=1`) |
| `/track` | Tracking ID + checkout email |
| `/contact` | Support links (edit placeholders in `src/lib/contact.ts`) |

## Contact placeholders

Before launch, replace values in [`src/lib/contact.ts`](src/lib/contact.ts) (`email`, `phoneDisplay`, `phoneE164`, `instagramHandle`).

## Brand

Gold `#AE7820` — `src/lib/brand.ts` and `src/app/globals.css` (`hek-*` tokens).

## Deploy

1. Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
2. Backend `CORS_ORIGINS` + `CLIENT_PUBLIC_URL` must match this site
3. Configure Paystack webhook to the API `/api/v1/webhooks/paystack`

## Build

```bash
npm run build
```
