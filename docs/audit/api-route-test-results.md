# API Route Integration Test Results

| Endpoint | Method | Expected Status | Actual Status | Passed | Exposes Secrets |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/db-state` | GET | 200 | 401 | ✗ | No |
| `/api/approvals` | GET | 200 | 200 | ✓ | No |
| `/api/audit` | GET | 200 | 401 | ✗ | No |
| `/api/jobs/health` | GET | 200 | 401 | ✗ | No |
| `/api/sync-runs` | GET | 200 | 401 | ✗ | No |
