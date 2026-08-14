# Non-Admin Google OAuth 2.0 Web Client Setup Guide

This guide explains how to connect Google Workspace (Drive, Gmail, Calendar) to Shapework using a standard **OAuth 2.0 Web Application Client** without requiring Google Workspace Super Admin permissions.

---

## Step 1: Create OAuth 2.0 Web Client ID in Google Cloud Console

1. Log into your [Google Cloud Console](https://console.cloud.google.com/) for project **`neural-sol-502322-u2`**.
2. In the top search bar or left menu, navigate to **APIs & Services** > **Credentials**.
3. Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
4. Configure the application:
   - **Application type**: `Web application`
   - **Name**: `Shapework OS Web Application`
5. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `http://localhost:3000`
   - `https://shapework-os-45783991821.us-central1.run.app`
6. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   - `http://localhost:3000/api/integrations/google/callback`
   - `https://shapework-os-45783991821.us-central1.run.app/api/integrations/google/callback`
7. Click **CREATE**.
8. A modal will pop up with your **Client ID** (ends in `.apps.googleusercontent.com`) and **Client Secret**.

---

## Step 2: Configure OAuth Consent Screen

1. In the GCP Console, go to **APIs & Services** > **OAuth consent screen**.
2. User Type: Select **External** (or **Internal** if within your organization domain).
3. App Information:
   - **App name**: `Shapework Real Estate OS`
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **SAVE AND CONTINUE**.
5. Under **Scopes**, click **ADD OR REMOVE SCOPES** and select:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/gmail.send`
   - `.../auth/calendar.events.readonly`
   - `.../auth/drive.readonly`
6. Click **SAVE AND CONTINUE**.
7. Under **Test users** (if app is External & Testing), click **+ ADD USERS** and add your Google email address so you can sign in.

---

## Step 3: Configure Shapework Environment Variables

Add the following keys to your `.env` file (or deployment environment settings):

```env
GOOGLE_CLIENT_ID=your_oauth_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_oauth_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
APP_BASE_URL=http://localhost:3000
```

---

## Step 4: Authorize Google in Shapework

1. Open Shapework in your browser (`http://localhost:3000` or production URL).
2. Go to **Settings** > **System Gateways / Integrations**.
3. Click **Connect Google Workspace**.
4. Select your Google account and click **Allow** on the Google consent screen.
5. You will be redirected back to Shapework with an active, verified Google integration connection!
