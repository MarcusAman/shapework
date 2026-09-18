/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * NORA Office Supply Deduplication & Runaway Prevention Engine
 * 
 * Prevents the "72 cases of water" problem:
 * If multiple agents call in asking for office consumables (water, coffee, paper, cleaning supplies),
 * Nora consolidates subsequent requests into an existing open ticket for Ann Gunn (+1 requester),
 * rather than creating duplicate orders.
 */

export type SupplyCategory = 
  | 'bottled_water'
  | 'coffee_kcups'
  | 'printer_paper'
  | 'cleaning_supplies'
  | 'trash_bags'
  | 'lightbulbs'
  | 'office_snacks'
  | 'general_supplies';

export interface OfficeSupplyRequest {
  id: string;
  category: SupplyCategory;
  categoryLabel: string;
  office: string;
  assignedTo: string;
  assignedToRole: string;
  sopCode: string;
  status: 'open_scheduled' | 'in_transit' | 'fulfilled' | 'cancelled';
  scheduledDeliveryDate: string;
  scheduledDeliveryDayOfWeek: string;
  initialRequester: {
    agentName: string;
    agentRole: string;
    phone?: string;
    requestedAt: string;
  };
  additionalRequesters: Array<{
    agentName: string;
    agentRole: string;
    phone?: string;
    requestedAt: string;
  }>;
  totalRequestersCount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyCheckResult {
  isDuplicate: boolean;
  order: OfficeSupplyRequest;
  spokenMessage: string;
  totalRequestersCount: number;
  isNewTicketCreated: boolean;
}

const CATEGORY_DEFINITIONS: Record<SupplyCategory, { label: string; keywords: string[]; defaultItem: string }> = {
  bottled_water: {
    label: 'Office Bottled Water & Hydration Restock',
    keywords: ['water', 'bottled water', 'cases of water', 'case of water', 'drinking water', 'sparkling water', 'lacroix'],
    defaultItem: 'Cases of Bottled Spring Water (24-pack)'
  },
  coffee_kcups: {
    label: 'Coffee & Nespresso Station Supplies',
    keywords: ['coffee', 'kcup', 'k-cup', 'k cups', 'nespresso', 'creamer', 'sugar', 'filters', 'roast'],
    defaultItem: 'Dark Roast K-Cup Box (72ct) & Oat Milk Creamer'
  },
  printer_paper: {
    label: 'Copier & Marketing Print Paper (8.5x11 / 11x17)',
    keywords: ['paper', 'copy paper', 'printer paper', 'cardstock', 'ream', 'reams of paper'],
    defaultItem: 'Case of 24lb Bright White 8.5x11 Multipurpose Paper'
  },
  cleaning_supplies: {
    label: 'Office Disinfectant & Sanitation Supplies',
    keywords: ['cleaning', 'wipes', 'disinfectant', 'clorox', 'lysol', 'paper towels', 'hand sanitizer'],
    defaultItem: 'Disinfecting Wipes & Multi-Fold Paper Towels'
  },
  trash_bags: {
    label: 'Office Trash Can Liners',
    keywords: ['trash', 'trash bags', 'garbage bags', 'can liners', 'recycle bags'],
    defaultItem: '13-Gallon & 33-Gallon Heavy Duty Office Liners'
  },
  lightbulbs: {
    label: 'Conference Room & Lighting Replacements',
    keywords: ['light', 'lightbulb', 'lightbulbs', 'bulb', 'bulbs', 'flicker', 'led bulb'],
    defaultItem: 'Recessed Daylight LED Bulbs (6-pack)'
  },
  office_snacks: {
    label: 'Client Hospitality & Snack Basket',
    keywords: ['snacks', 'granola', 'bars', 'chips', 'candy', 'cookies', 'hospitality'],
    defaultItem: 'Healthy Snack Assortment & Bottled Sparkling Water'
  },
  general_supplies: {
    label: 'General Office & Desk Essentials',
    keywords: ['pens', 'notepads', 'sticky notes', 'staples', 'paper clips', 'folders', 'scissors'],
    defaultItem: 'General Office Consumables Package'
  }
};

export class OfficeSupplyDeduplicationService {
  private static activeOrders: Map<string, OfficeSupplyRequest> = new Map();

  /**
   * Builds unique composite key for an office supply item
   */
  private static buildKey(office: string, category: SupplyCategory): string {
    const cleanOffice = (office || 'Mayfaire').toLowerCase().trim();
    return `${cleanOffice}:${category}`;
  }

  /**
   * Detects the supply category from free-form transcript or request text
   */
  public static detectCategory(text: string): SupplyCategory {
    const lower = (text || '').toLowerCase();

    for (const [category, def] of Object.entries(CATEGORY_DEFINITIONS)) {
      for (const kw of def.keywords) {
        if (lower.includes(kw)) {
          return category as SupplyCategory;
        }
      }
    }

    return 'general_supplies';
  }

