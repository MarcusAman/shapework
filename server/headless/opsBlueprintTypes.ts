export interface UserMembership {
  id: string;
  userId: string;
  organizationId: string;
  regionId?: string;
  officeId?: string;
  roleId: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface OpsRequest {
  id: string;
  organizationId: string;
  regionId?: string;
  officeId?: string;
  title: string;
  description: string;
  category: 
    | 'agent_question'
    | 'compliance'
    | 'contract_transaction'
    | 'accounting_commissions'
    | 'payables_bills_receipts'
    | 'marketing_request'
    | 'listing_marketing'
    | 'agent_branding'
    | 'business_cards_print'
    | 'signs_riders'
    | 'lockboxes_keys'
    | 'office_supplies'
    | 'room_reservation'
    | 'vendor_maintenance'
    | 'event_support'
    | 'it_systems'
    | 'leadership_decision'
    | 'unknown_owner';
  subcategory?: string;
  source: 'dashboard' | 'email' | 'sms' | 'phone' | 'hallway' | 'rechat' | 'basecamp' | 'google_drive' | 'manual';
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  officeLocation?: string;
  assignedOwner?: string; // personName e.g. "Ann"
  assignedRole: string; // e.g. "operations_manager"
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'needs_info' | 'assigned' | 'in_progress' | 'waiting_on_requester' | 'waiting_on_vendor' | 'waiting_on_approval' | 'escalated' | 'completed' | 'closed';
  slaDueAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  escalationLevel: number;
  linkedAgent?: string;
  linkedProperty?: string;
  linkedListing?: string;
  linkedFiles?: string[];
  notes?: string;
  resolutionSummary?: string;
}

export interface OwnerRole {
  id: string;
  name: string; // role ID e.g. "operations_manager"
  personName: string; // e.g. "Ann"
  department: string;
  responsibilities: string[];
  notificationPreference: {
    email: boolean;
    sms: boolean;
    frequency: 'immediate' | 'daily_digest' | 'weekly';
  };
  escalationRules: string;
}

export interface AssetInventoryItem {
  id: string;
  organizationId: string;
  officeId?: string;
  assetType: 'yard_sign' | 'rider' | 'lockbox' | 'key' | 'open_house_kit' | 'flag' | 'brochure_box' | 'office_supply';
  label: string;
  assetCode: string;
  qrCodeValue: string;
  status: 'available' | 'checked_out' | 'overdue' | 'missing' | 'damaged' | 'retired';
  currentHolder?: string;
  assignedAgent?: string;
  linkedProperty?: string;
  officeLocation?: string;
  checkoutDate?: string;
  expectedReturnDate?: string;
  returnedDate?: string;
  replacementCost: number;
  notes?: string;
  lastKnownLocation?: string;
  gpsTrackerId?: string;
  cameraVerified?: boolean;
}

export interface SOP {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  ownerRole: string;
  trigger: string;
  steps: string[];
  sla: string;
  escalationPath: string;
  relatedCategories: string[];
}

export interface IntegrationConnection {
  id: string;
  organizationId: string;
  provider: 'Rechat' | 'Google Drive' | 'Google Calendar' | 'Gmail' | 'Basecamp' | 'QuickBooks' | 'Twilio' | 'Shapework' | 'Slack' | 'Microsoft Teams' | 'Dotloop/SkySlope/Brokermint' | 'Marketing Systems';
  status: 'not_connected' | 'planned' | 'stubbed' | 'connected';
  description: string;
  priority: 'low' | 'medium' | 'high';
  connectedAt?: string;
  lastSyncAt?: string;
  syncHealth?: 'healthy' | 'warning' | 'critical' | 'none';
  supportedActions?: string[];
  notes?: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actorUserId: string;
  actorName: string;
  action: 
    | 'request_created'
    | 'request_assigned'
    | 'request_status_changed'
    | 'request_escalated'
    | 'request_completed'
    | 'asset_checked_out'
    | 'asset_checked_in'
    | 'asset_marked_missing'
    | 'sop_created'
    | 'sop_approved'
    | 'integration_connected'
    | 'integration_sync_failed'
    | 'user_invited'
    | 'role_changed'
    | 'permission_denied';
  resourceType: string;
  resourceId: string;
  previousValue?: string;
  newValue?: string;
  metadata?: string;
  createdAt: string;
}

export interface CameraDevice {
  id: string;
  workspaceId: string;
  name: string;
  provider: 'tapo' | 'generic';
  locationName: string;
  status: 'connected' | 'stubbed' | 'needs_credentials' | 'live_relay_missing' | 'error' | 'not_configured';
  liveRelayUrl?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CameraEvent {
  id: string;
  workspaceId: string;
  cameraId: string;
  eventType: 'motion_detected' | 'manual_snapshot' | 'possible_checkout' | 'possible_checkin' | 'unmatched_activity' | 'asset_removed' | 'asset_returned';
  status: 'new' | 'needs_review' | 'confirmed' | 'rejected' | 'linked_to_asset' | 'archived';
  snapshotUrl: string;
  clipUrl?: string;
  confidence?: number;
  suggestedAction?: string;
  linkedAssetId?: string;
  linkedAgentName?: string;
  linkedProperty?: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface AssetLedgerEntry {
  id: string;
  workspaceId: string;
  assetId: string;
  action: 'checkout' | 'checkin' | 'marked_missing' | 'marked_damaged' | 'camera_observed';
  source: 'manual' | 'camera' | 'qr' | 'system';
  cameraEventId?: string;
  actorName: string;
  actorEmail?: string;
  agentName?: string;
  property?: string;
  createdAt: string;
  notes?: string;
}
