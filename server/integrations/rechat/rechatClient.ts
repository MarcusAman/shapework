/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { tokenStore } from './rechatTokenStore';

export class RechatClient {
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private redirectUri: string | undefined;
  private apiBaseUrl: string;
  private appBaseUrl: string;
  private isSandbox: boolean;

  constructor() {
    this.clientId = process.env.RECHAT_CLIENT_ID;
    this.clientSecret = process.env.RECHAT_CLIENT_SECRET;
    this.redirectUri = process.env.RECHAT_REDIRECT_URI;
    this.apiBaseUrl = process.env.RECHAT_API_BASE_URL || 'https://api.rechat.com';
    this.appBaseUrl = process.env.RECHAT_APP_BASE_URL || 'https://rechat.com';
    // If client ID is missing, operate in secure Sandbox Mode
    this.isSandbox = !this.clientId;
  }

  public getIsSandbox(): boolean {
    return this.isSandbox;
  }

  public getAuthUrl(state: string): string {
    if (this.isSandbox) {
      // Mock OAuth server redirect URI
      return `/api/integrations/rechat/oauth/callback?code=mock_auth_code_12345&state=${state}&brand=mock_brand_nest_realty`;
    }
    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri!,
      response_type: 'code',
      state
    });
    return `${this.appBaseUrl}/oauth2/authorize?${params.toString()}`;
  }

  public async exchangeCodeForToken(code: string): Promise<{ accessToken: string; refreshToken: string; brandId: string }> {
    if (this.isSandbox) {
      console.log('[Rechat Client] [Sandbox] Exchanged mock code for tokens');
      return {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
        brandId: 'mock_brand_nest_realty'
      };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code',
          code
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Failed to exchange code: ${response.statusText}`);
      }

      const body = await response.json();
      return {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        brandId: body.brand || 'default_brand'
      };
    } catch (err: any) {
      console.error('[Rechat Client] Error exchanging token code:', err.message);
      throw err;
    }
  }

  public async refreshToken(connectionId: string): Promise<string> {
    const tokens = await tokenStore.getTokens(connectionId);
    if (!tokens) throw new Error('No tokens available for connection ' + connectionId);

    if (this.isSandbox) {
      const newAccess = 'mock_access_token_refreshed_' + Date.now();
      await tokenStore.saveTokens(connectionId, {
        ...tokens,
        accessToken: newAccess
      });
      return newAccess;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const body = await response.json();
      await tokenStore.saveTokens(connectionId, {
        accessToken: body.access_token,
        refreshToken: body.refresh_token || tokens.refreshToken,
        brandId: tokens.brandId,
        expiresAt: Date.now() + (body.expires_in || 3600) * 1000
      });
      return body.access_token;
    } catch (err: any) {
      console.error('[Rechat Client] Refresh token failed:', err.message);
      throw err;
    }
  }

  // API Methods
  public async getDeal(dealId: string): Promise<any> {
    if (this.isSandbox) {
      const deals = await this.filterDeals({});
      return deals.find(d => d.id === dealId) || null;
    }
    return this.makeRequest(`/deals/${dealId}`);
  }

  public async filterDeals(query: any): Promise<any[]> {
    if (this.isSandbox) {
      return [
        {
          id: 'deal_woodlawn',
          title: '109 Woodlawn Close',
          deal_type: 'Buying',
          stage: 'under_contract',
          status: 'Active',
          property_address: '109 Woodlawn Ave, Wilmington, NC 28403',
          closing_date: '2026-07-15T00:00:00Z',
          contract_date: '2026-06-20T00:00:00Z',
          list_price: 540000,
          sales_price: 535000,
          brand: 'mock_brand_nest_realty',
          roles: [
            { role: 'Buyer', legal_first_name: 'Arthur', legal_last_name: 'Pendragon', email: 'arthur@camelot-demo.local', phone_number: '512-555-9081' },
            { role: 'Agent', legal_first_name: 'Emma', legal_last_name: 'Watson', email: 'emma@nest-demo.local' }
          ],
          context: {
            intakeFormCompleted: true,
            complianceChecklistId: 'chk_woodlawn_123',
            commissionDetails: '3% split',
            transactionFileId: 'file_woodlawn_pdf'
          }
        },
        {
          id: 'deal_colonial',
          title: '908 Colonial Ave Lease',
          deal_type: 'Lease',
          stage: 'under_contract',
          status: 'Active',
          property_address: '908 Colonial Ave, Wilmington, NC 28403',
          closing_date: null,
          contract_date: '2026-06-18T00:00:00Z',
          list_price: 3200,
          sales_price: 3200,
          brand: 'mock_brand_nest_realty',
          roles: [
            { role: 'Tenant', legal_first_name: 'Lancelot', legal_last_name: 'DuLac', email: 'lancelot@lake-demo.local', phone_number: '512-555-1234' }
          ],
          context: {
            intakeFormCompleted: false,
            complianceChecklistId: null,
            commissionDetails: null,
            transactionFileId: null
          }
        }
      ];
    }
    return this.makeRequest('/deals');
  }

  public async getContact(contactId: string): Promise<any> {
    if (this.isSandbox) {
      const contacts = await this.filterContacts({});
      return contacts.find(c => c.id === contactId) || null;
    }
    return this.makeRequest(`/contacts/${contactId}`);
  }

  public async filterContacts(query: any): Promise<any[]> {
    if (this.isSandbox) {
      return [
        {
          id: 'contact_arthur',
          display_name: 'Arthur Pendragon',
          first_name: 'Arthur',
          last_name: 'Pendragon',
          email: 'arthur@camelot-demo.local',
          phone_number: '512-555-9081',
          user: 'mock_user_ Watson',
          tags: ['Lead', 'Warm']
        },
        {
          id: 'contact_lancelot',
          display_name: 'Lancelot DuLac',
          first_name: 'Lancelot',
          last_name: 'DuLac',
          email: 'lancelot@lake-demo.local',
          phone_number: '512-555-1234',
          user: 'mock_user_Watson',
          tags: ['Tenant']
        }
      ];
    }
    return this.makeRequest('/contacts');
  }

  public async getTask(taskId: string): Promise<any> {
    if (this.isSandbox) {
      return {
        id: taskId,
        title: 'Schedule Photography',
        description: 'Verify photography session timings with client.',
        status: 'PENDING',
        task_type: 'Todo',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        assignees: ['mock_user_Watson'],
        deal: 'deal_woodlawn'
      };
    }
    return this.makeRequest(`/crm/tasks/${taskId}`);
  }

  public async searchTasks(params: any): Promise<any[]> {
    if (this.isSandbox) {
      return [
        {
          id: 'task_photo_schedule',
          title: 'Schedule Photography',
          description: 'Verify photography session timings with client.',
          status: 'PENDING',
          task_type: 'Todo',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignees: ['mock_user_Watson'],
          deal: 'deal_woodlawn'
        },
        {
          id: 'task_appraisal_alert',
          title: 'Appraisal Inspection reminder',
          description: 'Confirm appraisal inspection dates with attorney.',
          status: 'DONE',
          task_type: 'Call',
          due_date: new Date().toISOString(),
          assignees: ['mock_user_Watson'],
          deal: 'deal_colonial'
        }
      ];
    }
    return this.makeRequest('/crm/tasks');
  }

  public async createTask(payload: any): Promise<any> {
    if (this.isSandbox) {
      console.log('[Rechat Client] [Sandbox] Created mock task:', payload);
      return {
        id: 'task_mock_created_' + Date.now(),
        ...payload,
        status: 'PENDING',
        lastSyncedAt: new Date().toISOString()
      };
    }
    return this.makeRequest('/crm/tasks', 'POST', payload);
  }

  public async updateTask(taskId: string, payload: any): Promise<any> {
    if (this.isSandbox) {
      console.log('[Rechat Client] [Sandbox] Updated mock task:', taskId, payload);
      return {
        id: taskId,
        ...payload,
        lastSyncedAt: new Date().toISOString()
      };
    }
    return this.makeRequest(`/crm/tasks/${taskId}`, 'PUT', payload);
  }

  public async addTaskAssociation(taskId: string, associationPayload: any): Promise<any> {
    if (this.isSandbox) {
      console.log('[Rechat Client] [Sandbox] Associated mock task:', taskId, associationPayload);
      return { status: 'success' };
    }
    return this.makeRequest(`/crm/tasks/${taskId}/associations`, 'POST', associationPayload);
  }

  public async getCalendarEvents(params: any): Promise<any[]> {
    if (this.isSandbox) {
      return [
        {
          id: 'cal_event_closing',
          title: 'Escrow Room Closing: Woodlawn',
          timestamp: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
    return this.makeRequest('/calendar');
  }

  // Webhooks Management
  public async createBrandWebhook(brandId: string, topic: string, url: string): Promise<any> {
    if (this.isSandbox) {
      return { id: 'mock_webhook_' + topic.toLowerCase(), topic, url, brand: brandId };
    }
    return this.makeRequest(`/brands/${brandId}/webhooks`, 'POST', { topic, url });
  }

  public async listBrandWebhooks(brandId: string, topic?: string): Promise<any[]> {
    if (this.isSandbox) {
      return [
        { id: 'mock_webhook_deals', topic: 'Deals', url: 'https://shapework-os.a.run.app/api/integrations/rechat/webhook', brand: brandId },
        { id: 'mock_webhook_contacts', topic: 'Contacts', url: 'https://shapework-os.a.run.app/api/integrations/rechat/webhook', brand: brandId },
        { id: 'mock_webhook_showings', topic: 'Showings', url: 'https://shapework-os.a.run.app/api/integrations/rechat/webhook', brand: brandId }
      ];
    }
    return this.makeRequest(`/brands/${brandId}/webhooks`);
  }

  public async deleteBrandWebhook(brandId: string, webhookId: string): Promise<any> {
    if (this.isSandbox) {
      return { status: 'deleted' };
    }
    return this.makeRequest(`/brands/${brandId}/webhooks/${webhookId}`, 'DELETE');
  }

  // Safe request helper with token injection, timeout, and redacted logs
  private async makeRequest(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
    // Inject access token from local store (uses 'rechat_connection' connectionId as default)
    const tokens = await tokenStore.getTokens('rechat_connection');
    if (!tokens) {
      throw new Error('Unauthorized Rechat access. Please connect your account.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json'
    };

    const redactedHeaders = { ...headers, 'Authorization': 'Bearer [REDACTED]' };
    console.log(`[Rechat Client] Outbound ${method} request to ${path}`, {
      headers: redactedHeaders,
      body: body ? '[REDACTED_PAYLOAD]' : undefined
    });

    try {
      const response = await fetch(`${this.apiBaseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10000)
      });

      if (response.status === 401) {
        // Attempt token refresh
        console.log('[Rechat Client] Unauthorized status code (401). Triggering token refresh...');
        const newAccessToken = await this.refreshToken('rechat_connection');
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        // Retry request
        const retryResponse = await fetch(`${this.apiBaseUrl}${path}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: AbortSignal.timeout(10000)
        });

        if (!retryResponse.ok) {
          throw new Error(`Rechat API returned ${retryResponse.status} after token refresh.`);
        }
        return await retryResponse.json();
      }

      if (!response.ok) {
        throw new Error(`Rechat API returned ${response.status}: ${response.statusText}`);
      }

      if (method === 'DELETE' || response.status === 204) {
        return { status: 'success' };
      }

      return await response.json();
    } catch (err: any) {
      console.error(`[Rechat Client] Error on ${method} ${path}:`, err.message);
      throw err;
    }
  }
}

export const rechatClient = new RechatClient();
