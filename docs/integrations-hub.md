# shapework. Integrations Hub Specification

## Overview
The **Integrations Hub** is the nervous system of shapework. It orchestrates and connects the diverse tech stacks used across different real estate brokerages, ensuring unified operational visibility regardless of the underlying platforms.

---

## Supported Integration Categories

### 1. Communication & Channels
* **Email providers**: Google Workspace, Microsoft Outlook, and custom inbound SMTP lines.
* **SMS & Voice**: Twilio, Telnyx, RingCentral, or mobile carrier bridges.
* **Internal Chat**: Slack and Microsoft Teams.

### 2. Transaction Management & e-Signatures
* **Transaction Compliance**: Rechat, Dotloop, SkySlope, kvCORE, Lofty, Follow Up Boss.
* **Signatures**: DocuSign, Adobe Sign, HelloSign.

### 3. File Storage & Calendars
* **Documents**: Google Drive, OneDrive, SharePoint, Box.
* **Scheduling**: Google Calendar, Outlook Calendar.

### 4. Ecosystem & Vendors
* **MLS/RESO integration**: Stream active property listings, price updates, and listing-readiness data.
* **Inspection, Title, and Escrow**: Connect local inspectors, closing attorneys, and earnest-money payment providers.

---

## Visual Design & Controls
* **Integration Card Grid**: Clear, modular layouts detailing connection health, last synchronization time, permissions, and synched records volume.
* **Troubleshooting and Resync**: Actions to reconnect, run diagnostics, test webhooks, or inspect recent errors.
* **Unified Concepts**: Where source systems differ, shapework. maps them to normalized concepts (Agent, Property, Transaction, Listing, Task, Milestone, Risk) while retaining original source system metadata for reference.
