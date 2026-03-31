# Security Audit Checklist

## Current Risks

1. Hardcoded admin credentials in frontend logic
2. Client-side storage is modifiable by end users
3. No centralized auth/session management
4. No backend-side validation in local mode

## Mitigations Completed

- Centralized sensitive constants in one config object (`APP_CONFIG`) for easier hardening and migration.
- Added optional backend scaffold (separate) for future JWT-based auth/API expansion.

## Recommended Next Hardening

1. Move auth to backend (JWT/session)
2. Store secrets in environment variables
3. Add request validation and rate limiting
4. Enforce HTTPS-only deployment
5. Add audit logging

## Audit Status

- Prototype academic app: acceptable with documented limitations
- Production readiness: requires backend auth and server-side data authority

