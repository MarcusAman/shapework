# shapework. Operations Inbox Specification

## Overview
The **Operations Inbox** serves as the nervous system for transaction coordinators, listing compliance staff, and operations administrators. It combines events from standard channels (Brokerage Gmail, Outlook, SMS, Secure-link uploads, Webhooks) into a single unified triage stream.

---

## Desktop Three-Pane Interface

### Left Pane: Triage Views
* Contains operational smart queues:
  * **Needs Attention**
  * **Needs Classification**
  * **Awaiting Approval**
  * **Waiting on Agent**
  * **Waiting on Third Party**
  * **Documents Received**
  * **Workflow Exceptions**
  * **Completed / Handled**

### Middle Pane: Item List Row
* Shows individual dispatch items. Each row displays:
  * Sender identity and profile avatar.
  * Communication channel (Email, SMS, Secure Link, Webhook).
  * Extracted transaction intent (e.g., "HOA disclosure attachment").
  * AI matching confidence level (e.g., "94% Match").
  * Assigned transaction/property name and urgency badge.

### Right Pane: Context & Evidence Detail
* Shows the deep details of the selected triage item:
  * Sourced original communication body (original email/text) and attachments.
  * AI-generated brief summary of the conversation.
  * Suggested transaction or property match with alternative recommendations if confidence is low.
  * Sourced workflow context, proposed task updates, and next actions.
  * Direct action buttons to approve, draft a follow-up, or reassign.

---

## The Communication-to-State Loop
No communication in shapework. is passive. Every email or message triggers a clear operational pipeline:
1. **Receive**: Read text, email, or webhook.
2. **Identify**: Resolve sender email/phone to a known Agent, Vendor, or Buyer/Seller.
3. **Match**: Link content to an active Property, Listing, or Transaction folder.
4. **Classify**: Determine intent (e.g., "Buyer wants extension").
5. **Extract**: Highlight key dates, dollar amounts, or milestones.
6. **Propose**: Draft response, schedule checklist tasks, or alert the coordinator.
7. **Authorize**: Human verifies and triggers external updates.
