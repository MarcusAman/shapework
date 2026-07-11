import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, User, Plus, Trash2, Check, Play, Share2, FileText, ArrowRight,
  Shield, AlertTriangle, Layers, BookOpen, Link, Settings, Info, Search,
  ChevronRight, ChevronLeft, HelpCircle, File, Folder, Download, Eye, Sparkles, CheckCircle
} from 'lucide-react';
import { 
  orgChartService, OrgPosition, OrgRole, OrgSop, OrgConnection, EscalationPolicy, RoutingMatrixItem, OrgModel, OrgKnowledgeDocument, OrgKnowledgeStatus, OrgKnowledgeSourceType, DEFAULT_KNOWLEDGE_DOCUMENTS, OrgPositionStatus, AvatarCropSettings, OrgLogicNode
} from '../../services/orgChartService';

interface OrgAvatarProps {
  name: string;
  avatarUrl?: string;
  avatarCrop?: AvatarCropSettings;
  size?: number;
  className?: string;
}

export function OrgAvatar({ name, avatarUrl, avatarCrop, size = 40, className = '' }: OrgAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const hasAvatar = avatarUrl && !imgError;

  const defaultCrop: AvatarCropSettings = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    cropShape: 'circle'
  };

  const crop = avatarCrop || defaultCrop;

  const shapeClass = 
    crop.cropShape === 'square' ? 'rounded-none' :
    crop.cropShape === 'rounded' ? 'rounded-xl' :
    'rounded-full';

  const scaleFactor = size / 200;
  const tx = (crop.x || 0) * scaleFactor;
  const ty = (crop.y || 0) * scaleFactor;

  return (
    <div
      className={`${shapeClass} flex items-center justify-center font-bold text-white font-mono shrink-0 select-none overflow-hidden relative ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(8, Math.floor(size * 0.35))}px`,
        backgroundColor: hasAvatar ? 'transparent' : '#00635C',
        border: '1px solid rgba(246, 247, 241, 0.18)'
      }}
    >
      {hasAvatar ? (
        <img
          src={avatarUrl}
          alt={`${name} profile image`}
          onError={() => setImgError(true)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `translate(-50%, -50%) translate(${tx}px, ${ty}px) scale(${crop.scale || 1}) rotate(${crop.rotation || 0}deg)`,
            transformOrigin: 'center center'
          }}
          className="transition-all duration-75"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

interface AvatarCropEditorProps {
  avatarUrl: string;
  name: string;
  initialCrop?: AvatarCropSettings;
  onSave: (crop: AvatarCropSettings) => void;
  onCancel: () => void;
}
export function AvatarCropEditor({ avatarUrl, name, initialCrop, onSave, onCancel }: AvatarCropEditorProps) {
  const [crop, setCrop] = useState<AvatarCropSettings>(
    initialCrop || { x: 0, y: 0, scale: 1, rotation: 0, cropShape: 'circle' }
  );

  const handleZoom = (amount: number) => {
    setCrop(prev => ({
      ...prev,
      scale: Math.max(0.75, Math.min(3.0, Math.round((prev.scale + amount) * 100) / 100))
    }));
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
    setCrop(prev => {
      let dx = prev.x;
      let dy = prev.y;
      if (direction === 'up') dy -= amount;
      if (direction === 'down') dy += amount;
      if (direction === 'left') dx -= amount;
      if (direction === 'right') dx += amount;
      return { ...prev, x: dx, y: dy };
    });
  };

  const handleRotate = (amount: number) => {
    setCrop(prev => ({
      ...prev,
      rotation: ((prev.rotation || 0) + amount) % 360
    }));
  };

  const handleReset = () => {
    setCrop({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      cropShape: 'circle'
    });
  };

  const shapeClass = 
    crop.cropShape === 'square' ? 'rounded-none' :
    crop.cropShape === 'rounded' ? 'rounded-2xl' :
    'rounded-full';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-md bg-[#013028] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-left">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h4 className="text-xs font-serif font-black text-white uppercase tracking-wider">
            Edit Avatar Position & Crop
          </h4>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large preview frame */}
        <div className="flex justify-center items-center py-6 bg-black/20 rounded-2xl border border-white/5 relative overflow-hidden">
          <div 
            className={`w-[200px] h-[200px] relative border-2 border-emerald-500/50 shadow-inner overflow-hidden bg-[#00635C] ${shapeClass}`}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${name} cropping preview`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: `translate(-50%, -50%) translate(${crop.x || 0}px, ${crop.y || 0}px) scale(${crop.scale || 1}) rotate(${crop.rotation || 0}deg)`,
                  transformOrigin: 'center center'
                }}
                className="transition-all duration-75"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50 font-mono text-sm font-bold">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Shape selector */}
        <div className="flex flex-col gap-2 text-xs text-[#D0D6BB]">
          <span className="text-[9px] font-bold font-mono uppercase tracking-wider block text-white/50">Crop Frame Shape</span>
          <div className="flex gap-2">
            {(['circle', 'rounded', 'square'] as const).map(shape => (
              <button
                key={shape}
                type="button"
                onClick={() => setCrop(prev => ({ ...prev, cropShape: shape }))}
                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  crop.cropShape === shape
                    ? 'bg-[#00635C] border-emerald-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        {/* Controls Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Movement controls */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold font-mono uppercase text-[#D0D6BB] block text-white/50">Position</span>
            <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
              <div />
              <button
                type="button"
                onClick={() => handleMove('up', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Up"
              >
                ▲
              </button>
              <div />

              <button
                type="button"
                onClick={() => handleMove('left', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Left"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[9px] font-bold"
                title="Reset Position"
              >
                ↺
              </button>
              <button
                type="button"
                onClick={() => handleMove('right', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Right"
              >
                ▶
              </button>

              <div />
              <button
                type="button"
                onClick={() => handleMove('down', 5)}
                className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg flex items-center justify-center cursor-pointer text-[10px]"
                title="Move Down"
              >
                ▼
              </button>
              <div />
            </div>
          </div>

          {/* Zoom & Rotation controls */}
          <div className="flex flex-col gap-3 font-mono text-[10px]">
            <div>
              <span className="text-[9px] font-bold uppercase text-[#D0D6BB] block mb-1">Zoom</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleZoom(-0.05)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg cursor-pointer text-xs"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(0.05)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg cursor-pointer text-xs"
                  title="Zoom In"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold uppercase text-[#D0D6BB] block mb-1">Rotate</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleRotate(-15)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg cursor-pointer"
                >
                  ↺ -15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(15)}
                  className="flex-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg cursor-pointer"
                >
                  🗘 +15°
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-3 border-t border-white/10 pt-4 font-mono text-[10px] uppercase">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded-xl transition-colors cursor-pointer text-center font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(crop)}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20 rounded-xl transition-all cursor-pointer text-center font-bold"
          >
            Save Crop
          </button>
        </div>
      </div>
    </div>
  );
}


interface OrgChartWizardPageProps {
  onClose?: () => void;
  state: any;
  fullPage?: boolean;
  embeddedTab?: 'visual' | 'guided';
}

export default function OrgChartWizardPage({ onClose, state, embeddedTab }: OrgChartWizardPageProps) {
  const workspaceId = state.workspaceId || 'nest-realty-demo';
  const workspaceName = workspaceId === 'nest-realty-demo' ? 'Nest Realty' : 'Workspace';

  // --- CORE STATE ---
  const [model, setModel] = useState<OrgModel>({
    positions: [],
    roles: [],
    sops: [],
    connections: [],
    escalationPolicies: [],
    routingMatrix: [],
    knowledgeDocuments: []
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [posStepFilter, setPosStepFilter] = useState<'all' | 'active' | 'open' | 'planned' | 'virtual_ai'>('all');

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'guided' | 'visual' | 'routing' | 'export'>(() => {
    if (embeddedTab) return embeddedTab;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab');
      if (tabParam === 'visual' || tabParam === 'guided' || tabParam === 'routing' || tabParam === 'export') {
        return tabParam as any;
      }
      if (window.location.hash === '#export') {
        return 'export';
      }
    }
    return 'guided';
  });

  useEffect(() => {
    if (embeddedTab) {
      setActiveTab(embeddedTab);
    }
  }, [embeddedTab]);

  // Visual Map Canvas States
  const [pan, setPan] = useState({ x: 100, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [activeViewMode, setActiveViewMode] = useState<'org' | 'workflow' | 'position'>('org');
  const [selectedElement, setSelectedElement] = useState<{ type: 'position' | 'role' | 'sop' | 'escalation' | 'logic_split' | 'intake_trigger' | 'connection'; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'reporting' | 'roles' | 'escalations' | 'sops'>('reporting');
  const [showReportingLines, setShowReportingLines] = useState(true);
  const [showEscalationLines, setShowEscalationLines] = useState(true);
  const [showSopLines, setShowSopLines] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showOpenRoles, setShowOpenRoles] = useState(true);
  const [showPlannedRoles, setShowPlannedRoles] = useState(true);
  const [showVirtualAi, setShowVirtualAi] = useState(true);
  const [planningMode, setPlanningMode] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleFitView = () => {
    // Filter positions based on checkbox filters
    const visible = model.positions.filter(p => {
      const status = p.status || 'active';
      if (status === 'active' && !showActive) return false;
      if (status === 'open' && !showOpenRoles) return false;
      if (status === 'planned' && !showPlannedRoles) return false;
      if (status === 'wanted' && !showPlannedRoles) return false;
      if (status === 'fractional' && !showActive) return false;
      if (status === 'outsourced' && !showActive) return false;
      if (status === 'virtual_ai' && !showVirtualAi) return false;
      return true;
    });

    if (visible.length === 0) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    visible.forEach(p => {
      const x = p.x ?? 100;
      const y = p.y ?? 100;
      if (x < minX) minX = x;
      if (x + 280 > maxX) maxX = x + 280; // cardWidth is 280
      if (y < minY) minY = y;
      if (y + 150 > maxY) maxY = y + 150;
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    let containerWidth = 900;
    let containerHeight = 600;
    if (canvasContainerRef.current) {
      const clientW = canvasContainerRef.current.clientWidth;
      const clientH = canvasContainerRef.current.clientHeight;
      if (clientW > 0 && clientH > 0) {
        containerWidth = clientW;
        containerHeight = clientH;
      }
    }

    const padding = 60;
    const zX = (containerWidth - padding * 2) / boundsWidth;
    const zY = (containerHeight - padding * 2) / boundsHeight;
    const newZoom = Math.min(2.0, Math.max(0.5, Math.min(zX, zY)));

    const centerX = minX + boundsWidth / 2;
    const centerY = minY + boundsHeight / 2;
    const newPan = {
      x: containerWidth / 2 - centerX * newZoom,
      y: containerHeight / 2 - centerY * newZoom
    };

    setPan(newPan);
    setZoom(newZoom);
  };

  useEffect(() => {
    if (activeTab === 'visual' && model.positions.length > 0) {
      const needsLayout = model.positions.some(
        p => p.x === undefined || p.y === undefined || (p.x === 0 && p.y === 0)
      );
      if (needsLayout) {
        handleAutoLayout();
      } else {
        setTimeout(() => {
          handleFitView();
        }, 120);
      }
    }
  }, [activeTab, model.positions.length]);

  // Synchronize coordinates for roles, SOPs, escalations, logic nodes if they don't have them in Workflow mode
  useEffect(() => {
    if (activeTab === 'visual' && activeViewMode === 'workflow') {
      let updated = false;
      const newModel = { ...model };

      if (!newModel.logicNodes) {
        newModel.logicNodes = [];
      }

      newModel.logicNodes = newModel.logicNodes.map((ln, idx) => {
        if (ln.x === undefined || ln.y === undefined || (ln.x === 0 && ln.y === 0)) {
          updated = true;
          return { ...ln, x: 200, y: 150 + idx * 180 };
        }
        return ln;
      });

      newModel.sops = newModel.sops.map((sop, idx) => {
        if (sop.x === undefined || sop.y === undefined || (sop.x === 0 && sop.y === 0)) {
          updated = true;
          const ownerPos = newModel.positions.find(p => p.id === sop.ownerPositionId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...sop, x: px + 320, y: py + (idx % 3) * 120 };
        }
        return sop;
      });

      newModel.escalationPolicies = newModel.escalationPolicies.map((esc, idx) => {
        if (esc.x === undefined || esc.y === undefined || (esc.x === 0 && esc.y === 0)) {
          updated = true;
          const ownerPos = newModel.positions.find(p => p.id === esc.fromPositionId || p.id === esc.escalateToPositionId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...esc, x: px - 320, y: py + (idx % 3) * 120 };
        }
        return esc;
      });

      newModel.roles = newModel.roles.map((role, idx) => {
        if (role.x === undefined || role.y === undefined || (role.x === 0 && role.y === 0)) {
          updated = true;
          const ownerPos = newModel.positions.find(p => p.id === role.positionId);
          const px = ownerPos?.x ?? 500;
          const py = ownerPos?.y ?? 300;
          return { ...role, x: px, y: py + 180 + (idx % 2) * 100 };
        }
        return role;
      });

      if (updated) {
        setModel(newModel);
        orgChartService.saveOrgChart(workspaceId, newModel);
      }
    }
  }, [activeTab, activeViewMode, model.positions.length]);

  // Dragging states
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, x_val: 0, y_val: 0 });

  // Connection overlay/drawer states
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionDrawerOpen, setConnectionDrawerOpen] = useState(false);
  const [connFrom, setConnFrom] = useState('');
  const [connTo, setConnTo] = useState('');
  const [connType, setConnType] = useState<'reporting' | 'escalation' | 'sop' | 'ownership'>('reporting');
  const [connLabel, setConnLabel] = useState('');
  const [connCondition, setConnCondition] = useState('');
  const [connWindow, setConnWindow] = useState('24 hours');
  const [connSops, setConnSops] = useState<string[]>([]);
  const [connEscalations, setConnEscalations] = useState<string[]>([]);

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // SVG Line curve helper
  const getCurvePath = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  };

  // Canvas interaction moves
  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const canvasBound = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - canvasBound.left;
    const mouseY = e.clientY - canvasBound.top;

    if (draggedNodeId) {
      const newX = Math.round((mouseX - pan.x) / zoom - dragStartOffset.x);
      const newY = Math.round((mouseY - pan.y) / zoom - dragStartOffset.y);
      
      const newModel = { ...model };
      let found = false;
      
      newModel.positions = newModel.positions.map(p => {
        if (p.id === draggedNodeId) {
          found = true;
          return { ...p, x: newX, y: newY };
        }
        return p;
      });
      
      if (!found) {
        newModel.roles = newModel.roles.map(r => {
          if (r.id === draggedNodeId) {
            found = true;
            return { ...r, x: newX, y: newY };
          }
          return r;
        });
      }
      
      if (!found) {
        newModel.sops = newModel.sops.map(s => {
          if (s.id === draggedNodeId) {
            found = true;
            return { ...s, x: newX, y: newY };
          }
          return s;
        });
      }
      
      if (!found) {
        newModel.escalationPolicies = newModel.escalationPolicies.map(e => {
          if (e.id === draggedNodeId) {
            found = true;
            return { ...e, x: newX, y: newY };
          }
          return e;
        });
      }
      
      if (!found && newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.map(ln => {
          if (ln.id === draggedNodeId) {
            found = true;
            return { ...ln, x: newX, y: newY };
          }
          return ln;
        });
      }
      
      setModel(newModel);
      setHasChanges(true);
      setSaveStatus('idle');
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan({ x: panStart.x_val + dx, y: panStart.y_val + dy });
    }
  };

  // Auto layout tree algorithm
  const handleAutoLayout = () => {
    const nodes = [...model.positions];
    if (nodes.length === 0) return;

    const depths: Record<string, number> = {};
    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (depths[id] !== undefined) return depths[id];
      if (visited.has(id)) return 0;
      visited.add(id);

      const node = nodes.find(n => n.id === id);
      if (!node || !node.reportsToPositionId) {
        depths[id] = 0;
        return 0;
      }
      const d = 1 + getDepth(node.reportsToPositionId, visited);
      depths[id] = d;
      return d;
    };

    nodes.forEach(n => getDepth(n.id));

    const groups: Record<number, string[]> = {};
    nodes.forEach(n => {
      const d = depths[n.id] || 0;
      if (!groups[d]) groups[d] = [];
      groups[d].push(n.id);
    });

    const updatedPositions = nodes.map(node => {
      const d = depths[node.id] || 0;
      const nodesAtLevel = groups[d] || [];
      const idx = nodesAtLevel.indexOf(node.id);
      
      const levelWidth = 800;
      const spacing = nodesAtLevel.length > 1 ? levelWidth / (nodesAtLevel.length - 1) : 0;
      const startX = nodesAtLevel.length > 1 ? 150 : 500;
      
      const x = nodesAtLevel.length > 1 ? startX + idx * spacing : 500;
      const y = 80 + d * 220;

      return {
        ...node,
        x,
        y
      };
    });

    markChanged({
      ...model,
      positions: updatedPositions
    });
  };

  // Apply template helper
  const applyTemplate = (templateName: string) => {
    if (model.positions.length > 0) {
      if (!confirm("This will replace or add template positions to your current model. Existing positions will not be deleted. Do you want to proceed?")) {
        return;
      }
    }
    const templateModel = orgChartService.getTemplate(templateName, workspaceId);
    
    const mergedPositions = [...model.positions];
    templateModel.positions.forEach(tp => {
      if (!mergedPositions.some(p => p.id === tp.id)) {
        mergedPositions.push(tp);
      }
    });

    const mergedRoles = [...model.roles];
    templateModel.roles.forEach(tr => {
      if (!mergedRoles.some(r => r.id === tr.id)) {
        mergedRoles.push(tr);
      }
    });

    const mergedSops = [...model.sops];
    templateModel.sops.forEach(ts => {
      if (!mergedSops.some(s => s.id === ts.id)) {
        mergedSops.push(ts);
      }
    });

    const mergedEscalations = [...model.escalationPolicies];
    templateModel.escalationPolicies.forEach(te => {
      if (!mergedEscalations.some(e => e.id === te.id)) {
        mergedEscalations.push(te);
      }
    });

    const mergedMatrix = [...(model.routingMatrix || [])];
    templateModel.routingMatrix?.forEach(tm => {
      if (!mergedMatrix.some(m => m.category === tm.category)) {
        mergedMatrix.push(tm);
      } else {
        const idx = mergedMatrix.findIndex(m => m.category === tm.category);
        if (mergedMatrix[idx].primaryOwnerPositionId.startsWith('pos_blank') || mergedMatrix[idx].primaryOwnerPositionId === '') {
          mergedMatrix[idx] = tm;
        }
      }
    });

    markChanged({
      ...model,
      positions: mergedPositions,
      roles: mergedRoles,
      sops: mergedSops,
      escalationPolicies: mergedEscalations,
      routingMatrix: mergedMatrix
    });
  };

  // Visual connections selector
  const getVisualConnections = () => {
    const list: any[] = [];
    
    // 1. Reporting hierarchy
    model.positions.forEach(pos => {
      if (pos.reportsToPositionId) {
        list.push({
          id: `rep_${pos.id}_${pos.reportsToPositionId}`,
          workspaceId,
          type: 'reporting',
          fromPositionId: pos.id,
          toPositionId: pos.reportsToPositionId,
          label: 'Reports To',
          sopIds: [],
          escalationPolicyIds: [],
          createdAt: pos.createdAt,
          updatedAt: pos.updatedAt
        });
      }
    });

    // 2. Escalation connections
    model.escalationPolicies.forEach(policy => {
      if (policy.fromPositionId && policy.escalateToPositionId) {
        list.push({
          id: `esc_policy_${policy.id}`,
          workspaceId,
          type: 'escalation',
          fromPositionId: policy.fromPositionId,
          toPositionId: policy.escalateToPositionId,
          label: `Escalates To`,
          condition: policy.condition,
          responseWindow: policy.responseWindow,
          sopIds: [],
          escalationPolicyIds: [policy.id],
          createdAt: policy.createdAt,
          updatedAt: policy.updatedAt
        });
      }
    });

    // 3. Custom node-to-node connections
    if (model.connections) {
      model.connections.forEach(c => {
        list.push({
          id: c.id,
          workspaceId: c.workspaceId,
          type: 'sop',
          fromPositionId: c.fromPositionId,
          toPositionId: c.toPositionId,
          label: c.label,
          sopIds: c.sopIds,
          escalationPolicyIds: c.escalationPolicyIds,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        });
      });
    }

    // 4. Workflow view direct attachments
    if (activeViewMode === 'workflow') {
      model.roles.forEach(role => {
        if (role.positionId) {
          list.push({
            id: `role_conn_${role.id}`,
            workspaceId,
            type: 'ownership',
            fromPositionId: role.id,
            toPositionId: role.positionId,
            label: 'Belongs To',
            sopIds: [],
            escalationPolicyIds: [],
            createdAt: role.createdAt,
            updatedAt: role.updatedAt
          });
        }
      });

      model.sops.forEach(sop => {
        if (sop.ownerPositionId) {
          list.push({
            id: `sop_conn_${sop.id}`,
            workspaceId,
            type: 'sop',
            fromPositionId: sop.id,
            toPositionId: sop.ownerPositionId,
            label: 'SOP Owner',
            sopIds: [],
            escalationPolicyIds: [],
            createdAt: sop.createdAt,
            updatedAt: sop.updatedAt
          });
        }
      });
    }

    return list;
  };

  // Save visual connection changes
  const handleSaveConnectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connFrom || !connTo) return;

    if (connType === 'reporting') {
      const updatedPositions = model.positions.map(p => 
        p.id === connFrom ? { ...p, reportsToPositionId: connTo } : p
      );
      markChanged({
        ...model,
        positions: updatedPositions
      });
    } else if (connType === 'escalation') {
      const existing = model.escalationPolicies.find(ep => ep.fromPositionId === connFrom && ep.escalateToPositionId === connTo);
      if (existing) {
        const updatedPolicies = model.escalationPolicies.map(ep => 
          ep.id === existing.id 
            ? { ...ep, name: connLabel || ep.name, condition: connCondition || ep.condition, responseWindow: connWindow || ep.responseWindow } 
            : ep
        );
        markChanged({ ...model, escalationPolicies: updatedPolicies });
      } else {
        const newPolicy: EscalationPolicy = {
          id: `esc_${Date.now()}`,
          workspaceId,
          name: connLabel || 'New Escalation Policy',
          trigger: `Task overdue at ${connFrom}`,
          condition: connCondition || 'IF task overdue',
          fromPositionId: connFrom,
          escalateToPositionId: connTo,
          responseWindow: connWindow,
          urgency: 'normal',
          channels: ['dashboard', 'email'],
          requiredContext: [],
          recommendedNextAction: 'Review delay',
          saveToKnowledgeBase: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        markChanged({
          ...model,
          escalationPolicies: [...model.escalationPolicies, newPolicy]
        });
      }
    } else {
      const existingIdx = (model.connections || []).findIndex(c => c.id === selectedConnectionId);
      const newConn = {
        id: selectedConnectionId || `con_${Date.now()}`,
        workspaceId,
        fromPositionId: connFrom,
        toPositionId: connTo,
        label: connLabel,
        sopIds: connSops,
        escalationPolicyIds: connEscalations,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedConnections = [...(model.connections || [])];
      if (existingIdx > -1) {
        updatedConnections[existingIdx] = newConn;
      } else {
        updatedConnections.push(newConn);
      }
      markChanged({
        ...model,
        connections: updatedConnections
      });
    }

    setConnectionDrawerOpen(false);
    setSelectedConnectionId(null);
  };

  // Delete visual connection
  const handleDeleteConnection = (connId: string) => {
    if (connId.startsWith('rep_')) {
      const fromId = connId.split('_')[1];
      const updatedPositions = model.positions.map(p => 
        p.id === fromId ? { ...p, reportsToPositionId: undefined } : p
      );
      markChanged({
        ...model,
        positions: updatedPositions
      });
    } else if (connId.startsWith('esc_policy_')) {
      const policyId = connId.replace('esc_policy_', '');
      const updatedPolicies = model.escalationPolicies.filter(p => p.id !== policyId);
      markChanged({
        ...model,
        escalationPolicies: updatedPolicies
      });
    } else {
      const updatedConnections = (model.connections || []).filter(c => c.id !== connId);
      markChanged({
        ...model,
        connections: updatedConnections
      });
    }
    setConnectionDrawerOpen(false);
    setSelectedConnectionId(null);
  };

  // Add node from left palette near viewport center
  const handleAddPaletteNode = (type: 'position' | 'role' | 'sop' | 'escalation' | 'logic_split' | 'intake_trigger') => {
    const container = canvasContainerRef.current;
    const width = container ? container.clientWidth : 800;
    const height = container ? container.clientHeight : 500;
    const centerX = Math.round((width / 2 - pan.x) / zoom);
    const centerY = Math.round((height / 2 - pan.y) / zoom);

    const newModel = { ...model };

    if (type === 'position') {
      const newPos: OrgPosition = {
        id: `pos_new_${Date.now()}`,
        workspaceId,
        name: 'New Position',
        title: 'Title / Role',
        department: 'Operations',
        office: 'Wilmington',
        roleIds: [],
        status: 'open',
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.positions.push(newPos);
      setSelectedElement({ type: 'position', id: newPos.id });
    } else if (type === 'role') {
      const newRole: OrgRole = {
        id: `role_new_${Date.now()}`,
        workspaceId,
        positionId: model.positions[0]?.id || '',
        name: 'New Role',
        description: 'New role responsibility',
        categories: ['Operations'],
        sopIds: [],
        escalationPolicyIds: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.roles.push(newRole);
      setSelectedElement({ type: 'role', id: newRole.id });
    } else if (type === 'sop') {
      const newSop: OrgSop = {
        id: `sop_new_${Date.now()}`,
        workspaceId,
        name: 'New SOP Document',
        trigger: 'Trigger event',
        ownerPositionId: model.positions[0]?.id || '',
        steps: ['Step 1', 'Step 2'],
        requiredInformation: ['Information required'],
        tags: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.sops.push(newSop);
      setSelectedElement({ type: 'sop', id: newSop.id });
    } else if (type === 'escalation') {
      const newEsc: EscalationPolicy = {
        id: `esc_new_${Date.now()}`,
        workspaceId,
        name: 'New Escalation Policy',
        trigger: 'SLA overdue trigger',
        condition: 'SLA is exceeded',
        escalateToPositionId: model.positions[0]?.id || '',
        responseWindow: '24 hours',
        urgency: 'normal',
        channels: ['dashboard', 'email'],
        requiredContext: ['Context reference'],
        recommendedNextAction: 'Review issue log',
        saveToKnowledgeBase: true,
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.escalationPolicies.push(newEsc);
      setSelectedElement({ type: 'escalation', id: newEsc.id });
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (!newModel.logicNodes) newModel.logicNodes = [];
      const newLogicNode: OrgLogicNode = {
        id: `logic_new_${Date.now()}`,
        workspaceId,
        type,
        label: type === 'intake_trigger' ? 'New Intake Trigger' : 'New Logic Split',
        description: type === 'intake_trigger' ? 'Inbound ticket intake channel' : 'Request type routing matrix split',
        conditions: type === 'logic_split' ? ['Marketing', 'Compliance', 'Operations'] : [],
        branches: [],
        x: centerX,
        y: centerY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      newModel.logicNodes.push(newLogicNode);
      setSelectedElement({ type: type as any, id: newLogicNode.id });
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Update properties inline for inspector panel
  const handleUpdateElementInline = (field: string, value: any) => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    const newModel = { ...model };

    if (type === 'position') {
      newModel.positions = newModel.positions.map(p => 
        p.id === id ? { ...p, [field]: value, updatedAt: new Date().toISOString() } : p
      );
    } else if (type === 'role') {
      newModel.roles = newModel.roles.map(r => 
        r.id === id ? { ...r, [field]: value, updatedAt: new Date().toISOString() } : r
      );
    } else if (type === 'sop') {
      newModel.sops = newModel.sops.map(s => 
        s.id === id ? { ...s, [field]: value, updatedAt: new Date().toISOString() } : s
      );
    } else if (type === 'escalation') {
      newModel.escalationPolicies = newModel.escalationPolicies.map(e => 
        e.id === id ? { ...e, [field]: value, updatedAt: new Date().toISOString() } : e
      );
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.map(ln => 
          ln.id === id ? { ...ln, [field]: value, updatedAt: new Date().toISOString() } : ln
        );
      }
    } else if (type === 'connection') {
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.map(c => 
          c.id === id ? { ...c, [field]: value, updatedAt: new Date().toISOString() } : c
        );
      }
      newModel.connections = newModel.connections.map(c => 
        c.id === id ? { ...c, [field]: value, updatedAt: new Date().toISOString() } : c
      );
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Delete node or connection from inspector
  const handleDeleteSelectedElement = () => {
    if (!selectedElement) return;
    const { type, id } = selectedElement;
    const newModel = { ...model };

    if (type === 'position') {
      newModel.positions = newModel.positions.filter(p => p.id !== id);
      newModel.connections = newModel.connections.filter(c => c.fromPositionId !== id && c.toPositionId !== id);
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.filter(c => c.fromPositionId !== id && c.toPositionId !== id);
      }
    } else if (type === 'role') {
      newModel.roles = newModel.roles.filter(r => r.id !== id);
    } else if (type === 'sop') {
      newModel.sops = newModel.sops.filter(s => s.id !== id);
    } else if (type === 'escalation') {
      newModel.escalationPolicies = newModel.escalationPolicies.filter(e => e.id !== id);
    } else if (type === 'logic_split' || type === 'intake_trigger') {
      if (newModel.logicNodes) {
        newModel.logicNodes = newModel.logicNodes.filter(ln => ln.id !== id);
      }
    } else if (type === 'connection') {
      newModel.connections = newModel.connections.filter(c => c.id !== id);
      if (newModel.visualConnections) {
        newModel.visualConnections = newModel.visualConnections.filter(c => c.id !== id);
      }
    }

    setModel(newModel);
    orgChartService.saveOrgChart(workspaceId, newModel);
    setSelectedElement(null);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  // Position View Dashboard Component
  const renderPositionViewDashboard = () => {
    const activePos = model.positions.find(p => p.id === activePositionId) || model.positions[0];
    if (!activePos) {
      return (
        <div className="flex-1 flex items-center justify-center bg-[#01362D] text-white p-8 text-center">
          <p className="text-sm opacity-60 font-mono">No positions defined in this workspace.</p>
        </div>
      );
    }

    const posRoles = model.roles.filter(r => r.positionId === activePos.id);
    const posSops = model.sops.filter(s => s.ownerPositionId === activePos.id);
    const posEscalations = model.escalationPolicies.filter(e => e.fromPositionId === activePos.id || e.escalateToPositionId === activePos.id);

    return (
      <div className="flex-grow flex min-h-0 bg-[#013028] text-white font-sans w-full">
        {/* Left Side Position Selector Column */}
        <div className="w-72 border-r border-white/10 bg-[#012620]/75 flex flex-col min-h-0 shrink-0">
          <div className="p-4 border-b border-white/5 space-y-2">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]/60 text-left">Select Position</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="filter seats..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 pl-7 text-[11px] text-white focus:outline-none focus:border-emerald-500 lowercase"
              />
              <Search className="w-3 h-3 text-[#D0D6BB]/50 absolute left-2.5 top-2.5" />
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {model.positions
              .filter(p => {
                if (searchQuery) {
                  return p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.title.toLowerCase().includes(searchQuery.toLowerCase());
                }
                return true;
              })
              .map(p => {
                const isActive = p.id === activePos.id;
                const status = p.status || 'active';
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivePositionId(p.id);
                      setSelectedElement({ type: 'position', id: p.id });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                      isActive 
                        ? 'bg-[#00635C]/30 border-emerald-500/50 shadow-[0_2px_10px_rgba(0,0,0,0.2)]' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                      <OrgAvatar name={p.name} avatarUrl={p.avatarUrl} avatarCrop={p.avatarCrop} size={36} className="border border-white/10" />
                    ) : status === 'virtual_ai' ? (
                      <div className="w-[36px] h-[36px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 text-xs">🤖</div>
                    ) : (
                      <div className="w-[36px] h-[36px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 text-xs font-bold">+</div>
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                      <p className="text-[9px] text-[#D0D6BB]/60 truncate font-mono uppercase">{p.title}</p>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Side Position Detail Dashboard */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header Dashboard Profile Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-4">
              {activePos.status === 'active' || activePos.status === 'fractional' || activePos.status === 'outsourced' ? (
                <OrgAvatar name={activePos.name} avatarUrl={activePos.avatarUrl} avatarCrop={activePos.avatarCrop} size={72} className="border border-white/10 shadow-lg" />
              ) : activePos.status === 'virtual_ai' ? (
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-lg text-3xl">🤖</div>
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 shadow-lg text-[#D0D6BB]/40 text-xl font-bold">+</div>
              )}
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-black tracking-tight text-white">{activePos.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-mono uppercase font-bold">
                    {activePos.status || 'active'}
                  </span>
                </div>
                <p className="text-xs font-mono uppercase text-[#D0D6BB]/70">{activePos.title}</p>
                <div className="flex items-center gap-4 text-[10px] text-[#D0D6BB]/50 pt-1 font-mono">
                  {activePos.department && <span>Dept: <span className="text-[#D0D6BB]">{activePos.department}</span></span>}
                  {activePos.office && <span>Office: <span className="text-[#D0D6BB]">{activePos.office}</span></span>}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(activePos.id);
                setDrawerType('position');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-colors shadow cursor-pointer"
            >
              Edit Seat Details
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles & Responsibilities */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-teal-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Responsibilities ({posRoles.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posRoles.map(role => (
                  <div key={role.id} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                    <h5 className="text-xs font-bold text-white">{role.name}</h5>
                    <p className="text-[10px] text-[#D0D6BB]/80 leading-relaxed">{role.description}</p>
                    {role.defaultSla && <div className="text-[8px] font-mono text-teal-400 mt-1 uppercase">SLA Window: {role.defaultSla}</div>}
                  </div>
                ))}
                {posRoles.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No responsibilities assigned to this seat.</p>
                )}
              </div>
            </div>

            {/* SOPs & Knowledge Documents */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-green-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                SOPs & Checklists ({posSops.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posSops.map(sop => (
                  <div key={sop.id} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                    <h5 className="text-xs font-bold text-white">{sop.name}</h5>
                    <div className="text-[9px] text-[#D0D6BB] leading-normal"><span className="text-[#D0D6BB]/40 font-mono uppercase">Trigger:</span> {sop.trigger}</div>
                    <div className="text-[8px] text-green-400 mt-1 font-mono uppercase">Steps Checklist: {sop.steps.length} actions</div>
                  </div>
                ))}
                {posSops.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No SOP documentation owned by this seat.</p>
                )}
              </div>
            </div>
            
            {/* Escalation Policy Paths */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3.5 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-amber-300 border-b border-white/5 pb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Escalation Fallbacks ({posEscalations.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {posEscalations.map(esc => {
                  const targetName = model.positions.find(p => p.id === esc.escalateToPositionId)?.name || 'Principal Broker';
                  return (
                    <div key={esc.id} className="p-3 bg-black/20 border border-white/5 rounded-xl space-y-1">
                      <h5 className="text-xs font-bold text-white">{esc.name}</h5>
                      <div className="text-[9px] text-[#D0D6BB]"><span className="text-amber-400 font-bold uppercase text-[7px] font-mono pr-1">{esc.urgency}</span> Escalates to: <span className="text-white font-bold">{targetName}</span></div>
                      <div className="text-[8px] text-[#D0D6BB]/60 font-mono uppercase">SLA fallback: {esc.responseWindow}</div>
                    </div>
                  );
                })}
                {posEscalations.length === 0 && (
                  <p className="text-xs text-[#D0D6BB]/40 italic py-4">No escalation triggers configured for this seat.</p>
                )}
              </div>
            </div>

            {/* Operating Model Details */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 text-left">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#D0D6BB] border-b border-white/5 pb-2 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Operating Matrix
              </h4>
              
              <div className="space-y-3 font-mono text-[10px] text-[#D0D6BB]">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Reports To:</span>
                  <span className="text-white">{model.positions.find(p => p.id === activePos.reportsToPositionId)?.name || '(Top Level Broker)'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Backup Seat Owner:</span>
                  <span className="text-white">{model.positions.find(p => p.id === activePos.backupPositionId)?.name || '(None)'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Urgency priority:</span>
                  <span className="text-amber-400 font-bold uppercase">{activePos.priority || 'Normal'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>Estimated Cost / Budget:</span>
                  <span className="text-emerald-400 font-bold">{activePos.estimatedCost || 'N/A'}</span>
                </div>
              </div>

              {activePos.businessCase && (
                <div className="space-y-1 text-xs">
                  <h5 className="text-[9px] font-mono text-[#D0D6BB]/50 uppercase tracking-wider">Business Case / Gaps</h5>
                  <p className="p-3 bg-black/20 border border-white/5 rounded-xl text-[#D0D6BB] leading-relaxed text-[11px] font-sans">{activePos.businessCase}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Left Node Palette Component
  const renderLeftNodePalette = () => {
    const paletteItems = [
      { type: 'position', label: 'Position / Seat', desc: 'Active, open, or AI seat', icon: User, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20' },
      { type: 'role', label: 'Role / Responsibility', desc: 'Accountability owned by seat', icon: Layers, color: 'text-teal-400 border-teal-500/30 bg-teal-950/20' },
      { type: 'sop', label: 'SOP / Knowledge', desc: 'Guidance and checklists', icon: BookOpen, color: 'text-green-400 border-green-500/30 bg-green-950/20' },
      { type: 'escalation', label: 'Escalation Policy', desc: 'SLA priority routing fallback', icon: AlertTriangle, color: 'text-amber-400 border-amber-500/30 bg-amber-950/20' },
      { type: 'logic_split', label: 'Logic Split', desc: 'Conditional branch route', icon: Shield, color: 'text-violet-400 border-violet-500/30 bg-violet-950/20' },
      { type: 'intake_trigger', label: 'Intake Trigger', desc: 'Inbound channel entry point', icon: Play, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' }
    ] as const;

    return (
      <div className="w-64 border-r border-white/10 bg-[#012a23]/95 backdrop-blur-md p-4 flex flex-col gap-4 shrink-0 text-white font-sans">
        <div className="space-y-1">
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#D0D6BB]">Add to canvas</h3>
          <p className="text-[10px] text-[#D0D6BB]/60 leading-relaxed">Click any node to spawn it at the center of the active canvas.</p>
        </div>
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
          {paletteItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAddPaletteNode(item.type)}
                className={`w-full text-left p-3 rounded-xl border hover:border-white/30 hover:bg-white/5 transition-all flex gap-3 items-start group cursor-pointer ${item.color}`}
              >
                <div className="p-2 rounded-lg bg-black/20 shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <h4 className="text-xs font-bold truncate">{item.label}</h4>
                  <p className="text-[9px] opacity-70 leading-normal line-clamp-2">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Right Inspector HUD component
  const renderRightInspector = () => {
    if (!selectedElement) {
      const totalSeats = model.positions.length;
      const openSeats = model.positions.filter(p => p.status === 'open').length;
      const plannedSeats = model.positions.filter(p => p.status === 'planned').length;
      const aiSeats = model.positions.filter(p => p.status === 'virtual_ai').length;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-5 shrink-0 text-white font-sans overflow-y-auto">
          <div className="space-y-1.5 border-b border-white/5 pb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#D0D6BB]">Inspector Panel</h3>
            <p className="text-[10px] text-[#D0D6BB]/50">Select a node or connection on the canvas to configure properties.</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]/70">Workspace Stats</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-[9px] text-[#D0D6BB]/60 block uppercase">Total Seats</span>
                <span className="text-xl font-bold font-serif">{totalSeats}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-[9px] text-[#D0D6BB]/60 block uppercase">Vacant Seats</span>
                <span className="text-xl font-bold font-serif text-rose-400">{openSeats}</span>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                <span className="text-[9px] text-[#D0D6BB]/60 block uppercase">Planned</span>
                <span className="text-xl font-bold font-serif text-sky-400">{plannedSeats}</span>
              </div>
              <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl space-y-1">
                <span className="text-[9px] text-emerald-400 block uppercase">AI Coworkers</span>
                <span className="text-xl font-bold font-serif text-emerald-300">{aiSeats}</span>
              </div>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2.5">
              <h5 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]">Canvas Quick Guide</h5>
              <ul className="text-[10px] text-[#D0D6BB]/70 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Drag nodes to position them.</li>
                <li>Single click to inspect details and edit parameters inline.</li>
                <li>Draw connections by selecting nodes and connecting them.</li>
                <li>Double click a position, SOP, or escalation card to open the advanced multi-tab settings drawer.</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    const { type, id } = selectedElement;

    if (type === 'position') {
      const pos = model.positions.find(p => p.id === id);
      if (!pos) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">Position Node</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{pos.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Full Name</label>
              <input
                type="text"
                value={pos.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Seat Title</label>
              <input
                type="text"
                value={pos.title}
                onChange={e => handleUpdateElementInline('title', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Seat Status</label>
              <select
                value={pos.status || 'active'}
                onChange={e => handleUpdateElementInline('status', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="active">Active Seat</option>
                <option value="open">Open / Vacant</option>
                <option value="planned">Planned (Future)</option>
                <option value="wanted">Wanted (Gap)</option>
                <option value="fractional">Fractional</option>
                <option value="outsourced">Outsourced</option>
                <option value="virtual_ai">AI / Virtual Role</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Department</label>
              <input
                type="text"
                value={pos.department || ''}
                onChange={e => handleUpdateElementInline('department', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Reports To</label>
              <select
                value={pos.reportsToPositionId || ''}
                onChange={e => handleUpdateElementInline('reportsToPositionId', e.target.value || undefined)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">(None - Top Level)</option>
                {model.positions.filter(p => p.id !== pos.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Backup Seat Owner</label>
              <select
                value={pos.backupPositionId || ''}
                onChange={e => handleUpdateElementInline('backupPositionId', e.target.value || undefined)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">(None)</option>
                {model.positions.filter(p => p.id !== pos.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(pos.id);
                  setDrawerType('position');
                  setDrawerMode('edit');
                  setDrawerOpen(true);
                }}
                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
              >
                Open Full Settings
              </button>
            </div>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'sop') {
      const sop = model.sops.find(s => s.id === id);
      if (!sop) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400">SOP Node</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{sop.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">SOP Title</label>
              <input
                type="text"
                value={sop.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Intake Trigger</label>
              <input
                type="text"
                value={sop.trigger}
                onChange={e => handleUpdateElementInline('trigger', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Owner Position</label>
              <select
                value={sop.ownerPositionId || ''}
                onChange={e => handleUpdateElementInline('ownerPositionId', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {model.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Purpose</label>
              <textarea
                value={sop.purpose || ''}
                onChange={e => handleUpdateElementInline('purpose', e.target.value)}
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(sop.id);
                setDrawerType('sop');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
            >
              Open Full SOP Editor
            </button>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'escalation') {
      const esc = model.escalationPolicies.find(e => e.id === id);
      if (!esc) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400">Escalation Policy</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{esc.name}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Policy Name</label>
              <input
                type="text"
                value={esc.name}
                onChange={e => handleUpdateElementInline('name', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Trigger event</label>
              <input
                type="text"
                value={esc.trigger}
                onChange={e => handleUpdateElementInline('trigger', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">SLA Window</label>
              <input
                type="text"
                value={esc.responseWindow}
                onChange={e => handleUpdateElementInline('responseWindow', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Escalate To Seat</label>
              <select
                value={esc.escalateToPositionId || ''}
                onChange={e => handleUpdateElementInline('escalateToPositionId', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {model.positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Urgency Level</label>
              <select
                value={esc.urgency}
                onChange={e => handleUpdateElementInline('urgency', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">URGENT fallback</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingId(esc.id);
                setDrawerType('escalation');
                setDrawerMode('edit');
                setDrawerOpen(true);
              }}
              className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold font-mono text-[10px] uppercase text-center cursor-pointer transition-colors"
            >
              Open Full Policy Editor
            </button>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'logic_split' || type === 'intake_trigger') {
      const node = model.logicNodes?.find(l => l.id === id);
      if (!node) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-violet-400">{type === 'logic_split' ? 'Logic Split' : 'Intake Trigger'}</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{node.label}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Label / Name</label>
              <input
                type="text"
                value={node.label}
                onChange={e => handleUpdateElementInline('label', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Description</label>
              <textarea
                value={node.description || ''}
                onChange={e => handleUpdateElementInline('description', e.target.value)}
                rows={3}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-sans text-xs resize-none"
              />
            </div>

            {type === 'logic_split' && (
              <div className="space-y-2">
                <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60 block">Routing Branch Options</label>
                <div className="space-y-1.5">
                  {(node.conditions || []).map((cond, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={cond}
                        onChange={e => {
                          const branches = [...(node.conditions || [])];
                          branches[idx] = e.target.value;
                          handleUpdateElementInline('conditions', branches);
                        }}
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const branches = (node.conditions || []).filter((_, i) => i !== idx);
                          handleUpdateElementInline('conditions', branches);
                        }}
                        className="p-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const branches = [...(node.conditions || []), `Branch Option ${ (node.conditions || []).length + 1 }`];
                      handleUpdateElementInline('conditions', branches);
                    }}
                    className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-colors"
                  >
                    + Add Condition Path
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Node
            </button>
          </div>
        </div>
      );
    }

    if (type === 'connection') {
      const conn = getVisualConnections().find(c => c.id === id);
      if (!conn) return null;

      return (
        <div className="w-80 border-l border-white/10 bg-[#012a23]/95 backdrop-blur-md p-5 flex flex-col gap-4 shrink-0 text-white font-sans overflow-y-auto">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#10b981]">Connection Path</span>
              <h3 className="text-sm font-bold truncate max-w-[200px]">{conn.label || 'Connection Path'}</h3>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-[#D0D6BB]/50 hover:text-white transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-left">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Path Label</label>
              <input
                type="text"
                value={conn.label || ''}
                onChange={e => handleUpdateElementInline('label', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Path Condition</label>
              <input
                type="text"
                value={conn.condition || ''}
                onChange={e => handleUpdateElementInline('condition', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. if category === 'Marketing'"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#D0D6BB]/60">Response Window (SLA)</label>
              <input
                type="text"
                value={conn.responseWindow || ''}
                onChange={e => handleUpdateElementInline('responseWindow', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="24 hours"
              />
            </div>

            <button
              onClick={handleDeleteSelectedElement}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-4 text-xs font-mono uppercase text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Disconnect Path
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render visual org map
  function renderVisualOrgMap() {
    const getNodeCoordinates = (nodeId: string): { x: number; y: number } | null => {
      const pos = model.positions.find(p => p.id === nodeId);
      if (pos) return { x: pos.x || 0, y: pos.y || 0 };
      const role = model.roles.find(r => r.id === nodeId);
      if (role) return { x: role.x || 0, y: role.y || 0 };
      const sop = model.sops.find(s => s.id === nodeId);
      if (sop) return { x: sop.x || 0, y: sop.y || 0 };
      const esc = model.escalationPolicies.find(e => e.id === nodeId);
      if (esc) return { x: esc.x || 0, y: esc.y || 0 };
      const ln = model.logicNodes?.find(n => n.id === nodeId);
      if (ln) return { x: ln.x || 0, y: ln.y || 0 };
      return null;
    };

    const visualConns = getVisualConnections();
    
    // Filter positions based on visibility checkbox states
    const visiblePositions = model.positions.filter(p => {
      const status = p.status || 'active';
      if (status === 'active' && !showActive) return false;
      if (status === 'open' && !showOpenRoles) return false;
      if (status === 'planned' && !showPlannedRoles) return false;
      if (status === 'wanted' && !showPlannedRoles) return false;
      if (status === 'fractional' && !showActive) return false;
      if (status === 'outsourced' && !showActive) return false;
      if (status === 'virtual_ai' && !showVirtualAi) return false;
      return true;
    });

    // Filter connections based on visibility checkbox states and visible positions
    const filteredConns = visualConns.filter(c => {
      const fromVisible = visiblePositions.some(p => p.id === c.fromPositionId);
      const toVisible = visiblePositions.some(p => p.id === c.toPositionId);
      if (!fromVisible || !toVisible) return false;

      if (c.type === 'reporting') return showReportingLines;
      if (c.type === 'escalation') return showEscalationLines;
      if (c.type === 'sop') return showSopLines;
      return true;
    });

    console.log('[VISUAL MAP]', {
      positions: model.positions.length,
      filteredPositions: visiblePositions.length,
      connections: filteredConns.length,
      canvasWidth: canvasContainerRef.current?.clientWidth || 0,
      canvasHeight: canvasContainerRef.current?.clientHeight || 0,
      pan,
      zoom
    });

    if (model.positions.length === 0) {
      return (
        <div className="flex-grow flex flex-col items-center justify-center bg-[#01362D] text-white p-8 space-y-6 min-h-[500px]">
          <div className="text-[#D0D6BB] text-center max-w-sm">
            <h3 className="text-sm font-serif font-black uppercase tracking-wider text-white">No org positions found</h3>
            <p className="text-xs opacity-80 mt-2 leading-relaxed">Load the Brokerage Default template or add your first position to begin building your operational map.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => applyTemplate('Brokerage Default')}
              className="px-4 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-md rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
            >
              Load Brokerage Template
            </button>
            <button
              onClick={() => openAddDrawer('position')}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-colors"
            >
              Add Position
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-grow flex flex-col min-h-0 text-left relative select-none">
        {/* Toolbar */}
        <div className="sticky top-[73px] z-10 px-4 py-3 bg-[#012a23]/88 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase shrink-0 visual-org-map-toolbar">
          {/* Left Group */}
          <div className="flex items-center gap-3">
            {/* View Switcher */}
            <div className="flex gap-0.5 bg-black/25 p-1 rounded-lg border border-white/5 shrink-0">
              {[
                { mode: 'org', label: 'Org View', icon: Layers },
                { mode: 'workflow', label: 'Workflow View', icon: Sparkles },
                { mode: 'position', label: 'Position View', icon: User }
              ].map(({ mode, label, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setActiveViewMode(mode as any);
                    setSelectedElement(null);
                  }}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeViewMode === mode
                      ? 'bg-[#00635C] text-white shadow'
                      : 'text-[#D0D6BB]/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Templates Selector */}
            <div className="relative group">
              <button type="button" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold cursor-pointer flex items-center gap-1">
                Templates <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
              <div className="absolute left-0 mt-1 hidden group-hover:block bg-[#013028] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-30 w-44 font-sans text-xs lowercase">
                {[
                  'Brokerage Default',
                  'Small Business',
                  'Real Estate Team',
                  'Multi-office Brokerage',
                  'Blank Canvas'
                ].map(tmpl => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="w-full px-4 py-2.5 text-left text-[#D0D6BB] hover:bg-[#00635C] hover:text-white transition-colors"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {activeViewMode !== 'position' && (
              <>
                <button
                  type="button"
                  onClick={() => openAddDrawer('position')}
                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-lg font-bold cursor-pointer"
                >
                  + Add Seat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConnFrom('');
                    setConnTo('');
                    setConnLabel('');
                    setConnCondition('');
                    setConnWindow('24 hours');
                    setConnSops([]);
                    setConnEscalations([]);
                    setSelectedConnectionId(null);
                    setConnType('reporting');
                    setConnectionDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold cursor-pointer"
                >
                  + Connect
                </button>
              </>
            )}
          </div>

          {/* Center Group */}
          {activeViewMode !== 'position' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAutoLayout}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold cursor-pointer"
              >
                Auto Layout
              </button>
              <button
                type="button"
                onClick={handleFitView}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold cursor-pointer"
              >
                Fit View
              </button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="search canvas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 pl-7 text-[10px] text-white focus:outline-none focus:border-emerald-500 w-36 lowercase"
                />
                <Search className="w-3 h-3 text-[#D0D6BB]/50 absolute left-2.5 top-2.5" />
              </div>
            </div>
          )}

          {/* Right Group */}
          <div className="flex items-center gap-3">
            {/* Filters Dropdown */}
            {activeViewMode !== 'position' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFiltersPopoverOpen(!filtersPopoverOpen)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <span>Filters</span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${filtersPopoverOpen ? 'rotate-90' : ''}`} />
                </button>
                
                {filtersPopoverOpen && (
                  <div className="absolute right-0 mt-2 bg-[#013028] border border-white/15 rounded-xl shadow-2xl p-4 z-40 w-64 space-y-4 font-sans text-xs lowercase">
                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]/50">Show Nodes</h4>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showActive}
                            onChange={() => setShowActive(!showActive)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          Active seats
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showOpenRoles}
                            onChange={() => setShowOpenRoles(!showOpenRoles)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          Open / vacant seats
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showPlannedRoles}
                            onChange={() => setShowPlannedRoles(!showPlannedRoles)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          Planned seats
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showVirtualAi}
                            onChange={() => setShowVirtualAi(!showVirtualAi)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          AI / virtual roles
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 text-left border-t border-white/5 pt-3">
                      <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#D0D6BB]/50">Show Lines</h4>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showReportingLines}
                            onChange={() => setShowReportingLines(!showReportingLines)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          Reporting lines
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showEscalationLines}
                            onChange={() => setShowEscalationLines(!showEscalationLines)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          Escalations
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showSopLines}
                            onChange={() => setShowSopLines(!showSopLines)}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          SOP paths
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Planning Mode Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/20 transition-colors">
              <input
                type="checkbox"
                checked={planningMode}
                onChange={() => setPlanningMode(!planningMode)}
                className="rounded accent-amber-500 bg-black/30 border-amber-500/20 cursor-pointer"
              />
              Planning Mode
            </label>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="flex-grow flex min-h-0 relative">
          
          {/* Left Node Palette (Workflow View Only) */}
          {activeViewMode === 'workflow' && renderLeftNodePalette()}
          
          {/* Center Canvas or Position View Dashboard */}
          {activeViewMode === 'position' ? (
            renderPositionViewDashboard()
          ) : (
            <div 
              ref={canvasContainerRef}
              className="flex-grow min-h-0 bg-[#01362D] relative overflow-hidden cursor-grab active:cursor-grabbing border-t border-white/10 visual-org-map-canvas-shell"
              style={{
                backgroundImage: activeViewMode === 'workflow'
                  ? 'radial-gradient(rgba(246, 247, 241, 0.12) 1.2px, transparent 1.2px)'
                  : 'radial-gradient(rgba(246, 247, 241, 0.08) 1.2px, transparent 1.2px)',
                backgroundSize: '20px 20px'
              }}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).closest('.position-card') || (e.target as HTMLElement).closest('.connection-line')) return;
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY, x_val: pan.x, y_val: pan.y });
              }}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={() => {
                setIsPanning(false);
                if (draggedNodeId) {
                  orgChartService.saveOrgChart(workspaceId, model);
                }
                setDraggedNodeId(null);
              }}
              onPointerLeave={() => {
                setIsPanning(false);
                if (draggedNodeId) {
                  orgChartService.saveOrgChart(workspaceId, model);
                }
                setDraggedNodeId(null);
              }}
              onWheel={(e) => {
                const zoomDelta = -e.deltaY * 0.001;
                setZoom(prev => Math.min(2.0, Math.max(0.5, prev + zoomDelta)));
              }}
            >
              {/* Zoom/Pan wrapper */}
              <div 
                className="absolute inset-0 origin-top-left transition-transform duration-75 pointer-events-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  width: '4000px',
                  height: '3000px'
                }}
              >
                {/* SVG connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                  <defs>
                    <marker id="arrow-reporting" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#D0D6BB" />
                    </marker>
                    <marker id="arrow-escalation" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
                    </marker>
                    <marker id="arrow-sop" markerWidth="8" markerHeight="8" refX="28" refY="4" orient="auto">
                      <path d="M0,0 L8,4 L0,8 Z" fill="#10b981" />
                    </marker>
                  </defs>
                  
                  {filteredConns.map((conn) => {
                    const fromCoords = getNodeCoordinates(conn.fromPositionId);
                    const toCoords = getNodeCoordinates(conn.toPositionId);
                    if (!fromCoords || !toCoords) return null;

                    const cardWidth = 300;
                    const cardHeight = 160;

                    const x1 = fromCoords.x + cardWidth / 2;
                    const y1 = fromCoords.y + cardHeight / 2;
                    const x2 = toCoords.x + cardWidth / 2;
                    const y2 = toCoords.y + cardHeight / 2;

                    const isSelected = selectedElement?.type === 'connection' && selectedElement?.id === conn.id;

                    let strokeColor = 'rgba(208, 214, 187, 0.45)';
                    let dashArray = '';
                    let marker = 'url(#arrow-reporting)';
                    
                    if (conn.type === 'escalation') {
                      strokeColor = '#f59e0b';
                      dashArray = '4,4';
                      marker = 'url(#arrow-escalation)';
                    } else if (conn.type === 'sop') {
                      strokeColor = '#10b981';
                      dashArray = '1,3';
                      marker = 'url(#arrow-sop)';
                    } else if (conn.type === 'ownership') {
                      strokeColor = '#2dd4bf';
                      dashArray = '2,2';
                      marker = '';
                    }

                    const pathD = getCurvePath(x1, y1, x2, y2);
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;

                    return (
                      <g key={conn.id} className="connection-line group">
                        <path
                          d={pathD}
                          stroke="transparent"
                          strokeWidth={14}
                          fill="none"
                          className="cursor-pointer pointer-events-auto"
                          onClick={() => {
                            setSelectedElement({ type: 'connection', id: conn.id });
                          }}
                        />
                        <path
                          d={pathD}
                          stroke={isSelected ? "#f59e0b" : strokeColor}
                          strokeWidth={isSelected ? 3 : 1.5}
                          strokeDasharray={dashArray}
                          fill="none"
                          markerEnd={marker}
                          className="transition-all"
                        />
                        <circle
                          cx={midX}
                          cy={midY}
                          r={6}
                          fill={isSelected ? "#f59e0b" : "transparent"}
                          className="group-hover:fill-emerald-400 transition-colors pointer-events-auto cursor-pointer"
                          onClick={() => setSelectedElement({ type: 'connection', id: conn.id })}
                        />

                        {conn.label && (zoom >= 0.6 || isSelected) && (
                          <g 
                            className="cursor-pointer pointer-events-auto transition-opacity"
                            onClick={() => setSelectedElement({ type: 'connection', id: conn.id })}
                          >
                            <rect
                              x={midX - 55}
                              y={midY - 9}
                              width={110}
                              height={18}
                              rx={9}
                              fill="#012620"
                              stroke={isSelected ? "#f59e0b" : "rgba(255,255,255,0.12)"}
                              strokeWidth={1}
                            />
                            <text
                              x={midX}
                              y={midY + 3}
                              textAnchor="middle"
                              fill="#D0D6BB"
                              fontSize="7.5px"
                              fontWeight="800"
                              fontFamily="monospace"
                              className="uppercase tracking-wider"
                            >
                              {conn.label.length > 20 ? conn.label.substring(0, 17) + '...' : conn.label}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
                
                {/* Canvas Node Cards */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* 1. Positions */}
                  {model.positions
                    .filter(p => {
                      const status = p.status || 'active';
                      if (status === 'active' && !showActive) return false;
                      if (status === 'open' && !showOpenRoles) return false;
                      if (status === 'planned' && !showPlannedRoles) return false;
                      if (status === 'wanted' && !showPlannedRoles) return false;
                      if (status === 'fractional' && !showActive) return false;
                      if (status === 'outsourced' && !showActive) return false;
                      if (status === 'virtual_ai' && !showVirtualAi) return false;

                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        return p.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || (p.department || '').toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map((pos) => {
                      const nodeX = pos.x || 100;
                      const nodeY = pos.y || 100;

                      const posRoles = model.roles.filter(r => r.positionId === pos.id);
                      const sopsCount = model.sops.filter(s => s.ownerPositionId === pos.id).length;
                      const escCount = model.escalationPolicies.filter(e => e.escalateToPositionId === pos.id).length;

                      const isSelected = selectedElement?.type === 'position' && selectedElement?.id === pos.id;
                      const status = pos.status || 'active';
                      
                      let highlightClass = "border-white/10 hover:border-white/25 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transition-all duration-200";
                      if (isSelected) {
                        highlightClass = "border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.5)] scale-[1.02] z-20";
                      } else if (status === 'virtual_ai') {
                        highlightClass = "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] transition-all duration-200";
                      } else if (['open', 'planned', 'wanted'].includes(status)) {
                        highlightClass = "border-dashed border-white/20 hover:border-white/40 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-200";
                      }

                      const isFutureRole = ['open', 'planned', 'wanted'].includes(status);

                      return (
                        <div
                          key={pos.id}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            setSelectedElement({ type: 'position', id: pos.id });
                            setActivePositionId(pos.id);
                          }}
                          onDoubleClick={() => {
                            setEditingId(pos.id);
                            setDrawerType('position');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute position-card w-[300px] bg-[#012620]/90 backdrop-blur-md border rounded-[24px] p-5 flex flex-col gap-3 pointer-events-auto cursor-pointer ${highlightClass}`}
                          style={{
                            left: `${nodeX}px`,
                            top: `${nodeY}px`,
                          }}
                        >
                          <div 
                            className="flex justify-between items-start cursor-grab active:cursor-grabbing select-none border-b border-white/5 pb-2.5"
                            onPointerDown={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              setDraggedNodeId(pos.id);
                              
                              const canvasBound = e.currentTarget.closest('[onPointerMove]')!.getBoundingClientRect();
                              const mouseX = e.clientX - canvasBound.left;
                              const mouseY = e.clientY - canvasBound.top;

                              setDragStartOffset({
                                x: (mouseX - pan.x) / zoom - nodeX,
                                y: (mouseY - pan.y) / zoom - nodeY
                              });
                            }}
                          >
                            <div className="flex items-center gap-2.5 max-w-[200px]">
                              {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                                <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={48} className="border border-white/10 shadow-sm" />
                              ) : status === 'virtual_ai' ? (
                                <div className="w-[48px] h-[48px] rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm text-emerald-300">
                                  <span className="text-lg">🤖</span>
                                </div>
                              ) : (
                                <div className="w-[48px] h-[48px] rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center shrink-0 shadow-sm text-[#D0D6BB]/40 hover:text-white hover:bg-white/10 transition-colors">
                                  <span className="text-sm font-bold">+</span>
                                </div>
                              )}
                              <div className="space-y-0.5 text-left truncate">
                                <h4 className="font-sans font-extrabold text-white truncate text-sm tracking-tight">{pos.name}</h4>
                                <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/70 block truncate">{pos.title}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[6px] font-mono uppercase text-[#D0D6BB] max-w-[65px] truncate">
                                {pos.department || 'Staff'}
                              </span>
                              {isFutureRole && (
                                <span className="px-1.5 py-0.2 bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[6px] font-mono uppercase font-bold rounded">
                                  {status.toUpperCase()}
                                </span>
                              )}
                              {status === 'virtual_ai' && (
                                <span className="px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[6px] font-mono uppercase font-bold rounded">
                                  AI Agent
                                </span>
                              )}
                            </div>
                          </div>

                          {status === 'virtual_ai' ? (
                            <div className="space-y-1.5 text-left text-[9px] font-mono text-[#D0D6BB] flex-1">
                              <div className="text-[8px] truncate">Tools: <span className="text-white">{pos.phone || 'Gemini API'}</span></div>
                              <div className="text-[8px] truncate">Backup Owner: <span className="text-white">{
                                model.positions.find(p => p.id === pos.backupPositionId)?.name || 'Ann Gunn'
                              }</span></div>
                              <div className="flex justify-between items-center border-t border-white/5 pt-1 mt-1 text-[8px]">
                                <span>{posRoles.length} Skills</span>
                                <span className="text-emerald-300">Routing active</span>
                              </div>
                            </div>
                          ) : isFutureRole ? (
                            <div className="space-y-1.5 text-left text-[9px] font-mono text-[#D0D6BB] flex-1">
                              {pos.coverageGap && (
                                <div className="text-white leading-relaxed truncate" title={pos.coverageGap}>
                                  Gap: <span className="text-[#D0D6BB]/80">{pos.coverageGap}</span>
                                </div>
                              )}
                              <div className="space-y-0.5 border-t border-white/5 pt-1 mt-1 text-[8px] text-[#D0D6BB]/60 flex justify-between">
                                <span>Priority: <span className="text-white">{pos.priority || 'Normal'}</span></span>
                                {pos.estimatedCost && <span>Budget: <span className="text-emerald-300">{pos.estimatedCost}</span></span>}
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] flex-1">
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-white font-extrabold block text-xs">{posRoles.length}</span>
                                <span className="text-[6.5px] text-[#D0D6BB]/40 block uppercase">Roles</span>
                              </div>
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-emerald-300 font-extrabold block text-xs">{sopsCount}</span>
                                <span className="text-[6.5px] text-[#D0D6BB]/40 block uppercase">SOPs</span>
                              </div>
                              <div className="bg-black/35 p-1.5 rounded-xl border border-white/5">
                                <span className="text-amber-300 font-extrabold block text-xs">{escCount}</span>
                                <span className="text-[6.5px] text-[#D0D6BB]/40 block uppercase">Escs</span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-[8px] font-mono text-[#D0D6BB]/40 border-t border-white/5 pt-2">
                            <span>{pos.office || 'Corporate'}</span>
                            <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={() => {
                              setSelectedElement({ type: 'position', id: pos.id });
                            }}>Configure Seat</span>
                          </div>
                        </div>
                      );
                    })}

                  {/* 2. Roles */}
                  {activeViewMode === 'workflow' && model.roles
                    .filter(r => {
                      if (searchQuery) {
                        return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((role) => {
                      const rx = role.x || 100;
                      const ry = role.y || 100;
                      const isSelected = selectedElement?.type === 'role' && selectedElement?.id === role.id;
                      
                      return (
                        <div
                          key={role.id}
                          onClick={() => setSelectedElement({ type: 'role', id: role.id })}
                          onDoubleClick={() => {
                            setEditingId(role.id);
                            setDrawerType('role');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute w-[240px] bg-teal-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-teal-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${rx}px`, top: `${ry}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-teal-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(role.id);
                              const canvasBound = e.currentTarget.closest('[onPointerMove]')!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - rx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ry
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-teal-300 uppercase tracking-widest font-bold">Role Node</span>
                            <span className="text-[6.5px] font-mono px-1 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">SLA: {role.defaultSla || '24h'}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{role.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-2 leading-relaxed">{role.description}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 3. SOPs */}
                  {activeViewMode === 'workflow' && model.sops
                    .filter(s => {
                      if (searchQuery) {
                        return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.purpose || '').toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((sop) => {
                      const sx = sop.x || 100;
                      const sy = sop.y || 100;
                      const isSelected = selectedElement?.type === 'sop' && selectedElement?.id === sop.id;

                      return (
                        <div
                          key={sop.id}
                          onClick={() => setSelectedElement({ type: 'sop', id: sop.id })}
                          onDoubleClick={() => {
                            setEditingId(sop.id);
                            setDrawerType('sop');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute w-[240px] bg-green-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-green-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${sx}px`, top: `${sy}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-green-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(sop.id);
                              const canvasBound = e.currentTarget.closest('[onPointerMove]')!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - sx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - sy
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-green-300 uppercase tracking-widest font-bold">SOP / Knowledge</span>
                            <span className="text-[6.5px] font-mono px-1 bg-green-500/20 text-green-300 rounded border border-green-500/30">Steps: {sop.steps.length}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{sop.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">Trigger: {sop.trigger}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 4. Escalations */}
                  {activeViewMode === 'workflow' && model.escalationPolicies
                    .filter(e => {
                      if (searchQuery) {
                        return e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.trigger.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((esc) => {
                      const ex = esc.x || 100;
                      const ey = esc.y || 100;
                      const isSelected = selectedElement?.type === 'escalation' && selectedElement?.id === esc.id;

                      return (
                        <div
                          key={esc.id}
                          onClick={() => setSelectedElement({ type: 'escalation', id: esc.id })}
                          onDoubleClick={() => {
                            setEditingId(esc.id);
                            setDrawerType('escalation');
                            setDrawerMode('edit');
                            setDrawerOpen(true);
                          }}
                          className={`absolute w-[240px] bg-amber-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : 'border-amber-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${ex}px`, top: `${ey}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-amber-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(esc.id);
                              const canvasBound = e.currentTarget.closest('[onPointerMove]')!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - ex,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ey
                              });
                            }}
                          >
                            <span className="text-[7.5px] font-mono text-amber-300 uppercase tracking-widest font-bold">Escalation Policy</span>
                            <span className="text-[6.5px] font-mono px-1 bg-red-500/20 text-red-300 rounded border border-red-500/30 uppercase">{esc.urgency}</span>
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{esc.name}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">Limit: {esc.responseWindow}</p>
                          </div>
                        </div>
                      );
                    })}

                  {/* 5. Logic splits / Intake Triggers */}
                  {activeViewMode === 'workflow' && model.logicNodes && model.logicNodes
                    .filter(node => {
                      if (searchQuery) {
                        return node.label.toLowerCase().includes(searchQuery.toLowerCase());
                      }
                      return true;
                    })
                    .map((node) => {
                      const lx = node.x || 100;
                      const ly = node.y || 100;
                      const isSelected = (selectedElement?.type === 'logic_split' || selectedElement?.type === 'intake_trigger') && selectedElement?.id === node.id;
                      const isTrigger = node.type === 'intake_trigger';

                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedElement({ type: node.type as any, id: node.id })}
                          className={`absolute w-[240px] bg-violet-950/20 backdrop-blur-md border ${isSelected ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] z-20' : isTrigger ? 'border-cyan-500/30' : 'border-violet-500/30'} rounded-xl p-3 flex flex-col gap-2 pointer-events-auto cursor-pointer`}
                          style={{ left: `${lx}px`, top: `${ly}px` }}
                        >
                          <div 
                            className="flex justify-between items-center border-b border-violet-500/10 pb-1.5 cursor-grab active:cursor-grabbing"
                            onPointerDown={(e) => {
                              setDraggedNodeId(node.id);
                              const canvasBound = e.currentTarget.closest('[onPointerMove]')!.getBoundingClientRect();
                              setDragStartOffset({
                                x: ((e.clientX - canvasBound.left) - pan.x) / zoom - lx,
                                y: ((e.clientY - canvasBound.top) - pan.y) / zoom - ly
                              });
                            }}
                          >
                            <span className={`text-[7.5px] font-mono ${isTrigger ? 'text-cyan-300' : 'text-violet-300'} uppercase tracking-widest font-bold`}>
                              {isTrigger ? 'Intake Trigger' : 'Logic Split'}
                            </span>
                            {!isTrigger && (
                              <span className="text-[6.5px] font-mono px-1 bg-violet-500/20 text-violet-300 rounded border border-violet-500/30">Paths: {node.conditions?.length || 0}</span>
                            )}
                          </div>
                          <div className="text-left font-sans text-xs">
                            <h4 className="font-bold text-white truncate">{node.label}</h4>
                            <p className="text-[10px] text-[#D0D6BB]/75 mt-1 line-clamp-1 truncate">{node.description || 'Intake channel split'}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Floating Map Legend */}
                <div className="absolute bottom-4 right-4 bg-[#012620]/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl select-none z-10 text-left space-y-2.5 max-w-[245px]">
                  <div>
                    <h5 className="text-[9px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-1">Line Connections</h5>
                    <div className="space-y-1.5 font-mono text-[8px] text-[#D0D6BB] mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 bg-[#D0D6BB] inline-block opacity-60" />
                        <span>Reporting Structure (Solid)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 border-t border-dashed border-[#f59e0b] inline-block" />
                        <span>Escalation Path (Dashed)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-0.5 border-t border-dotted border-[#10b981] inline-block" />
                        <span>SOP / Knowledge (Dotted)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-[9px] font-mono font-bold uppercase tracking-wider text-white border-b border-white/5 pb-1">Position Indicators</h5>
                    <div className="space-y-1.5 font-mono text-[8px] text-[#D0D6BB] mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-white/20 rounded inline-block" />
                        <span>Solid Card = Active Position</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-dashed border-white/30 rounded inline-block" />
                        <span>Dashed Card = Open/Wanted/Planned Seat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-3 bg-black/45 border border-emerald-500/50 shadow-[0_0_6px_rgba(16,185,129,0.5)] rounded inline-block" />
                        <span>Glowing Card = AI/Virtual Role</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Floating Positions Notice Fallback */}
              {visiblePositions.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-[#012620]/95 backdrop-blur-md border border-white/10 text-[#D0D6BB] text-[10px] font-mono rounded-xl pointer-events-auto shadow-md">
                  Positions loaded but not visible. Click{' '}
                  <button
                    type="button"
                    onClick={handleFitView}
                    className="underline font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Fit View
                  </button>{' '}
                  or{' '}
                  <button
                    type="button"
                    onClick={handleAutoLayout}
                    className="underline font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Auto Layout
                  </button>
                  .
                </div>
              )}
            </div>
          )}

          {/* Right Inspector Panel */}
          {renderRightInspector()}
        </div>
      </div>
    );
  }

  // Markdown Export Modal State
  const [exportContent, setExportContent] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'standard' | 'retell'>('standard');
  const [exportFilter, setExportFilter] = useState<'all' | 'ask_nest_ops' | 'retell' | 'active'>('all');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'queued'>('idle');

  // Step 3 filters & search
  const [step3Search, setStep3Search] = useState('');
  const [step3Filter, setStep3Filter] = useState<'all' | 'manual_sop' | 'pdf' | 'doc' | 'link' | 'needs_review' | 'active' | 'retell' | 'ask_nest_ops'>('all');

  // Drawer / Inspector overlay states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link' | null>(null);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Step 2 Selection state
  const [activePositionId, setActivePositionId] = useState<string>('');
  const [activeRoleId, setActiveRoleId] = useState<string>('');

  // Playground Test states
  const [testQuery, setTestQuery] = useState('I need a lockbox for 123 Oak Island Dr by tomorrow.');
  const [testResult, setTestResult] = useState<any>(null);

  // Load Initial Data
  useEffect(() => {
    const rawData = orgChartService.getOrgChart(workspaceId);
    
    // Auto layout positions if any lack proper coordinates or are all at (0,0)
    const positionsNeedLayout = rawData.positions.some(p => p.x === undefined || p.y === undefined || (p.x === 0 && p.y === 0));
    if (positionsNeedLayout && rawData.positions.length > 0) {
      const nodes = [...rawData.positions];
      const depths: Record<string, number> = {};
      const getDepth = (id: string, visited = new Set<string>()): number => {
        if (depths[id] !== undefined) return depths[id];
        if (visited.has(id)) return 0;
        visited.add(id);
        const node = nodes.find(n => n.id === id);
        if (!node || !node.reportsToPositionId) {
          depths[id] = 0;
          return 0;
        }
        const d = 1 + getDepth(node.reportsToPositionId, visited);
        depths[id] = d;
        return d;
      };
      nodes.forEach(n => getDepth(n.id));
      const groups: Record<number, string[]> = {};
      nodes.forEach(n => {
        const d = depths[n.id] || 0;
        if (!groups[d]) groups[d] = [];
        groups[d].push(n.id);
      });
      rawData.positions = nodes.map(node => {
        const d = depths[node.id] || 0;
        const nodesAtLevel = groups[d] || [];
        const idx = nodesAtLevel.indexOf(node.id);
        const levelWidth = 800;
        const spacing = nodesAtLevel.length > 1 ? levelWidth / (nodesAtLevel.length - 1) : 0;
        const startX = nodesAtLevel.length > 1 ? 150 : 500;
        const x = nodesAtLevel.length > 1 ? startX + idx * spacing : 500;
        const y = 80 + d * 220;
        return { ...node, x, y };
      });
    }

    const data = rawData;
    
    // Load docs from backend REST API
    fetch(`/api/org-knowledge?workspaceId=${workspaceId}`)
      .then(res => res.json())
      .then(backendDocs => {
        if (Array.isArray(backendDocs)) {
          const merged = [...(data.knowledgeDocuments || [])];
          backendDocs.forEach(bDoc => {
            const idx = merged.findIndex(d => d.id === bDoc.id);
            if (idx > -1) {
              merged[idx] = bDoc;
            } else {
              merged.push(bDoc);
            }
          });
          data.knowledgeDocuments = merged;
        }
        setModel(data);
      })
      .catch(err => {
        console.error("Failed loading backend knowledge docs", err);
        setModel(data);
      });

    setHasChanges(false);
    setSaveStatus('idle');
    if (data.positions.length > 0) {
      setActivePositionId(data.positions[0].id);
      const posRoles = data.roles.filter(r => r.positionId === data.positions[0].id);
      if (posRoles.length > 0) {
        setActiveRoleId(posRoles[0].id);
      }
    }
  }, [workspaceId]);

  const markChanged = (newModel: OrgModel) => {
    setModel(newModel);
    setHasChanges(true);
    setSaveStatus('idle');
    orgChartService.saveOrgChart(workspaceId, newModel);
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      orgChartService.saveOrgChart(workspaceId, model);
      setSaveStatus('saved');
      setHasChanges(false);
    }, 800);
  };

  const triggerSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('queued');
    }, 1200);
  };

  const handleExport = () => {
    const md = exportFormat === 'standard'
      ? orgChartService.exportOrgChartToKnowledgeBase(workspaceId, model, exportFilter)
      : orgChartService.exportRetellKB(workspaceId, model);
    setExportContent(md);
  };

  // --- DRAWER OPEN/CLOSE HELPERS ---
  const openAddDrawer = (type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link') => {
    setDrawerType(type);
    setDrawerMode('add');
    setEditingId(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link', id: string) => {
    setDrawerType(type);
    setDrawerMode('edit');
    setEditingId(id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerType(null);
    setEditingId(null);
  };

  // --- SELECTION SYNC ---
  const selectPosition = (posId: string) => {
    setActivePositionId(posId);
    const posRoles = model.roles.filter(r => r.positionId === posId);
    if (posRoles.length > 0) {
      setActiveRoleId(posRoles[0].id);
    } else {
      setActiveRoleId('');
    }
  };

  // --- CORE SUBMIT ACTIONS ---
  const handleAddPositionSubmit = (data: Partial<OrgPosition>) => {
    const newId = `pos_${Date.now()}`;
    const newPos: OrgPosition = {
      id: newId,
      workspaceId,
      name: data.name || 'New Seat Name',
      title: data.title || 'Untitled Seat',
      department: data.department || 'Operations',
      office: data.office || 'Wilmington',
      email: data.email || '',
      phone: data.phone || '',
      reportsToPositionId: data.reportsToPositionId,
      backupPositionId: data.backupPositionId,
      visibilityLevel: data.visibilityLevel || 'internal',
      avatarUrl: data.avatarUrl,
      avatarCrop: data.avatarCrop,
      status: data.status || 'active',
      targetHireDate: data.targetHireDate,
      priority: data.priority || 'normal',
      estimatedCost: data.estimatedCost,
      businessCase: data.businessCase,
      hiringNotes: data.hiringNotes,
      coverageGap: data.coverageGap,
      roleIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      positions: [...model.positions, newPos]
    });
    selectPosition(newId);
    closeDrawer();
  };

  const handleEditPositionSubmit = (id: string, updates: Partial<OrgPosition>) => {
    const updated = model.positions.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    markChanged({ ...model, positions: updated });
    closeDrawer();
  };

  const handleAddRoleSubmit = (data: Partial<OrgRole>) => {
    const newId = `role_${Date.now()}`;
    const newRole: OrgRole = {
      id: newId,
      workspaceId,
      positionId: data.positionId || activePositionId,
      name: data.name || 'New Responsibility',
      description: data.description || '',
      categories: data.categories || ['Other / Unknown'],
      defaultSla: data.defaultSla || '24 hours',
      backupOwnerPositionId: data.backupOwnerPositionId,
      sopIds: [],
      escalationPolicyIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedPositions = model.positions.map(p => {
      if (p.id === (data.positionId || activePositionId)) {
        return { ...p, roleIds: [...p.roleIds, newId] };
      }
      return p;
    });

    markChanged({
      ...model,
      positions: updatedPositions,
      roles: [...model.roles, newRole]
    });
    setActiveRoleId(newId);
    closeDrawer();
  };

  const handleEditRoleSubmit = (id: string, updates: Partial<OrgRole>) => {
    const updated = model.roles.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
    markChanged({ ...model, roles: updated });
    closeDrawer();
  };

  const handleAddSopSubmit = (data: Partial<OrgSop>) => {
    const newId = `sop_${Date.now()}`;
    const newSop: OrgSop = {
      id: newId,
      workspaceId,
      name: data.name || 'New SOP Checklist',
      trigger: data.trigger || 'When a trigger occurs',
      purpose: data.purpose || '',
      ownerPositionId: data.ownerPositionId || activePositionId,
      roleId: data.roleId || activeRoleId || undefined,
      steps: data.steps || ['Step 1'],
      requiredInformation: data.requiredInformation || ['Information required'],
      tags: data.tags || ['general'],
      completionCriteria: data.completionCriteria,
      notificationRules: data.notificationRules,
      escalationNotes: data.escalationNotes,
      requestCategories: data.requestCategories,
      status: data.status || 'active',
      includeInAskNestOps: data.includeInAskNestOps ?? true,
      includeInRetell: data.includeInRetell ?? true,
      includeInRouting: data.includeInRouting ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      sops: [...model.sops, newSop]
    });
    closeDrawer();
  };

  const handleEditSopSubmit = (id: string, updates: Partial<OrgSop>) => {
    const updated = model.sops.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s);
    markChanged({ ...model, sops: updated });
    closeDrawer();
  };

  const handleAddEscalationSubmit = (data: Partial<EscalationPolicy>) => {
    const newId = `esc_${Date.now()}`;
    const newEsc: EscalationPolicy = {
      id: newId,
      workspaceId,
      name: data.name || 'New Escalation Policy',
      trigger: data.trigger || 'Trigger event description',
      condition: data.condition || 'IF task overdue 24h',
      escalateToPositionId: data.escalateToPositionId || model.positions[0]?.id || '',
      responseWindow: data.responseWindow || '24 hours',
      urgency: data.urgency || 'normal',
      channels: data.channels || ['dashboard', 'email'],
      requiredContext: data.requiredContext || [],
      recommendedNextAction: data.recommendedNextAction || '',
      saveToKnowledgeBase: data.saveToKnowledgeBase ?? true,
      fallbackActivePositionId: data.fallbackActivePositionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    markChanged({
      ...model,
      escalationPolicies: [...model.escalationPolicies, newEsc]
    });
    closeDrawer();
  };

  const handleEditEscalationSubmit = (id: string, updates: Partial<EscalationPolicy>) => {
    const updated = model.escalationPolicies.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e);
    markChanged({ ...model, escalationPolicies: updated });
    closeDrawer();
  };

  const handleAddDocSubmit = (newDoc: OrgKnowledgeDocument) => {
    const updated = [...(model.knowledgeDocuments || []), newDoc];
    markChanged({ ...model, knowledgeDocuments: updated });
    closeDrawer();
  };

  const handleEditDocSubmit = (id: string, updates: Partial<OrgKnowledgeDocument>) => {
    const updated = (model.knowledgeDocuments || []).map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d);
    markChanged({ ...model, knowledgeDocuments: updated });
    closeDrawer();
  };

  // --- DELETE HELPER ---
  const deleteItem = async (type: 'position' | 'role' | 'sop' | 'escalation' | 'document', id: string) => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      if (type === 'position') {
        const remainingPos = model.positions.filter(p => p.id !== id);
        const remainingRoles = model.roles.filter(r => r.positionId !== id);
        const remainingMatrix = (model.routingMatrix || []).map(row => {
          let primary = row.primaryOwnerPositionId;
          let backup = row.backupOwnerPositionId;
          if (primary === id) primary = remainingPos[0]?.id || '';
          if (backup === id) backup = remainingPos[0]?.id || '';
          return { ...row, primaryOwnerPositionId: primary, backupOwnerPositionId: backup };
        });

        markChanged({
          ...model,
          positions: remainingPos,
          roles: remainingRoles,
          routingMatrix: remainingMatrix
        });
        if (activePositionId === id && remainingPos.length > 0) {
          selectPosition(remainingPos[0].id);
        }
      } else if (type === 'role') {
        const remainingRoles = model.roles.filter(r => r.id !== id);
        const updatedPositions = model.positions.map(p => ({
          ...p,
          roleIds: p.roleIds.filter(rid => rid !== id)
        }));
        markChanged({
          ...model,
          positions: updatedPositions,
          roles: remainingRoles
        });
        if (activeRoleId === id) {
          setActiveRoleId(remainingRoles.filter(r => r.positionId === activePositionId)[0]?.id || '');
        }
      } else if (type === 'sop') {
        const remainingSops = model.sops.filter(s => s.id !== id);
        markChanged({
          ...model,
          sops: remainingSops
        });
      } else if (type === 'escalation') {
        const remainingEsc = model.escalationPolicies.filter(e => e.id !== id);
        markChanged({
          ...model,
          escalationPolicies: remainingEsc
        });
      } else if (type === 'document') {
        try {
          await fetch(`/api/org-knowledge/${id}`, { method: 'DELETE' });
        } catch (e) {
          console.error("Delete call to API failed", e);
        }
        const remainingDocs = (model.knowledgeDocuments || []).filter(d => d.id !== id);
        markChanged({
          ...model,
          knowledgeDocuments: remainingDocs
        });
      }
    }
  };

  const toggleDocToggle = (docId: string, setting: 'includeInAskNestOps' | 'includeInRetell' | 'includeInRouting') => {
    const updated = (model.knowledgeDocuments || []).map(doc => {
      if (doc.id === docId) {
        const newVal = !doc[setting];
        // If updating backend, queue a silent PUT
        fetch(`/api/org-knowledge/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [setting]: newVal })
        }).catch(err => console.error("Failed putting setting update", err));

        return { ...doc, [setting]: newVal, updatedAt: new Date().toISOString() };
      }
      return doc;
    });
    markChanged({ ...model, knowledgeDocuments: updated });
  };

  const toggleSopSetting = (sopId: string, setting: 'includeInAskNestOps' | 'includeInRetell' | 'includeInRouting') => {
    const updated = model.sops.map(sop => {
      if (sop.id === sopId) {
        return { ...sop, [setting]: !sop[setting], updatedAt: new Date().toISOString() };
      }
      return sop;
    });
    markChanged({ ...model, sops: updated });
  };

  const handleRunDocExtraction = async (docId: string) => {
    try {
      const res = await fetch(`/api/org-knowledge/${docId}/extract`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.document) {
        const updated = (model.knowledgeDocuments || []).map(d => d.id === docId ? data.document : d);
        markChanged({ ...model, knowledgeDocuments: updated });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- PLAYGROUND MOCK NLP RUNNER ---
  const runTestPlayground = () => {
    const query = testQuery.toLowerCase();
    let category = 'Unknown owner';
    let primaryId = 'pos_ryan';
    let backupId = 'pos_bic';
    let sla = '24 hours';
    let matchedSops: OrgSop[] = [];
    let matchedEscalations: EscalationPolicy[] = [];

    // Simple keyword checks
    if (query.includes('coo') || query.includes('staff management') || query.includes('recruitment')) {
      category = 'Operations leadership';
      primaryId = 'pos_coo';
      backupId = 'pos_ryan';
      sla = '24 hours';
    } else if (query.includes('front') || query.includes('desk') || query.includes('reception') || query.includes('hospitality')) {
      category = 'Guest Services & Reception';
      primaryId = 'pos_front_desk';
      backupId = 'pos_coo';
      sla = '8 hours';
    } else if (query.includes('assistant') && (query.includes('virtual') || query.includes('posting') || query.includes('format'))) {
      category = 'Marketing / Admin Support';
      primaryId = 'pos_va';
      backupId = 'pos_melissa';
      sla = '24 hours';
    } else if (query.includes('ai') || query.includes('triage') || query.includes('bot') || query.includes('lookup')) {
      category = 'AI Intake Triage';
      primaryId = 'pos_ai_ops';
      backupId = 'pos_ann';
      sla = '5 minutes';
    } else if (query.includes('lockbox') || query.includes('key')) {
      category = 'Lockboxes / keys';
      primaryId = 'pos_ann';
      backupId = 'pos_ryan';
      sla = '12 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_lockbox');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_showing_blocked');
    } else if (query.includes('commission') || query.includes('pay') || query.includes('invoice') || query.includes('receipt') || query.includes('bill')) {
      category = 'Accounting / commissions';
      primaryId = 'pos_james';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_commission');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_deal_at_risk');
    } else if (query.includes('compliance') || query.includes('contract') || query.includes('legal') || query.includes('addendum')) {
      category = 'Compliance';
      primaryId = 'pos_bic';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_compliance');
      matchedEscalations = model.escalationPolicies.filter(e => e.id === 'esc_compliance_risk');
    } else if (query.includes('marketing') || query.includes('branding') || query.includes('flyer') || query.includes('card') || query.includes('social')) {
      category = 'Marketing request';
      primaryId = 'pos_melissa';
      backupId = 'pos_ryan';
      sla = '24 hours';
      matchedSops = model.sops.filter(s => s.id === 'sop_listing_launch');
    } else if (query.includes('office') || query.includes('room') || query.includes('supply')) {
      category = 'Office supplies';
      primaryId = 'pos_ann';
      backupId = 'pos_ryan';
      sla = '48 hours';
    }

    let futureOwnerName = '';
    let futureOwnerStatus = '';

    const originalPrimaryObj = model.positions.find(p => p.id === primaryId) || model.positions[0];
    const status = originalPrimaryObj?.status || 'active';

    if (status === 'open' || status === 'planned' || status === 'wanted') {
      futureOwnerName = originalPrimaryObj.name;
      futureOwnerStatus = status;

      // Find an active fallback owner
      let fallbackId = originalPrimaryObj.backupPositionId || originalPrimaryObj.reportsToPositionId || 'pos_ann';
      let fallbackObj = model.positions.find(p => p.id === fallbackId);
      if (!fallbackObj || (fallbackObj.status && fallbackObj.status !== 'active')) {
        fallbackId = 'pos_ann';
        fallbackObj = model.positions.find(p => p.id === fallbackId);
      }
      if (!fallbackObj || (fallbackObj.status && fallbackObj.status !== 'active')) {
        fallbackId = 'pos_ryan';
        fallbackObj = model.positions.find(p => p.id === fallbackId);
      }

      primaryId = fallbackId;
    }

    const primaryObj = model.positions.find(p => p.id === primaryId) || model.positions[0];
    const backupObj = model.positions.find(p => p.id === backupId) || model.positions[1];

    const matchedDocs = (model.knowledgeDocuments || []).filter(doc => 
      doc.requestCategories.includes(category) && doc.includeInRouting
    );

    setTestResult({
      category,
      primaryName: primaryObj?.name || 'Unassigned',
      primaryTitle: primaryObj?.title || 'Unknown Title',
      backupName: backupObj?.name || 'Unassigned',
      sla,
      sops: matchedSops,
      escalations: matchedEscalations,
      knowledgeDocuments: matchedDocs,
      futureOwnerName,
      futureOwnerStatus
    });
  };

  useEffect(() => {
    if (currentStep === 5) {
      runTestPlayground();
    }
  }, [currentStep, model]);

  // Unified items filter list for step 3
  const getFilteredSopsAndDocs = () => {
    const s = step3Search.toLowerCase();
    
    // 1. Filter manual sops
    const matchingSops = model.sops.filter(sop => {
      const matchesSearch = 
        sop.name.toLowerCase().includes(s) || 
        (sop.purpose || '').toLowerCase().includes(s) ||
        (sop.tags || []).some(t => t.toLowerCase().includes(s)) ||
        (sop.requestCategories || []).some(c => c.toLowerCase().includes(s));
      
      const matchesPosition = !activePositionId || sop.ownerPositionId === activePositionId;
      const matchesRole = !activeRoleId || sop.roleId === activeRoleId;

      if (!matchesSearch || !matchesPosition || !matchesRole) return false;

      if (step3Filter === 'manual_sop') return true;
      if (step3Filter === 'active') return sop.status !== 'draft';
      if (step3Filter === 'needs_review') return sop.status === 'needs_review';
      if (step3Filter === 'retell') return sop.includeInRetell === true;
      if (step3Filter === 'ask_nest_ops') return sop.includeInAskNestOps === true;
      
      // If filtering for PDFs/Docs/Links, manual sops are excluded
      if (['pdf', 'doc', 'link'].includes(step3Filter)) return false;

      return true; // step3Filter === 'all'
    });

    // 2. Filter uploaded documents & links
    const matchingDocs = (model.knowledgeDocuments || []).filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(s) ||
        (doc.fileName || '').toLowerCase().includes(s) ||
        (doc.aiSummary || '').toLowerCase().includes(s) ||
        doc.tags.some(t => t.toLowerCase().includes(s)) ||
        doc.requestCategories.some(c => c.toLowerCase().includes(s));

      const matchesPosition = !activePositionId || doc.ownerPositionId === activePositionId;
      const matchesRole = !activeRoleId || doc.ownerRoleId === activeRoleId;

      if (!matchesSearch || !matchesPosition || !matchesRole) return false;

      if (step3Filter === 'manual_sop') return false;
      if (step3Filter === 'pdf') return doc.sourceType === 'pdf';
      if (step3Filter === 'doc') return ['doc', 'docx'].includes(doc.sourceType);
      if (step3Filter === 'link') return doc.sourceType === 'link';
      if (step3Filter === 'active') return doc.status === 'active';
      if (step3Filter === 'needs_review') return doc.status === 'needs_review';
      if (step3Filter === 'retell') return doc.includeInRetell === true;
      if (step3Filter === 'ask_nest_ops') return doc.includeInAskNestOps === true;

      return true; // step3Filter === 'all'
    });

    return { sops: matchingSops, docs: matchingDocs };
  };

  const { sops: filteredStep3Sops, docs: filteredStep3Docs } = getFilteredSopsAndDocs();

  return (
    <>
      <div className="w-full h-full flex flex-col bg-[#01362D] text-[#F6F7F1] font-sans relative overflow-hidden border-none shadow-none">
      
      {/* --- HEADER ACTIONS --- */}
      <div className="sticky top-0 z-20 px-6 py-4 border-b border-[rgba(246,247,241,0.12)] bg-[#012620]/88 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 text-left visual-org-map-header">
        <div className="flex items-center gap-3">
          {(onClose || !embeddedTab) && (
            <button
              onClick={onClose || (() => window.location.assign('/app/settings'))}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[#D0D6BB] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back to Settings
            </button>
          )}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xs md:text-sm font-serif font-black uppercase tracking-wider text-white">
                {activeTab === 'visual' ? 'Visual Org Map' : activeTab === 'guided' ? 'Organization Chart Wizard' : 'Org Chart Wizard'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#00635C]/60 text-[#D0D6BB] text-[8px] font-bold font-mono tracking-wide uppercase border border-white/10">
                {workspaceName}
              </span>
              {hasChanges ? (
                <span className="text-[8px] text-amber-300 font-mono font-bold uppercase tracking-wider animate-pulse">Unsaved changes</span>
              ) : (
                <span className="text-[8px] text-[#D0D6BB]/50 font-mono uppercase tracking-wider">Saved</span>
              )}
            </div>
            <p className="text-[9px] md:text-[10px] text-[#D0D6BB] font-sans leading-none">
              {activeTab === 'visual' 
                ? 'See the operating structure, reporting lines, planned seats, and escalation paths.' 
                : 'Build the operating model that powers routing, SOPs, staffing plans, and escalations.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Export SOPs
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export KB
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              hasChanges 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20' 
                : 'bg-white/5 border border-white/5 text-[#D0D6BB]/40 cursor-default'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* --- STICKY MODE SWITCHER --- */}
      {!embeddedTab && (
        <div className="sticky top-0 z-10 px-6 py-3 border-b border-[rgba(246,247,241,0.12)] bg-[#013028]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 select-none shrink-0 text-left">
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
            {[
              { id: 'guided', label: 'Guided Builder' },
              { id: 'visual', label: 'Visual Org Map' },
              { id: 'routing', label: 'Routing Matrix' },
              { id: 'export', label: 'Export KB' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00635C] text-white shadow-lg border border-white/10'
                    : 'text-[#D0D6BB]/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

        {/* --- STEPPER PROGRESS BAR & MULTI-COLUMN LAYOUT --- */}
        {activeTab === 'guided' && (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-[#01362D] text-left">
            {/* Left Navigation: Vertical Stepper */}
            <div className="w-full md:w-60 shrink-0 bg-[#012a23] border-r border-white/10 p-5 flex flex-col justify-between select-none">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono">
                  Guided Progress
                </span>
                <div className="flex flex-col gap-2">
                  {[
                    { num: 1, label: 'Positions', desc: 'Seats' },
                    { num: 2, label: 'Roles', desc: 'Ownership' },
                    { num: 3, label: 'SOPs & Knowledge', desc: 'Knowledge Base' },
                    { num: 4, label: 'Escalations', desc: 'Rules' },
                    { num: 5, label: 'Preview', desc: 'AI Routing' }
                  ].map((step, idx) => {
                    const isCurrent = currentStep === step.num;
                    const isPast = currentStep > step.num;
                    return (
                      <button
                        key={step.num}
                        onClick={() => setCurrentStep(step.num as any)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                          isCurrent 
                            ? 'bg-[#00635C] border border-white/10 shadow-sm'
                            : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-[10px] font-black transition-all shrink-0 ${
                          isCurrent 
                            ? 'bg-emerald-400 border-emerald-300 text-[#01362D]' 
                            : isPast 
                              ? 'bg-[#00635C] border-[#00635C] text-white' 
                              : 'border-white/20 text-[#D0D6BB]/40'
                        }`}>
                          {step.num}
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                            isCurrent ? 'text-white' : 'text-[#D0D6BB]/75'
                          }`}>
                            {step.label}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/40 block">{step.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 border-t border-white/5 text-[9px] text-[#D0D6BB]/40 leading-relaxed font-sans">
                Follow this 5-step process to configure the full operational structure for {workspaceName}.
              </div>
            </div>

            {/* Center Column: Step Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="w-full max-w-5xl mx-auto space-y-6">
            
            {/* STEP HEADER TEXTS */}
            {currentStep === 1 && (() => {
              const openCount = model.positions.filter(p => p.status === 'open').length;
              const plannedCount = model.positions.filter(p => p.status === 'planned' || p.status === 'wanted').length;
              const aiCount = model.positions.filter(p => p.status === 'virtual_ai').length;

              const planningSeats = model.positions.filter(p => ['open', 'planned', 'wanted'].includes(p.status || ''));
              let highestPrioritySeat: OrgPosition | null = null;
              let maxPriorityVal = 0;
              const priorityMap: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };
              planningSeats.forEach(p => {
                const val = priorityMap[p.priority || 'normal'] || 2;
                if (val > maxPriorityVal) {
                  maxPriorityVal = val;
                  highestPrioritySeat = p;
                }
              });

              let totalMonthlyCost = 0;
              model.positions.forEach(p => {
                if (['open', 'planned', 'wanted'].includes(p.status || '') && p.estimatedCost) {
                  const matches = p.estimatedCost.match(/\d[\d,.]*/);
                  if (matches) {
                    const val = parseFloat(matches[0].replace(/,/g, ''));
                    if (!isNaN(val)) {
                      if (p.estimatedCost.toLowerCase().includes('yr') || p.estimatedCost.toLowerCase().includes('annual')) {
                        totalMonthlyCost += val / 12;
                      } else {
                        totalMonthlyCost += val;
                      }
                    }
                  }
                }
              });

              return (
                <div className="space-y-4 border-b border-white/5 pb-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">Who are the seats in the organization?</h3>
                      <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                        Configure the personnel or functional seats that represent task handlers and decision-makers in this workspace.
                      </p>
                    </div>
                    <button
                      onClick={() => openAddDrawer('position')}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + Add Position
                    </button>
                  </div>

                  {/* Planning Gaps Summary Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#012a23]/60 border border-white/10 p-4 rounded-2xl text-left">
                    <div className="md:col-span-4 border-b border-white/5 pb-2 mb-1 flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold uppercase text-amber-300">⚠️ Planning Gaps & Staffing Forecast</span>
                      <span className="text-[8px] font-mono text-[#D0D6BB]/50 uppercase">{openCount + plannedCount + aiCount} future seats identified</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Open Seats</span>
                      <strong className="text-white text-xs font-serif font-black block">{openCount} Approved Roles</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Planned Seats</span>
                      <strong className="text-white text-xs font-serif font-black block">{plannedCount} Future / Wanted</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Highest Priority Gap</span>
                      <strong className="text-amber-400 text-xs font-serif font-black block truncate">
                        {highestPrioritySeat ? (highestPrioritySeat as OrgPosition).name : 'None'}
                      </strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[7px] font-mono uppercase text-[#D0D6BB]/50 block">Est. Cost Impact</span>
                      <strong className="text-emerald-400 text-xs font-serif font-black block">
                        {totalMonthlyCost > 0 ? `$${Math.round(totalMonthlyCost).toLocaleString()}/mo` : 'TBD'}
                      </strong>
                    </div>
                  </div>

                  {/* Step 1 Filters Segmented Control */}
                  <div className="flex gap-1.5 bg-black/15 p-1 rounded-xl border border-white/5 max-w-md">
                    {(['all', 'active', 'open', 'planned', 'virtual_ai'] as const).map(filterType => (
                      <button
                        key={filterType}
                        type="button"
                        onClick={() => setPosStepFilter(filterType)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer ${
                          posStepFilter === filterType
                            ? 'bg-[#00635C] text-white'
                            : 'text-[#D0D6BB]/40 hover:text-white'
                        }`}
                      >
                        {filterType === 'virtual_ai' ? 'AI/Virtual' : filterType}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {currentStep === 2 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">What does each seat own?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Define operational roles and request categories assigned to each organizational seat.
                  </p>
                </div>
                <button
                  onClick={() => openAddDrawer('role')}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Role
                </button>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">How should that work be handled?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Upload policies, checklists, PDFs, templates, and instructions that help each role handle work correctly.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddDrawer('sop')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Create SOP
                  </button>
                  <button
                    onClick={() => openAddDrawer('document')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Upload Document
                  </button>
                  <button
                    onClick={() => openAddDrawer('link')}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] rounded-xl text-[9px] font-mono font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Add Link
                  </button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">What happens when something is late, risky, or unclear?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Configure automated rules to escalate tickets to backup owners or notify channels under custom operational triggers.
                  </p>
                </div>
                <button
                  onClick={() => openAddDrawer('escalation')}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-[rgba(246,247,241,0.18)] shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)] rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Escalation Policy
                </button>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider">How will Ask Nest Ops route real requests?</h3>
                  <p className="text-[11px] text-[#D0D6BB] mt-1 font-sans">
                    Simulate real-life agent scenarios to verify task ownership matching and checklist mapping rules.
                  </p>
                </div>
              </div>
            )}

            {/* STEP CONTENT SWITCH PANELS */}
            
            {/* --- STEP 1: POSITIONS --- */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {model.positions.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                    <User className="w-8 h-8 mx-auto text-[#D0D6BB]/50 mb-3" />
                    <p className="text-xs text-[#D0D6BB]">No positions yet. Add the first seat in the organization.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {model.positions
                      .filter(pos => {
                        const status = pos.status || 'active';
                        if (posStepFilter === 'all') return true;
                        if (posStepFilter === 'active') return status === 'active' || status === 'fractional' || status === 'outsourced';
                        if (posStepFilter === 'open') return status === 'open';
                        if (posStepFilter === 'planned') return status === 'planned' || status === 'wanted';
                        if (posStepFilter === 'virtual_ai') return status === 'virtual_ai';
                        return true;
                      })
                      .map(pos => {
                        const posRoles = model.roles.filter(r => r.positionId === pos.id);
                        const sopsCount = model.sops.filter(s => s.ownerPositionId === pos.id).length;
                        const escCount = model.escalationPolicies.filter(e => e.escalateToPositionId === pos.id).length;
                        const status = pos.status || 'active';
                        const isFuture = ['open', 'planned', 'wanted'].includes(status);
                        
                        let cardBorderClass = "border-white/10 hover:border-white/20";
                        if (status === 'virtual_ai') {
                          cardBorderClass = "border-emerald-500/30 hover:border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                        } else if (isFuture) {
                          cardBorderClass = "border-dashed border-white/20 hover:border-white/40";
                        }

                        return (
                          <div 
                            key={pos.id}
                            className={`bg-black/15 border rounded-2xl p-5 flex flex-col justify-between gap-5 relative hover:-translate-y-0.5 transition-all text-left ${cardBorderClass} ${status === 'planned' ? 'opacity-70 hover:opacity-100' : ''}`}
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  {status === 'active' || status === 'fractional' || status === 'outsourced' ? (
                                    <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={44} className="border border-[#D0D6BB]/20 shadow-sm" />
                                  ) : status === 'virtual_ai' ? (
                                    <div className="w-11 h-11 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                                      <span>🤖</span>
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-[#D0D6BB]/40">
                                      <span className="font-bold">+</span>
                                    </div>
                                  )}
                                  <div className="space-y-0.5">
                                    <h4 className="font-serif font-black text-xs text-white uppercase tracking-wide"><span>{pos.name}</span></h4>
                                    <span className="text-[10px] font-mono uppercase text-[#D0D6BB]/80 block">{pos.title}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-mono uppercase text-[#D0D6BB] shrink-0">
                                    {pos.department || 'Staff'}
                                  </span>
                                  {status !== 'active' && (
                                    <span className={`px-1.5 py-0.2 text-[6px] font-mono uppercase font-bold rounded ${
                                      status === 'open' ? 'bg-red-950/40 border border-red-500/30 text-red-300' :
                                      status === 'virtual_ai' ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300' :
                                      status === 'wanted' ? 'bg-emerald-950/40 border border-emerald-500/30 text-[#D0D6BB]' :
                                      status === 'planned' ? 'bg-blue-950/40 border border-blue-500/30 text-blue-300' :
                                      status === 'fractional' ? 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-300' :
                                      'bg-purple-950/40 border border-purple-500/30 text-purple-300'
                                    }`}>
                                      {status === 'virtual_ai' ? 'AI Agent' : status}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isFuture ? (
                                <div className="space-y-1 bg-white/5 p-2 rounded-xl text-[10px] font-mono text-[#D0D6BB] space-y-1">
                                  {pos.priority && (
                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                      <span>Priority:</span>
                                      <span className={`font-bold ${
                                        pos.priority === 'urgent' ? 'text-red-400' :
                                        pos.priority === 'high' ? 'text-amber-400' : 'text-white'
                                      }`}>{pos.priority.toUpperCase()}</span>
                                    </div>
                                  )}
                                  {pos.coverageGap && (
                                    <div className="pt-0.5 text-2xs truncate">
                                      Gap: <span className="text-white">{pos.coverageGap}</span>
                                    </div>
                                  )}
                                  {pos.estimatedCost && (
                                    <div className="pt-0.5 text-2xs">
                                      Cost: <span className="text-emerald-400">{pos.estimatedCost}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{posRoles.length}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">roles</span>
                                  </div>
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{sopsCount}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">SOPs</span>
                                  </div>
                                  <div className="bg-black/25 p-2 rounded-xl border border-white/5">
                                    <span className="text-white text-xs font-black block">{escCount}</span>
                                    <span className="text-[8px] text-[#D0D6BB]/40 block uppercase">escalations</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[9px] text-[#D0D6BB]/50 font-mono">
                              <span>{status === 'virtual_ai' ? 'Cloud Agent' : pos.office || 'Corporate'}</span>
                              <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={() => {
                                    setActivePositionId(pos.id);
                                    openAddDrawer('role');
                                  }}
                                  className="px-2 py-1 bg-white/5 hover:bg-white/10 text-[#D0D6BB] border border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                                  disabled={status === 'virtual_ai'}
                                  style={{ opacity: status === 'virtual_ai' ? 0.3 : 1 }}
                                >
                                  + Role
                                </button>
                                <button 
                                  onClick={() => openEditDrawer('position', pos.id)}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                                >
                                  Edit
                                </button>
                              <button 
                                onClick={() => deleteItem('position', pos.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-300 rounded-lg transition-colors border border-transparent hover:border-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* --- STEP 2: ROLES --- */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Position select list */}
                <div className="lg:col-span-1 space-y-2.5">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Select Position Seat</span>
                  <div className="space-y-1.5">
                    {model.positions.map(pos => {
                      const isSelected = activePositionId === pos.id;
                      const roleCount = model.roles.filter(r => r.positionId === pos.id).length;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => selectPosition(pos.id)}
                          className={`w-full p-3 rounded-xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/20 text-white font-bold' 
                              : 'bg-black/15 border-white/5 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <OrgAvatar name={pos.name} avatarUrl={pos.avatarUrl} avatarCrop={pos.avatarCrop} size={28} className="border border-white/5 shadow-sm" />
                            <div>
                              <span className="text-xs block leading-tight">{pos.name}</span>
                              <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/40 block mt-0.5">{pos.title}</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-black/25 text-[8px] font-mono text-white">
                            {roleCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Role editor summary */}
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Active Responsibilities & Mappings</span>
                  
                  {model.roles.filter(r => r.positionId === activePositionId).length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                      <p className="text-xs text-[#D0D6BB]">No roles mapped to this seat yet. Click "+ Add Role" to assign a responsibility.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {model.roles.filter(r => r.positionId === activePositionId).map(role => (
                        <div key={role.id} className="p-4 rounded-xl bg-black/15 border border-white/10 flex flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-white block">{role.name}</span>
                              <span className="px-2 py-0.5 rounded bg-black/20 text-[8px] font-mono text-[#D0D6BB] border border-white/5">
                                SLA: {role.defaultSla || '24h'}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#D0D6BB]/75 leading-relaxed font-sans">{role.description}</p>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-[#D0D6BB]/40 block">Assigned Request Categories</span>
                            <div className="flex flex-wrap gap-1">
                              {role.categories.map((c, i) => (
                                <span key={i} className="px-2 py-0.5 bg-[#00635C]/30 text-[#D0D6BB] text-[8px] rounded border border-white/5 font-mono">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-[#D0D6BB]/60 font-mono">
                            <span>SOP checklists: {model.sops.filter(s => s.roleId === role.id).length}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditDrawer('role', role.id)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded text-[9px] font-bold font-mono tracking-wide uppercase transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteItem('role', role.id)}
                                className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- STEP 3: SOPS & KNOWLEDGE --- */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Position & Role selectors & Filter lists */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Choose Position</span>
                    <select
                      value={activePositionId}
                      onChange={(e) => selectPosition(e.target.value)}
                      className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="">-- All Positions --</option>
                      {model.positions.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Choose Role</span>
                    <select
                      value={activeRoleId}
                      onChange={(e) => setActiveRoleId(e.target.value)}
                      className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="">-- All Roles --</option>
                      {model.roles.filter(r => !activePositionId || r.positionId === activePositionId).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filter Categories */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Source Filters</span>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'all', label: 'All Sources' },
                        { id: 'manual_sop', label: 'Manual SOPs' },
                        { id: 'pdf', label: 'PDF Files' },
                        { id: 'doc', label: 'Doc Files' },
                        { id: 'link', label: 'Links & Refs' },
                        { id: 'active', label: 'Active Only' },
                        { id: 'needs_review', label: 'Needs Review' },
                        { id: 'retell', label: 'Retell Synced' },
                        { id: 'ask_nest_ops', label: 'Ask Nest Ops' }
                      ].map(filterBtn => (
                        <button
                          key={filterBtn.id}
                          onClick={() => setStep3Filter(filterBtn.id as any)}
                          className={`w-full p-2 text-left text-[11px] rounded-lg transition-colors flex justify-between items-center cursor-pointer ${
                            step3Filter === filterBtn.id
                              ? 'bg-[#00635C] text-white font-bold'
                              : 'bg-black/10 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <span>{filterBtn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Cards displaying checklists, policies, pdfs, and links */}
                <div className="lg:col-span-3 space-y-4">
                  
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#D0D6BB]/60" />
                      <input
                        type="text"
                        value={step3Search}
                        onChange={(e) => setStep3Search(e.target.value)}
                        placeholder="Search SOP checklists and document files by title, tags, role, category..."
                        className="w-full pl-9 pr-4 py-2 bg-black/25 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Document & Checklist List */}
                  {filteredStep3Sops.length === 0 && filteredStep3Docs.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                      <FileText className="w-8 h-8 mx-auto text-[#D0D6BB]/30 mb-3" />
                      <p className="text-xs text-[#D0D6BB]">No matching SOPs or uploaded knowledge document assets found.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* 1. Manual SOPs Cards */}
                      {filteredStep3Sops.map(sop => {
                        const ownerPos = model.positions.find(p => p.id === sop.ownerPositionId);
                        return (
                          <div key={sop.id} className="p-4 rounded-2xl bg-black/15 border border-white/10 flex flex-col justify-between gap-3 text-left hover:border-white/15 transition-all">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span className="text-xs font-bold text-white block leading-tight">{sop.name}</span>
                                </div>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-mono text-emerald-300 tracking-wide uppercase">
                                  Manual SOP
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D0D6BB] leading-relaxed line-clamp-2">{sop.purpose}</p>
                              
                              <div className="bg-black/25 p-2 rounded-xl border border-white/5 text-[9px] font-mono space-y-1 text-[#D0D6BB]/90">
                                <div><strong className="text-white">Trigger:</strong> {sop.trigger}</div>
                                <div className="flex gap-4 pt-0.5">
                                  <span>Steps: <strong className="text-white">{sop.steps.length}</strong></span>
                                  <span>Required Fields: <strong className="text-white">{sop.requiredInformation.length}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Sync Status Toggles */}
                            <div className="border-t border-white/5 pt-2 space-y-2">
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInRouting ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInRouting')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Routing
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInRetell ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInRetell')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Retell KB
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={sop.includeInAskNestOps ?? true} 
                                    onChange={() => toggleSopSetting(sop.id, 'includeInAskNestOps')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Ask Nest Ops
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono text-[#D0D6BB]/40">
                                <span className="truncate max-w-[120px]">{ownerPos?.title || 'Unassigned Seat'}</span>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => openEditDrawer('sop', sop.id)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteItem('sop', sop.id)}
                                    className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* 2. Uploaded Documents & Links Cards */}
                      {filteredStep3Docs.map(doc => {
                        const ownerPos = model.positions.find(p => p.id === doc.ownerPositionId);
                        const isLink = doc.sourceType === 'link';
                        const docIcon = isLink ? <Link className="w-4 h-4 text-orange-400 shrink-0" /> : <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />;
                        
                        return (
                          <div key={doc.id} className="p-4 rounded-2xl bg-black/15 border border-white/10 flex flex-col justify-between gap-3 text-left hover:border-white/15 transition-all">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex items-center gap-2">
                                  {docIcon}
                                  <span className="text-xs font-bold text-white block leading-tight">{doc.title}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded border text-[8px] font-mono tracking-wide uppercase ${
                                  isLink 
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' 
                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                                }`}>
                                  {doc.sourceType.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D0D6BB] leading-relaxed line-clamp-2">{doc.aiSummary}</p>
                              
                              <div className="bg-black/25 p-2 rounded-xl border border-white/5 text-[9px] font-mono space-y-1 text-[#D0D6BB]/80">
                                <div><strong className="text-white">File Name:</strong> {doc.fileName || 'N/A'}</div>
                                <div className="flex justify-between">
                                  <span>Size: <strong className="text-white">{doc.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : 'N/A'}</strong></span>
                                  <div className="flex items-center gap-1">
                                    <span>Extraction: </span>
                                    <button
                                      disabled={doc.extractionStatus === 'extracted'}
                                      onClick={() => handleRunDocExtraction(doc.id)}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        doc.extractionStatus === 'extracted'
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                          : doc.extractionStatus === 'pending_extraction'
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20 hover:bg-amber-500/25 cursor-pointer'
                                            : 'bg-red-500/15 text-red-300 border border-red-500/20'
                                      }`}
                                    >
                                      {doc.extractionStatus.toUpperCase()}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sync Status Toggles */}
                            <div className="border-t border-white/5 pt-2 space-y-2">
                              <div className="flex flex-wrap gap-2 text-[9px] font-mono">
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInRouting} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInRouting')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Routing
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInRetell} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInRetell')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Retell KB
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer select-none text-[#D0D6BB] hover:text-white">
                                  <input 
                                    type="checkbox" 
                                    checked={doc.includeInAskNestOps} 
                                    onChange={() => toggleDocToggle(doc.id, 'includeInAskNestOps')}
                                    className="rounded border-white/20 bg-black/30 accent-emerald-600 w-3 h-3" 
                                  />
                                  Ask Nest Ops
                                </label>
                              </div>

                              <div className="flex items-center justify-between text-[9px] font-mono text-[#D0D6BB]/40">
                                <span className="truncate max-w-[120px]">{ownerPos?.title || 'Unassigned Seat'}</span>
                                <div className="flex gap-1">
                                  {doc.storagePath && (
                                    <a
                                      href={`/api/org-knowledge/${doc.id}/download`}
                                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                    >
                                      Download
                                    </a>
                                  )}
                                  <button
                                    onClick={() => openEditDrawer(isLink ? 'link' : 'document', doc.id)}
                                    className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/15 rounded text-[9px] font-bold uppercase transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => deleteItem('document', doc.id)}
                                    className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    </div>
                  )}

                </div>
              </div>
            )}

            {/* --- STEP 4: ESCALATIONS --- */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
                {/* Left Panel: Escalation selector lists */}
                <div className="lg:col-span-1 space-y-2.5">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Escalation Mappings</span>
                  <div className="space-y-1.5">
                    {model.escalationPolicies.map(esc => {
                      const isSelected = activeRoleId === esc.id; // Recycle state hook
                      return (
                        <button
                          key={esc.id}
                          onClick={() => openEditDrawer('escalation', esc.id)}
                          className={`w-full p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                            isSelected 
                              ? 'bg-white/10 border-white/20 text-white font-bold' 
                              : 'bg-black/15 border-white/5 text-[#D0D6BB] hover:bg-white/5'
                          }`}
                        >
                          <span className="text-xs block leading-tight">{esc.name}</span>
                          <span className="text-[8px] text-amber-300 font-mono uppercase block mt-0.5">{esc.urgency}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Panel: Rule editor summary */}
                <div className="lg:col-span-3 space-y-4">
                  <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Plain-English Rule Summary</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {model.escalationPolicies.map(esc => {
                      const target = model.positions.find(p => p.id === esc.escalateToPositionId);
                      
                      return (
                        <div key={esc.id} className="p-4 rounded-xl bg-black/15 border border-white/10 flex flex-col justify-between gap-4">
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold text-white block">{esc.name}</span>
                            <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 font-mono text-[9px] text-[#D0D6BB] leading-relaxed">
                              <div>
                                <span className="text-amber-300 uppercase font-bold">IF:</span> {esc.condition}
                              </div>
                              <div className="pt-1.5 border-t border-white/5 mt-1.5">
                                <span className="text-emerald-300 uppercase font-bold">THEN:</span> Escalate to <span className="inline-flex items-center gap-1"><OrgAvatar name={target ? target.name : ''} avatarUrl={target?.avatarUrl} avatarCrop={target?.avatarCrop} size={14} className="border border-white/10" /><strong className="text-white">{target ? target.name : 'Unknown'}</strong></span> ({esc.responseWindow} window)
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-[9px] text-[#D0D6BB]/60 font-mono">
                            <span>Channels: {(esc.channels || []).join(', ')}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditDrawer('escalation', esc.id)}
                                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded text-[9px] font-bold font-mono tracking-wide uppercase transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteItem('escalation', esc.id)}
                                className="p-1 hover:bg-red-500/20 text-red-300 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 5: PREVIEW & ROUTING MATRIX --- */}
            {currentStep === 5 && (
              <div className="space-y-6 text-left">
                
                {/* Routing preview tester */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  <div className="bg-black/15 border border-white/10 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Simulation Playground</span>
                      <p className="text-[10px] text-[#D0D6BB] mt-1 font-sans">
                        Select one of our preset request scenarios or type your own to verify routing mappings.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'I need a lockbox for 123 Oak Island Dr by tomorrow.',
                        'I need listing flyers for 456 River Wynd.',
                        'I have a commission question for a closing this week.',
                        'I have a compliance question about a contract.',
                        'The office AC is not working.'
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            setTestQuery(preset);
                            // Trigger match immediately
                            setTimeout(() => runTestPlayground(), 50);
                          }}
                          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono text-[#D0D6BB] text-left max-w-full truncate cursor-pointer transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <textarea
                        value={testQuery}
                        onChange={(e) => setTestQuery(e.target.value)}
                        placeholder="Type standard transaction request..."
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={runTestPlayground}
                      className="w-full py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-xl text-[9px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Run Simulation
                    </button>
                  </div>

                  <div className="bg-black/20 border border-white/10 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    {testResult ? (
                      <div className="space-y-4">
                        <div className="border-b border-white/5 pb-2">
                          <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/50 uppercase">Analysis Results</span>
                          <h4 className="text-xs font-bold text-white mt-1">Matched Category: <span className="text-emerald-300">{testResult.category}</span></h4>
                        </div>

                        {testResult.futureOwnerName && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] rounded-xl font-mono text-left space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-[11px]">
                              <span>⚠️ Staffing Gap Alert</span>
                            </div>
                            <p className="leading-relaxed">
                              This request maps to future seat <strong className="text-white">{testResult.futureOwnerName}</strong> (status: <span className="text-white font-bold">{testResult.futureOwnerStatus}</span>, which is not staffed yet).
                            </p>
                            <p className="leading-relaxed">
                              Routed to fallback active owner: <strong className="text-white">{testResult.primaryName}</strong>.
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                          <div className="bg-black/15 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[8px] text-[#D0D6BB] uppercase block">Primary Owner</span>
                            <strong className="text-white block mt-0.5">{testResult.primaryName}</strong>
                            <span className="text-[8px] text-[#D0D6BB]/40 block">{testResult.primaryTitle}</span>
                          </div>
                          <div className="bg-black/15 p-2.5 rounded-xl border border-white/5">
                            <span className="text-[8px] text-[#D0D6BB] uppercase block">Backup Owner</span>
                            <strong className="text-white block mt-0.5">{testResult.backupName}</strong>
                          </div>
                        </div>

                        <div className="space-y-2 text-[9px] font-mono text-[#D0D6BB]">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span>SLA Window:</span>
                            <span className="text-white font-bold">{testResult.sla}</span>
                          </div>
                        </div>

                        {testResult.sops.length > 0 && (
                          <div className="space-y-1 bg-teal-500/5 border border-teal-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-teal-300 uppercase block">Triggered SOP Checklist</span>
                            <span className="text-[10px] text-white font-bold block">{testResult.sops[0].name}</span>
                            <span className="text-[9px] text-[#D0D6BB] block truncate">{testResult.sops[0].purpose}</span>
                          </div>
                        )}

                        {testResult.knowledgeDocuments && testResult.knowledgeDocuments.length > 0 && (
                          <div className="space-y-1 bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-indigo-300 uppercase block">Triggered Knowledge Sources</span>
                            {testResult.knowledgeDocuments.map((doc: any) => (
                              <div key={doc.id} className="flex justify-between text-[10px] text-white">
                                <span className="font-bold">{doc.title}</span>
                                <span className="text-[8px] font-mono uppercase text-[#D0D6BB]/50">{doc.fileName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {testResult.escalations.length > 0 && (
                          <div className="space-y-1 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl">
                            <span className="text-[8px] font-mono font-bold text-amber-300 uppercase block">Escalation Policy</span>
                            <span className="text-[10px] text-white font-bold block">{testResult.escalations[0].name}</span>
                            <span className="text-[9px] text-[#D0D6BB] block">Condition: {testResult.escalations[0].condition}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-4">
                        <p className="text-[10px] text-[#D0D6BB]/60 italic">Submit a simulation query to preview routing outputs.</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* Routing Matrix Sub-table */}
                <div className="space-y-3.5 pt-4 border-t border-white/5">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Routing Matrix Mappings</span>
                    <p className="text-[10px] text-[#D0D6BB] font-sans mt-0.5">Edit category parameters directly below.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/25">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-[#D0D6BB] font-mono text-[9px] uppercase">
                          <th className="p-3">Category</th>
                          <th className="p-3">Primary Owner</th>
                          <th className="p-3">Backup Owner</th>
                          <th className="p-3">SLA</th>
                          <th className="p-3">Escalation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(model.routingMatrix || []).map((row, idx) => (
                          <tr key={idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/2">
                            <td className="p-3 font-semibold text-white">{row.category}</td>
                            <td className="p-3">
                              <select
                                value={row.primaryOwnerPositionId}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, primaryOwnerPositionId: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={row.backupOwnerPositionId}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, backupOwnerPositionId: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                {model.positions.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={row.sla}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, sla: e.target.value } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none text-xs font-mono w-24"
                              />
                            </td>
                            <td className="p-3">
                              <select
                                value={row.escalationPolicyId || ''}
                                onChange={(e) => {
                                  const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, escalationPolicyId: e.target.value || undefined } : r);
                                  markChanged({ ...model, routingMatrix: updated });
                                }}
                                className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                              >
                                <option value="">None (Standard SLA)</option>
                                {model.escalationPolicies.map(esc => (
                                  <option key={esc.id} value={esc.id}>{esc.name}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Stepper Footer Controls */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between shrink-0 select-none">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as any)}
              disabled={currentStep === 1}
              className={`px-4 py-2 border rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 1 
                  ? 'border-white/5 text-[#D0D6BB]/20 cursor-not-allowed' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={() => setCurrentStep(prev => Math.min(5, prev + 1) as any)}
              disabled={currentStep === 5}
              className={`px-4 py-2 border rounded-xl text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
                currentStep === 5 
                  ? 'border-white/5 text-[#D0D6BB]/20 cursor-not-allowed' 
                  : 'bg-[#00635C] hover:bg-[#004d47] border-white/20 text-white'
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {/* Right Column: Contextual Help & Forecast Panel */}
        <div className="w-full md:w-80 shrink-0 bg-[#012a23] border-l border-white/10 p-5 text-left flex flex-col gap-5 overflow-y-auto">
          {/* Section 1: Help/Tips depending on Step */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono border-b border-white/5 pb-1">
              Contextual Tips
            </span>
            {currentStep === 1 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Seats & Positions</h4>
                <p>Positions represent seats in the brokerage. You can configure active employees, planned recruits, fractional seats, and AI tools.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-amber-300">
                  <strong>Tip:</strong> Define open or planned positions to plan future team scaling.
                </p>
              </div>
            )}
            {currentStep === 2 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Roles & Responsibilities</h4>
                <p>Assign specific areas of responsibility (e.g. compliance, marketing) to seats so tickets route correctly.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-[#D0D6BB]">
                  <strong>Tip:</strong> An unstaffed seat's roles will automatically route to its fallback active manager.
                </p>
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">SOPs & Knowledge</h4>
                <p>Upload files or checklists. Ask Nest Ops uses these files to guide agents with exact execution details.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-[#D0D6BB]">
                  <strong>Tip:</strong> Attach checklists to the primary position that owns the operational workflow.
                </p>
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">Escalation Policies</h4>
                <p>Define logic rules (SLA windows, notification channels) for handoffs if the primary owner is slow to respond.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-amber-300">
                  <strong>Note:</strong> If the target position is unstaffed, choosing an active fallback manager is required.
                </p>
              </div>
            )}
            {currentStep === 5 && (
              <div className="space-y-3 text-xs text-[#D0D6BB] leading-relaxed">
                <h4 className="font-serif font-black text-white uppercase tracking-wider">AI Routing Playground</h4>
                <p>Type in mock client/agent requests to simulate ticket triage. Verify routing paths and check for staffing warnings.</p>
                <p className="bg-black/25 p-3 rounded-xl border border-white/5 font-mono text-[9px] text-emerald-400">
                  <strong>Example:</strong> Try typing: "The lockbox is jammed on Edgewater."
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Gaps & Planning Summary */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider block font-mono border-b border-white/5 pb-1">
              Hiring & Staffing Forecast
            </span>
            {(() => {
              const activeCount = model.positions.filter(p => !p.status || p.status === 'active' || p.status === 'fractional' || p.status === 'outsourced').length;
              const openCount = model.positions.filter(p => p.status === 'open' || p.status === 'wanted').length;
              const plannedCount = model.positions.filter(p => p.status === 'planned').length;
              const aiCount = model.positions.filter(p => p.status === 'virtual_ai').length;
              
              const priorityMap: Record<string, number> = { low: 1, normal: 2, high: 3, urgent: 4 };
              const neededSeats = model.positions
                .filter(p => ['open', 'planned', 'wanted'].includes(p.status || ''))
                .sort((a, b) => (priorityMap[b.priority || 'normal'] || 2) - (priorityMap[a.priority || 'normal'] || 2));

              return (
                <div className="space-y-3 font-mono text-[10px] text-[#D0D6BB]">
                  <div className="grid grid-cols-2 gap-2 text-center text-[9px]">
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <strong className="text-white text-xs block">{activeCount}</strong>
                      <span>Staffed</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                      <strong className="text-amber-400 text-xs block">{openCount + plannedCount}</strong>
                      <span>Gaps/Planned</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5 col-span-2">
                      <strong className="text-emerald-300 text-xs block">{aiCount} Positions</strong>
                      <span>AI Integrated Agents</span>
                    </div>
                  </div>

                  {neededSeats.length > 0 && (
                    <div className="space-y-2 border-t border-white/5 pt-3">
                      <span className="text-[9px] uppercase text-[#D0D6BB]/50 block font-bold">Needs Hiring/Staffing:</span>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {neededSeats.map(seat => (
                          <div key={seat.id} className="flex justify-between items-center bg-black/15 p-2 rounded-lg border border-white/5 text-[9px]">
                            <div className="truncate pr-1">
                              <div className="font-bold text-white truncate">{seat.name}</div>
                              <div className="text-[8px] text-[#D0D6BB]/60 truncate">{seat.title}</div>
                            </div>
                            <span className={`px-1.5 py-0.2 rounded font-bold shrink-0 text-[7px] uppercase ${
                              seat.priority === 'urgent' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              seat.priority === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-white/5 text-[#D0D6BB]'
                            }`}>
                              {seat.priority || 'normal'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      )}

        {activeTab === 'visual' && renderVisualOrgMap()}

        {activeTab === 'routing' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            <div className="w-full max-w-7xl mx-auto space-y-6 bg-black/10 p-6 border border-white/10 rounded-2xl">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#D0D6BB]/60 uppercase tracking-widest block">Routing Matrix Mappings</span>
                <p className="text-xs text-[#D0D6BB] font-sans mt-1">Configure default primary owners, backup owners, and SLAs for specific operational request categories.</p>
              </div>
              <div className="overflow-x-auto border border-white/10 rounded-2xl bg-black/25">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[#D0D6BB] font-mono text-[9px] uppercase">
                      <th className="p-3">Category</th>
                      <th className="p-3">Primary Owner</th>
                      <th className="p-3">Backup Owner</th>
                      <th className="p-3">SLA</th>
                      <th className="p-3">Escalation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(model.routingMatrix || []).map((row, idx) => (
                      <tr key={idx} className="border-b border-white/5 last:border-b-0 hover:bg-white/2">
                        <td className="p-3 font-semibold text-white">{row.category}</td>
                        <td className="p-3">
                          <select
                            value={row.primaryOwnerPositionId}
                            onChange={(e) => {
                              const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, primaryOwnerPositionId: e.target.value } : r);
                              markChanged({ ...model, routingMatrix: updated });
                            }}
                            className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                          >
                            {model.positions.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.backupOwnerPositionId}
                            onChange={(e) => {
                              const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, backupOwnerPositionId: e.target.value } : r);
                              markChanged({ ...model, routingMatrix: updated });
                            }}
                            className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                          >
                            {model.positions.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.sla}
                            onChange={(e) => {
                              const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, sla: e.target.value } : r);
                              markChanged({ ...model, routingMatrix: updated });
                            }}
                            className="p-1.5 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none text-xs font-mono w-24"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={row.escalationPolicyId || ''}
                            onChange={(e) => {
                              const updated = (model.routingMatrix || []).map((r, i) => i === idx ? { ...r, escalationPolicyId: e.target.value || undefined } : r);
                              markChanged({ ...model, routingMatrix: updated });
                            }}
                            className="p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white focus:outline-none text-xs cursor-pointer"
                          >
                            <option value="">None (Standard SLA)</option>
                            {model.escalationPolicies.map(esc => (
                              <option key={esc.id} value={esc.id}>{esc.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            <div className="w-full max-w-4xl mx-auto bg-black/35 p-6 rounded-3xl border border-white/10 text-xs text-[#D0D6BB] space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">Exported SOP Knowledge Markdown</h3>
                <button
                  onClick={() => {
                    const md = orgChartService.exportOrgChartToKnowledgeBase(workspaceId, model, 'all');
                    navigator.clipboard.writeText(md);
                    alert("Copied Standard Markdown to Clipboard!");
                  }}
                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/25 rounded-xl text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer"
                >
                  Copy to Clipboard
                </button>
              </div>
              <pre className="whitespace-pre-wrap select-text leading-relaxed font-mono overflow-auto max-h-[50vh] bg-black/40 p-4 rounded-xl border border-white/5">
                {orgChartService.exportOrgChartToKnowledgeBase(workspaceId, model, 'all')}
              </pre>
            </div>
          </div>
        )}

      </div>

      {/* --- CONTEXTUAL SLIDE DRAWERS --- */}
      {drawerOpen && (
        <OrgChartDrawerOverlay
          type={drawerType!}
          mode={drawerMode}
          id={editingId}
          model={model}
          onClose={closeDrawer}
          onSubmitPosition={drawerMode === 'add' ? handleAddPositionSubmit : (updates) => handleEditPositionSubmit(editingId!, updates)}
          onUpdatePositionInline={(posId, updates) => {
            const updated = model.positions.map(p => p.id === posId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
            markChanged({ ...model, positions: updated });
          }}
          onSubmitRole={drawerMode === 'add' ? handleAddRoleSubmit : (updates) => handleEditRoleSubmit(editingId!, updates)}
          onSubmitSop={drawerMode === 'add' ? handleAddSopSubmit : (updates) => handleEditSopSubmit(editingId!, updates)}
          onSubmitEscalation={drawerMode === 'add' ? handleAddEscalationSubmit : (updates) => handleEditEscalationSubmit(editingId!, updates)}
          onSubmitDocument={drawerMode === 'add' ? handleAddDocSubmit : (updates) => handleEditDocSubmit(editingId!, updates)}
          onSubmitLink={drawerMode === 'add' ? handleAddDocSubmit : (updates) => handleEditDocSubmit(editingId!, updates)} // Recycle handlers for simplicity
          preselectedPositionId={activePositionId || undefined}
        />
      )}

      {connectionDrawerOpen && (
        <OrgChartConnectionDrawer
          isOpen={connectionDrawerOpen}
          id={selectedConnectionId}
          model={model}
          onClose={() => { setConnectionDrawerOpen(false); setSelectedConnectionId(null); }}
          onSave={handleSaveConnectionSubmit}
          onDelete={handleDeleteConnection}
          from={connFrom}
          to={connTo}
          type={connType}
          label={connLabel}
          condition={connCondition}
          window={connWindow}
          sops={connSops}
          escalations={connEscalations}
          setFrom={setConnFrom}
          setTo={setConnTo}
          setType={setConnType}
          setLabel={setConnLabel}
          setCondition={setConnCondition}
          setWindow={setConnWindow}
          setSops={setConnSops}
          setEscalations={setConnEscalations}
        />
      )}

      {/* --- EXPORT OVERLAY MODAL --- */}
      {exportContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#013028] border border-white/20 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D0D6BB]" />
                Exported SOP Knowledge Markdown
              </h3>
              <button
                onClick={() => setExportContent(null)}
                className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Export Settings */}
            <div className="grid grid-cols-2 gap-4 bg-black/20 p-3 rounded-2xl border border-white/5 text-[11px] font-sans">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold font-mono text-[#D0D6BB] uppercase">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => {
                    setExportFormat(e.target.value as any);
                    setTimeout(() => handleExport(), 50);
                  }}
                  className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white focus:outline-none cursor-pointer"
                >
                  <option value="standard">Standard Markdown (Ask Nest Ops & Wiki)</option>
                  <option value="retell">Retell Voice Agent optimized Markdown</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold font-mono text-[#D0D6BB] uppercase">Active Filters</label>
                <select
                  value={exportFilter}
                  disabled={exportFormat === 'retell'}
                  onChange={(e) => {
                    setExportFilter(e.target.value as any);
                    setTimeout(() => handleExport(), 50);
                  }}
                  className="w-full p-2 bg-[#012620] border border-white/10 rounded-xl text-white focus:outline-none cursor-pointer disabled:opacity-40"
                >
                  <option value="all">Export All Documents</option>
                  <option value="ask_nest_ops">Ask Nest Ops Integrated Only</option>
                  <option value="retell">Retell Voice Agent Integrated Only</option>
                  <option value="active">Active/Needs Review Only</option>
                </select>
              </div>
            </div>

            <textarea
              readOnly
              value={exportContent}
              className="flex-1 w-full p-4 bg-black/30 border border-white/10 rounded-2xl text-[10px] text-white font-mono focus:outline-none resize-none leading-relaxed h-[360px]"
            />

            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={triggerSync}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Sync to Ask Nest Ops
                </button>
                {syncStatus === 'syncing' && (
                  <span className="text-[9px] text-[#D0D6BB] animate-pulse">Syncing...</span>
                )}
                {syncStatus === 'queued' && (
                  <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Queued
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportContent);
                    alert('SOP Knowledge Markdown copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/10 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setExportContent(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold font-mono uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            {syncStatus === 'queued' && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] rounded-xl font-mono text-center">
                Knowledge sync queued: Vector database update will take effect in a few minutes.
              </div>
            )}
          </div>
        </div>
      )}

    </>
  );
}

// --- CONTEXTUAL DRAWER OVERLAY SUBCOMPONENT ---
interface DrawerOverlayProps {
  type: 'position' | 'role' | 'sop' | 'escalation' | 'document' | 'link';
  mode: 'add' | 'edit';
  id: string | null;
  model: OrgModel;
  onClose: () => void;
  onSubmitPosition: (data: Partial<OrgPosition>) => void;
  onUpdatePositionInline?: (id: string, updates: Partial<OrgPosition>) => void;
  onSubmitRole: (data: Partial<OrgRole>) => void;
  onSubmitSop: (data: Partial<OrgSop>) => void;
  onSubmitEscalation: (data: Partial<EscalationPolicy>) => void;
  onSubmitDocument: (data: OrgKnowledgeDocument) => void;
  onSubmitLink: (data: OrgKnowledgeDocument) => void;
  preselectedPositionId?: string;
}

function OrgChartDrawerOverlay({
  type, mode, id, model, onClose, onSubmitPosition, onUpdatePositionInline, onSubmitRole, onSubmitSop, onSubmitEscalation, onSubmitDocument, onSubmitLink, preselectedPositionId
}: DrawerOverlayProps) {

  // A. Local State for Position
  const [posName, setPosName] = useState('');
  const [posTitle, setPosTitle] = useState('');
  const [posDept, setPosDept] = useState('Operations');
  const [posOffice, setPosOffice] = useState('Wilmington');
  const [posEmail, setPosEmail] = useState('');
  const [posPhone, setPosPhone] = useState('');
  const [posReports, setPosReports] = useState('');
  const [posBackup, setPosBackup] = useState('');
  const [posVisibility, setPosVisibility] = useState<'internal' | 'leadership' | 'admin'>('internal');
  const [posAvatarUrl, setPosAvatarUrl] = useState('');
  const [posAvatarCrop, setPosAvatarCrop] = useState<AvatarCropSettings>({ x: 0, y: 0, scale: 1.2, rotation: 0, cropShape: 'circle', objectPosition: '50% 50%' });
  const [cropEditorOpen, setCropEditorOpen] = useState(false);
  const [posStatus, setPosStatus] = useState<OrgPositionStatus>('active');
  const [posTargetHireDate, setPosTargetHireDate] = useState('');
  const [posPriority, setPosPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [posEstimatedCost, setPosEstimatedCost] = useState('');
  const [posBusinessCase, setPosBusinessCase] = useState('');
  const [posHiringNotes, setPosHiringNotes] = useState('');
  const [posCoverageGap, setPosCoverageGap] = useState('');

  // B. Local State for Role
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [roleSla, setRoleSla] = useState('24 hours');
  const [rolePosId, setRolePosId] = useState('');
  const [roleCategories, setRoleCategories] = useState<string[]>(['Other / Unknown']);
  const [roleBackupOwner, setRoleBackupOwner] = useState('');

  // C. Local State for SOP
  const [sopName, setSopName] = useState('');
  const [sopTrigger, setSopTrigger] = useState('');
  const [sopPurpose, setSopPurpose] = useState('');
  const [sopOwner, setSopOwner] = useState('');
  const [sopRoleId, setSopRoleId] = useState('');
  const [sopSteps, setSopSteps] = useState<string[]>(['Step 1']);
  const [sopFields, setSopFields] = useState<string[]>(['Required Parameter']);
  const [sopTags, setSopTags] = useState<string[]>(['general']);
  const [sopCompletionCriteria, setSopCompletionCriteria] = useState('');
  const [sopNotificationRules, setSopNotificationRules] = useState('');
  const [sopEscalationNotes, setSopEscalationNotes] = useState('');
  const [sopCategories, setSopCategories] = useState<string[]>([]);
  const [sopStatus, setSopStatus] = useState<OrgKnowledgeStatus>('active');
  const [sopIncludeAsk, setSopIncludeAsk] = useState(true);
  const [sopIncludeRetell, setSopIncludeRetell] = useState(true);
  const [sopIncludeRouting, setSopIncludeRouting] = useState(true);

  // D. Local State for Escalation Policy
  const [escName, setEscName] = useState('');
  const [escTrigger, setEscTrigger] = useState('');
  const [escCondition, setEscCondition] = useState('IF task overdue by 24h');
  const [escTarget, setEscTarget] = useState('');
  const [escFallbackTarget, setEscFallbackTarget] = useState('');
  const [escWindow, setEscWindow] = useState('24 hours');
  const [escUrgency, setEscUrgency] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [escChannels, setEscChannels] = useState<Array<'dashboard' | 'email' | 'sms' | 'phone' | 'slack' | 'teams'>>(['dashboard', 'email']);
  const [escContext, setEscContext] = useState<string[]>([]);
  const [escAction, setEscAction] = useState('');
  const [escSaveToKb, setEscSaveToKb] = useState(true);

  // E. Local State for Document Upload
  const [docTitle, setDocTitle] = useState('');
  const [docOwnerPosition, setDocOwnerPosition] = useState('');
  const [docOwnerRole, setDocOwnerRole] = useState('');
  const [docCategories, setDocCategories] = useState<string[]>([]);
  const [docTags, setDocTags] = useState<string[]>([]);
  const [docClassType, setDocClassType] = useState<'policy' | 'sop' | 'checklist' | 'template' | 'training_guide' | 'vendor_document' | 'compliance_reference' | 'marketing_reference' | 'accounting_reference' | 'other'>('policy');
  const [docStatus, setDocStatus] = useState<OrgKnowledgeStatus>('active');
  const [docIncludeAsk, setDocIncludeAsk] = useState(true);
  const [docIncludeRetell, setDocIncludeRetell] = useState(true);
  const [docIncludeRouting, setDocIncludeRouting] = useState(true);
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileName, setDocFileName] = useState('');
  const [docFileSize, setDocFileSize] = useState(0);
  const [docFileContentBase64, setDocFileContentBase64] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // F. Local State for Link Reference
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOwnerPosition, setLinkOwnerPosition] = useState('');
  const [linkOwnerRole, setLinkOwnerRole] = useState('');
  const [linkCategories, setLinkCategories] = useState<string[]>([]);
  const [linkTags, setLinkTags] = useState<string[]>([]);
  const [linkStatus, setLinkStatus] = useState<OrgKnowledgeStatus>('active');
  const [linkIncludeAsk, setLinkIncludeAsk] = useState(true);
  const [linkIncludeRetell, setLinkIncludeRetell] = useState(true);
  const [linkIncludeRouting, setLinkIncludeRouting] = useState(true);
  const [linkNotes, setLinkNotes] = useState('');

  // Sync / Load edit data
  useEffect(() => {
    if (mode === 'edit' && id) {
      if (type === 'position') {
        const item = model.positions.find(p => p.id === id);
        if (item) {
          setPosName(item.name);
          setPosTitle(item.title);
          setPosDept(item.department || 'Operations');
          setPosOffice(item.office || 'Wilmington');
          setPosEmail(item.email || '');
          setPosPhone(item.phone || '');
          setPosReports(item.reportsToPositionId || '');
          setPosBackup(item.backupPositionId || '');
          setPosVisibility(item.visibilityLevel || 'internal');
          setPosAvatarUrl(item.avatarUrl || '');
          setPosAvatarCrop(item.avatarCrop || { x: 0, y: 0, scale: 1.2, rotation: 0, cropShape: 'circle', objectPosition: '50% 50%' });
          setPosStatus(item.status || 'active');
          setPosTargetHireDate(item.targetHireDate || '');
          setPosPriority(item.priority || 'normal');
          setPosEstimatedCost(item.estimatedCost || '');
          setPosBusinessCase(item.businessCase || '');
          setPosHiringNotes(item.hiringNotes || '');
          setPosCoverageGap(item.coverageGap || '');
        }
      } else if (type === 'role') {
        const item = model.roles.find(r => r.id === id);
        if (item) {
          setRoleName(item.name);
          setRoleDesc(item.description);
          setRoleSla(item.defaultSla || '24 hours');
          setRolePosId(item.positionId);
          setRoleCategories(item.categories || []);
          setRoleBackupOwner(item.backupOwnerPositionId || '');
        }
      } else if (type === 'sop') {
        const item = model.sops.find(s => s.id === id);
        if (item) {
          setSopName(item.name);
          setSopTrigger(item.trigger);
          setSopPurpose(item.purpose || '');
          setSopOwner(item.ownerPositionId);
          setSopRoleId(item.roleId || '');
          setSopSteps(item.steps || ['Step 1']);
          setSopFields(item.requiredInformation || ['Required Field']);
          setSopTags(item.tags || ['general']);
          setSopCompletionCriteria(item.completionCriteria || '');
          setSopNotificationRules(item.notificationRules || '');
          setSopEscalationNotes(item.escalationNotes || '');
          setSopCategories(item.requestCategories || []);
          setSopStatus(item.status || 'active');
          setSopIncludeAsk(item.includeInAskNestOps ?? true);
          setSopIncludeRetell(item.includeInRetell ?? true);
          setSopIncludeRouting(item.includeInRouting ?? true);
        }
      } else if (type === 'escalation') {
        const item = model.escalationPolicies.find(e => e.id === id);
        if (item) {
          setEscName(item.name);
          setEscTrigger(item.trigger);
          setEscCondition(item.condition);
          setEscTarget(item.escalateToPositionId);
          setEscFallbackTarget(item.fallbackActivePositionId || '');
          setEscWindow(item.responseWindow);
          setEscUrgency(item.urgency || 'normal');
          setEscChannels(item.channels || ['dashboard', 'email']);
          setEscContext(item.requiredContext || []);
          setEscAction(item.recommendedNextAction || '');
          setEscSaveToKb(item.saveToKnowledgeBase ?? true);
        }
      } else if (type === 'document' || type === 'link') {
        const item = (model.knowledgeDocuments || []).find(d => d.id === id);
        if (item) {
          if (type === 'document') {
            setDocTitle(item.title);
            setDocOwnerPosition(item.ownerPositionId || '');
            setDocOwnerRole(item.ownerRoleId || '');
            setDocCategories(item.requestCategories || []);
            setDocTags(item.tags || []);
            setDocClassType(item.documentType || 'policy');
            setDocStatus(item.status || 'active');
            setDocIncludeAsk(item.includeInAskNestOps);
            setDocIncludeRetell(item.includeInRetell);
            setDocIncludeRouting(item.includeInRouting);
            setDocNotes(item.aiSummary || '');
            setDocFileName(item.fileName || '');
            setDocFileSize(item.fileSizeBytes || 0);
          } else {
            setLinkTitle(item.title);
            setLinkUrl(item.sourceUrl || '');
            setLinkOwnerPosition(item.ownerPositionId || '');
            setLinkOwnerRole(item.ownerRoleId || '');
            setLinkCategories(item.requestCategories || []);
            setLinkTags(item.tags || []);
            setLinkStatus(item.status || 'active');
            setLinkIncludeAsk(item.includeInAskNestOps);
            setLinkIncludeRetell(item.includeInRetell);
            setLinkIncludeRouting(item.includeInRouting);
            setLinkNotes(item.aiSummary || '');
          }
        }
      }
    } else {
      // Set defaults for adds
      const defaultPosId = preselectedPositionId || (model.positions.length > 0 ? model.positions[0].id : '');
      if (defaultPosId) {
        setRolePosId(defaultPosId);
        setSopOwner(defaultPosId);
        setEscTarget(defaultPosId);
        setDocOwnerPosition(defaultPosId);
        setLinkOwnerPosition(defaultPosId);
        
        const posRoles = model.roles.filter(r => r.positionId === defaultPosId);
        if (posRoles.length > 0) {
          setSopRoleId(posRoles[0].id);
          setDocOwnerRole(posRoles[0].id);
          setLinkOwnerRole(posRoles[0].id);
        }
      }
    }
  }, [mode, id, type, model, preselectedPositionId]);

  // Handle position select updates in drawer forms
  const handlePositionChange = (posId: string, form: 'sop' | 'doc' | 'link') => {
    const roles = model.roles.filter(r => r.positionId === posId);
    const firstRoleId = roles.length > 0 ? roles[0].id : '';
    
    if (form === 'sop') {
      setSopOwner(posId);
      setSopRoleId(firstRoleId);
    } else if (form === 'doc') {
      setDocOwnerPosition(posId);
      setDocOwnerRole(firstRoleId);
    } else if (form === 'link') {
      setLinkOwnerPosition(posId);
      setLinkOwnerRole(firstRoleId);
    }
  };

  const handlePreFillRole = (templateName: string) => {
    if (templateName === 'Agent Onboarding') {
      setRoleName('Agent setup and onboarding');
      setRoleDesc('Coordinating initial software login details, license registration, and corporate access.');
      setRoleSla('24 hours');
      setRoleCategories(['IT / systems', 'Office supplies']);
    } else if (templateName === 'Listing Launch') {
      setRoleName('Listing marketing launch');
      setRoleDesc('Coordinating MLS parameters, photographer timelines, and marketing material distribution.');
      setRoleSla('12 hours');
      setRoleCategories(['Listing marketing', 'Marketing request']);
    } else if (templateName === 'Lockbox & Signage') {
      setRoleName('Sign and lockbox management');
      setRoleDesc('Handling Lockbox key access codes and local yard riders.');
      setRoleSla('12 hours');
      setRoleCategories(['Lockboxes / keys', 'Signs / riders']);
    }
  };

  const handlePreFillSop = (templateName: string) => {
    if (templateName === 'New-hire setup') {
      setSopName('New-hire setup');
      setSopTrigger('Agent onboarding agreement signed');
      setSopPurpose('Set up agent tool accounts.');
      setSopSteps(['Create email profile', 'Add to Slack workspace', 'Order default print business cards']);
      setSopFields(['Agent Full Name', 'Start Date', 'Support tier']);
      setSopTags(['onboarding', 'operations']);
    } else if (templateName === 'Listing launch checklist') {
      setSopName('Listing launch checklist');
      setSopTrigger('Listing agreement executed in Dotloop');
      setSopPurpose('Prepare new property advertising.');
      setSopSteps(['Confirm MLS draft fields', 'Schedule photographer arrival', 'Coordinate sign post install']);
      setSopFields(['Property Address', 'List Price', 'Showing instructions']);
      setSopTags(['marketing', 'listing']);
    } else if (templateName === 'Lockbox issue') {
      setSopName('Lockbox issue');
      setSopTrigger('Lockbox Jam or battery dead at property');
      setSopPurpose('Provide emergency property entry code.');
      setSopSteps(['Lookup device serial', 'Locate master backup code', 'Dispatch runner with replacement lockbox']);
      setSopFields(['Property Address', 'Serial code']);
      setSopTags(['lockbox', 'operations']);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocFile(file);
    setDocFileName(file.name);
    setDocFileSize(file.size);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setDocFileContentBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (type === 'position') {
      onSubmitPosition({
        name: posName,
        title: posTitle,
        department: posDept,
        office: posOffice,
        email: posEmail,
        phone: posPhone,
        reportsToPositionId: posReports || undefined,
        backupPositionId: posBackup || undefined,
        visibilityLevel: posVisibility,
        avatarUrl: posAvatarUrl || undefined,
        avatarCrop: posAvatarCrop,
        status: posStatus,
        targetHireDate: posTargetHireDate || undefined,
        priority: posPriority,
        estimatedCost: posEstimatedCost || undefined,
        businessCase: posBusinessCase || undefined,
        hiringNotes: posHiringNotes || undefined,
        coverageGap: posCoverageGap || undefined
      });
    } else if (type === 'role') {
      onSubmitRole({
        positionId: rolePosId,
        name: roleName,
        description: roleDesc,
        categories: roleCategories,
        defaultSla: roleSla,
        backupOwnerPositionId: roleBackupOwner || undefined
      });
    } else if (type === 'sop') {
      onSubmitSop({
        name: sopName,
        trigger: sopTrigger,
        purpose: sopPurpose,
        ownerPositionId: sopOwner,
        roleId: sopRoleId || undefined,
        steps: sopSteps,
        requiredInformation: sopFields,
        tags: sopTags,
        completionCriteria: sopCompletionCriteria || undefined,
        notificationRules: sopNotificationRules || undefined,
        escalationNotes: sopEscalationNotes || undefined,
        requestCategories: sopCategories,
        status: sopStatus,
        includeInAskNestOps: sopIncludeAsk,
        includeInRetell: sopIncludeRetell,
        includeInRouting: sopIncludeRouting
      });
    } else if (type === 'escalation') {
      const targetPos = model.positions.find(p => p.id === escTarget);
      const targetStatus = targetPos?.status || 'active';
      if (['open', 'planned', 'wanted'].includes(targetStatus) && !escFallbackTarget) {
        alert('Please select an active fallback owner for this unstaffed escalation target.');
        return;
      }
      onSubmitEscalation({
        name: escName,
        trigger: escTrigger,
        condition: escCondition,
        escalateToPositionId: escTarget,
        fallbackActivePositionId: escFallbackTarget || undefined,
        responseWindow: escWindow,
        urgency: escUrgency,
        channels: escChannels,
        requiredContext: escContext,
        recommendedNextAction: escAction,
        saveToKnowledgeBase: escSaveToKb
      });
    } else if (type === 'document') {
      if (mode === 'add') {
        if (!docFileContentBase64) {
          setUploadError('Please select a valid document file to upload.');
          return;
        }
        setUploading(true);
        try {
          const res = await fetch('/api/org-knowledge/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspaceId: model.positions[0]?.workspaceId || 'nest-realty-demo',
              fileName: docFileName,
              fileContent: docFileContentBase64,
              ownerPositionId: docOwnerPosition || undefined,
              ownerRoleId: docOwnerRole || undefined,
              requestCategories: docCategories,
              tags: docTags,
              documentType: docClassType,
              includeInAskNestOps: docIncludeAsk,
              includeInRetell: docIncludeRetell,
              includeInRouting: docIncludeRouting
            })
          });
          const data = await res.json();
          setUploading(false);
          if (data.success && data.document) {
            onSubmitDocument(data.document);
          } else {
            setUploadError(data.error || 'Failed uploading document.');
          }
        } catch (err: any) {
          setUploading(false);
          setUploadError(err.message || 'Error occurred uploading file.');
        }
      } else {
        // Edit Mode
        const updates = {
          title: docTitle,
          ownerPositionId: docOwnerPosition || undefined,
          ownerRoleId: docOwnerRole || undefined,
          requestCategories: docCategories,
          tags: docTags,
          documentType: docClassType,
          status: docStatus,
          includeInAskNestOps: docIncludeAsk,
          includeInRetell: docIncludeRetell,
          includeInRouting: docIncludeRouting,
          aiSummary: docNotes
        };
        onSubmitDocument({ id: id!, ...updates } as any);
      }
    } else if (type === 'link') {
      if (mode === 'add') {
        const newLinkDoc: OrgKnowledgeDocument = {
          id: `kd_link_${Date.now()}`,
          workspaceId: model.positions[0]?.workspaceId || 'nest-realty-demo',
          title: linkTitle || 'Reference Link',
          sourceType: 'link',
          documentType: 'other',
          ownerPositionId: linkOwnerPosition || undefined,
          ownerRoleId: linkOwnerRole || undefined,
          requestCategories: linkCategories,
          tags: linkTags,
          status: linkStatus,
          sourceUrl: linkUrl,
          aiSummary: linkNotes,
          extractionStatus: 'extracted',
          includeInAskNestOps: linkIncludeAsk,
          includeInRetell: linkIncludeRetell,
          includeInRouting: linkIncludeRouting,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSubmitLink(newLinkDoc);
      } else {
        const updates = {
          title: linkTitle,
          sourceUrl: linkUrl,
          ownerPositionId: linkOwnerPosition || undefined,
          ownerRoleId: linkOwnerRole || undefined,
          requestCategories: linkCategories,
          tags: linkTags,
          status: linkStatus,
          aiSummary: linkNotes,
          includeInAskNestOps: linkIncludeAsk,
          includeInRetell: linkIncludeRetell,
          includeInRouting: linkIncludeRouting
        };
        onSubmitLink({ id: id!, ...updates } as any);
      }
    }
  };

  const allCategories = [
    'Agent question', 'Compliance', 'Contract / transaction issue',
    'Accounting / commissions', 'Payables / bills / receipts', 'Marketing request',
    'Listing marketing', 'Agent branding', 'Business cards / print materials',
    'Signs / riders', 'Lockboxes / keys', 'Office supplies', 'Room reservation',
    'Vendor / maintenance', 'Event support', 'IT / systems', 'Leadership decision'
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="w-full max-w-lg bg-[#013028] border-l border-white/20 h-full flex flex-col justify-between text-left p-6 shadow-2xl relative animate-slide-in"
      >
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div>
              <span className="text-[9px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider block">
                Drawer Config
              </span>
              <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider mt-0.5">
                {mode === 'add' ? 'Add' : 'Edit'} {type === 'document' ? 'Document' : type === 'link' ? 'Link Reference' : type.toUpperCase()}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
            
            {/* A. POSITION FIELDS */}
            {type === 'position' && (
              <div className="space-y-4">
                {/* Position Status Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Position Type</label>
                  <select
                    value={posStatus}
                    onChange={(e) => setPosStatus(e.target.value as OrgPositionStatus)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active employee / current seat</option>
                    <option value="open">Open role — approved but not hired</option>
                    <option value="wanted">Wanted role — needed but not approved yet</option>
                    <option value="planned">Planned future role</option>
                    <option value="fractional">Fractional / contractor</option>
                    <option value="outsourced">Outsourced partner</option>
                    <option value="virtual_ai">Virtual / AI role</option>
                  </select>
                </div>

                {/* Conditional Fields based on posStatus */}
                {posStatus === 'active' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Person Name</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. Ann Gunn"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Job Title / Seat</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. Operations Director"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                        <select
                          value={posDept}
                          onChange={(e) => setPosDept(e.target.value)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                        >
                          <option value="Operations">Operations</option>
                          <option value="Leadership">Leadership</option>
                          <option value="Accounting">Accounting</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Compliance">Compliance</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Office Location</label>
                        <input
                          type="text"
                          value={posOffice}
                          onChange={(e) => setPosOffice(e.target.value)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Email</label>
                        <input
                          type="email"
                          value={posEmail}
                          onChange={(e) => setPosEmail(e.target.value)}
                          placeholder="name@nestrealty.com"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Phone</label>
                        <input
                          type="text"
                          value={posPhone}
                          onChange={(e) => setPosPhone(e.target.value)}
                          placeholder="910-555-0100"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner</label>
                      <select
                        value={posBackup}
                        onChange={(e) => setPosBackup(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (No Backup)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Visibility Level</label>
                      <select
                        value={posVisibility}
                        onChange={(e) => setPosVisibility(e.target.value as any)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="internal">Internal (All Staff)</option>
                        <option value="leadership">Leadership Only</option>
                        <option value="admin">Admin / Compliance Board Only</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Avatar / Profile Image URL</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="text"
                          value={posAvatarUrl}
                          onChange={(e) => setPosAvatarUrl(e.target.value)}
                          placeholder="e.g. /org-avatars/ryan.png"
                          className="flex-1 p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                        <div className="shrink-0 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-mono text-[#D0D6BB]/40 uppercase">Preview</span>
                          <OrgAvatar name={posName} avatarUrl={posAvatarUrl} avatarCrop={posAvatarCrop} size={36} className="border border-white/10" />
                        </div>
                      </div>
                      {posAvatarUrl && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setCropEditorOpen(true)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded text-[8px] font-mono font-bold uppercase transition-colors cursor-pointer"
                          >
                            Edit Crop
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Open / Wanted / Planned / Fractional / Outsourced form layout */}
                {['open', 'wanted', 'planned', 'fractional', 'outsourced'].includes(posStatus) && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Seat Name / Identifier</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. COO, Front Desk Assistant"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Proposed Job Title</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. Chief Operating Officer"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                      <select
                        value={posDept}
                        onChange={(e) => setPosDept(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Operations">Operations</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Priority</label>
                        <select
                          value={posPriority}
                          onChange={(e) => setPosPriority(e.target.value as any)}
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                        >
                          <option value="low">LOW</option>
                          <option value="normal">NORMAL</option>
                          <option value="high">HIGH</option>
                          <option value="urgent">URGENT</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Target Hire Date</label>
                        <input
                          type="text"
                          value={posTargetHireDate}
                          onChange={(e) => setPosTargetHireDate(e.target.value)}
                          placeholder="e.g. Q4 2026, 2026-10-01"
                          className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Estimated Cost (monthly/annual)</label>
                      <input
                        type="text"
                        value={posEstimatedCost}
                        onChange={(e) => setPosEstimatedCost(e.target.value)}
                        placeholder="e.g. $6,000/mo or $75,000/yr"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Coverage Gap / Operational Need</label>
                      <input
                        type="text"
                        value={posCoverageGap}
                        onChange={(e) => setPosCoverageGap(e.target.value)}
                        placeholder="e.g. Operational bottleneck overhead, signs setup bottleneck"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Business Case / Justification</label>
                      <textarea
                        value={posBusinessCase}
                        onChange={(e) => setPosBusinessCase(e.target.value)}
                        placeholder="Why is this role needed now?"
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Hiring Notes</label>
                      <textarea
                        value={posHiringNotes}
                        onChange={(e) => setPosHiringNotes(e.target.value)}
                        placeholder="Candidate requirements, source agency, or status logs..."
                        rows={2}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {/* Virtual / AI position form layout */}
                {posStatus === 'virtual_ai' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Role / Agent Name</label>
                      <input
                        type="text"
                        required
                        value={posName}
                        onChange={(e) => setPosName(e.target.value)}
                        placeholder="e.g. AI Ops Assistant"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Title / Function</label>
                      <input
                        type="text"
                        required
                        value={posTitle}
                        onChange={(e) => setPosTitle(e.target.value)}
                        placeholder="e.g. AI Coworker, Automated Triage Bot"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#00635C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Department</label>
                      <select
                        value={posDept}
                        onChange={(e) => setPosDept(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="Operations">Operations</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Accounting">Accounting</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Compliance">Compliance</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reports To / Owner</label>
                      <select
                        value={posReports}
                        onChange={(e) => setPosReports(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None (Top Level)</option>
                        {model.positions.filter(p => p.id !== id).map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">AI Core Responsibilities / Capabilities</label>
                      <textarea
                        value={posBusinessCase}
                        onChange={(e) => setPosBusinessCase(e.target.value)}
                        placeholder="e.g. Intake triage, SOP lookup, missing-info collection..."
                        rows={3}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Channels / Tools Used (Comma-separated)</label>
                      <input
                        type="text"
                        value={posPhone}
                        onChange={(e) => setPosPhone(e.target.value)}
                        placeholder="e.g. Email, Slack, Retell, API integrations"
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Human Fallback / Escalation Owner</label>
                      <select
                        value={posBackup}
                        onChange={(e) => setPosBackup(e.target.value)}
                        className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">None</option>
                        {model.positions.filter(p => p.id !== id && p.status !== 'virtual_ai').map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOPs / Knowledge Docs Accessible</label>
                      <textarea
                        value={posHiringNotes}
                        onChange={(e) => setPosHiringNotes(e.target.value)}
                        placeholder="e.g. All brokerage SOPs, commission guidelines, room bookings..."
                        rows={2}
                        className="w-full p-2.5 bg-black/25 border border-white/10 rounded-lg text-white text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* B. ROLE FIELDS */}
            {type === 'role' && (
              <div className="space-y-4">
                
                {mode === 'add' && (
                  <div className="bg-black/15 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                    <label className="text-[8px] font-bold font-mono text-[#D0D6BB] uppercase block">Prefill Responsibility Template</label>
                    <select
                      onChange={(e) => handlePreFillRole(e.target.value)}
                      defaultValue=""
                      className="w-full p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white text-[11px] cursor-pointer"
                    >
                      <option value="" disabled>-- Select a template --</option>
                      <option value="Agent Onboarding">Agent Onboarding</option>
                      <option value="Listing Launch">Listing Launch</option>
                      <option value="Lockbox & Signage">Lockbox & Signage</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Responsibility Owner Seat</label>
                  <select
                    value={rolePosId}
                    onChange={(e) => setRolePosId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Role Name / Responsibility</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Closing verification"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Description</label>
                  <textarea
                    required
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe exactly what tasks this role is accountable for..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Target SLA Window</label>
                  <input
                    type="text"
                    value={roleSla}
                    onChange={(e) => setRoleSla(e.target.value)}
                    placeholder="e.g. 24 hours, 4 hours"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {allCategories.map(cat => {
                      const isChecked = roleCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1.5 text-white cursor-pointer select-none text-[10px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setRoleCategories(roleCategories.filter(x => x !== cat));
                              } else {
                                setRoleCategories([...roleCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Backup Owner Seat Override</label>
                  <select
                    value={roleBackupOwner}
                    onChange={(e) => setRoleBackupOwner(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">None (Use Seat Default)</option>
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* C. SOP FIELDS */}
            {type === 'sop' && (
              <div className="space-y-4">
                
                {/* SUGGESTED TEMPLATE SELECTOR */}
                {mode === 'add' && (
                  <div className="bg-black/15 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                    <label className="text-[8px] font-bold font-mono text-[#D0D6BB] uppercase block">Suggest SOP Template</label>
                    <select
                      onChange={(e) => handlePreFillSop(e.target.value)}
                      defaultValue=""
                      className="w-full p-1.5 bg-[#012620] border border-white/10 rounded-lg text-white text-[11px] cursor-pointer"
                    >
                      <option value="" disabled>-- Select suggested template --</option>
                      <option value="New-hire setup">New-hire setup</option>
                      <option value="Listing launch checklist">Listing launch checklist</option>
                      <option value="Lockbox issue">Lockbox issue</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Name</label>
                  <input
                    type="text"
                    required
                    value={sopName}
                    onChange={(e) => setSopName(e.target.value)}
                    placeholder="e.g. Commission request"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position</label>
                  <select
                    value={sopOwner}
                    onChange={(e) => handlePositionChange(e.target.value, 'sop')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Attached Owner Role</label>
                  <select
                    value={sopRoleId}
                    onChange={(e) => setSopRoleId(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === sopOwner).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Condition</label>
                  <input
                    type="text"
                    required
                    value={sopTrigger}
                    onChange={(e) => setSopTrigger(e.target.value)}
                    placeholder="e.g. When closing package is received"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Purpose / Goal</label>
                  <textarea
                    value={sopPurpose}
                    onChange={(e) => setSopPurpose(e.target.value)}
                    rows={2}
                    placeholder="Describe the target outcome of this checklist..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Execution Steps</label>
                    <button
                      type="button"
                      onClick={() => setSopSteps([...sopSteps, 'New step'])}
                      className="text-[9px] font-bold text-teal-300 uppercase hover:underline cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>
                  {sopSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => {
                          const updated = [...sopSteps];
                          updated[idx] = e.target.value;
                          setSopSteps(updated);
                        }}
                        className="flex-1 p-1.5 bg-black/20 border border-white/10 rounded text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setSopSteps(sopSteps.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Required Caller Details</label>
                    <button
                      type="button"
                      onClick={() => setSopFields([...sopFields, 'New Parameter'])}
                      className="text-[9px] font-bold text-teal-300 uppercase hover:underline cursor-pointer"
                    >
                      + Add Parameter
                    </button>
                  </div>
                  {sopFields.map((field, idx) => (
                    <div key={idx} className="flex gap-1.5">
                      <input
                        type="text"
                        value={field}
                        onChange={(e) => {
                          const updated = [...sopFields];
                          updated[idx] = e.target.value;
                          setSopFields(updated);
                        }}
                        className="flex-1 p-1.5 bg-black/20 border border-white/10 rounded text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setSopFields(sopFields.filter((_, i) => i !== idx))}
                        className="p-1.5 text-red-300 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Extended SOP details */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Completion Criteria</label>
                  <input
                    type="text"
                    value={sopCompletionCriteria}
                    onChange={(e) => setSopCompletionCriteria(e.target.value)}
                    placeholder="e.g. Escrow receipt fully logged and shared in thread."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Notification Rules</label>
                  <input
                    type="text"
                    value={sopNotificationRules}
                    onChange={(e) => setSopNotificationRules(e.target.value)}
                    placeholder="e.g. Notify Ryan on Slack if deal is at risk."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalation Notes</label>
                  <textarea
                    value={sopEscalationNotes}
                    onChange={(e) => setSopEscalationNotes(e.target.value)}
                    rows={1}
                    placeholder="e.g. Escalate to Ryan after 24 hours of delay."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Tag List (Comma separated)</label>
                  <input
                    type="text"
                    value={sopTags.join(', ')}
                    onChange={(e) => setSopTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. finance, closing"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Categories</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = sopCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSopCategories(sopCategories.filter(x => x !== cat));
                              } else {
                                setSopCategories([...sopCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Status</label>
                    <select
                      value={sopStatus}
                      onChange={(e) => setSopStatus(e.target.value as any)}
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="needs_review">Needs Review</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeRouting} 
                      onChange={() => setSopIncludeRouting(!sopIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeRetell} 
                      onChange={() => setSopIncludeRetell(!sopIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sopIncludeAsk} 
                      onChange={() => setSopIncludeAsk(!sopIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {/* D. ESCALATION POLICY FIELDS */}
            {type === 'escalation' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalation Policy Name</label>
                  <input
                    type="text"
                    required
                    value={escName}
                    onChange={(e) => setEscName(e.target.value)}
                    placeholder="e.g. Critical closing delay"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Condition Trigger Speech</label>
                  <input
                    type="text"
                    required
                    value={escTrigger}
                    onChange={(e) => setEscTrigger(e.target.value)}
                    placeholder="e.g. Client complains repeat lockbox jam"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Plain English Logic Rule</label>
                  <input
                    type="text"
                    required
                    value={escCondition}
                    onChange={(e) => setEscCondition(e.target.value)}
                    placeholder="e.g. IF lockbox issue unresolved after 4 hours"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Escalate to Seat</label>
                  <select
                    value={escTarget}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEscTarget(val);
                      const selectedStatus = model.positions.find(p => p.id === val)?.status || 'active';
                      if (!['open', 'planned', 'wanted'].includes(selectedStatus)) {
                        setEscFallbackTarget('');
                      }
                    }}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>

                  {['open', 'planned', 'wanted'].includes(model.positions.find(p => p.id === escTarget)?.status || '') && (
                    <div className="space-y-1 mt-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                      <span className="text-[9px] font-mono font-bold text-amber-300 uppercase block">
                        ⚠️ Staffing Gap Alert
                      </span>
                      <span className="text-[9px] text-[#D0D6BB] block leading-relaxed">
                        This escalation target is not staffed yet. Choose an active fallback owner.
                      </span>
                      <select
                        required
                        value={escFallbackTarget}
                        onChange={(e) => setEscFallbackTarget(e.target.value)}
                        className="w-full p-2 mt-1.5 bg-black/40 border border-amber-500/30 rounded-lg text-white focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select Active Fallback Owner --</option>
                        {model.positions
                          .filter(p => !p.status || p.status === 'active' || p.status === 'fractional' || p.status === 'outsourced')
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                          ))
                        }
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Response window</label>
                  <input
                    type="text"
                    value={escWindow}
                    onChange={(e) => setEscWindow(e.target.value)}
                    placeholder="e.g. 2 hours, Same day"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Urgency Urgency</label>
                  <select
                    value={escUrgency}
                    onChange={(e) => setEscUrgency(e.target.value as any)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="low">LOW</option>
                    <option value="normal">NORMAL</option>
                    <option value="high">HIGH</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Notification Channels</label>
                  <div className="flex flex-wrap gap-2.5 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    {['dashboard', 'email', 'sms', 'phone', 'slack', 'teams'].map(c => {
                      const isChecked = escChannels.includes(c as any);
                      return (
                        <label key={c} className="flex items-center gap-1.5 text-white cursor-pointer select-none text-[10px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setEscChannels(escChannels.filter(x => x !== c));
                              } else {
                                setEscChannels([...escChannels, c as any]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20"
                          />
                          {c.toUpperCase()}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Actionable Next Steps</label>
                  <textarea
                    value={escAction}
                    onChange={(e) => setEscAction(e.target.value)}
                    rows={2}
                    placeholder="Describe specific next steps target receiver should trigger..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* E. DOCUMENT UPLOAD FIELDS */}
            {type === 'document' && (
              <div className="space-y-4">
                {mode === 'add' ? (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Upload File</label>
                    <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-black/15">
                      <input 
                        type="file" 
                        required
                        accept=".pdf,.doc,.docx,.txt,.md" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Eye className="w-8 h-8 text-[#D0D6BB]/40 mx-auto mb-2" />
                      <span className="text-[11px] text-white font-bold block">Drag & Drop or Click to Browse</span>
                      <span className="text-[9px] text-[#D0D6BB]/50 block mt-1">Accepted: .pdf, .doc, .docx, .txt, .md (Max 10MB)</span>
                    </div>
                    {docFileName && (
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 text-[9px] font-mono text-emerald-300 flex justify-between items-center">
                        <span>Selected: {docFileName}</span>
                        <span>{(docFileSize / 1024).toFixed(0)} KB</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Title</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position Seat</label>
                  <select
                    value={docOwnerPosition}
                    onChange={(e) => handlePositionChange(e.target.value, 'doc')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Role Assignment</label>
                  <select
                    value={docOwnerRole}
                    onChange={(e) => setDocOwnerRole(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === docOwnerPosition).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = docCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setDocCategories(docCategories.filter(x => x !== cat));
                              } else {
                                setDocCategories([...docCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Classification Type</label>
                  <select
                    value={docClassType}
                    onChange={(e) => setDocClassType(e.target.value as any)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                  >
                    <option value="policy">Policy</option>
                    <option value="sop">SOP Checklist</option>
                    <option value="checklist">Checklist</option>
                    <option value="template">Template</option>
                    <option value="training_guide">Training Guide</option>
                    <option value="vendor_document">Vendor Document</option>
                    <option value="compliance_reference">Compliance Reference</option>
                    <option value="marketing_reference">Marketing Reference</option>
                    <option value="accounting_reference">Accounting Reference</option>
                    <option value="other">Other Reference</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Status</label>
                    <select
                      value={docStatus}
                      onChange={(e) => setDocStatus(e.target.value as any)}
                      className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white cursor-pointer"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="needs_review">Needs Review</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Document Notes / Summary</label>
                  <textarea
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    rows={2}
                    placeholder="Enter summary details or notes about the document contents..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">SOP Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={docTags.join(', ')}
                    onChange={(e) => setDocTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. policy, onboard"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeRouting} 
                      onChange={() => setDocIncludeRouting(!docIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeRetell} 
                      onChange={() => setDocIncludeRetell(!docIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={docIncludeAsk} 
                      onChange={() => setDocIncludeAsk(!docIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {/* F. LINK REFERENCE FIELDS */}
            {type === 'link' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Link Title</label>
                  <input
                    type="text"
                    required
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder="e.g. Dotloop portal link"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Destination URL</label>
                  <input
                    type="url"
                    required
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="e.g. https://dotloop.com"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Position Seat</label>
                  <select
                    value={linkOwnerPosition}
                    onChange={(e) => handlePositionChange(e.target.value, 'link')}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    {model.positions.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Owner Role Assignment</label>
                  <select
                    value={linkOwnerRole}
                    onChange={(e) => setLinkOwnerRole(e.target.value)}
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
                  >
                    <option value="">-- No Attached Role --</option>
                    {model.roles.filter(r => r.positionId === linkOwnerPosition).map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Request Categories Mapping</label>
                  <div className="grid grid-cols-2 gap-1 bg-black/25 p-2 rounded-xl max-h-24 overflow-y-auto">
                    {allCategories.map(cat => {
                      const isChecked = linkCategories.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-1 text-[9px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setLinkCategories(linkCategories.filter(x => x !== cat));
                              } else {
                                setLinkCategories([...linkCategories, cat]);
                              }
                            }}
                            className="rounded accent-emerald-600 bg-black/30 border-white/20 w-3 h-3"
                          />
                          {cat}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Reference Summary / Notes</label>
                  <textarea
                    value={linkNotes}
                    onChange={(e) => setLinkNotes(e.target.value)}
                    rows={2}
                    placeholder="Enter summary details or notes about the link contents..."
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={linkTags.join(', ')}
                    onChange={(e) => setLinkTags(e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                    placeholder="e.g. portal, support"
                    className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 font-mono text-[10px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeRouting} 
                      onChange={() => setLinkIncludeRouting(!linkIncludeRouting)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Use for AI Routing
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeRetell} 
                      onChange={() => setLinkIncludeRetell(!linkIncludeRetell)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Retell custom voice agent
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={linkIncludeAsk} 
                      onChange={() => setLinkIncludeAsk(!linkIncludeAsk)} 
                      className="rounded accent-emerald-600 w-3 h-3" 
                    />
                    Include in Ask Nest Ops
                  </label>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl font-mono text-center">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-bold font-mono uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/20 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Processing...' : mode === 'add' ? (type === 'position' ? 'Create position' : type === 'role' ? 'Create role' : 'Add Item') : 'Update Item'}
              </button>
            </div>

          </form>
        </div>
      </div>

      {cropEditorOpen && (
        <AvatarCropEditor
          avatarUrl={posAvatarUrl}
          name={posName}
          initialCrop={posAvatarCrop}
          onSave={(newCrop) => {
            setPosAvatarCrop(newCrop);
            setCropEditorOpen(false);
            if (mode === 'edit' && id) {
              onUpdatePositionInline?.(id, { avatarCrop: newCrop });
            }
          }}
          onCancel={() => setCropEditorOpen(false)}
        />
      )}
    </div>
  );
}

function OrgChartConnectionDrawer({
  isOpen,
  id,
  model,
  onClose,
  onSave,
  onDelete,
  from,
  to,
  type,
  label,
  condition,
  window,
  sops,
  escalations,
  setFrom,
  setTo,
  setType,
  setLabel,
  setCondition,
  setWindow,
  setSops,
  setEscalations
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[360px] bg-[#013028] border-l border-white/10 shadow-2xl p-6 flex flex-col gap-5 text-left font-sans animate-slide-in">
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <h3 className="text-xs font-serif font-black text-white uppercase tracking-wider">
          {id ? 'Edit Connection Line' : 'Add Connection Line'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/10"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSave(e); }} className="flex-1 overflow-y-auto space-y-4 text-xs">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">From Position (Source)</label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Select Position --</option>
            {model.positions.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">To Position (Target)</label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="" disabled>-- Select Position --</option>
            {model.positions.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.title})</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Relationship Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none cursor-pointer"
          >
            <option value="reporting">Reporting Line (solid pistachio)</option>
            <option value="escalation">Escalation Policy Path (dashed gold)</option>
            <option value="sop">SOP / Knowledge Connection (dotted emerald)</option>
            <option value="ownership">Custom Connection / Ownership</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Line Label / Title</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Compliance Escalation"
            className="w-full p-2 bg-black/25 border border-white/10 rounded-lg text-white focus:outline-none"
          />
        </div>

        {type === 'escalation' && (
          <div className="space-y-3 p-3 bg-black/20 rounded-xl border border-white/5">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#D0D6BB] uppercase font-mono block">Trigger Condition</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. IF task overdue 48h"
                className="w-full p-1.5 bg-[#012620] border border-white/10 rounded text-white text-[11px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-[#D0D6BB] uppercase font-mono block">SLA Response Window</label>
              <input
                type="text"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
                placeholder="e.g. 24 hours"
                className="w-full p-1.5 bg-[#012620] border border-white/10 rounded text-white text-[11px]"
              />
            </div>
          </div>
        )}

        {type === 'sop' && (
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-[#D0D6BB] uppercase font-mono block">Link Checklist SOPs</label>
            <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 max-h-32 overflow-y-auto space-y-1">
              {model.sops.map((sop: any) => {
                const isChecked = sops.includes(sop.id);
                return (
                  <label key={sop.id} className="flex items-center gap-2 text-[10px] text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setSops(sops.filter((x: string) => x !== sop.id));
                        } else {
                          setSops([...sops, sop.id]);
                        }
                      }}
                      className="rounded border-white/20 bg-black/30 accent-emerald-600"
                    />
                    {sop.name}
                  </label>
                );
              })}
              {model.sops.length === 0 && (
                <span className="text-[9px] text-[#D0D6BB]/40 italic block">No SOPs documented.</span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
          {id && (
            <button
              type="button"
              onClick={() => onDelete(id)}
              className="mr-auto px-3 py-2 bg-red-600/25 hover:bg-red-600/35 border border-red-500/20 text-red-300 rounded-xl text-[9px] font-bold font-mono uppercase cursor-pointer"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[9px] font-bold font-mono uppercase cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[#00635C] hover:bg-[#004d47] text-white border border-white/20 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider cursor-pointer"
          >
            Save Line
          </button>
        </div>
      </form>
    </div>
  );
}
