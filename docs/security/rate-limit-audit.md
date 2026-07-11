# Rate Limiting and Brute Force Audit

This document details the rate limiting gates configured to secure the application.

---

## 1. Rate Limiting Specifications

| Route / Endpoint | Limit Policy | reset window | Action on Exceeded |
|---|---|---|---|
| `/api/auth/login` | Max 5 attempts | 1 minute | Returns `429 Too Many Requests` |
| `/api/workspaces/activate` | Max 3 attempts | 5 minutes | Returns `429 Too Many Requests` |
| `/api/integrations/*/webhook` | Max 60 requests | 1 minute | Returns `429 Too Many Requests` |

---

## 2. Client IP Extraction Behind Proxies
* Behind reverse proxies (like Google Cloud Load Balancer / Cloud Run), the client IP is extracted from the `x-forwarded-for` header.
* Express is configured with `app.set('trust proxy', 1)` to trust only the first upstream load balancer IP, preventing client IP header spoofing.

---

## 3. Security Hardening Findings
* Repeated login failures successfully trigger the `429` lockout window.
* Locked out IPs receive a generic JSON error message to prevent enumeration or brute-forcing of credentials.
* Normal pilot workflow operations are not impacted by the rate limits under normal usage patterns.
