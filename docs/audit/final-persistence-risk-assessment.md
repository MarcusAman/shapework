# final-persistence-risk-assessment.md

## 1. Core Persistence Audit Questions & Answers

| # | Question | Answer | Details |
| :--- | :--- | :--- | :--- |
| **1** | Which storage driver is active in production-like mode? | **`local`** | Set by `STORAGE_DRIVER=local` in the environment. |
| **2** | Is it `local`, `memory`, or `database`? | **`local`** | Express reads/writes to a JSON file on disk. |
| **3** | If `database`, what database is actually used? | **None** | No external database is active. |
| **4** | Does the database driver write to Supabase/Postgres or is it mocked? | **Mocked** | The Supabase initialization script exists, but no repository implements actual SQL or tables queries. |
| **5** | Does data survive server restart? | **Yes** | Saved to `data/db.json`, which is parsed on startup. |
| **6** | Does data survive deployment restart? | **No (under standard containers)** | Cloud containers (e.g. Google Cloud Run, Heroku, Render) reset the local filesystem on deployment redeploys. |
| **7** | Does data survive container replacement? | **No** | Ephemeral filesystems discard `data/db.json` on container swap. |
| **8** | Is `/data/db.json` being used? | **Yes** | Serves as the primary JSON flat-file storage database. |
| **9** | Is `/data/db.json` safe for a real hosted deployment? | **No** | Lacks locking, concurrent write protection, and high-availability backups. |
| **10**| What data loss risk exists? | **High** | Risk of total data loss if the server container is replaced, scaled down, or redeployed. |

---

## 2. Risk Classification

Due to local flat-file storage and mocked Supabase client repositories:

**`controlled pilot only`**

This database tier is **NOT ready** for full production or public customer usage.

---

## 3. Mitigation Requirements

* **Backup & Reset Checks**: A daily export of `data/db.json` must be manually downloaded or archived by shapework operators.
* **Persistent Volumes**: If hosted on cloud environments, the path `data/` must be mapped to a persistent volume (e.g., AWS EBS, Google Cloud Filestore, Fly.io persistent volumes) to survive container recycles.
* **Live DB migration**: A real PostgreSQL/Supabase driver must be fully implemented before opening self-serve customer registrations.
