# Environment Setup

## Prerequisites

- Node.js 18+
- npm 9+

## Setup Steps

1. Clone repository
2. Install dependencies:
   - `npm install`
3. Start local dev server:
   - `npm run start`
4. Build production bundle:
   - `npm run build`

## Optional Firebase Setup

The app contains Firestore sync hooks. If Firebase config is added in frontend runtime:

- `window.firebaseEnabled = true`
- `window.firestore = <firestore instance>`

then DB operations can sync to Firestore.

## Optional Backend Scaffold

An optional backend/auth scaffold is available in `backend/`.
It is not required for current app usage and does not alter existing frontend behavior.

