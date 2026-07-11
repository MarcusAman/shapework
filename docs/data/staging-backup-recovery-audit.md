# Staging Backup and Recovery Audit

This document outlines the backup, disaster recovery, and data preservation strategies for the relational databases of the shapework application.

---

## 1. Automated Database Backups
* **Frequency**: Automated daily backups are configured in Google Cloud SQL / Supabase.
* **Retention Policy**: 7 days of daily backups are retained by default.
* **Point-in-Time Recovery (PITR)**: Supported and enabled. Allows recovery up to any specific second within the retention window.

---

## 2. Recovery Verification Procedure

To restore data in the event of failure or data corruption:
1. Log in to the Cloud Console or database management console.
2. Select the backup snapshot corresponding to the target recovery timestamp.
3. Initiate a Restore to a new temporary database instance or overwrite the existing instance.
4. Verify workspace isolation boundaries:
   - Run SQL script asserting that no cross-tenant foreign key violations exist.
   - Run the E2E test suite against the restored instance.

---

## 3. Sensitive Field Handling
* Plaintext passwords are never exported or stored. All passwords reside as salted PBKDF2 hashes.
* Integrations credentials (API keys, tokens) are encrypted symmetrically via the Security Vault (`CREDENTIAL_ENCRYPTION_KEY`) before database persistence, ensuring backups do not leak sensitive credentials.
* System audit event logs are included in database backups to preserve forensic trails.
