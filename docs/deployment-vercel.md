# Cloud Deployment (GitHub + Vercel)

## Steps

1. Push project to GitHub repository.
2. Login to Vercel and click **Add New Project**.
3. Import the GitHub repository.
4. Framework preset: **Other** (or static).
5. Build command: `npm run build`
6. Output directory: `dist`
7. Deploy.

## Branch Strategy

- `main` -> production
- `dev` -> testing/staging

## Post-Deploy Checks

- Verify navigation works
- Verify client/item CRUD
- Verify WhatsApp link opening
- Verify QR generation and send flow

