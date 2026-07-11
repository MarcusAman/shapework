# Production Readiness & Security Risks

1. **Authentication (Guarded)**:
   * Production mode starts require AUTH_PROVIDER_CONFIGURED and DATABASE_URL. Plain text seeded tokens and query-string auth are rejected.
2. **Workspace Isolation (Guarded)**:
   * Users cannot access tenant context without a matching membership. Spoofing is blocked.
