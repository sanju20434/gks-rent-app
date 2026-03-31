# GKS Rent Pro

GKS Rent Pro is a construction material rental management web app for handling clients, projects, inventory, billing, payments, deposits, WhatsApp communication, and QR-based payment workflows.

## Current Scope

- Client and project management
- Item master and stock tracking
- Material OUT/IN transactions and billing
- Payment and deposit tracking
- WhatsApp message templates (custom and total due)
- QR code generation and WhatsApp QR sharing
- Dashboard and client ledger
- Local storage persistence with optional Firestore sync hooks

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Tooling: Webpack, webpack-dev-server
- Storage: localStorage (default), optional Firebase Firestore integration points

## Run Locally

```bash
npm install
npm run start
```

Build production assets:

```bash
npm run build
```

## Project Structure

- `index.html` - UI and page layout
- `css/style.css` - styling
- `js/app.js` - complete application logic
- `webpack.*.js` - build/dev configuration
- `docs/` - submission and design documentation
- `backend/` - optional API/auth scaffold (not required for current UI flow)

## Deployment

Recommended:

- Source control: GitHub
- Frontend deployment: Vercel

Detailed deployment steps are in `docs/deployment-vercel.md`.

## Documentation for Academic Submission

See `docs/` for:

- user stories/use cases
- architecture and ERD
- testing plan
- security and performance notes
- report template