  /**
   * Checks if an order for this office supply item already exists.
   * If yes, consolidates and adds caller as +1 requester without duplicate tickets.
   * If no, creates a new order ticket assigned to Ann Gunn.
   */
  public static checkAndConsolidateSupplyRequest(params: {
    callerName: string;
    callerRole?: string;
    callerPhone?: string;
    office?: string;
    requestText: string;
    category?: SupplyCategory;
  }): SupplyCheckResult {
    const office = params.office || 'Mayfaire';
    const category = params.category || this.detectCategory(params.requestText);
    const def = CATEGORY_DEFINITIONS[category];
    const key = this.buildKey(office, category);

    const existingOrder = this.activeOrders.get(key);

    if (existingOrder && existingOrder.status === 'open_scheduled') {
      // 1. DUPLICATE DETECTED -> CONSOLIDATE
      const isAlreadyListed = 
        existingOrder.initialRequester.agentName.toLowerCase() === params.callerName.toLowerCase() ||
        existingOrder.additionalRequesters.some(r => r.agentName.toLowerCase() === params.callerName.toLowerCase());

      if (!isAlreadyListed) {
        existingOrder.additionalRequesters.push({
          agentName: params.callerName,
          agentRole: params.callerRole || 'REALTOR®',
          phone: params.callerPhone,
          requestedAt: new Date().toISOString()
        });
        existingOrder.totalRequestersCount = 1 + existingOrder.additionalRequesters.length;
        existingOrder.updatedAt = new Date().toISOString();
      }

      const spokenFirst = params.callerName.split(' ')[0] || 'there';
      const spokenMessage = `Got it, ${spokenFirst}. An order for ${def.label} at the ${office} office is already open with Ann Gunn and scheduled for delivery this ${existingOrder.scheduledDeliveryDayOfWeek}. I've noted that you requested it as well so Ann is aware of high office demand.`;

      return {
        isDuplicate: true,
        order: existingOrder,
        spokenMessage,
        totalRequestersCount: existingOrder.totalRequestersCount,
        isNewTicketCreated: false
      };
    }

    // 2. NO EXISTING ORDER -> CREATE NEW CONSOLIDATED TASK FOR ANN GUNN
    const nextDelivery = this.calculateNextScheduledDelivery();

    const newOrder: OfficeSupplyRequest = {
      id: `supp_${category}_${office.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category,
      categoryLabel: def.label,
      office,
      assignedTo: 'Ann Gunn',
      assignedToRole: 'Signs & Operations (ATC)',
      sopCode: 'SOP-OPS-001',
      status: 'open_scheduled',
      scheduledDeliveryDate: nextDelivery.isoDate,
      scheduledDeliveryDayOfWeek: nextDelivery.dayOfWeek,
      initialRequester: {
        agentName: params.callerName,
        agentRole: params.callerRole || 'REALTOR®',
        phone: params.callerPhone,
        requestedAt: new Date().toISOString()
      },
      additionalRequesters: [],
      totalRequestersCount: 1,
      notes: `${def.defaultItem} requested for ${office} office. Initial intake from ${params.callerName}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.activeOrders.set(key, newOrder);

    const spokenFirst = params.callerName.split(' ')[0] || 'there';
    const spokenMessage = `I've created an office restock request for ${def.label} at the ${office} office and assigned it to Ann Gunn. Expected delivery is this ${nextDelivery.dayOfWeek}.`;

    return {
      isDuplicate: false,
      order: newOrder,
      spokenMessage,
      totalRequestersCount: 1,
      isNewTicketCreated: true
    };
  }

  /**
   * Retrieves all active open supply orders
   */
  public static getActiveOrders(office?: string): OfficeSupplyRequest[] {
    const all = Array.from(this.activeOrders.values());
    if (office) {
      return all.filter(o => o.office.toLowerCase() === office.toLowerCase());
    }
    return all;
  }

  /**
   * Fulfills an order
   */
  public static fulfillOrder(orderId: string): boolean {
    for (const [key, order] of this.activeOrders.entries()) {
      if (order.id === orderId) {
        order.status = 'fulfilled';
        order.updatedAt = new Date().toISOString();
        return true;
      }
    }
    return false;
  }

  /**
   * Resets in-memory store for unit test isolation
   */
  public static clearOrders(): void {
    this.activeOrders.clear();
  }

  /**
   * Calculates the next standard office supply delivery date (e.g. Thursday)
   */
  private static calculateNextScheduledDelivery(): { isoDate: string; dayOfWeek: string } {
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 4 is Thu
    const daysUntilThursday = (4 - day + 7) % 7 || 7;
    const nextThu = new Date(today);
    nextThu.setDate(today.getDate() + (daysUntilThursday === 0 ? 7 : daysUntilThursday));

    return {
      isoDate: nextThu.toISOString().split('T')[0],
      dayOfWeek: 'Thursday'
    };
  }
}
