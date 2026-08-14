# Dedicated Shapework GCP Project Setup & Deployment Guide

This guide details how to set up a brand-new, dedicated Google Cloud Project (**`shapework-production`**) under your official Shapework Google Cloud Organization and deploy **ONLY** the `shapework` application to it.

This keeps your personal GCP projects (**`folded-web`**, **`jupiter-api`**, **`jupiter-os`**, **`retailguard-ai`**) 100% separate in your personal account (`marcus.aman@gmail.com`).

---

## Step 1: Create Dedicated GCP Project (Shapework Console)

1. Open [Google Cloud Console](https://console.cloud.google.com/) signed in as your **Shapework account**.
2. Click the **Project Selector** dropdown at the top navigation bar.
3. Click **NEW PROJECT** at the top right of the modal.
4. Enter project details:
   - **Project Name**: `shapework-production`
   - **Organization**: Select your official **Shapework Organization**
5. Click **CREATE**.
6. Copy your generated **Project ID** (e.g., `shapework-production-458129`).

---

## Step 2: Enable Required GCP APIs

Run this command in terminal (replacing `YOUR_NEW_PROJECT_ID` with your project ID):

```bash
gcloud services enable run.googleapis.com build.googleapis.com artifactregistry.googleapis.com --project=YOUR_NEW_PROJECT_ID
```

*(Or in GCP Console: Go to **APIs & Services** > **Library** and enable **Cloud Run API**, **Cloud Build API**, and **Artifact Registry API**).*

---

## Step 3: Deploy Shapework to Dedicated Project

Run this command from your local terminal inside `/Users/marcusaman/Downloads/shapework (2)`:

```bash
gcloud run deploy shapework \
  --source . \
  --project=YOUR_NEW_PROJECT_ID \
  --region=us-central1 \
  --allow-unauthenticated
```

---

## Benefits of Dedicated Project Setup

| Feature | Personal Account (`gen-lang-client-0248014985`) | New Shapework Project (`shapework-production`) |
| :--- | :--- | :--- |
| **`folded-web`** | ✅ Remains in personal account | ❌ Isolated from Shapework |
| **`jupiter-api`** | ✅ Remains in personal account | ❌ Isolated from Shapework |
| **`jupiter-os`** | ✅ Remains in personal account | ❌ Isolated from Shapework |
| **`retailguard-ai`** | ✅ Remains in personal account | ❌ Isolated from Shapework |
| **`shapework`** | Deprecated / De-linked | ✅ Dedicated Corporate Cloud Run Service |
