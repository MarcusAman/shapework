# Auth Consistency Audit after Console Split

## Objectives
Validate that cookie-based HttpOnly JWT sessions are enforced as the source of truth for user authentication under production settings, and that the staging/development bearer token bypass is fully locked down and strictly validated.

## Architecture & Enforcements
- **Cookie Auth**: Session-based credentials (`shapework_session` HttpOnly cookie) are required for all backend interactions in production.
- **Fail-Closed Verification**: The server checks that production authentication is configured.
- **Bearer Token Bypass**: Bearer tokens are strictly parsed in development mode. Any invalid token results in a `401 Unauthorized` response.
- **Header Credentials Inclusion**: All client state synchronizations and staff profile requests include `credentials: 'include'`.

## Verification Status
- **E2E Test File**: [auth-consistency-cookie-session.spec.ts](file:///Users/marcusaman/Downloads/shapework%20(2)/tests/e2e/auth-consistency-cookie-session.spec.ts)
- **Status**: PASSED
