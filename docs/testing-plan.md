# Unit and Integration Testing Plan

## Unit Test Targets

- Phone normalization logic
- Due calculation logic (monthly and total)
- Input validation helpers

## Integration Test Targets

- Client CRUD flow
- Item CRUD flow
- Transaction + payment updates reflected in outstanding due
- WhatsApp message generation for total due and custom modes
- QR generation and send flow validation

## Manual QA Checklist

- Add/remove clients and items
- Create project and booking
- Material OUT/IN cycle
- Payment entry updates outstanding values
- WhatsApp message preview updates correctly
- QR generated and WhatsApp link opens with message

## Suggested Tools (Future)

- Jest + jsdom (unit)
- Playwright/Cypress (E2E)

