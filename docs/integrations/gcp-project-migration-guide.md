# GCP Project Migration Guide — Transferring Project to Shapework Organization

This guide walks you through migrating your Google Cloud Console project (**`neural-sol-502322-u2`**) from your personal Google account to your official Shapework Google Cloud Organization.

---

## Step 1: Grant Owner Access to Official Shapework Account

1. Open [Google Cloud Console IAM & Admin](https://console.cloud.google.com/iam-admin/iam) while signed into your **personal account**.
2. Make sure project **`neural-sol-502322-u2`** is selected in the top navigation bar.
3. At the top of the IAM page, click **+ GRANT ACCESS** (or **ADD**).
4. In the **New principals** field, enter your official Shapework email address (e.g. `marcus@shapework.com` or your company admin account).
5. In the **Select a role** dropdown:
   - Search for and select **Basic** > **Owner** (`roles/owner`).
6. Click **SAVE**.

---

## Step 2: Accept Project Invitation & Access Project

1. Open your official **Shapework Google email inbox**.
2. Look for an email from Google Cloud with subject: *"Invitation to co-own neural-sol-502322-u2"*.
3. Click the **Accept Invitation** link.
4. Log into [Google Cloud Console](https://console.cloud.google.com/) using your official Shapework account.

---

## Step 3: Move Project into Shapework Organization (Cloud Resource Manager)

1. While signed in as your **Shapework account**, go to **IAM & Admin** > **Manage Resources** ([`https://console.cloud.google.com/cloud-resource-manager`](https://console.cloud.google.com/cloud-resource-manager)).
2. Locate project **`neural-sol-502322-u2`** in the list.
3. Check the checkbox next to `neural-sol-502322-u2`.
4. Click the **MOVE** button at the top bar.
5. In the modal, select your **Shapework Organization** (or folder destination) as the new parent organization.
6. Click **MOVE**.

---

## Step 4: Link Project to Shapework Billing Account

1. In Google Cloud Console, navigate to **Billing** ([`https://console.cloud.google.com/billing`](https://console.cloud.google.com/billing)).
2. Select your official **Shapework Billing Account**.
3. Go to **Projects linked to this billing account** > **LINK A PROJECT**.
4. Select project **`neural-sol-502322-u2`** and click **SET ACCOUNT**.

---

## Step 5: Remove Personal Account (Optional Cleanup)

1. Signed in as Shapework Owner, go back to **IAM & Admin** > **IAM**.
2. Find your **personal Google email address** in the principal list.
3. Click the pencil icon or trash icon next to your personal email to remove `Owner` privileges.
4. Click **SAVE**.

The GCP Project `neural-sol-502322-u2` is now 100% owned, managed, and billed by the official Shapework Organization!
