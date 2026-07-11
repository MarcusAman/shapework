# Basecamp App Setup Guide

This document describes how to register and configure a new **Basecamp 3** integration app in the 37signals Launchpad.

---

## 1. Register App in 37signals Launchpad
1. Go to the [37signals Launchpad Integrations page](https://launchpad.37signals.com/integrations).
2. Log in with your Basecamp credentials.
3. Click on **"Register a new application"**.
4. Set the **Name** of the application (e.g. `shapework Brokerage Operating Layer`).
5. Set the **Company Name** (e.g. `shapework.ai`).
6. Set the **Website URL** (e.g. `https://shapework.ai`).

---

## 2. Configure Redirect URI
You must configure the exact redirect URIs matching your local and production environments. 37signals requires exact string matches for safety.

Set the **Redirect URIs** in Launchpad:
- **Local Development**:
  ```txt
  http://localhost:3000/api/integrations/basecamp/callback
  ```
- **Production Environment**:
  ```txt
  https://YOUR_DOMAIN.com/api/integrations/basecamp/callback
  ```

---

## 3. Retrieve Client Credentials
Upon successfully saving the integration in Launchpad, retrieve your client parameters:
- **Client ID** (`client_id`): Public identifier.
- **Client Secret** (`client_secret`): Secret string. Keep this private and secure.

---

## 4. Configure Environment Variables
Add the credentials to your server environment configuration (e.g. `.env` file):

```env
BASECAMP_CLIENT_ID=your_client_id_here
BASECAMP_CLIENT_SECRET=your_client_secret_here
BASECAMP_REDIRECT_URI=http://localhost:3000/api/integrations/basecamp/callback
BASECAMP_BASE_URL=https://3.basecampapi.com
BASECAMP_USER_AGENT=shapework (support@shapework.ai)
CREDENTIAL_ENCRYPTION_KEY=your_aes_encryption_key_here
BASECAMP_SYNC_LOOKBACK_DAYS=30
```
