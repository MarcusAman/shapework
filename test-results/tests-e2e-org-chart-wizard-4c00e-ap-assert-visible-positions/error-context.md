# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e/org-chart-wizard.spec.ts >> Test 1: Navigate to /app/settings, click Visual Org Map, assert visible positions
- Location: tests/e2e/org-chart-wizard.spec.ts:49:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```