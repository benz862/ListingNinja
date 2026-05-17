# Listing Ninja Vercel Deployment Guide

This folder is ready to deploy as the Vercel project behind `listingninja.app`.

## Current status

- Domain purchased in Vercel: `listingninja.app`
- GitHub repository found: `benz862/ListingNinja`
- Repository status: code pushed to `main` on May 17, 2026
- Local project folder: `/Volumes/SkillBinder/FB-Lister-Vercel/`
- License verification endpoint in code: `https://api.gumroad.com/v2/licenses/verify`

## 1. GitHub is connected

This local folder has been initialized as a Git repository and pushed to:

```text
https://github.com/benz862/ListingNinja
```

If you make future edits, push them with:

```bash
git add .
git commit -m "Update Listing Ninja license proxy"
git push
```

## 2. Import the GitHub repo into Vercel

1. The Vercel CLI has linked this folder to project `listingninja`.
2. The Vercel project has been connected to GitHub repository `benz862/ListingNinja`.
3. In the Vercel dashboard, confirm the project uses framework preset Other.
4. Leave Build Command empty.
5. Leave Output Directory empty.
6. Click Deploy or Redeploy after environment variables are set.

Vercel will detect `api/verify-license.js` as a serverless function and expose it at `/api/verify-license`.

## 3. Add required environment variables

In Vercel, open the imported project and go to Settings → Environment Variables.

Add these variables for Production, Preview, and Development unless you intentionally want different test values:

| Variable | Example value | Notes |
| --- | --- | --- |
| `GUMROAD_ACCESS_TOKEN` | `YOUR_GUMROAD_TOKEN` | Keep secret. Never put this in browser code. |
| `GUMROAD_BASIC_PERMALINK` | `listing-ninja-basic` | Use the Basic Gumroad product slug. |
| `GUMROAD_PRO_PERMALINK` | `listing-ninja-pro` | Use the Pro Gumroad product slug. |

After adding or changing environment variables, redeploy the project so production uses the new values.

## 4. Connect `listingninja.app`

1. In Vercel, open the Listing Ninja project.
2. Go to Settings → Domains.
3. Add `listingninja.app` if it is not already attached.
4. Add `www.listingninja.app` if you want the `www` hostname too.
5. Because the domain was purchased through Vercel, DNS should be managed automatically in the account that owns the domain.
6. Set the preferred production domain to `listingninja.app`.

Note: the local Vercel CLI scope `glenn-donnellys-projects` could not access `listingninja.app`, so attach the domain from the Vercel account/team where the domain was purchased or switch the CLI to that scope first.

## 5. Verify the live API

Once the production deployment is live, the app should call:

```text
https://listingninja.app/api/verify-license
```

Test with a real license key:

```bash
curl -X POST https://listingninja.app/api/verify-license \
  -H 'Content-Type: application/json' \
  -d '{"license_key":"YOUR_LICENSE_KEY","product_permalink":"listing-ninja-pro"}'
```

A valid license returns:

```json
{
  "valid": true,
  "tier": "pro",
  "uses": 1,
  "message": "License activated for Pro."
}
```

## 6. Deployment checklist

- `api/verify-license.js` uses the real Gumroad verification URL.
- `GUMROAD_ACCESS_TOKEN` is set in Vercel only.
- `GUMROAD_BASIC_PERMALINK` and `GUMROAD_PRO_PERMALINK` match the Gumroad product slugs.
- `benz862/ListingNinja` has this code pushed to `main`.
- Vercel project imports from `benz862/ListingNinja`.
- `listingninja.app` points to the Vercel project.
- The Listing Ninja frontend uses `https://listingninja.app/api/verify-license`.
