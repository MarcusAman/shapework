# Cloud Run Project Migration Guide — Transferring `shapework` to Shapework GCP Organization

This guide details how to transfer the Google Cloud project **`gen-lang-client-0248014985`** (Project # `745473217144`), which hosts the **`shapework`** Cloud Run service, from your personal account (`marcus.aman@gmail.com`) to your official **Shapework Google Cloud Organization**.

---

## Step 1: Add Shapework Account as Project Owner

1. Log into [Google Cloud Console IAM & Admin](https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0248014985) using your personal account (**`marcus.aman@gmail.com`**).
2. Verify project **`gen-lang-client-0248014985`** is selected in the top bar.
3. Click **+ GRANT ACCESS** at the top bar.
4. In **New principals**, enter your official **Shapework email address** (e.g. `marcus@shapework.com` or company admin account).
5. In **Select a role**, choose **Basic** > **Owner** (`roles/owner`).
6. Click **SAVE**.

---

## Step 2: Accept Project Co-Ownership

1. Log into your **Shapework email inbox**.
2. Open the email from Google Cloud titled *"Invitation to co-own gen-lang-client-0248014985"*.
3. Click **Accept Invitation**.

---

## Step 3: Move Project to Shapework Organization (Cloud Resource Manager)

1. Signed into GCP Console as your **Shapework account**, open [Cloud Resource Manager](https://console.cloud.google.com/cloud-resource-manager).
2. Locate project **`gen-lang-client-0248014985`** (named *"Default Gemini Project"*).
3. Check the checkbox next to `gen-lang-client-0248014985`.
4. Click **MOVE** at the top navigation bar.
5. Select your **Shapework Organization** (or target folder) and click **MOVE**.

---

## Step 4: Transfer Billing to Shapework Billing Account

1. In GCP Console, open [Billing](https://console.cloud.google.com/billing).
2. Select your **Shapework Corporate Billing Account**.
3. Click **Projects linked to this billing account** > **LINK A PROJECT**.
4. Select **`gen-lang-client-0248014985`** and click **SET ACCOUNT**.

---

## Step 5: (Optional) Remove Personal Account Privileges

1. In GCP IAM & Admin, find **`marcus.aman@gmail.com`** and remove Owner privileges once the Shapework account is co-owner and primary billing contact.

---

## Verification

After completing these steps:
- Your Cloud Run URL `https://shapework-745473217144.us-central1.run.app` remains **100% active with zero downtime**.
- Future deployments from `gcloud run deploy shapework --project=gen-lang-client-0248014985` will deploy directly under your Shapework organization.
