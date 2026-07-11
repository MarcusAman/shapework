/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getBasecampConfig } from './basecampConfig.js';

export class BasecampClient {
  private accessToken: string;
  private accountId: string;
  private baseUrl: string;
  private userAgent: string;
  private isMockMode: boolean = false;

  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken;
    this.accountId = accountId;
    
    const config = getBasecampConfig();
    this.baseUrl = config.baseUrl;
    this.userAgent = config.userAgent;

    // Trigger mock mode if using mock token or in test environments
    this.isMockMode = process.env.BASECAMP_CLIENT_ID === 'mock_client_id' || 
                      process.env.NODE_ENV === 'test' || 
                      !process.env.BASECAMP_CLIENT_ID ||
                      accessToken === 'mock_access_token';
  }

  private async makeRequest(path: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/${this.accountId}${path}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'User-Agent': this.userAgent,
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Basecamp API request to ${path} failed with status ${response.status}: ${errBody}`);
    }

    return await response.json();
  }

  /**
   * Fetch all projects in the selected account
   */
  public async getProjects(): Promise<any[]> {
    if (this.isMockMode) {
      return [
        { id: 101, name: 'Marketing Launch Campaign', purpose: 'marketing' },
        { id: 102, name: 'Office Expansion & Renovations', purpose: 'office' },
        { id: 103, name: 'Compliance Operations Queue', purpose: 'compliance' }
      ];
    }
    return await this.makeRequest('/projects.json');
  }

  /**
   * Fetch people in the account
   */
  public async getPeople(): Promise<any[]> {
    if (this.isMockMode) {
      return [
        { id: 1, name: 'Sarah Jenkins', email_address: 'sarah.jenkins@shapework.ai' },
        { id: 2, name: 'Melissa Vance', email_address: 'melissa.vance@shapework.ai' },
        { id: 3, name: 'Sarah Jennings', email_address: 'owner@shapework.ai' }
      ];
    }
    return await this.makeRequest('/people.json');
  }

  /**
   * Fetch to-dos in a specific project (bucket)
   */
  public async getTodos(projectId: number): Promise<any[]> {
    if (this.isMockMode) {
      const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
      const nextWeekStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

      if (projectId === 101) {
        // Marketing Project
        return [
          {
            id: 201,
            title: 'Upload MLS photo proofs for 742 Evergreen Terrace',
            due_on: yesterdayStr, // Overdue!
            assignees: [{ id: 2, name: 'Melissa Vance' }],
            status: 'active',
            url: 'https://3.basecamp.com/46208/buckets/101/todos/201',
            created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() // Stuck (15 days old)
          },
          {
            id: 202,
            title: 'Design custom flyers for open house',
            due_on: null, // Lacks due date / unassigned
            assignees: [],
            status: 'active',
            url: 'https://3.basecamp.com/46208/buckets/101/todos/202',
            created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() // Stuck
          }
        ];
      }

      if (projectId === 102) {
        // Office Project
        return [
          {
            id: 203,
            title: 'Order new lockboxes for Austin office',
            due_on: null, // No due date
            assignees: [], // Unassigned!
            status: 'active',
            url: 'https://3.basecamp.com/46208/buckets/102/todos/203',
            created_at: new Date().toISOString()
          }
        ];
      }

      if (projectId === 103) {
        // Compliance Project
        return [
          {
            id: 204,
            title: 'Prepare broker compliance closing worksheets',
            due_on: nextWeekStr,
            assignees: [], // Unassigned!
            status: 'active',
            url: 'https://3.basecamp.com/46208/buckets/103/todos/204',
            created_at: new Date().toISOString()
          }
        ];
      }

      return [];
    }

    // In production Basecamp, to-dos are nested inside todosets -> todolists -> todos.
    // 1. Get the project details to find the todoset tool
    const project = await this.makeRequest(`/projects/${projectId}.json`);
    const todosetTool = project.dock?.find((d: any) => d.name === 'todos');
    if (!todosetTool) return [];

    // 2. Fetch todolists inside this todoset
    const todolists = await this.makeRequest(`/buckets/${projectId}/todosets/${todosetTool.id}/todolists.json`);
    
    // 3. For each todolist, fetch its active todos
    const allTodos: any[] = [];
    for (const list of todolists) {
      const listTodos = await this.makeRequest(`/buckets/${projectId}/todolists/${list.id}/todos.json`);
      allTodos.push(...listTodos);
    }

    return allTodos;
  }

  /**
   * Fetch recent messages / message board posts
   */
  public async getRecentMessages(projectId: number): Promise<any[]> {
    if (this.isMockMode) {
      if (projectId === 101) {
        return [
          {
            id: 501,
            subject: 'Re: MLS listing photo approvals',
            content: 'Melissa Vance, please note we need these photo proofs uploaded by tomorrow. @Sarah Jenkins please review the lease override contract.',
            creator: { name: 'Melissa Vance' },
            url: 'https://3.basecamp.com/46208/buckets/101/messages/501',
            created_at: new Date().toISOString()
          }
        ];
      }
      if (projectId === 102) {
        return [
          {
            id: 502,
            subject: 'Follow up with title company on wiring instructions',
            content: 'The closing company has not sent the earnest money wire receipt yet. We need a vendor follow-up.',
            creator: { name: 'Sarah Jenkins' },
            url: 'https://3.basecamp.com/46208/buckets/102/messages/502',
            created_at: new Date().toISOString()
          }
        ];
      }
      return [];
    }

    const project = await this.makeRequest(`/projects/${projectId}.json`);
    const boardTool = project.dock?.find((d: any) => d.name === 'message_board');
    if (!boardTool) return [];

    return await this.makeRequest(`/buckets/${projectId}/message_boards/${boardTool.id}/messages.json`);
  }

  /**
   * Fetch recent activity / events
   */
  public async getRecentEvents(): Promise<any[]> {
    if (this.isMockMode) {
      return [
        {
          id: 901,
          action: 'created a to-do item',
          title: 'Order signs',
          creator: { name: 'Sarah Jenkins' },
          created_at: new Date().toISOString()
        }
      ];
    }
    // GET /activities.json returns global events across the account
    return await this.makeRequest('/activities.json');
  }
}
