# Listing Ninja License Proxy

This repository contains the Vercel serverless API for Listing Ninja license verification.

Listing Ninja is a browser-facing app, so Gumroad API credentials must stay server-side. This proxy keeps `GUMROAD_ACCESS_TOKEN` in Vercel, forwards license checks to Gumroad, and returns a small response the app can trust:

```json
{
  "valid": true,
  "tier": "pro",
  "uses": 1,
  "message": "License activated for Pro."
}
```

## Files

- `api/verify-license.js` — Vercel serverless function that validates licenses with Gumroad.
- `vercel.json` — Vercel function configuration.
- `package.json` — Minimal project metadata and Vercel scripts.
- `DEPLOY.md` — Step-by-step GitHub and Vercel launch checklist.

## Required environment variables

Set these in Vercel under Project → Settings → Environment Variables:

| Variable | Purpose |
| --- | --- |
| `GUMROAD_ACCESS_TOKEN` | Gumroad API token used server-side only. |
| `GUMROAD_BASIC_PERMALINK` | Gumroad permalink slug for the Basic product. |
| `GUMROAD_PRO_PERMALINK` | Gumroad permalink slug for the Pro product. |

## Gumroad values

1. Sign in to Gumroad.
2. Go to Settings → Advanced → Applications, then create or copy an API access token.
3. Open each Listing Ninja product in Gumroad.
4. Copy the product permalink slug from the public product URL. For example, if the URL is `https://gumroad.com/l/listing-ninja-pro`, use `listing-ninja-pro`.
5. Put the Basic product slug in `GUMROAD_BASIC_PERMALINK` and the Pro product slug in `GUMROAD_PRO_PERMALINK`.

## Local development

```bash
vercel dev
```

Then send a POST request to `/api/verify-license` with JSON:

```json
{
  "license_key": "YOUR_LICENSE_KEY",
  "product_permalink": "listing-ninja-pro"
}
```

If `product_permalink` is omitted, the API tries the configured Pro permalink first, then Basic.

## GitHub status

The GitHub repository `benz862/ListingNinja` exists, but it is currently empty. Push this folder to that repository before importing the project in Vercel.

```bash
git remote add origin https://github.com/benz862/ListingNinja.git
git add .
git commit -m "Prepare Listing Ninja Vercel license proxy"
git push -u origin main
```

## Production endpoint

After Vercel is connected and `listingninja.app` is assigned to the project, use:

```text
https://listingninja.app/api/verify-license
```
