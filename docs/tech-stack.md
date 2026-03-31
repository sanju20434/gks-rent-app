# Tech Stack Selection

## Chosen Stack

- UI: HTML5, CSS3, JavaScript (ES6)
- Bundler: Webpack 5
- Dev Server: webpack-dev-server
- Storage: Browser localStorage
- Optional Sync Layer: Firebase Firestore hooks (already present in code)
- QR Generation: QRCode library + QR image endpoint
- Messaging: WhatsApp deep links (`wa.me`)

## Why This Stack

- Easy to run and demo on lab machines
- Low operational complexity
- Fast UI iteration without backend coupling
- Suitable for prototype/MVP and academic projects

## Trade-offs

- No strict backend validation in default mode
- localStorage is browser-scoped and not multi-user secure
- Authentication is basic and should be upgraded for production

## Future Upgrade Path

- Move persistence to backend API + managed DB
- Replace local login with JWT/Firebase Auth
- Add CI + automated tests in pipeline

