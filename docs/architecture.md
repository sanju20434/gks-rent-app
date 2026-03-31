# System Architecture

## High-level Components

1. **Presentation Layer**
   - Single-page interface in `index.html`
   - Styled via `css/style.css`
2. **Application Layer**
   - Business logic in `js/app.js` (`AppPro` object)
3. **Data Layer**
   - `DB` abstraction for localStorage
   - Optional Firestore sync path when configured
4. **External Services**
   - WhatsApp link opening (`wa.me`)
   - QR image generation endpoint

## Data Flow

1. User action from UI triggers `AppPro` handlers.
2. Handlers validate input and call `DB` methods.
3. `DB` persists and returns state.
4. UI lists/cards/tables are re-rendered.
5. Optional integrations (WhatsApp/QR) are invoked on demand.

## Non-functional Notes

- Offline-friendly in local mode
- No server dependency for core usage
- Fast local performance due to in-browser data access

