import React, { useState, useEffect } from 'react';
import {
  Truck, Camera, Key, Plus, CheckCircle2, Clock, AlertTriangle,
  ExternalLink, Search, Filter, ShieldCheck, MapPin, Calendar,
  ArrowRight, X, Phone, RefreshCw, Eye, EyeOff, Sparkles, Building, ChevronRight,
  Mail, CreditCard, Receipt, Edit3, Trash2, UserCheck, DollarSign, Info
} from 'lucide-react';
import type { VendorOrderRecord, LockboxRecord, VendorDirectoryRecord } from '../../../server/persistence/vendorOrderRepository';

interface VendorDispatchHubProps {
  workspaceId?: string;
  onNavigateToSopRun?: (runId: string) => void;
}

export const VendorDispatchHub: React.FC<VendorDispatchHubProps> = ({
  workspaceId = 'nest-realty-wilmington',
  onNavigateToSopRun
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sign_post' | 'media' | 'lockbox' | 'vendors'>('all');
  const [orders, setOrders] = useState<VendorOrderRecord[]>([]);
  const [lockboxes, setLockboxes] = useState<LockboxRecord[]>([]);
  const [vendors, setVendors] = useState<VendorDirectoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncingSupra, setIsSyncingSupra] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('all');

  // Modals state
  const [showSignModal, setShowSignModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showLockboxAssignModal, setShowLockboxAssignModal] = useState(false);
  const [showAddLockboxModal, setShowAddLockboxModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDirectoryRecord | null>(null);
  const [selectedLockbox, setSelectedLockbox] = useState<LockboxRecord | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Form states
  const [signForm, setSignForm] = useState({
    propertyAddress: '',
    postType: 'White Colonial Vinyl 4x4',
    rider1: 'Coming Soon',
    rider2: 'None',
    brochureBox: true,
    specialInstructions: '',
    sopRunId: ''
  });

  const [mediaForm, setMediaForm] = useState({
    propertyAddress: '',
    packageTier: 'Pro Plus (HDR + Drone 4K + 2D Floor Plan)',
    requestedSlot: '',
    agentName: '',
    specialInstructions: '',
    sopRunId: ''
  });

  const [lockboxForm, setLockboxForm] = useState({
    propertyAddress: '',
    agentName: ''
  });

  const [addLockboxForm, setAddLockboxForm] = useState({
    serialNumber: '',
    model: 'Supra iBox BT LE',
    shackleCode: '',
    batteryLevel: 100,
    currentPropertyAddress: '',
    assignedAgentName: ''
  });

  const [vendorForm, setVendorForm] = useState({
    businessName: '',
    category: 'Signs & Post Installation',
    businessAddress: '',
    businessPhone: '',
    mainContactName: '',
    mainContactPhone: '',
    mainContactEmail: '',
    paymentTerms: 'net_account' as 'net_account' | 'pay_immediately',
    notes: '',
    isPreferred: true
  });

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const [ordersRes, lockboxesRes, vendorsRes] = await Promise.all([
        fetch(`/api/vendors/orders?workspaceId=${workspaceId}`),
        fetch(`/api/vendors/lockboxes?workspaceId=${workspaceId}`),
        fetch(`/api/vendors/directory?workspaceId=${workspaceId}`)
      ]);
      const ordersData = await ordersRes.json();
      const lockboxesData = await lockboxesRes.json();
      const vendorsData = await vendorsRes.json();

      setOrders(ordersData.success ? (ordersData.orders || []) : []);
      setLockboxes(lockboxesData.success ? (lockboxesData.lockboxes || []) : []);
      setVendors(vendorsData.success ? (vendorsData.vendors || []) : []);
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [workspaceId]);

  useEffect(() => {
    const handleOpenAdd = () => handleOpenAddVendorModal();
    const handleOpenSign = () => setShowSignModal(true);
    const handleOpenMedia = () => setShowMediaModal(true);

    window.addEventListener('open-add-vendor-modal', handleOpenAdd);
    window.addEventListener('open-order-sign-post', handleOpenSign);
    window.addEventListener('open-book-hdr-shoot', handleOpenMedia);

    return () => {
      window.removeEventListener('open-add-vendor-modal', handleOpenAdd);
      window.removeEventListener('open-order-sign-post', handleOpenSign);
      window.removeEventListener('open-book-hdr-shoot', handleOpenMedia);
    };
  }, []);

  const handleOpenAddVendorModal = (vendorToEdit?: VendorDirectoryRecord) => {
    if (vendorToEdit) {
      setEditingVendor(vendorToEdit);
      setVendorForm({
        businessName: vendorToEdit.businessName,
        category: vendorToEdit.category,
        businessAddress: vendorToEdit.businessAddress,
        businessPhone: vendorToEdit.businessPhone,
        mainContactName: vendorToEdit.mainContactName,
        mainContactPhone: vendorToEdit.mainContactPhone,
        mainContactEmail: vendorToEdit.mainContactEmail,
        paymentTerms: vendorToEdit.paymentTerms,
        notes: vendorToEdit.notes || '',
        isPreferred: vendorToEdit.isPreferred ?? true
      });
    } else {
      setEditingVendor(null);
      setVendorForm({
        businessName: '',
        category: 'Signs & Post Installation',
        businessAddress: '',
        businessPhone: '',
        mainContactName: '',
        mainContactPhone: '',
        mainContactEmail: '',
        paymentTerms: 'net_account',
        notes: '',
        isPreferred: true
      });
    }
    setShowAddVendorModal(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        // Update existing vendor
        const res = await fetch(`/api/vendors/directory/${editingVendor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            ...vendorForm
          })
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback(`✓ Updated ${vendorForm.businessName} successfully!`);
          fetchVendorData();
          setShowAddVendorModal(false);
        }
      } else {
        // Create new vendor
        const res = await fetch('/api/vendors/directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId,
            ...vendorForm
          })
        });
        const data = await res.json();
        if (data.success) {
          setActionFeedback(`✓ Added ${vendorForm.businessName} to approved vendor directory!`);
          fetchVendorData();
          setShowAddVendorModal(false);
        }
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
    }
  };

  const handleDeleteVendor = async (vendorId: string, businessName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${businessName} from the vendor directory?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/vendors/directory/${vendorId}?workspaceId=${workspaceId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`✓ Removed ${businessName} from vendor directory.`);
        fetchVendorData();
      }
    } catch (err) {
      console.error('Error deleting vendor:', err);
    }
  };

  // Dispatch Sign Post Order
  const handleDispatchSignPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors/orders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          vendorType: 'coastal_sign_post',
          propertyAddress: signForm.propertyAddress,
          sopRunId: signForm.sopRunId || undefined,
          sopStepNumber: signForm.sopRunId ? 3 : undefined,
          details: {
            postType: signForm.postType,
            rider1: signForm.rider1 !== 'None' ? signForm.rider1 : undefined,
            rider2: signForm.rider2 !== 'None' ? signForm.rider2 : undefined,
            brochureBox: signForm.brochureBox,
            specialInstructions: signForm.specialInstructions
          },
          cost: 75.00,
          createdBy: 'Operations Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSignModal(false);
        setSignForm({
          propertyAddress: '',
          postType: 'White Colonial Vinyl 4x4',
          rider1: 'Coming Soon',
          rider2: 'None',
          brochureBox: true,
          specialInstructions: '',
          sopRunId: ''
        });
        setActionFeedback(`Sign post work order #${data.order.vendorOrderId} dispatched to Coastal Sign Post Co.`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      }
    } catch (err) {
      console.error('Failed to dispatch sign post:', err);
    }
  };

  // Dispatch Media Shoot
  const handleDispatchMediaShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors/orders/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          vendorType: 'hdr_media',
          propertyAddress: mediaForm.propertyAddress,
          sopRunId: mediaForm.sopRunId || undefined,
          sopStepNumber: mediaForm.sopRunId ? 2 : undefined,
          details: {
            packageTier: mediaForm.packageTier,
            requestedSlot: mediaForm.requestedSlot,
            agentName: mediaForm.agentName,
            specialInstructions: mediaForm.specialInstructions
          },
          cost: 275.00,
          createdBy: mediaForm.agentName || 'Operations Desk'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowMediaModal(false);
        setMediaForm({
          propertyAddress: '',
          packageTier: 'Pro Plus (HDR + Drone 4K + 2D Floor Plan)',
          requestedSlot: '',
          agentName: '',
          specialInstructions: '',
          sopRunId: ''
        });
        setActionFeedback(`Media shoot #${data.order.vendorOrderId} scheduled with Cape Fear Real Estate Media.`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      }
    } catch (err) {
      console.error('Failed to book media shoot:', err);
    }
  };

  // Add Physical Lockbox to Fleet
  const handleAddLockbox = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors/lockboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          serialNumber: addLockboxForm.serialNumber.trim(),
          model: addLockboxForm.model,
          shackleCode: addLockboxForm.shackleCode.trim(),
          batteryLevel: addLockboxForm.batteryLevel,
          currentPropertyAddress: addLockboxForm.currentPropertyAddress.trim() || undefined,
          assignedAgentName: addLockboxForm.assignedAgentName.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddLockboxModal(false);
        setAddLockboxForm({
          serialNumber: '',
          model: 'Supra iBox BT LE',
          shackleCode: '',
          batteryLevel: 100,
          currentPropertyAddress: '',
          assignedAgentName: ''
        });
        setActionFeedback(`Lockbox #${data.lockbox.serialNumber} added to inventory!`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      } else {
        alert(data.error || 'Failed to add lockbox');
      }
    } catch (err) {
      console.error('Failed to add lockbox:', err);
    }
  };

  // Delete Lockbox from Fleet
  const handleDeleteLockbox = async (lockboxId: string, serialNumber: string) => {
    if (!window.confirm(`Are you sure you want to remove Lockbox #${serialNumber} from inventory?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/vendors/lockboxes/${lockboxId}?workspaceId=${workspaceId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Lockbox #${serialNumber} removed from inventory.`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      }
    } catch (err) {
      console.error('Failed to delete lockbox:', err);
    }
  };

  // Sync with Supra eKEY API
  const handleSyncSupra = async () => {
    try {
      setIsSyncingSupra(true);
      const res = await fetch('/api/vendors/lockboxes/sync-supra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });
      const data = await res.json();
      setActionFeedback(data.message || 'Supra sync completed.');
      setTimeout(() => setActionFeedback(null), 6000);
      await fetchVendorData();
    } catch (err) {
      console.error('Failed to sync Supra:', err);
      setActionFeedback('Supra sync request failed. Verify your network or credentials.');
    } finally {
      setIsSyncingSupra(false);
    }
  };

  // Assign Lockbox
  const handleAssignLockbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLockbox) return;
    try {
      const res = await fetch(`/api/vendors/lockboxes/${selectedLockbox.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress: lockboxForm.propertyAddress,
          agentName: lockboxForm.agentName
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowLockboxAssignModal(false);
        setSelectedLockbox(null);
        setLockboxForm({ propertyAddress: '', agentName: '' });
        setActionFeedback(`Lockbox #${data.lockbox.serialNumber} assigned to ${data.lockbox.currentPropertyAddress}.`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      }
    } catch (err) {
      console.error('Failed to assign lockbox:', err);
    }
  };

  // Release Lockbox
  const handleReleaseLockbox = async (lockboxId: string) => {
    try {
      const res = await fetch(`/api/vendors/lockboxes/${lockboxId}/release`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Lockbox #${data.lockbox.serialNumber} returned to office inventory.`);
        setTimeout(() => setActionFeedback(null), 4000);
        await fetchVendorData();
      }
    } catch (err) {
      console.error('Failed to release lockbox:', err);
    }
  };

  // Metrics
  const activeOrdersCount = orders.filter(o => o.vendorType !== 'coastal_sign_post' && o.status !== 'completed' && o.status !== 'cancelled').length;
  const mediaCompletedCount = orders.filter(o => o.vendorType === 'hdr_media' && o.status === 'completed').length;
  const lockboxesInFieldCount = lockboxes.filter(l => l.status === 'assigned_in_field').length;

  const filteredOrders = orders.filter(o => {
    if (o.vendorType === 'coastal_sign_post' || o.vendorName?.toLowerCase().includes('coastal sign post')) return false;
    if (activeTab === 'media' && o.vendorType !== 'hdr_media') return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.propertyAddress.toLowerCase().includes(q) ||
        o.vendorName.toLowerCase().includes(q) ||
        (o.vendorOrderId && o.vendorOrderId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredVendors = vendors.filter(v => {
    if (v.businessName?.toLowerCase().includes('coastal sign post')) return false;
    if (vendorCategoryFilter !== 'all' && !v.category.toLowerCase().includes(vendorCategoryFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.businessName.toLowerCase().includes(q) ||
        v.mainContactName.toLowerCase().includes(q) ||
        v.businessAddress.toLowerCase().includes(q) ||
        v.businessPhone.includes(q) ||
        v.mainContactPhone.includes(q) ||
        v.mainContactEmail.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        (v.notes && v.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left select-none font-sans">
      
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase flex items-center justify-between">
            <span>ACTIVE WORK ORDERS</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900">{activeOrdersCount}</span>
            <span className="text-xs text-stone-500 font-medium">In field / transit</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase flex items-center justify-between">
            <span>APPROVED VENDORS</span>
            <Building className="w-3.5 h-3.5 text-[#00635C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900">{filteredVendors.length}</span>
            <span className="text-xs text-stone-500 font-medium">Directory partners</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase flex items-center justify-between">
            <span>SUPRA LOCKBOXES</span>
            <Key className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-serif text-stone-900">{lockboxesInFieldCount}</span>
            <span className="text-xs text-stone-500 font-medium">of {lockboxes.length} in field</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & Quick Action Buttons */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Vendor Dispatches', count: filteredOrders.length },
            { id: 'media', label: 'HDR Media Shoots', count: filteredOrders.filter(o => o.vendorType === 'hdr_media').length },
            { id: 'lockbox', label: 'Supra Lockbox Fleet', count: lockboxes.length },
            { id: 'vendors', label: 'Vendor Directory', count: filteredVendors.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">

          <button
            onClick={() => setShowMediaModal(true)}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Book Shoot</span>
          </button>

          <button
            onClick={fetchVendorData}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0"
            title="Refresh vendor data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-stone-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: VENDOR DIRECTORY (ALL APPROVED VENDORS) */}
      {activeTab === 'vendors' ? (
        <div className="space-y-4">
          
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search vendors by business name, contact, phone, address, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={vendorCategoryFilter}
                onChange={(e) => setVendorCategoryFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                <option value="all">All Service Categories</option>
                <option value="Signs">Signs & Posts</option>
                <option value="Photography">Photography & Drone</option>
                <option value="Lockbox">Lockboxes</option>
                <option value="Inspection">Home Inspections</option>
                <option value="Pest">Pest & Termite (WDIR)</option>
                <option value="Septic">Septic & Water</option>
                <option value="Plumbing">Plumbing & Repairs</option>
                <option value="Cleaning">Cleaning & Staging</option>
              </select>

              <button
                onClick={() => handleOpenAddVendorModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vendor</span>
              </button>
            </div>
          </div>

          {/* Vendors Grid */}
          {filteredVendors.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-sm">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Building className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-stone-900">Vendor Directory is Empty</div>
              <p className="mt-1 max-w-md mx-auto text-stone-500">
                No vendor partners are currently listed. Add your approved local service partners (Sign installers, Photographers, Home Inspectors, Pest/WDIR, Repairs) to manage them in one place.
              </p>
              <button
                onClick={() => handleOpenAddVendorModal()}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Approved Vendor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header: Name + Preferred Badge + Category */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-stone-900">{vendor.businessName}</h3>
                          {vendor.isPreferred && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                              ★ Preferred
                            </span>
                          )}
                        </div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          {vendor.category}
                        </span>
                      </div>
                    </div>

                    {/* Business Address & Phone */}
                    <div className="space-y-1 text-xs text-stone-600">
                      {vendor.businessAddress && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{vendor.businessAddress}</span>
                        </div>
                      )}
                      {vendor.businessPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <a href={`tel:${vendor.businessPhone}`} className="text-[#00635C] hover:underline font-medium">
                            {vendor.businessPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Main Contact Card */}
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">MAIN CONTACT</span>
                        <span className="text-stone-900 font-semibold">{vendor.mainContactName || 'Operations Desk'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-600 pt-0.5">
                        {vendor.mainContactPhone && (
                          <a href={`tel:${vendor.mainContactPhone}`} className="flex items-center gap-1 text-stone-700 hover:text-stone-900">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{vendor.mainContactPhone}</span>
                          </a>
                        )}
                        {vendor.mainContactEmail && (
                          <a href={`mailto:${vendor.mainContactEmail}`} className="flex items-center gap-1 text-[#00635C] hover:underline truncate max-w-[150px]">
                            <Mail className="w-3 h-3 text-stone-400" />
                            <span className="truncate">{vendor.mainContactEmail}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Payment Terms Badge */}
                    <div>
                      {vendor.paymentTerms === 'net_account' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg font-medium">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span><strong>Payment Terms:</strong> Net Account ({vendor.paymentTermsLabel || 'Net 30'})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span><strong>Payment Terms:</strong> Pay Immediately ({vendor.paymentTermsLabel || 'Card on File'})</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed bg-stone-50/50 p-2 rounded-lg border border-stone-100">
                        {vendor.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenAddVendorModal(vendor)}
                        className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                        title="Edit vendor details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {vendor.category.toLowerCase().includes('sign') ? (
                      <button
                        onClick={() => setShowSignModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Truck className="w-3 h-3" />
                        <span>Dispatch Post</span>
                      </button>
                    ) : vendor.category.toLowerCase().includes('photo') || vendor.category.toLowerCase().includes('media') ? (
                      <button
                        onClick={() => setShowMediaModal(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00635C] hover:bg-[#00514B] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Book Shoot</span>
                      </button>
                    ) : (
                      <a
                        href={`tel:${vendor.businessPhone || vendor.mainContactPhone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-[11px] font-semibold transition-colors"
                      >
                        <Phone className="w-3 h-3 text-stone-500" />
                        <span>Call Vendor</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'lockbox' ? (
        /* VIEW 2: LOCKBOX FLEET VIEW */
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-stone-900">Supra eKEY Fleet Inventory</span>
              <span className="text-[11px] text-stone-500 font-medium">({lockboxes.length} total units)</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSyncSupra}
                disabled={isSyncingSupra}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupra ? 'animate-spin' : ''}`} />
                <span>{isSyncingSupra ? 'Syncing...' : 'Sync Supra eKEY'}</span>
              </button>

              <button
                onClick={() => setShowAddLockboxModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Lockbox</span>
              </button>
            </div>
          </div>

          {/* Lockbox Cards / Empty State */}
          {lockboxes.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Key className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-stone-900">No Lockboxes in Inventory</div>
              <p className="mt-1 max-w-md mx-auto text-stone-500">
                Your brokerage lockbox inventory is currently empty. You can add your physical Supra keyboxes manually using their serial numbers and shackle codes, or sync with the Supra eKEY API once configured.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setShowAddLockboxModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lockbox Manually</span>
                </button>
                <button
                  onClick={handleSyncSupra}
                  disabled={isSyncingSupra}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-xl shadow-2xs transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupra ? 'animate-spin' : ''}`} />
                  <span>Sync Supra eKEY</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lockboxes.map((lb) => {
                const isRevealed = revealedCodes[lb.id] || false;
                return (
                  <div
                    key={lb.id}
                    className={`p-4 bg-white rounded-xl border transition-all flex flex-col justify-between ${
                      lb.status === 'assigned_in_field'
                        ? 'border-emerald-200 shadow-sm'
                        : lb.status === 'maintenance'
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">{lb.serialNumber}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              lb.status === 'assigned_in_field'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lb.status === 'maintenance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {lb.status === 'assigned_in_field' ? 'In Field' : lb.status === 'maintenance' ? 'Low Battery' : 'In Office'}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">{lb.model}</div>
                        </div>

                        <div className="text-right flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${lb.batteryLevel < 30 ? 'text-amber-700 font-bold' : 'text-stone-600'}`}>
                            🔋 {lb.batteryLevel}%
                          </span>
                          <button
                            onClick={() => handleDeleteLockbox(lb.id, lb.serialNumber)}
                            className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove lockbox"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Shackle Code Reveal */}
                      <div className="mt-3.5 p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">SHACKLE CODE</div>
                          <div className="font-mono text-sm font-bold text-stone-900 mt-0.5">
                            {isRevealed ? lb.shackleCode : '••••'}
                          </div>
                        </div>
                        <button
                          onClick={() => setRevealedCodes(prev => ({ ...prev, [lb.id]: !isRevealed }))}
                          className="p-1.5 text-stone-500 hover:text-stone-900 transition-colors"
                          title={isRevealed ? 'Hide code' : 'Reveal shackle code'}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Assignment details */}
                      {lb.currentPropertyAddress ? (
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{lb.currentPropertyAddress}</span>
                          </div>
                          {lb.assignedAgentName && (
                            <div className="text-[11px] text-stone-500 pl-5">
                              Agent: <span className="font-semibold text-stone-700">{lb.assignedAgentName}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-stone-400 italic">
                          Currently available in office key safe.
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end">
                      {lb.status === 'assigned_in_field' ? (
                        <button
                          onClick={() => handleReleaseLockbox(lb.id)}
                          className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                        >
                          Return to Office
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedLockbox(lb);
                            setShowLockboxAssignModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Assign to Property
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 3: VENDOR DISPATCH ORDERS LIST */
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search orders by property, vendor, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                <option value="all">All Statuses</option>
                <option value="dispatched">Dispatched</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Orders Cards / Tab Specific Empty States */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs shadow-sm">
              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                {activeTab === 'sign_post' ? (
                  <Truck className="w-6 h-6 text-amber-600" />
                ) : activeTab === 'media' ? (
                  <Camera className="w-6 h-6 text-purple-600" />
                ) : (
                  <Truck className="w-6 h-6" />
                )}
              </div>
              <div className="font-bold text-sm text-stone-900">
                {activeTab === 'sign_post'
                  ? 'No Sign Posts Dispatched'
                  : activeTab === 'media'
                  ? 'No Media Shoots Scheduled'
                  : 'No Active Vendor Dispatches'}
              </div>
              <p className="mt-1 max-w-md mx-auto text-stone-500">
                {activeTab === 'sign_post'
                  ? 'No yard posts currently ordered. Dispatch a 4x4 vinyl post or estate metal post with custom riders for any active listing.'
                  : activeTab === 'media'
                  ? 'No real estate media shoots currently booked. Schedule HDR photography, 4K drone footage, or 2D floor plans.'
                  : 'There are currently no vendor work orders dispatched. Dispatch a yard post or book an HDR Media shoot above.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {(activeTab === 'all' || activeTab === 'sign_post') && (
                  <button
                    onClick={() => setShowSignModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Sign Post</span>
                  </button>
                )}
                {(activeTab === 'all' || activeTab === 'media') && (
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00514B] text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Book Media Shoot</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm hover:border-stone-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        order.vendorType === 'coastal_sign_post'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}>
                        {order.vendorType === 'coastal_sign_post' ? 'Coastal Sign Post' : 'HDR Media Shoot'}
                      </span>
                      <span className="font-mono text-xs font-bold text-stone-700">#{order.vendorOrderId || order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {order.status === 'completed' ? '✓ Completed' : order.status === 'confirmed' ? 'Scheduled' : order.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 truncate">{order.propertyAddress}</h3>

                    <div className="text-xs text-stone-500 flex items-center gap-3 flex-wrap">
                      <span>Vendor: <strong className="text-stone-700">{order.vendorName}</strong></span>
                      {order.cost && <span>Cost: <strong className="text-stone-700">${order.cost.toFixed(2)}</strong></span>}
                      {order.details?.rider1 && (
                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] text-stone-700 font-medium">
                          Rider: {order.details.rider1}
                        </span>
                      )}
                      {order.details?.packageTier && (
                        <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded text-[11px] font-medium">
                          {order.details.packageTier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side actions & proof */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {order.details?.photoProofUrl && (
                      <button
                        onClick={() => setPhotoPreviewUrl(order.details.photoProofUrl)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-500" />
                        <span>View Install Proof</span>
                      </button>
                    )}

                    {order.details?.mediaGalleryUrl && (
                      <a
                        href={order.details.mediaGalleryUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-xs font-semibold text-purple-800 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Media Gallery</span>
                      </a>
                    )}

                    {order.sopRunId && onNavigateToSopRun && (
                      <button
                        onClick={() => onNavigateToSopRun(order.sopRunId!)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>SOP Run</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ORDER SIGN POST */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">Dispatch Coastal Sign Post</h3>
              </div>
              <button onClick={() => setShowSignModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchSignPost} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  PROPERTY ADDRESS *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 518 Chestnut St, Wilmington NC"
                  value={signForm.propertyAddress}
                  onChange={(e) => setSignForm({ ...signForm, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    PRIMARY RIDER
                  </label>
                  <select
                    value={signForm.rider1}
                    onChange={(e) => setSignForm({ ...signForm, rider1: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Under Contract">Under Contract</option>
                    <option value="Open Saturday">Open Saturday</option>
                    <option value="Open Sunday">Open Sunday</option>
                    <option value="Pool">Pool</option>
                    <option value="Waterfront">Waterfront</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    POST STYLE
                  </label>
                  <select
                    value={signForm.postType}
                    onChange={(e) => setSignForm({ ...signForm, postType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="White Colonial Vinyl 4x4">White Colonial Vinyl 4x4</option>
                    <option value="Black Estate Metal 4x4">Black Estate Metal 4x4</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="brochureBox"
                  checked={signForm.brochureBox}
                  onChange={(e) => setSignForm({ ...signForm, brochureBox: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="brochureBox" className="text-xs text-stone-700 font-medium">
                  Attach clear outdoor brochure box ($0 / included)
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  INSTALLATION NOTES / PLACEMENT INSTRUCTIONS
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Place post to right of driveway near mailbox, avoid underground sprinkler line."
                  value={signForm.specialInstructions}
                  onChange={(e) => setSignForm({ ...signForm, specialInstructions: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="text-stone-500">Standard Installation Rate</span>
                <span className="text-stone-900 font-bold">$75.00</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BOOK MEDIA SHOOT */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-lg w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-600" />
                <h3 className="text-base font-bold text-stone-900">Book Real Estate Media Shoot</h3>
              </div>
              <button onClick={() => setShowMediaModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchMediaShoot} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  PROPERTY ADDRESS *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 518 Chestnut St, Wilmington NC"
                  value={mediaForm.propertyAddress}
                  onChange={(e) => setMediaForm({ ...mediaForm, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  PACKAGE TIER
                </label>
                <select
                  value={mediaForm.packageTier}
                  onChange={(e) => setMediaForm({ ...mediaForm, packageTier: e.target.value as any })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="Standard HDR (25 Photos)">Standard HDR (25 Photos) — $175</option>
                  <option value="Pro Plus (HDR + Drone 4K + 2D Floor Plan)">Pro Plus (HDR + Drone 4K + 2D Floor Plan) — $275</option>
                  <option value="Cinematic Estate (HDR + Drone Video + Twilight + 3D Scan)">Cinematic Estate (HDR + Drone Video + Twilight + 3D Scan) — $450</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    REQUESTED TIME SLOT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow 10:00 AM"
                    value={mediaForm.requestedSlot}
                    onChange={(e) => setMediaForm({ ...mediaForm, requestedSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    REQUESTING AGENT
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Listing Agent"
                    value={mediaForm.agentName}
                    onChange={(e) => setMediaForm({ ...mediaForm, agentName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  SPECIAL INSTRUCTIONS / ACCESS CODES
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Lockbox on front water spigot, gate code #4492."
                  value={mediaForm.specialInstructions}
                  onChange={(e) => setMediaForm({ ...mediaForm, specialInstructions: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Book Shoot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW LOCKBOX TO INVENTORY */}
      {showAddLockboxModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-stone-900">Add Lockbox to Fleet</h3>
              </div>
              <button onClick={() => setShowAddLockboxModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLockbox} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  SERIAL NUMBER *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUP-882910 or 3499210"
                  value={addLockboxForm.serialNumber}
                  onChange={(e) => setAddLockboxForm({ ...addLockboxForm, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    MODEL
                  </label>
                  <select
                    value={addLockboxForm.model}
                    onChange={(e) => setAddLockboxForm({ ...addLockboxForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Supra iBox BT LE">Supra iBox BT LE</option>
                    <option value="Supra iBox BT">Supra iBox BT</option>
                    <option value="Supra Mechanical Combo">Mechanical Combination</option>
                    <option value="SentriLock Bluetooth">SentriLock Bluetooth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    SHACKLE CODE *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4821"
                    value={addLockboxForm.shackleCode}
                    onChange={(e) => setAddLockboxForm({ ...addLockboxForm, shackleCode: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  CURRENT PROPERTY ADDRESS (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty if stored in office safe"
                  value={addLockboxForm.currentPropertyAddress}
                  onChange={(e) => setAddLockboxForm({ ...addLockboxForm, currentPropertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  ASSIGNED AGENT NAME (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agent on record"
                  value={addLockboxForm.assignedAgentName}
                  onChange={(e) => setAddLockboxForm({ ...addLockboxForm, assignedAgentName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLockboxModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ASSIGN LOCKBOX TO PROPERTY */}
      {showLockboxAssignModal && selectedLockbox && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-stone-900" />
                <h3 className="text-base font-bold text-stone-900">Assign Lockbox #{selectedLockbox.serialNumber}</h3>
              </div>
              <button onClick={() => setShowLockboxAssignModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignLockbox} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  TARGET PROPERTY ADDRESS *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 518 Chestnut St, Wilmington NC"
                  value={lockboxForm.propertyAddress}
                  onChange={(e) => setLockboxForm({ ...lockboxForm, propertyAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  ASSIGNED AGENT *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agent on record"
                  value={lockboxForm.agentName}
                  onChange={(e) => setLockboxForm({ ...lockboxForm, agentName: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">Shackle Release Code</div>
                <div className="font-mono text-sm font-bold text-stone-900">{selectedLockbox.shackleCode}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLockboxAssignModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: PHOTO PROOF PREVIEW */}
      {photoPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900">Installer Verification Photo Proof</span>
              <button onClick={() => setPhotoPreviewUrl(null)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden border border-stone-200">
              <img src={photoPreviewUrl} alt="Installer Proof" className="w-full h-64 object-cover" />
            </div>
            <div className="mt-3 text-right">
              <button
                onClick={() => setPhotoPreviewUrl(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD / EDIT APPROVED VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-xl w-full p-6 text-left animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#00635C]" />
                <h3 className="text-base font-bold text-stone-900">
                  {editingVendor ? `Edit Vendor: ${editingVendor.businessName}` : 'Add Approved Vendor'}
                </h3>
              </div>
              <button onClick={() => setShowAddVendorModal(false)} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="mt-4 space-y-3.5 text-xs">
              {/* Row 1: Business Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    VENDOR NAME (BUSINESS NAME) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coastal Sign Post Co."
                    value={vendorForm.businessName}
                    onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    SERVICE CATEGORY *
                  </label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="Signs & Post Installation">Signs & Post Installation</option>
                    <option value="Photography, Drone & 3D Virtual Tours">Photography, Drone & 3D Tours</option>
                    <option value="Lockbox Fleet & Electronic Access">Lockbox Fleet & Electronic Access</option>
                    <option value="Home & Structural Inspection">Home & Structural Inspection</option>
                    <option value="Pest Inspection & WDIR">Pest Inspection & WDIR (Termite)</option>
                    <option value="Septic & Water Quality Inspection">Septic & Water Quality Inspection</option>
                    <option value="Plumbing & General Repairs">Plumbing & General Repairs</option>
                    <option value="Cleaning & Staging">Cleaning & Staging</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Business Address & Business Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    BUSINESS ADDRESS
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3200 Wrightsville Ave, Wilmington NC"
                    value={vendorForm.businessAddress}
                    onChange={(e) => setVendorForm({ ...vendorForm, businessAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    BUSINESS PHONE NUMBER
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. (910) 791-3820"
                    value={vendorForm.businessPhone}
                    onChange={(e) => setVendorForm({ ...vendorForm, businessPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Section: Main Contact Person */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  PRIMARY CONTACT DETAILS
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    MAIN CONTACT PERSON
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dave Vance"
                    value={vendorForm.mainContactName}
                    onChange={(e) => setVendorForm({ ...vendorForm, mainContactName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      CONTACT PHONE NUMBER
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. (910) 619-4402"
                      value={vendorForm.mainContactPhone}
                      onChange={(e) => setVendorForm({ ...vendorForm, mainContactPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                      CONTACT EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. dave@coastalsignposts.com"
                      value={vendorForm.mainContactEmail}
                      onChange={(e) => setVendorForm({ ...vendorForm, mainContactEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Payment Terms */}
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  PAYMENT TERMS *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    vendorForm.paymentTerms === 'net_account'
                      ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="net_account"
                      checked={vendorForm.paymentTerms === 'net_account'}
                      onChange={() => setVendorForm({ ...vendorForm, paymentTerms: 'net_account' })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Net Account (Net 30)</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Invoiced monthly on 30-day corporate terms</div>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition ${
                    vendorForm.paymentTerms === 'pay_immediately'
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}>
                    <input
                      type="radio"
                      name="paymentTerms"
                      value="pay_immediately"
                      checked={vendorForm.paymentTerms === 'pay_immediately'}
                      onChange={() => setVendorForm({ ...vendorForm, paymentTerms: 'pay_immediately' })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-stone-900 text-xs flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pay Immediately</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">Charged directly to corporate card on file upon completion</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Row 4: Notes & Instructions */}
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  DISPATCH NOTES & INSTRUCTIONS
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions, gate codes, preferred time slots, or turnaround expectations..."
                  value={vendorForm.notes}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#00635C] hover:bg-[#00514B] text-white font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  {editingVendor ? 'Save Changes' : 'Add to Vendor Directory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VendorDispatchHub;
