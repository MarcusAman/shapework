# Google Review Request Safety

This document audits the post-closing Google Review request triggers, confirming strict adherence to neutral customer feedback collection practices.

---

## 1. Compliance Controls Checklist

- **No Private Rating Gate**: The system creates Google Review Request drafts for all closed transactions, without checking client satisfaction scores or gating requests based on positive feedback.
- **No Incentives**: Review emails contains no incentives, gifts, or discounts.
- **No Automatic Send**: Every Google Review Request must be explicitly approved in the Approvals Center.
- **Audit Trails**: Draft creation and manager authorization are logged in the audit ledger.

---

## 2. Neutral Copy Verification

The review request draft text is verified as neutral and non-leading:
```txt
Thank you for working with our team. If you have a moment, we would appreciate your feedback on your experience.

Google Review Link: https://g.page/nest-realty/review
```
No leading copy requesting "only 5-star feedback" or selective language is used.
