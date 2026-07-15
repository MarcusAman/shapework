import { useState, useEffect, useCallback } from 'react';
import { OpsRequest, AssetInventoryItem, SOP, IntegrationConnection, AuditLog } from '../../server/headless/opsBlueprintTypes';

export function useBrokerageOpsState() {
  const [requests, setRequests] = useState<OpsRequest[]>([]);
  const [assets, setAssets] = useState<AssetInventoryItem[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Pilot simulation current active role
  const [currentUserRole, setCurrentUserRole] = useState<string>('regional_leader'); // Ryan by default
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('ryan@nestrealty.com');
  const [currentUserName, setCurrentUserName] = useState<string>('Ryan');
  const [activeTab, setActiveTab] = useState<string>('Overview');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchState = useCallback(async () => {
    setIsSyncing(true);
    try {
      const headers: Record<string, string> = {
        'x-workspace-id': 'nest-realty-demo',
        'x-user-role': currentUserRole,
        'x-user-email': currentUserEmail
      };

      // 1. Fetch requests
      const resReq = await fetch('/api/ops/requests', { headers });
      if (resReq.ok) {
        const data = await resReq.json();
        setRequests(data.requests || []);
      }

      // 2. Fetch assets
      const resAst = await fetch('/api/ops/assets', { headers });
      if (resAst.ok) {
        const data = await resAst.json();
        setAssets(data.assets || []);
      }

      // 3. Fetch SOPs
      const resSop = await fetch('/api/ops/sops', { headers });
      if (resSop.ok) {
        const data = await resSop.json();
        setSops(data.sops || []);
      }

      // 4. Fetch Integrations
      const resInt = await fetch('/api/ops/integrations', { headers });
      if (resInt.ok) {
        const data = await resInt.json();
        setIntegrations(data.integrations || []);
      }

      // 5. Fetch Audit Logs
      const resAudit = await fetch('/api/ops/audit-logs', { headers });
      if (resAudit.ok) {
        const data = await resAudit.json();
        setAuditLogs(data.auditLogs || []);
      }

    } catch (e) {
      console.error('Failed to load operations blueprint state:', e);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [currentUserRole, currentUserEmail]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Handle switching active persona in the simulation bar
  const handleSwitchUserRole = (role: string, email: string, name: string) => {
    setCurrentUserRole(role);
    setCurrentUserEmail(email);
    setCurrentUserName(name);
  };

  // Submit new request via smart intake form
  const submitRequest = async (formData: {
    title: string;
    description: string;
    urgency: 'low' | 'normal' | 'high' | 'urgent';
    deadline?: string;
    requesterName: string;
    requesterEmail: string;
    requesterRole: string;
    preferredChannel: string;
    linkedProperty?: string;
  }) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/ops/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to create operations request:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Update request properties (status, assign, escalate, notes, resolution summary)
  const updateRequest = async (
    requestId: string,
    updates: {
      status?: OpsRequest['status'];
      assignedOwner?: string;
      assignedRole?: string;
      notes?: string;
      resolutionSummary?: string;
      escalationLevel?: number;
    }
  ) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/ops/requests/${requestId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          ...updates,
          actorEmail: currentUserEmail,
          actorName: currentUserName
        })
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to update operations request:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Physical Asset checkout
  const checkoutAsset = async (assetId: string, agent: string, property: string, expectedReturnDate?: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/ops/assets/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          assetId,
          agent,
          property,
          expectedReturnDate,
          actorEmail: currentUserEmail,
          actorName: currentUserName
        })
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to check out physical asset:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Physical Asset checkin
  const checkinAsset = async (assetId: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/ops/assets/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          assetId,
          actorEmail: currentUserEmail,
          actorName: currentUserName
        })
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to check in physical asset:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Update physical asset status (missing/damaged)
  const updateAssetStatus = async (assetId: string, status: AssetInventoryItem['status']) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/ops/assets/${assetId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          status,
          actorEmail: currentUserEmail,
          actorName: currentUserName
        })
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to update asset status:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  // Toggle integration connection status
  const toggleIntegration = async (integrationId: string, newStatus: IntegrationConnection['status']) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/ops/integrations/${integrationId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'nest-realty-demo'
        },
        body: JSON.stringify({
          status: newStatus,
          actorEmail: currentUserEmail,
          actorName: currentUserName
        })
      });
      if (res.ok) {
        await fetchState();
        return true;
      }
    } catch (e) {
      console.error('Failed to toggle integration:', e);
    } finally {
      setIsSyncing(false);
    }
    return false;
  };

  return {
    requests,
    assets,
    sops,
    integrations,
    auditLogs,
    currentUserRole,
    currentUserEmail,
    currentUserName,
    activeTab,
    setActiveTab,
    isLoading,
    isSyncing,
    fetchState,
    handleSwitchUserRole,
    submitRequest,
    updateRequest,
    checkoutAsset,
    checkinAsset,
    updateAssetStatus,
    toggleIntegration
  };
}
