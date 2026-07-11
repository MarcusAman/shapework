# White Label Branding Safety Audit Report

## 1. Scope & Audited Files
* [`server/headless/headlessActionRouter.ts`](file:///Users/marcusaman/Downloads/shapework%20(2)/server/headless/headlessActionRouter.ts) (Branding routes)
* [`src/components/headless/HeadlessPortals.tsx`](file:///Users/marcusaman/Downloads/shapework%20(2)/src/components/headless/HeadlessPortals.tsx) (Logo & styling rendering)

---

## 2. Findings and Verification

### A. Sanitization and Script Injection Controls
* **Input Sanitization**: Branding inputs (`brokerageName`, `logoUrl`, `primaryColor`, `emailHeaderLogo`, `replyToEmail`, etc.) are validated before being saved to state.
* **XSS Defenses**: 
  * Logo images are rendered via React elements (`<img src={brand.logoUrl} />`), which automatically escapes and prevents injection of attributes like `onerror`.
  * Brand headers use CSS custom property injection securely.

### B. Logo/Branding URL Validation
* URL validation verifies that logo and email header logos are absolute URLs (`http://` or `https://`) or data URIs, preventing `javascript:` URI routing.
* Max file size and dimensions are recommended to maintain email client rendering quality.

---

## 3. Recommendations
* Ensure any custom logos loaded inside the app are served over HTTPS to avoid insecure content mixed-mode warnings in browser clients.
