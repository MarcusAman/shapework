# ASK NEST OPS — ELEVENLABS AGENT CONFIGURATION GUIDE
**Environment Scope:** Development & Pilot Scaffold  
**Agent Purpose:** Interactive WebRTC Voice Contract Copilot for Nest Realty Wilmington  

---

## 1. Overview & Setup Requirements

The ElevenLabs Contract Agent provides real-time WebRTC conversational intake. It executes client/server tools bound to a short-lived `VoiceAuthorizationToken` issued by `/api/contracts/intake-sessions/:sessionId/voice-token`.

---

## 2. Environment Variables

| Variable Name | Description | Example / Location |
| :--- | :--- | :--- |
| `ELEVENLABS_API_KEY` | ElevenLabs API Key (`xi-api-key`) | `.env` / Server Environment |
| `ELEVENLABS_AGENT_ID` | Agent ID for Contract Copilot Voice | `agent_3901kyk7pf3he52v8v9fp3m3bhd8` |
| `CONTRACT_VOICE_TOKEN_SECRET` | Secret key for signing voice authorization tokens | `.env` / Server Environment |

---

## 3. Tool Schemas for ElevenLabs Agent

### Tool 1: `get_contract_intake`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/get_contract_intake`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**: None

### Tool 2: `update_contract_terms`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/update_contract_terms`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "terms": {
        "type": "object",
        "properties": {
          "purchasePriceCents": { "type": "integer" },
          "dueDiligenceFeeCents": { "type": "integer" },
          "initialEarnestMoneyCents": { "type": "integer" },
          "offerDate": { "type": "string" },
          "dueDiligenceDate": { "type": "string" },
          "settlementDate": { "type": "string" },
          "financingCategory": { "type": "string", "enum": ["cash", "conventional", "fha", "va", "usda"] },
          "sellerConcessionCents": { "type": "integer" }
        }
      }
    }
  }
  ```

### Tool 3: `add_transaction_party`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/add_transaction_party`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "fullName": { "type": "string" },
      "role": { "type": "string", "enum": ["buyer", "seller"] }
    },
    "required": ["fullName"]
  }
  ```

### Tool 4: `update_property`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/update_property`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "streetAddress": { "type": "string" },
      "city": { "type": "string" },
      "postalCode": { "type": "string" }
    }
  }
  ```

### Tool 5: `confirm_contract_terms`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/confirm_contract_terms`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "explicitBrokerConfirmation": { "type": "boolean" }
    },
    "required": ["explicitBrokerConfirmation"]
  }
  ```

### Tool 6: `request_bic_review`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/request_bic_review`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**:
  ```json
  {
    "type": "object",
    "properties": {
      "reason": { "type": "string" }
    }
  }
  ```

### Tool 7: `request_mock_draft`
- **URL Endpoint**: `https://<app-domain>/api/contracts/voice-tools/request_mock_draft`
- **Method**: `POST`
- **Headers**: `x-voice-token: {{voice_token}}`
- **Parameters**: None

---

## 4. Authentication Flow Sequence

1. Authenticated broker clicks `Start Voice Draft` in Nest Ops Hub.
2. Nest Ops Hub calls `POST /api/contracts/intake-sessions/:sessionId/voice-token` with session JWT.
3. Server returns short-lived `voiceToken` bound to `userId`, `workspaceId`, `sessionId`, and `capability`.
4. Client passes `voiceToken` in headers for all tool invocations.
5. Server tool endpoints verify `voiceToken` and execute state mutations on the target `ContractIntakeSession`.
