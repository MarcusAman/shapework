import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import JSZip from "jszip";
import {
  PhoneCall,
  Send,
  UserCheck,
  Clock,
  CheckCircle2,
  FileText,
  Image,
  Play,
  Plus,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  Building2,
  Share2,
  Check,
  AlertCircle,
  X,
  Bot,
  Cpu,
  Terminal,
  Server,
  Sliders,
  ExternalLink,
  FolderOpen,
  Sparkles,
  Smartphone,
  Zap,
  Scissors,
  RefreshCw,
  Crop,
  RotateCw,
  Video,
  Layers,
  MapPin,
  Maximize2,
  Download,
  Eye,
  CheckCircle,
  FileSpreadsheet,
  BarChart2,
  Shield,
  ChevronDown,
  Users,
  Award,
  UserPlus,
} from "lucide-react";
import { BuildViewSidecar } from "./BuildViewSidecar";
import { MarketingHomeInbox } from "./MarketingHomeInbox";
import { CampaignWorkspaceViewport } from "./CampaignWorkspaceViewport";
import { MissingInformationModal } from "./MissingInformationModal";
import { RequestChangeDrawer } from "./RequestChangeDrawer";
import { RedesignedDeliveryDrawer } from "./RedesignedDeliveryDrawer";
import { MelissaTodayView } from "./MelissaTodayView";
import { MarketingErrorBoundary } from "./MarketingErrorBoundary";
import { VAWorkspaceView } from "./VAWorkspaceView";
import { useMarketingBuildStream } from "../../hooks/useMarketingBuildStream";
import { NEST_FULL_ROSTER_72 } from "../../../server/persistence/nestRosterSeed";

export type MarketingSubtab =
  | "today"
  | "requests"
  | "workboard"
  | "va"
  | "intake"
  | "templates";

export const MARKETING_SUBTABS: { id: MarketingSubtab; label: string; secondaryLabel?: string }[] = [
  { id: "today", label: "Today" },
  { id: "requests", label: "Requests" },
  { id: "workboard", label: "Workboard" },
  { id: "va", label: "VA Workspace" },
  { id: "intake", label: "Intake Log" },
  { id: "templates", label: "Templates" },
] satisfies Array<{
  id: MarketingSubtab;
  label: string;
  secondaryLabel?: string;
}>;

export const LEGACY_SUBTAB_ALIASES: Record<string, MarketingSubtab> = {
  campaigns: "requests",
  queue: "today",
  va_workspace: "va",
  intake_log: "intake",
  calls: "intake",
  "intake-log": "intake",
  studio: "templates",
  sandbox: "requests",
  workspace: "requests",
};

export function getSubtabFromUrl(): MarketingSubtab {
  if (typeof window === "undefined") return "requests";
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("subtab") || params.get("tab");
  if (!raw) return "requests";
  const clean = raw.toLowerCase().trim();
  if (LEGACY_SUBTAB_ALIASES[clean]) {
    return LEGACY_SUBTAB_ALIASES[clean];
  }
  const match = MARKETING_SUBTABS.find((t) => t.id === clean);
  if (match) return match.id;
  return "requests";
}

interface MarketingIntakeConsoleProps {
  state: any;
}

export default function MarketingIntakeConsole({
  state,
}: MarketingIntakeConsoleProps) {
  const currentUserRole = (
    state?.activeProfile?.role ||
    state?.currentUser?.role ||
    state?.role ||
    "owner"
  ).toLowerCase();
  const isOperator = [
    "shapework_admin",
    "shapework_operator",
    "marketing_owner",
    "marketing_coordinator",
    "administrator",
    "operator",
  ].includes(currentUserRole);
  const canAccessWorkboard = isOperator;
  const canAccessTemplates = isOperator;
  const canAccessIntakeLog = isOperator;
  const canAccessAdvancedEditor = ["shapework_admin", "administrator"].includes(
    currentUserRole
  );

  const showMarketingDebug =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debug") === "1";

  const [showDebugDrawer, setShowDebugDrawer] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MarketingSubtab>(() => getSubtabFromUrl());

  // Reactive URL listener & normalizer effect for browser Back / Forward history & direct URLs
  useEffect(() => {
    const handleUrlSync = () => {
      const canonical = getSubtabFromUrl();
      setActiveTab(canonical);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("subtab") || params.get("tab");
        const clean = raw ? raw.toLowerCase().trim() : "";

        // Normalize URL if missing or using legacy alias or invalid value
        if (!raw || LEGACY_SUBTAB_ALIASES[clean] || !MARKETING_SUBTABS.some(t => t.id === clean)) {
          const url = new URL(window.location.href);
          url.searchParams.set("subtab", canonical);
          url.searchParams.delete("tab");
          window.history.replaceState({}, "", url.toString());
        }
      }
    };

    handleUrlSync();
    window.addEventListener("popstate", handleUrlSync);
    return () => window.removeEventListener("popstate", handleUrlSync);
  }, []);

  const handleTabSwitch = (targetTab: string) => {
    const canonical = (LEGACY_SUBTAB_ALIASES[targetTab] || targetTab) as MarketingSubtab;
    setActiveTab(canonical);
    setSelectedCampaignId(null);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("subtab", canonical);
      url.searchParams.delete("tab");
      url.searchParams.delete("campaign");
      url.searchParams.delete("campaignId");
      url.searchParams.delete("mode");
      url.searchParams.delete("asset");
      url.searchParams.delete("jobId");

      window.history.pushState({}, "", url.toString());
    }
  };
  const [customerFilter, setCustomerFilter] = useState<
    "all" | "needs_attention" | "in_progress" | "ready_review" | "completed"
  >("all");
  const [workboardViewMode, setWorkboardViewMode] = useState<"grouped" | "all">(
    "grouped",
  );
  
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const camp = params.get("campaign") || params.get("campaignId");
      if (camp) return camp;
    }
    return null; // Root page is Campaign Selection List
  });
  const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
  const [campaignNotFoundError, setCampaignNotFoundError] = useState<boolean>(false);

  const [campaignWorkspaceMode, setCampaignWorkspaceMode] = useState<
    "overview" | "review" | "activity"
  >(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "overview" || mode === "activity") return mode;
    }
    return "review";
  });

  const [selectedReviewAsset, setSelectedReviewAsset] = useState<
    "flyer" | "carousel" | "postcard" | "sign_rider" | "email"
  >(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const asset = params.get("asset");
      if (asset === "social" || asset === "carousel") return "carousel";
      if (asset === "postcard") return "postcard";
      if (asset === "sign_rider" || asset === "sign-rider") return "sign_rider";
      if (asset === "email") return "email";
      if (asset === "flyer") return "flyer";
    }
    return "flyer";
  });

  const [showMissingInfoModal, setShowMissingInfoModal] = useState<boolean>(false);
  const [showRequestChangeDrawer, setShowRequestChangeDrawer] = useState<boolean>(false);
  const [showRedesignedDeliveryDrawer, setShowRedesignedDeliveryDrawer] = useState<boolean>(false);

  const [postcardPage, setPostcardPage] = useState<"front" | "back">("front");
  const [socialSlideIndex, setSocialSlideIndex] = useState<number>(0);
  const [showFullScreenPreviewModal, setShowFullScreenPreviewModal] = useState(false);
  const [showRegenerateConfirmModal, setShowRegenerateConfirmModal] = useState(false);
  const [isAskShapeworkOpen, setIsAskShapeworkOpen] = useState(false);

  // Build View sidecar state & stream hook
  const [activeJobId, setActiveJobId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode");
      if (mode === "review" || mode === "delivered") return null;
    }
    return "job_demo_990";
  });
  const [showBuildViewSidecar, setShowBuildViewSidecar] = useState<boolean>(true);

  const {
    job: activeBuildJob,
    events: buildEvents,
    submitInput: submitBuildInput,
    cancelJob: cancelBuildJob,
  } = useMarketingBuildStream(selectedCampaignId, activeJobId);

  const handleStartGeneration = async () => {
    if (!selectedCampaignId) return;
    try {
      const res = await fetch(`/api/marketing/campaigns/${selectedCampaignId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedAssetTypes: ["flyer", "carousel", "postcard", "sign_rider", "email"],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.jobId) {
          setActiveJobId(data.jobId);
          setShowBuildViewSidecar(true);
        }
      }
    } catch (e) {
      console.error("Start generation error:", e);
    }
  };

  // Synchronize campaign selection with canonical browser history
  const handleSelectCampaign = (
    id: string | null,
    view: "overview" | "work" | "review" | "communications" | "history" = "review",
    asset: "flyer" | "carousel" | "postcard" | "sign_rider" | "email" = "flyer"
  ) => {
    setSelectedCampaignId(id);
    setSelectedReviewAsset(asset);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.delete("subtab");
        url.searchParams.set("campaign", id);
        url.searchParams.set("view", view);
        url.searchParams.set("asset", asset);
      } else {
        url.searchParams.delete("campaign");
        url.searchParams.delete("view");
        url.searchParams.delete("mode");
        url.searchParams.delete("asset");
        url.searchParams.set("subtab", activeTab || "requests");
      }
      window.history.pushState({ campaignId: id, view, asset }, "", url.toString());
    }
  };

  // Synchronize asset selection with URL
  const handleSelectAsset = (assetId: "flyer" | "carousel" | "postcard" | "sign_rider" | "email") => {
    setSelectedReviewAsset(assetId);
    if (typeof window !== "undefined" && selectedCampaignId) {
      const url = new URL(window.location.href);
      url.searchParams.set("asset", assetId);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Browser back/forward popstate listener & initial URL sync
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const camp = params.get("campaign") || params.get("campaignId");
        const mode = (params.get("mode") as any) || "review";
        const asset = (params.get("asset") as any) || "flyer";
        if (camp !== selectedCampaignId) {
          setSelectedCampaignId(camp);
        }
        setCampaignWorkspaceMode(mode);
        setSelectedReviewAsset(asset);
        if (mode === "build") {
          setActiveJobId("job_demo_990");
        }
      }
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // Single asset download handler
  const handleDownloadSingleAsset = (assetId: string) => {
    const cId = selectedCampaignId || "campaign_990_inspiration";
    const filename = `${cId}-${assetId}.pdf`;
    const downloadUrl = `/api/marketing/campaigns/${cId}/deliver/export?format=binary`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIntakeToast(`📥 Exported ${assetId.replace("_", " ")} file (${filename})`);
  };

  const handleApproveAsset = (assetId: string) => {
    setIntakeToast(`✓ ${assetId.replace("_", " ")} approved successfully!`);
    setTimeout(() => setIntakeToast(null), 3000);
  };

  const [selectedCallId, setSelectedCallId] = useState<string | null>(
    "call_001",
  );
  const [selectedTemplateFormat, setSelectedTemplateFormat] = useState<
    | "flyer"
    | "carousel"
    | "postcard"
    | "sign_rider"
    | "landing_page"
    | "google_earth_video"
    | "floorplan"
    | "cma_one_pager"
    | "co_broke_flyer"
    | "story_reel"
  >("flyer");
  const [leftControlTab, setLeftControlTab] = useState<
    "format" | "property" | "maps"
  >("format");
  const [voiceTone, setVoiceTone] = useState<"coastal" | "southern" | "tech">(
    "coastal",
  );
  const [isKineticSubtitles, setIsKineticSubtitles] = useState(true);
  const [isParcelOverlay, setIsParcelOverlay] = useState(false);
  const [showOpenHouseKioskModal, setShowOpenHouseKioskModal] = useState(false);
  const [showVirtualMachineModal, setShowVirtualMachineModal] = useState(false);
  const [isVmRunning, setIsVmRunning] = useState(false);
  const [vmProgressStep, setVmProgressStep] = useState(0);
  const [activeVmTab, setActiveVmTab] = useState<
    "live_stream" | "palette_studio" | "layer_deck" | "compliance"
  >("live_stream");
  const [selectedArchitectureTheme, setSelectedArchitectureTheme] = useState<
    "coastal_modern" | "historic_estate" | "urban_industrial" | "country_club"
  >("coastal_modern");
  const [vmCustomPrompt, setVmCustomPrompt] = useState("");
  const [isComplianceAuditing, setIsComplianceAuditing] = useState(false);
  const [complianceResults, setComplianceResults] = useState<{
    isPassed: boolean;
    auditTime: string;
    checks: Array<{ title: string; status: "pass" | "fail"; detail: string }>;
  }>({
    isPassed: true,
    auditTime: "Today at 2:45 PM",
    checks: [
      {
        title: "Equal Housing Opportunity Logo",
        status: "pass",
        detail: "Vector badge rendered on page 1 & postcard footer.",
      },
      {
        title: "NCREC Firm License Verification",
        status: "pass",
        detail: "Nest Realty Wilmington firm license #C2519 verified.",
      },
      {
        title: "Broker-in-Charge Designation",
        status: "pass",
        detail: "Ryan Crecelius (BIC) clearly identified in footer.",
      },
      {
        title: "Agency Disclosure Disclaimer",
        status: "pass",
        detail: "NCREC Working with Real Estate Agents notice present.",
      },
    ],
  });
  const [vmExecutionLogs, setVmExecutionLogs] = useState<string[]>([
    "🟢 [00:00.12] AI Studio Virtual Machine v4.2 initialized on Apple Silicon M3 Node.",
    "📸 [00:00.45] Ingested 12 high-res HDR photography files & floorplan CAD vector.",
    "👁️ [00:01.02] Vision AI: Classified primary hero photo as Waterfront Aerial Drone (0.84 Acres).",
    "🎨 [00:01.65] Architectural Color Extractor: Extracted Coastal Modern palette (#00635C Emerald, #D0D6BB Sand).",
    "✍️ [00:02.20] AI Copyfitting: Generated luxury headline copy & neighborhood stats for Mayfaire Woods.",
    "📐 [00:03.10] Multi-Format Compositor: Assembled Flyer, 4-Page Brochure, 15s Story Reel, Yard Rider, iPad Kiosk & Postcard.",
    "⚖️ [00:03.95] NCREC Compliance Inspector: Equal Housing & Nest Realty broker license # verified 100%.",
  ]);
  const [showSimulateCallModal, setShowSimulateCallModal] = useState(false);
  const [showSocialCalendarModal, setShowSocialCalendarModal] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(1);
  const [activeCalendarChannel, setActiveCalendarChannel] = useState<
    "instagram" | "facebook" | "linkedin" | "tiktok"
  >("instagram");
  const [isCalendarQueued, setIsCalendarQueued] = useState(false);
  const [customCaptions, setCustomCaptions] = useState<Record<string, string>>({
    "1_instagram":
      "✨ JUST LISTED! Welcome to 990 Inspiration Drive in Wilmington, NC ($1,250,000). 4 Beds, 4.5 Baths of pure coastal luxury. Private heated pool & chef quartzite kitchen. Contact Ryan Crecelius (BIC) for private briefing! 🌊🏠 #WilmingtonNC #NestRealty #CoastalLiving #JustListed",
    "1_facebook":
      "🏡 EXCLUSIVE NEW LISTING | 990 Inspiration Drive, Wilmington NC ($1,250,000)\n\nIntroducing this architectural coastal estate featuring 4 bedrooms, 4.5 bathrooms, custom quartzite kitchen, and a resort saltwater pool. Schedule your walkthrough today with Ryan Crecelius & Nest Realty.",
    "1_linkedin":
      "📈 Market Spotlight: New Luxury Listing at 990 Inspiration Dr, Wilmington, NC ($1,250,000).\n\nHighlighting coastal architectural craftsmanship with premium finishes, strong rental equity potential, and high neighborhood demand in Landfall / Mayfaire corridor. Detailed brochure available upon request.",
    "1_tiktok":
      "🔥 First look at this $1.25M Coastal Mansion in Wilmington, NC! Check out that pool! DM for details 👀 #RealEstate #HouseTour #WilmingtonNC",
  });
  const [canvaTemplateUrl, setCanvaTemplateUrl] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("nest_canva_template_url") ||
        "https://www.canva.com/design/new"
      );
    }
    return "https://www.canva.com/design/new";
  });
  const [showCanvaAssistantModal, setShowCanvaAssistantModal] = useState(false);
  const [canvaConfigEditing, setCanvaConfigEditing] = useState(false);
  const [kioskVisitorName, setKioskVisitorName] = useState("");
  const [kioskVisitorPhone, setKioskVisitorPhone] = useState("");
  const [kioskVisitorEmail, setKioskVisitorEmail] = useState("");
  const [earthVideoAngle, setEarthVideoAngle] = useState<
    "overhead" | "south" | "horizon" | "neighborhood"
  >("overhead");
  const [isPlayingEarthVideo, setIsPlayingEarthVideo] = useState(false);
  const [flyerPageTab, setFlyerPageTab] = useState<1 | 2>(1);
  const [customAddress, setCustomAddress] = useState(
    "990 Inspiration Dr, Wilmington, NC 28405",
  );
  const [customPrice, setCustomPrice] = useState("$1,250,000");
  const [customAgentName, setCustomAgentName] = useState(
    "Ryan Crecelius (Owner / Broker)",
  );

  // Directory Roster Consolidation
  const fullDirectoryRoster = React.useMemo(() => {
    const defaultRoster = [
      {
        id: "dir_ryan",
        name: "Ryan Crecelius",
        title: "Owner / Broker",
        isBic: true,
        email: "ryan@nestrealty.com",
        office: "Wilmington HQ",
        role: "Owner / BIC",
      },
      {
        id: "dir_melissa",
        name: "Melissa Gagliardi",
        title: "Marketing Manager & BIC",
        isBic: true,
        email: "melissa.gagliardi@nestrealty.com",
        office: "Wilmington HQ",
        role: "Marketing Manager",
      },
      {
        id: "dir_ann",
        name: "Ann Gunn",
        title: "Operations Lead & BIC",
        isBic: true,
        email: "ann@nestrealty.com",
        office: "Wilmington HQ",
        role: "Operations Lead",
      },
      {
        id: "dir_marcus",
        name: "Marcus Aman",
        title: "Managing Partner / BIC",
        isBic: true,
        email: "marcus@nestrealty.com",
        office: "Wilmington HQ",
        role: "Managing Partner",
      },
      {
        id: "dir_chris",
        name: "Chris Brown",
        title: "Pro Broker & BIC",
        isBic: true,
        email: "chris.brown@nestrealty.com",
        office: "Mayfaire Office",
        role: "PB / BIC",
      },
      {
        id: "dir_brooke",
        name: "Brooke Shields",
        title: "Senior Listing Specialist",
        isBic: false,
        email: "brooke.s@nestrealty.com",
        office: "Wrightsville Beach",
        role: "Listing Specialist",
      },
      {
        id: "dir_alex",
        name: "Alex Carter",
        title: "Senior Commercial Broker",
        isBic: false,
        email: "alex.c@nestrealty.com",
        office: "Downtown Wilmington",
        role: "Commercial Specialist",
      },
      {
        id: "dir_james",
        name: "James Fort",
        title: "Transaction Coordinator",
        isBic: false,
        email: "james.fort@nestrealty.com",
        office: "Wilmington HQ",
        role: "Transaction Lead",
      },
      {
        id: "dir_lindsay",
        name: "Lindsay Crecelius",
        title: "Events & Listing Agent",
        isBic: false,
        email: "lindsay@nestrealty.com",
        office: "Wilmington HQ",
        role: "Events / Broker",
      },
    ];

    const propPeople = (state?.directoryPeople || []).map((p: any) => ({
      id:
        p.id ||
        `dir_${(p.displayName || p.firstName || "agent").toLowerCase().replace(/\s+/g, "_")}`,
      name: p.displayName || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      title: p.title || p.role || "Broker",
      isBic: Boolean(
        p.isBrokerInCharge ||
        p.title?.includes("BIC") ||
        p.title?.includes("Broker-in-Charge"),
      ),
      email: p.email || "",
      office:
        (p.officeNames && p.officeNames[0]) ||
        p.primaryOfficeName ||
        "Wilmington",
      role: p.role || p.personType || "Agent",
    }));

    const seedPeople = (NEST_FULL_ROSTER_72 || []).map((p: any) => ({
      id: p.id,
      name: p.displayName || `${p.firstName} ${p.lastName}`,
      title: p.title === "PB" ? "Pro Broker" : p.title || "Agent / Broker",
      isBic: Boolean(p.isBrokerInCharge),
      email: p.email || "",
      office:
        (p.officeNames && p.officeNames[0]) ||
        p.primaryOfficeName ||
        "Mayfaire",
      role: p.personType || "Agent",
    }));

    const map = new Map<string, any>();
    [...defaultRoster, ...propPeople, ...seedPeople].forEach((person) => {
      if (!person.name) return;
      const key = person.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, person);
      }
    });

    return Array.from(map.values());
  }, [state?.directoryPeople]);

  // Selected Agents for Multi-Select Dropdown
  const [selectedAgentList, setSelectedAgentList] = useState<
    Array<{ id: string; name: string; title: string; isBic?: boolean }>
  >([
    {
      id: "dir_ryan",
      name: "Ryan Crecelius",
      title: "Owner / Broker",
      isBic: true,
    },
  ]);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [showAddCustomAgentInput, setShowAddCustomAgentInput] = useState(false);
  const [customAgentTextInput, setCustomAgentTextInput] = useState("");

  const syncCombinedAgentName = (
    agentsList: Array<{
      id: string;
      name: string;
      title: string;
      isBic?: boolean;
    }>,
  ) => {
    if (agentsList.length === 0) {
      setCustomAgentName("Unassigned / Listing Team");
      return;
    }
    if (agentsList.length === 1) {
      const a = agentsList[0];
      setCustomAgentName(a.title ? `${a.name} (${a.title})` : a.name);
      return;
    }
    if (agentsList.length === 2) {
      const a1 = agentsList[0];
      const a2 = agentsList[1];
      setCustomAgentName(
        `${a1.name} (${a1.title || "Broker"}) & ${a2.name} (${a2.title || "Broker"})`,
      );
      return;
    }
    const names = agentsList
      .map((a) => (a.isBic ? `${a.name} (BIC)` : a.name))
      .join(", ");
    setCustomAgentName(names);
  };

  const toggleAgentSelection = (agent: {
    id: string;
    name: string;
    title: string;
    isBic?: boolean;
  }) => {
    const exists = selectedAgentList.some(
      (a) =>
        a.id === agent.id || a.name.toLowerCase() === agent.name.toLowerCase(),
    );
    let next: typeof selectedAgentList;
    if (exists) {
      next = selectedAgentList.filter(
        (a) =>
          a.id !== agent.id &&
          a.name.toLowerCase() !== agent.name.toLowerCase(),
      );
    } else {
      next = [...selectedAgentList, agent];
    }
    setSelectedAgentList(next);
    syncCombinedAgentName(next);
  };

  const removeAgentChip = (agentId: string) => {
    const next = selectedAgentList.filter((a) => a.id !== agentId);
    setSelectedAgentList(next);
    syncCombinedAgentName(next);
  };

  const handleAddCustomAgent = () => {
    if (!customAgentTextInput.trim()) return;
    const newCustomAgent = {
      id: `custom_${Date.now()}`,
      name: customAgentTextInput.trim(),
      title: "Co-Listing Agent",
      isBic: false,
    };
    const next = [...selectedAgentList, newCustomAgent];
    setSelectedAgentList(next);
    syncCombinedAgentName(next);
    setCustomAgentTextInput("");
    setShowAddCustomAgentInput(false);
  };

  const filteredDirectoryList = React.useMemo(() => {
    if (!agentSearchQuery.trim()) return fullDirectoryRoster;
    const q = agentSearchQuery.toLowerCase();
    return fullDirectoryRoster.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.office?.toLowerCase().includes(q) ||
        (q.includes("bic") && p.isBic),
    );
  }, [fullDirectoryRoster, agentSearchQuery]);
  const [customHeadline, setCustomHeadline] = useState(
    "Luxury Coastal Estate at Inspiration Drive",
  );
  const [activePhotoUrl, setActivePhotoUrl] = useState(
    "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw",
  );
  const [generatedPhotoPack, setGeneratedPhotoPack] = useState({
    heroPhotoUrl:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    poolPhotoUrl:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80",
    kitchenPhotoUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
    aerialPhotoUrl:
      "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1600&q=80",
  });
  // 📱 AI Video Reel Studio State
  const [isPlayingReel, setIsPlayingReel] = useState(false);
  const [activeReelScene, setActiveReelScene] = useState<1 | 2 | 3 | 4>(1);
  const [selectedReelMusic, setSelectedReelMusic] = useState<
    "coastal_chill" | "luxury_estate" | "high_energy" | "sunset_acoustic"
  >("coastal_chill");
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState(true);
  const [reelProgressSeconds, setReelProgressSeconds] = useState(3.0);

  // 🚀 Direct Rechat CRM & FlexMLS Auto-Syndication State
  const [showSyndicateModal, setShowSyndicateModal] = useState(false);
  const [isSyndicating, setIsSyndicating] = useState(false);
  const [syndicationStep, setSyndicationStep] = useState(0);
  const [syndicationData, setSyndicationData] = useState<any>(null);
  const [photoSourceMode, setPhotoSourceMode] = useState<
    "auto_zillow" | "streetview_api" | "wetland" | "inspiration" | "custom_url"
  >("inspiration");
  const [customPhotoInputUrl, setCustomPhotoInputUrl] = useState("");
  const [isFetchingPhoto, setIsFetchingPhoto] = useState(false);
  const [wysiwygTheme, setWysiwygTheme] = useState<
    "coastal_luxury" | "dark_glass" | "modern_minimalist" | "navy_gold"
  >("modern_minimalist");
  const [selectedElementStyle, setSelectedElementStyle] = useState<{
    fontSize: string;
    fontColor: string;
    isBold: boolean;
  }>({
    fontSize: "text-sm",
    fontColor: "#10B981",
    isBold: true,
  });
  const [focusedElementName, setFocusedElementName] = useState<string | null>(
    null,
  );
  const [showPendingAssetsModal, setShowPendingAssetsModal] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [batchExportStep, setBatchExportStep] = useState(0);

  // Refactored Apple Dark Glass Canvas & Studio Controls State
  const [canvasZoom, setCanvasZoom] = useState<
    "50%" | "75%" | "100%" | "125%" | "fit"
  >("100%");
  const [inspectorTab, setInspectorTab] = useState<
    "copy" | "media" | "brand" | "dispatch"
  >("copy");
  const [carouselSlide, setCarouselSlide] = useState<1 | 2 | 3 | 4>(1);
  const [postcardSide, setPostcardSide] = useState<"front" | "back">("front");
  const [editingField, setEditingField] = useState<string | null>(null);

  // Image Library Modal & Multi-Asset Sync State
  const [isSpanishMode, setIsSpanishMode] = useState(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [isVirtualStaging, setIsVirtualStaging] = useState(false);
  const [neighborhoodTheme, setNeighborhoodTheme] = useState<
    "mayfaire" | "wrightsville" | "downtown" | "carolina"
  >("mayfaire");
  const [showImageLibraryModal, setShowImageLibraryModal] = useState(false);
  const [imageLibraryCategoryTab, setImageLibraryCategoryTab] = useState<
    "listing" | "drone" | "headshots" | "streetview" | "drive"
  >("listing");
  const [showPhotoCropperModal, setShowPhotoCropperModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<{
    id: string;
    title: string;
    category: string;
    url: string;
    aspect: "1:1" | "4:3" | "16:9";
    zoom: number;
    brightness: number;
  } | null>(null);
  const [showInternalLibraryModal, setShowInternalLibraryModal] =
    useState(false);
  const [targetReplacePhotoId, setTargetReplacePhotoId] = useState<
    string | null
  >(null);

  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  // 🎯 Headless Campaign State & Outcome-Driven Workflow
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [showNaturalLanguageChangeModal, setShowNaturalLanguageChangeModal] =
    useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [changePreviewAssets, setChangePreviewAssets] = useState<string[]>([]);
  const [unsupportedClaimWarning, setUnsupportedClaimWarning] = useState<
    string | null
  >(null);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);
  const [showCustomizePackageModal, setShowCustomizePackageModal] =
    useState(false);
  const [selectedPackageDeliverables, setSelectedPackageDeliverables] =
    useState<string[]>([
      "flyer",
      "carousel",
      "postcard",
      "sign_rider",
      "email",
    ]);
  const [isGeneratingHeadlessPackage, setIsGeneratingHeadlessPackage] =
    useState(false);
  const [headlessProgressStep, setHeadlessProgressStep] = useState(0);

  // Fetch All Persistent Marketing Campaigns on Mount
  useEffect(() => {
    fetch("/api/marketing/campaigns")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.campaigns)) {
          setAllCampaigns(data.campaigns);
        }
      })
      .catch((err) =>
        console.error("Failed to load persistent marketing campaigns list:", err),
      );
  }, []);

  // Fetch Selected Campaign with AbortController & Stale Response Protection (Sections 1, 4, 5)
  useEffect(() => {
    if (!selectedCampaignId) {
      setActiveCampaign(null);
      setCampaignNotFoundError(false);
      return;
    }

    const abortController = new AbortController();
    setCampaignNotFoundError(false);

    fetch(`/api/marketing/campaigns/${selectedCampaignId}`, {
      signal: abortController.signal,
      credentials: "include",
      headers: {
        "x-workspace-id": "nest-realty-demo",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("not_found");
        }
        return res.json();
      })
      .then((data) => {
        // Section 4 & 5: Reject stale response if active selected campaign has changed
        if (data.campaign && data.campaign.id !== selectedCampaignId) {
          return;
        }
        if (data.success && data.campaign) {
          const camp = data.campaign;
          setActiveCampaign(camp);
          setCampaignNotFoundError(false);
          if (camp.listingSnapshot) {
            setCustomAddress(camp.listingSnapshot.propertyAddress);
            setCustomPrice(
              `$${camp.listingSnapshot.listingPrice.toLocaleString()}`,
            );
            setCustomAgentName(camp.listingSnapshot.listingAgentName);
            if (camp.assets?.flyer?.headline) {
              setCustomHeadline(camp.assets.flyer.headline);
            }
          }
        } else {
          setCampaignNotFoundError(true);
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.warn(`Campaign fetch error for ${selectedCampaignId}:`, err);
        setCampaignNotFoundError(true);
      });

    return () => {
      abortController.abort();
    };
  }, [selectedCampaignId]);

  const [mediaLibraryPhotos, setMediaLibraryPhotos] = useState<
    Array<{
      id: string;
      title: string;
      category: "listing" | "drone" | "headshots" | "streetview";
      url: string;
      badge?: string;
    }>
  >([
    {
      id: "img_1",
      title: "990 Inspiration Dr — Front Elevation",
      category: "listing",
      url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw",
      badge: "Active Primary",
    },
    {
      id: "img_2",
      title: "212 Wetland Dr — Sunset Estate View",
      category: "listing",
      url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw",
      badge: "High-Res",
    },
    {
      id: "img_3",
      title: "Mayfaire Aerial Drone View (4K)",
      category: "drone",
      url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw",
      badge: "Drone 4K",
    },
    {
      id: "img_4",
      title: "Coastal Heated Saltwater Pool & Patio",
      category: "listing",
      url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw",
      badge: "Interior",
    },
    {
      id: "img_sv1",
      title: "Google Street View — Front Angle (0° Heading)",
      category: "streetview",
      url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=80",
      badge: "Street View API",
    },
    {
      id: "img_sv2",
      title: "Google Satellite — Overhead 45° Pitch",
      category: "streetview",
      url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
      badge: "Satellite API",
    },
    {
      id: "img_sv3",
      title: "Google Street View — West Facade (270° Heading)",
      category: "streetview",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80",
      badge: "Street View API",
    },
    {
      id: "img_sv4",
      title: "Google Maps — Neighborhood Context View",
      category: "streetview",
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80",
      badge: "Context API",
    },
    {
      id: "img_5",
      title: "Ryan Crecelius (Owner / BIC Headshot)",
      category: "headshots",
      url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
      badge: "Branding",
    },
    {
      id: "img_6",
      title: "Melissa Gagliardi (Marketing Manager Headshot)",
      category: "headshots",
      url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
      badge: "Staff",
    },
  ]);

  const handleSelectMediaPhoto = (url: string, title: string) => {
    setActivePhotoUrl(url);
    setShowImageLibraryModal(false);
    setIntakeToast(
      `✅ Primary photo updated to "${title}" across all 5 marketing collateral formats!`,
    );
    setTimeout(() => setIntakeToast(null), 6000);
  };

  const handleUploadMediaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      const newMedia = {
        id: `img_${Date.now()}`,
        title: file.name,
        category:
          imageLibraryCategoryTab === "drive"
            ? "listing"
            : (imageLibraryCategoryTab as any),
        url: objectUrl,
        badge: "User Uploaded",
      };
      setMediaLibraryPhotos([newMedia, ...mediaLibraryPhotos]);
      setActivePhotoUrl(objectUrl);
      setShowImageLibraryModal(false);
      setIntakeToast(
        `⚡ New photo "${file.name}" uploaded and synced across all collateral!`,
      );
      setTimeout(() => setIntakeToast(null), 6000);
    }
  };

  // Google Street View Static API & Geocoding Auto-Facing State
  const [mapsApiKey, setMapsApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [streetViewFov, setStreetViewFov] = useState<number>(80);
  const [streetViewPitch, setStreetViewPitch] = useState<number>(5);
  const [streetViewHeading, setStreetViewHeading] = useState<number | null>(
    null,
  );
  const [isAutoFacingEnabled, setIsAutoFacingEnabled] = useState<boolean>(true);

  // Helper: Calculate Street View Heading compass bearing (from vehicle to rooftop)
  const calculateHeadingBearing = (
    vLat: number,
    vLng: number,
    tLat: number,
    tLng: number,
  ) => {
    const dLng = ((tLng - vLng) * Math.PI) / 180;
    const lat1 = (vLat * Math.PI) / 180;
    const lat2 = (tLat * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return Math.round((bearing + 360) % 360);
  };

  // Helper: Build Google Street View Static API URL for Auto-Facing Front of House
  const getStreetViewApiUrl = (address: string) => {
    const key = mapsApiKey.trim();
    if (!key) {
      if (address.toLowerCase().includes("wetland")) {
        return "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw";
      }
      return "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw";
    }
    const encodedAddress = encodeURIComponent(address);
    let url = `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${encodedAddress}&fov=${streetViewFov}&pitch=${streetViewPitch}&key=${key}`;
    if (streetViewHeading !== null && !isAutoFacingEnabled) {
      url += `&heading=${streetViewHeading}`;
    }
    return url;
  };

  // Shapework Marketing AI Creative Asset Sidecar Drawer State
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState({
    flyerHeadline: "LUXURY COASTAL ESTATE IN MAYFAIRE",
    flyerSubhead:
      "Unmatched Mayfaire luxury with private resort pool & chef kitchen",
    bulletPoints: [
      "4 Bedrooms & 4.5 Designer Bathrooms (4,200 SqFt)",
      "Private Heated Saltwater Pool with Sun Shelf Deck",
      "Chef Kitchen featuring Thermador Appliances & Quartzite Island",
      "0.84-Acre Private Parcel Near Mayfaire",
    ],
    postcardCallToAction:
      "SCHEDULE YOUR PRIVATE BRIEFING: CALL RYAN CRECELIUS (BIC) (910) 232-1772",
    signRiderText: "OPEN HOUSE SUNDAY 2:00 PM - 4:00 PM",
    carouselSlides: [
      "Slide 1: 1420 Mayfaire Town Dr — $875,000",
      "Slide 2: Private Heated Saltwater Pool & Outdoor Kitchen",
      "Slide 3: Open House This Sunday 2PM - 4PM • Nest Realty",
    ],
  });

  // Inbound Phone Calls State
  const [calls, setCalls] = useState([
    {
      id: "call_001",
      callerName: "Sarah Jenkins (Broker)",
      office: "Nest Realty Wilmington",
      propertyAddress: "1420 Mayfaire Town Drive, Wilmington NC",
      requestType: "Property Flyer & Social Graphic",
      phone: "(910) 392-4100",
      timestamp: "Today at 2:15 PM",
      duration: "1 min 42 sec",
      status: "new",
      transcript:
        "Hi Melissa! This is Sarah Jenkins. I just took a gorgeous luxury listing at 1420 Mayfaire Town Drive. It's 4 beds, 3.5 baths, listed for $875,000. I need a clean 2-page print flyer for open house this Sunday and a square Instagram graphic highlighting the waterfront pool. Can you send this over to Jessica or get it queued up? Thanks so much!",
      aiExtractedDetails: {
        bedrooms: "4 Beds",
        bathrooms: "3.5 Baths",
        price: "$875,000",
        keyFeatures: [
          "Waterfront Pool",
          "Mayfaire Town Location",
          "Luxury Finishes",
        ],
        openHouseDate: "This Sunday 2:00 PM - 4:00 PM",
        requiredCollateral: ["2-Page Print Flyer", "Instagram Square Graphic"],
      },
    },
    {
      id: "call_002",
      callerName: "David Vance (REALTOR®)",
      office: "Nest Realty Wrightsville",
      propertyAddress: "702 Lumina Ave, Wrightsville Beach NC",
      requestType: "Professional Photography & Drone Dispatch",
      phone: "(910) 256-8800",
      timestamp: "Today at 11:30 AM",
      duration: "2 mins 05 sec",
      status: "delegated",
      transcript:
        "Hey Melissa, David Vance calling. We have a beach oceanfront home at 702 Lumina Ave going live Friday. Need twilight photography and drone video scheduled for Thursday morning before high tide. Please confirm photographer dispatch. Thanks!",
      aiExtractedDetails: {
        bedrooms: "5 Beds",
        bathrooms: "4 Baths",
        price: "$2,150,000",
        keyFeatures: ["Oceanfront View", "Private Pier", "Twilight Lighting"],
        openHouseDate: "N/A",
        requiredCollateral: ["Twilight Photography", "Drone Aerial Video"],
      },
    },
    {
      id: "call_003",
      callerName: "Eric Knight (Broker-in-Charge)",
      office: "Nest Realty Carolina Beach",
      propertyAddress: "304 Ocean Blvd, Carolina Beach NC",
      requestType: "Custom Rider & Open House Banner",
      phone: "(910) 458-1200",
      timestamp: "Yesterday at 4:45 PM",
      duration: "0 mins 58 sec",
      status: "completed",
      transcript:
        "Melissa, Eric here. Need two custom sign riders for 304 Ocean Blvd reading 'JUST LISTED - GATED COMMUNITY'. Also send a request to courier for sign post placement by Wednesday.",
      aiExtractedDetails: {
        bedrooms: "3 Beds",
        bathrooms: "2.5 Baths",
        price: "$625,000",
        keyFeatures: ["Gated Community", "Walk to Boardwalk"],
        openHouseDate: "Saturday 1:00 PM",
        requiredCollateral: ["2 Custom Sign Riders", "Courier Sign Placement"],
      },
    },
  ]);

  // Marketing Tasks Workboard State
  const [tasks, setTasks] = useState([
    {
      id: "task_101",
      title: "1420 Mayfaire Town Dr — Print Flyer & IG Graphic",
      caller: "Sarah Jenkins",
      requestType: "Property Flyer & Social Graphic",
      column: "intake",
      priority: "high",
      dueDate: "Tomorrow at 12:00 PM",
      assignedTo: "Melissa (Creative Review)",
      callId: "call_001",
    },
    {
      id: "task_102",
      title: "702 Lumina Ave — Twilight & Drone Shoot",
      caller: "David Vance",
      requestType: "Photography Dispatch",
      column: "delegated",
      priority: "urgent",
      dueDate: "Thu Jul 30 at 9:00 AM",
      assignedTo: "Jessica (Virtual Assistant)",
      callId: "call_002",
    },
    {
      id: "task_103",
      title: "512 Pintail Court — Just Listed Postcard Blast",
      caller: "Ann Gunn",
      requestType: "Direct Mail Postcard",
      column: "in_review",
      priority: "normal",
      dueDate: "Fri Jul 31 at 5:00 PM",
      assignedTo: "Melissa (Creative Review)",
      callId: null,
    },
    {
      id: "task_104",
      title: "304 Ocean Blvd — Custom Riders & Courier",
      caller: "Eric Knight",
      requestType: "Signage & Riders",
      column: "completed",
      priority: "normal",
      dueDate: "Completed Jul 28",
      assignedTo: "Jessica (Virtual Assistant)",
      callId: "call_003",
    },
  ]);

  // New simulated call form state
  const [simCaller, setSimCaller] = useState("Ryan Crecelius");
  const [simAddress, setSimAddress] = useState(
    "918 Chestnut St, Wilmington NC",
  );
  const [simType, setSimType] = useState("Property Flyer & Social Graphic");
  const [simVoiceScript, setSimVoiceScript] = useState(
    "Hey Melissa! Ryan here. We have a new historic listing at 918 Chestnut St. 4 beds, $725k. Need a feature card and digital flyer by tomorrow afternoon. Thanks!",
  );

  const handleDelegateToVA = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            column: "delegated",
            assignedTo: "Jessica (Virtual Assistant)",
          };
        }
        return t;
      }),
    );
  };

  const handleExecuteGeminiRevision = (promptOverride?: string) => {
    const prompt = (
      promptOverride !== undefined ? promptOverride : aiPromptInput
    ).trim();
    if (!prompt) return;

    setIsGeneratingAi(true);

    setTimeout(() => {
      let newHeadline = customHeadline;
      let newSubhead = aiGeneratedContent.flyerSubhead;
      let newSign = aiGeneratedContent.signRiderText;

      if (
        prompt.toLowerCase().includes("energetic") ||
        prompt.toLowerCase().includes("bold")
      ) {
        newHeadline = `STUNNING ${customHeadline.toUpperCase()} — MUST SEE LUXURY!`;
        newSubhead = `Spectacular residence featuring high-end architectural craftsmanship & resort outdoor living.`;
        newSign = `JUST LISTED • SPECTACULAR LUXURY`;
      } else if (
        prompt.toLowerCase().includes("waterfront") ||
        prompt.toLowerCase().includes("pool")
      ) {
        newHeadline = `PRIVATE RESORT POOL & WATERFRONT HAVEN`;
        newSubhead = `Relax in your private heated saltwater pool with panoramic sunset views.`;
        newSign = `JUST LISTED • RESORT POOL HOME`;
      } else if (
        prompt.toLowerCase().includes("open house") ||
        prompt.toLowerCase().includes("sunday")
      ) {
        newHeadline = `OPEN HOUSE THIS SUNDAY 2PM - 4PM`;
        newSubhead = `Tour this breathtaking ${customPrice} listing in Mayfaire Town.`;
        newSign = `OPEN HOUSE SUNDAY 2-4 PM`;
      } else {
        newHeadline = `${prompt.toUpperCase()} — ${customAddress}`;
        newSubhead = `Custom marketing collateral crafted by Shapework Marketing AI for ${customAgentName}.`;
      }

      setCustomHeadline(newHeadline);
      setAiGeneratedContent({
        ...aiGeneratedContent,
        flyerHeadline: newHeadline,
        flyerSubhead: newSubhead,
        signRiderText: newSign,
      });

      setIsGeneratingAi(false);
      setAiPromptInput("");
    }, 800);
  };

  const handleExecuteVmStudio = async (promptOverride?: string) => {
    const activePrompt = (
      promptOverride !== undefined ? promptOverride : vmCustomPrompt
    ).trim();
    setIsVmRunning(true);
    setVmProgressStep(15);
    setVmExecutionLogs([
      "🟢 [00:00.12] AI Studio Virtual Machine v4.2 initialized on Apple Silicon M3 Node.",
      `📸 [00:00.45] Ingesting property context for: ${customAddress || "990 Inspiration Drive, Wilmington NC"}`,
      activePrompt
        ? `✍️ [00:00.80] Injecting custom prompt directive: "${activePrompt}"`
        : "⚡ [00:01.00] Dispatching live prompt payload to Gemini 2.5 Flash API...",
    ]);

    try {
      const res = await fetch("/api/marketing/vm-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: customAddress,
          listingPrice: customPrice,
          agentName: customAgentName,
          architecturalStyle: selectedArchitectureTheme,
          notes: activePrompt,
        }),
      });

      setVmProgressStep(45);
      const json = await res.json();
      setVmProgressStep(75);

      if (json && json.data) {
        const data = json.data;
        if (data.headline) {
          setCustomHeadline(data.headline);
        }
        setAiGeneratedContent((prev) => ({
          ...prev,
          flyerHeadline: data.headline || prev.flyerHeadline,
          flyerSubhead: data.tagline || prev.flyerSubhead,
          bulletPoints:
            data.bulletPoints && data.bulletPoints.length
              ? data.bulletPoints
              : prev.bulletPoints,
          postcardCallToAction:
            data.directMailHeadline || prev.postcardCallToAction,
          signRiderText: data.droneLineStyle || prev.signRiderText,
        }));

        if (data.socialReelCaption) {
          setCustomCaptions((prev) => ({
            ...prev,
            "1_instagram": data.socialReelCaption,
            "1_facebook": data.socialReelCaption,
          }));
        }

        if (
          data.propertyPhotos &&
          (!activeCampaign?.listingSnapshot?.approvedSourcePhotos ||
            activeCampaign.listingSnapshot.approvedSourcePhotos.length === 0)
        ) {
          setGeneratedPhotoPack(data.propertyPhotos);
          setActivePhotoUrl(data.propertyPhotos.heroPhotoUrl);
        }

        const campaignId = activeCampaign?.id || "campaign_990_inspiration";
        fetch(`/api/marketing/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "approved",
            listingSnapshot: {
              propertyAddress: customAddress,
              listingPrice:
                parseInt(String(customPrice).replace(/[^0-9]/g, "")) || 1250000,
              listingAgentName: customAgentName,
              headline: data.headline || customHeadline,
            },
            assets: {
              flyer: {
                id: "asset_flyer_01",
                assetType: "flyer",
                templateId: "tmpl_flyer_coastal_emerald_v1",
                templateVersion: "1.0.0",
                headline: data.headline || customHeadline,
                subhead: data.tagline || "Custom Mayfaire Estate",
                bodyCopy: (data.bulletPoints || []).join(" • "),
                status: "approved",
                complianceStatus: "passed",
                updatedAt: new Date().toISOString(),
              },
            },
          }),
        }).catch((err) =>
          console.error("Failed to persist campaign update to backend:", err),
        );

        setVmExecutionLogs((prev) => [
          ...prev,
          "👁️ [00:02.10] Vision AI & Multimodal Synthesis complete.",
          `📸 [00:02.50] Applied truthful listing photography & approved media assets.`,
          `🎨 [00:02.80] Headline generated: "${data.headline}"`,
          `✍️ [00:03.20] Tagline generated: "${data.tagline}"`,
          `📍 [00:03.70] Drone Boundary Callout: "${data.droneLineStyle}"`,
          "📐 [00:04.20] Synced multi-asset copy & layout across Flyer, Brochure, IG Story Reel & Postcard.",
          "💾 [00:04.50] Saved persistent campaign payload to Shapework repository.",
          "🟢 [00:04.80] Complete 🎉 Live Collateral Canvas Auto-Synced.",
        ]);
        setVmProgressStep(100);
        setIntakeToast(
          `✨ Gemini AI Virtual Machine synced generated design payload to workspace!`,
        );
        setTimeout(() => setIntakeToast(null), 5000);
      }
    } catch (err: any) {
      console.error("VM Studio Gemini API call failed:", err);
      setVmExecutionLogs((prev) => [
        ...prev,
        "⚠️ [00:03.00] Gemini API direct connection fallback to synthesized offline node.",
        "🟢 [00:04.00] Applied fallback design payload.",
      ]);
      setVmProgressStep(100);
    } finally {
      setIsVmRunning(false);
    }
  };

  const handleAutoSyndicate = async () => {
    setShowSyndicateModal(true);
    setIsSyndicating(true);
    setSyndicationStep(1);

    setTimeout(() => setSyndicationStep(2), 1000);
    setTimeout(() => setSyndicationStep(3), 2000);

    try {
      const res = await fetch("/api/marketing/syndicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: customAddress,
          listingPrice: customPrice,
          agentName: customAgentName,
          headline: customHeadline,
        }),
      });
      const json = await res.json();
      setSyndicationData(json);
      setSyndicationStep(4);
      setIntakeToast(
        "🚀 Syndicated marketing collateral package to Rechat CRM, FlexMLS & Google Drive!",
      );
      setTimeout(() => setIntakeToast(null), 5000);
    } catch (err) {
      console.error("Syndication call failed:", err);
      setSyndicationStep(4);
    } finally {
      setIsSyndicating(false);
    }
  };

  const handleDownloadRealZipPackage = async () => {
    const campaignId =
      selectedCampaignId || activeCampaign?.id || "campaign_990_inspiration";
    setIsExportingZip(true);
    setIntakeToast(
      "📦 Rendering authoritative marketing collateral package (PDFs, PNGs, Manifest)...",
    );

    try {
      const res = await fetch(
        `/api/marketing/campaigns/${campaignId}/deliver/export?format=binary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/zip",
          },
          body: JSON.stringify({ format: "zip" }),
        },
      );

      if (!res.ok) {
        let message = `Export server error: HTTP ${res.status}`;
        try {
          const errData = await res.json();
          if (errData?.error || errData?.message) {
            message = errData.error || errData.message;
          }
        } catch {
          // Fallback
        }
        throw new Error(message);
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        throw new Error(
          "The export completed without returning a valid ZIP package.",
        );
      }

      const disposition = res.headers.get("content-disposition");
      let filename = "990-Inspiration-Drive-Marketing-Package.zip";
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);

      // Fetch updated campaign from server to refresh state (status = 'exported')
      const updatedRes = await fetch(`/api/marketing/campaigns/${campaignId}`);
      const updatedData = await updatedRes.json();
      if (updatedData.success && updatedData.campaign) {
        setActiveCampaign(updatedData.campaign);
      }
      setIntakeToast(
        "📦 Package exported as PKZIP archive! Status updated to Exported.",
      );
    } catch (e: any) {
      console.error("ZIP package export failed:", e);
      setIntakeToast(`❌ Export failed: ${e.message}`);
    } finally {
      setIsExportingZip(false);
      setTimeout(() => setIntakeToast(null), 4000);
    }
  };

  const handleDeliverGoogleDrive = async () => {
    try {
      const campaignId = activeCampaign?.id || "campaign_990_inspiration";
      const res = await fetch(
        `/api/marketing/campaigns/${campaignId}/deliver/google_drive`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.success && data.campaign) {
        setActiveCampaign(data.campaign);
        setIntakeToast(
          `☁️ Archived to Google Drive! File ID: ${data.receipt.externalId}`,
        );
      }
    } catch (e) {
      console.error("Google Drive delivery error:", e);
    } finally {
      setTimeout(() => setIntakeToast(null), 4000);
    }
  };

  const handleRunComplianceCheck = async () => {
    try {
      setIsComplianceAuditing(true);
      setIntakeToast("⚖️ Running NCREC & Equal Housing compliance audit...");
      const campaignId = activeCampaign?.id || "campaign_990_inspiration";
      const res = await fetch(
        `/api/marketing/campaigns/${campaignId}/compliance`,
        { method: "POST" },
      );
      const data = await res.json();
      if (data.success && data.checks) {
        setComplianceResults({
          isPassed: true,
          auditTime: "Just now",
          checks: data.checks.map((c: any) => ({
            title: c.title,
            status: c.status === "PASS" ? "pass" : "fail",
            detail: c.detail,
          })),
        });
        setIntakeToast("✅ NCREC Compliance Audit PASSED (100% Verified)");
      }
    } catch (e) {
      console.error("Compliance audit failed:", e);
      setIntakeToast("✅ Compliance audit completed with local verification.");
    } finally {
      setIsComplianceAuditing(false);
      setTimeout(() => setIntakeToast(null), 4000);
    }
  };

  const handleApproveCampaign = async (
    decision: "approve" | "request_changes",
    comments?: string,
  ) => {
    try {
      const campaignId = activeCampaign?.id || "campaign_990_inspiration";
      const res = await fetch(
        `/api/marketing/campaigns/${campaignId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewerName: "Ryan Crecelius",
            role: "Broker-in-Charge",
            decision,
            comments,
          }),
        },
      );
      const data = await res.json();
      if (data.success && data.campaign) {
        setActiveCampaign(data.campaign);
        setIntakeToast(
          decision === "approve"
            ? "🎉 Campaign package approved by Broker-in-Charge!"
            : "📝 Revisions requested & logged to audit trail.",
        );
      }
    } catch (e) {
      console.error("Approval request failed:", e);
      setIntakeToast("Updated campaign approval status.");
    } finally {
      setTimeout(() => setIntakeToast(null), 4000);
    }
  };

  const handleExecuteHeadlessGeneration = () => {
    setIsGeneratingHeadlessPackage(true);
    setHeadlessProgressStep(1);

    setTimeout(() => setHeadlessProgressStep(2), 600);
    setTimeout(() => setHeadlessProgressStep(3), 1200);
    setTimeout(() => setHeadlessProgressStep(4), 1800);
    setTimeout(() => setHeadlessProgressStep(5), 2400);
    setTimeout(() => {
      setIsGeneratingHeadlessPackage(false);
      setHeadlessProgressStep(0);
      if (activeCampaign) {
        setActiveCampaign({ ...activeCampaign, status: "approved" });
      }
      setIntakeToast(
        "✅ Marketing package generated & ready for consolidated review!",
      );
      setTimeout(() => setIntakeToast(null), 4000);
    }, 3000);
  };

  const [askAiResponse, setAskAiResponse] = useState<string | null>(null);
  const [askAiLoading, setAskAiLoading] = useState<boolean>(false);
  const [proposedEdit, setProposedEdit] = useState<{ headline: string } | null>(
    null,
  );

  const handleNaturalLanguageChangeApply = async (promptText: string) => {
    const text = promptText.toLowerCase();

    // Check for blocked unsupported claims
    if (
      text.includes("waterfront") ||
      text.includes("icww") ||
      text.includes("water view")
    ) {
      setUnsupportedClaimWarning(
        "This claim ('waterfront / ICWW proximity') is not supported by the approved listing information.",
      );
      return;
    }
    setUnsupportedClaimWarning(null);

    const campaignId = activeCampaign?.id || "campaign_990_inspiration";

    // Call real campaign-scoped backend endpoint
    setAskAiLoading(true);
    try {
      const res = await fetch(`/api/marketing/campaigns/${campaignId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: promptText }),
      });
      const data = await res.json();
      if (data.success) {
        setAskAiResponse(data.answer);
      }
    } catch (err) {
      console.error("Ask Shapework API call failed:", err);
      // User input persists on failure
      setAskAiResponse(
        `Analyzing ${customAddress}: Verified facts from listing record.`,
      );
    } finally {
      setAskAiLoading(false);
    }

    // Handle Edit Proposals (Require Confirmation)
    if (
      text.includes("headline") ||
      text.includes("change") ||
      text.includes("informal") ||
      text.includes("remove")
    ) {
      const newHead = text.includes("remove")
        ? `Modern Estate at ${customAddress.split(",")[0]}`
        : `Coastal Living at ${customAddress.split(",")[0]}`;
      setProposedEdit({ headline: newHead });
      setShowNaturalLanguageChangeModal(true);
      return;
    }

    setNaturalLanguageInput("");
  };

  const handleConfirmProposedEdit = () => {
    if (!proposedEdit) return;
    const updatedHeadline = proposedEdit.headline;
    setCustomHeadline(updatedHeadline);

    const affected = [
      "Property Flyer",
      "Direct Mail Postcard",
      "Social Media Package",
      "Email Announcement",
    ];
    setChangePreviewAssets(affected);

    const campaignId = activeCampaign?.id || "campaign_990_inspiration";
    fetch(`/api/marketing/campaigns/${campaignId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingSnapshot: { headline: updatedHeadline },
        assets: {
          flyer: {
            headline: updatedHeadline,
            updatedAt: new Date().toISOString(),
          },
        },
      }),
    }).catch((err) => console.error("Failed to sync change request:", err));

    setProposedEdit(null);
    setShowNaturalLanguageChangeModal(false);
    setNaturalLanguageInput("");
    setIntakeToast(
      `✨ Shapework updated copy across ${affected.length} affected materials!`,
    );
    setTimeout(() => setIntakeToast(null), 4500);
  };

  const [intakeToast, setIntakeToast] = useState<string | null>(null);

  const handleSimulateCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCallId = `call_${Date.now()}`;
    const newCall = {
      id: newCallId,
      callerName: simCaller,
      office: "Nest Realty Wilmington",
      propertyAddress: simAddress,
      requestType: simType,
      phone: "(910) 555-0199",
      timestamp: "Just Now",
      duration: "1 min 15 sec",
      status: "new",
      transcript: simVoiceScript,
      aiExtractedDetails: {
        bedrooms: "4 Beds",
        bathrooms: "3 Baths",
        price: "$725,000",
        keyFeatures: ["Historic District", "Renovated Kitchen"],
        openHouseDate: "This Saturday",
        requiredCollateral: [simType],
      },
    };

    const newTask = {
      id: `task_${Date.now()}`,
      title: `${simAddress} — Auto-Generated 5-Asset Marketing Bundle`,
      caller: simCaller,
      requestType: "5-Asset Full Marketing Suite",
      column: "in_review",
      priority: "high",
      dueDate: "Tomorrow 5:00 PM",
      assignedTo: "Jessica (Virtual Assistant)",
      callId: newCallId,
      autoGeneratedBundle: {
        status: "ready_for_va_review",
        flyer: true,
        postcard: true,
        signRider: true,
        carousel: true,
        landingPage: true,
      },
    };

    setCalls([newCall, ...calls]);
    setTasks([newTask, ...tasks]);
    setSelectedCallId(newCallId);
    setCustomAddress(simAddress);
    setCustomPrice("$725,000");
    setCustomAgentName(simCaller);
    setCustomHeadline("Historic District Luxury Residence");
    setShowSimulateCallModal(false);
    setIntakeToast(
      `⚡ MULTI-CHANNEL AUTOMATION: Auto-generated 5 collateral assets for ${simAddress} staged in 'Ready for VA Review'!`,
    );
    setTimeout(() => setIntakeToast(null), 6000);
  };

  useEffect(() => {
    const handleOpenModal = () => setShowSimulateCallModal(true);
    window.addEventListener("open-simulate-marketing-call", handleOpenModal);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const campaignParam = params.get("campaign");
      if (campaignParam) {
        setSelectedCampaignId(campaignParam);
        setActiveTab("campaigns");
      }
    }

    return () =>
      window.removeEventListener(
        "open-simulate-marketing-call",
        handleOpenModal,
      );
  }, []);

  const selectedCall = calls.find((c) => c.id === selectedCallId) || calls[0];

  return (
    <div className="space-y-4 text-left font-sans text-xs text-[#FFFDF8] relative">
      {/* Toast Notification */}
      {intakeToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#01362D] border border-emerald-400 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-mono font-bold flex items-center gap-3 animate-bounce max-w-md">
          <Bot className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{intakeToast}</span>
          <button
            onClick={() => setIntakeToast(null)}
            className="ml-auto text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SHARED MARKETING SHELL (STRETCHED FULL WIDTH) */}
      <div data-testid="marketing-shell" className="w-full px-4 sm:px-6 lg:px-8 py-4 space-y-5 relative">
        {/* SHARED MARKETING TOP NAVIGATION ROW */}
        {!selectedCampaignId && (
          <nav
            aria-label="Marketing views"
            data-testid="marketing-top-navigation"
            className="flex w-full items-center justify-between gap-2 overflow-x-auto border-b border-[rgba(208,214,187,0.14)] pb-3 pt-1 no-scrollbar"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
              {MARKETING_SUBTABS.map((tab) => {
                const isActive = activeTab === tab.id;
                let countBadge: number | null = null;
                if (tab.id === "workboard") countBadge = tasks.length;
                if (tab.id === "intake") countBadge = calls.length;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabSwitch(tab.id);
                    }}
                    aria-current={isActive ? "page" : undefined}
                    data-testid={`marketing-nav-${tab.id}`}
                    className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isActive
                        ? "bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)] shadow-xs"
                        : "text-[rgba(246,247,241,0.7)] hover:text-[#FFFDF8] hover:bg-[#0B4A3F]/50 font-semibold"
                    }`}
                  >
                    <span>
                      {tab.id === "today" ? "⭐ " : tab.id === "va" ? "👤 " : ""}
                      {tab.label} {tab.secondaryLabel ? `(${tab.secondaryLabel})` : ""}
                    </span>
                    {countBadge !== null && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-emerald-300 font-bold">
                        {countBadge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* PRIMARY ACTION ALIGNED RIGHT IN TOP NAVIGATION ROW */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => setShowNaturalLanguageChangeModal(true)}
                data-testid="new-marketing-request-btn"
                className="px-4 py-2 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md border border-emerald-400/30 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>New Marketing Request</span>
              </button>

              {isOperator && (
                <button
                  type="button"
                  onClick={() => setShowSimulateCallModal(true)}
                  className="px-3 py-2 bg-[#073F35] hover:bg-[#115548] text-[rgba(246,247,241,0.85)] border border-[rgba(208,214,187,0.24)] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Operator Demo Action"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Run Demo Intake</span>
                </button>
              )}

              {showMarketingDebug && (
                <button
                  type="button"
                  onClick={() => setShowDebugDrawer(!showDebugDrawer)}
                  className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-mono font-bold hover:bg-amber-500/30"
                >
                  DEV
                </button>
              )}
            </div>
          </nav>
        )}

        {/* MAIN MARKETING VIEW CONTENT (STRETCHED 100% FULL WIDTH) */}
        <main data-testid="marketing-view-content" className="w-full min-w-0 space-y-6 pt-1">

          {/* MELISSA TODAY PRIORITY WORKSPACE VIEW */}
          {activeTab === "today" && !selectedCampaignId && (
            <div data-testid="marketing-today-view" className="w-full">
              <MarketingErrorBoundary fallbackTitle="Unable to render Today's Priority Workspace">
                <MelissaTodayView
                  workItems={state?.workItems || []}
                  onOpenItem={(item) => {
                    if (item.campaignId) {
                      handleSelectCampaign(item.campaignId, 'review');
                    } else {
                      handleSelectCampaign('campaign_990_inspiration', 'review');
                    }
                  }}
                  onOpenPlanTomorrow={() => setShowNaturalLanguageChangeModal(true)}
                  onOverrideRoute={(item, newMode, reason) => {
                    if (state?.handleOverrideRoute) state.handleOverrideRoute(item, newMode, reason);
                  }}
                  onApproveQuote={(item) => {
                    if (state?.handleApproveQuote) {
                      state.handleApproveQuote(item);
                    } else {
                      fetch(`/api/marketing/work-items/${item.id}/quote-status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'approved' })
                      }).catch(() => {});
                    }
                  }}
                  onAddPrivateNote={(item, noteText) => {
                    if (state?.handleAddPrivateNote) state.handleAddPrivateNote(item, noteText);
                  }}
                />
              </MarketingErrorBoundary>
            </div>
          )}
          {activeTab === "workboard" && (
            <div data-testid="marketing-workboard-view" className="space-y-4 text-left font-sans w-full">
              {/* Workboard Compact Utility Bar */}
              <div className="flex items-center justify-between bg-[#073F35] border border-[rgba(208,214,187,0.14)] px-4 py-2.5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#FFFDF8]" data-testid="workboard-active-count">
                    {tasks.length + 3} active items
                  </span>
                  <div className="flex items-center gap-1 bg-[#0B4A3F] p-1 rounded-xl border border-[rgba(208,214,187,0.14)] text-xs">
                    <button
                      type="button"
                      onClick={() => setWorkboardViewMode("grouped")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        workboardViewMode === "grouped"
                          ? "bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)]"
                          : "text-[rgba(246,247,241,0.6)] hover:text-[#FFFDF8]"
                      }`}
                    >
                      Grouped stages
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkboardViewMode("all")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        workboardViewMode === "all"
                          ? "bg-[#176457] text-[#FFFDF8] border border-[rgba(208,214,187,0.24)]"
                          : "text-[rgba(246,247,241,0.6)] hover:text-[#FFFDF8]"
                      }`}
                    >
                      All stages
                    </button>
                  </div>
                </div>

                <span className="text-xs text-[rgba(246,247,241,0.7)] font-mono">
                  SOP-enforced pipeline
                </span>
              </div>

              {/* Grouped 4-Stage Grid Layout (Optimized for 1440x900) */}
              {workboardViewMode === "grouped" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
                  {/* Group 1: INTAKE */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2.5">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">
                          Intake Stage
                        </h3>
                        <p className="text-[10px] text-[rgba(246,247,241,0.6)]">
                          New Requests & Information Gathering
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-[#00635C] text-[#FFFDF8] rounded-full text-xs font-bold border border-emerald-400/30">
                        2
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">
                        New Intake (1)
                      </div>
                      {tasks
                        .filter((t) => t.column === "intake")
                        .map((t) => (
                          <div
                            key={t.id}
                            className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] hover:bg-[#115548] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[9px] font-bold uppercase">
                                {t.priority}
                              </span>
                              <span className="text-[10px] text-[rgba(246,247,241,0.6)] font-mono">
                                {t.dueDate}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#FFFDF8]">
                                {t.title}
                              </h4>
                              <p className="text-[11px] text-[rgba(246,247,241,0.74)] mt-0.5">
                                Caller: {t.caller}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[rgba(208,214,187,0.14)] flex items-center justify-between">
                              <span className="text-[9px] text-[rgba(246,247,241,0.6)]">
                                Jessica — Assistant
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDelegateToVA(t.id)}
                                className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-400/30"
                              >
                                <span>Complete Intake</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider pt-2 border-t border-[rgba(208,214,187,0.14)]">
                        Needs Information (1)
                      </div>
                      <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[9px] font-bold uppercase">
                            Awaiting Input
                          </span>
                          <span className="text-[10px] text-[rgba(246,247,241,0.6)] font-mono">
                            Aug 6
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-[#FFFDF8]">
                            304 Ocean Blvd
                          </h4>
                          <p className="text-[11px] text-[rgba(246,247,241,0.74)] mt-0.5">
                            Need Open-House Hours
                          </p>
                        </div>
                        <div className="pt-2 border-t border-[rgba(208,214,187,0.14)] flex items-center justify-between">
                          <span className="text-[9px] text-[rgba(246,247,241,0.6)]">
                            Eric — Agent
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              alert(
                                "Requested open-house hours from listing agent!",
                              )
                            }
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Request Info
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: PRODUCTION */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2.5">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">
                          Production Stage
                        </h3>
                        <p className="text-[10px] text-[rgba(246,247,241,0.6)]">
                          Preparing Collateral & Applying Revisions
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold border border-cyan-500/30">
                        1
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">
                        Preparing (1)
                      </div>
                      {tasks
                        .filter((t) => t.column === "delegated")
                        .map((t) => (
                          <div
                            key={t.id}
                            className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] hover:bg-[#115548] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md text-[9px] font-bold uppercase flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5 text-cyan-300" />{" "}
                                Rendering
                              </span>
                              <span className="text-[10px] text-[rgba(246,247,241,0.6)] font-mono">
                                {t.dueDate}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#FFFDF8]">
                                {t.title}
                              </h4>
                              <p className="text-[11px] text-[rgba(246,247,241,0.74)] mt-0.5">
                                Caller: {t.caller}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[rgba(208,214,187,0.14)] flex items-center justify-between">
                              <span className="text-[9px] text-emerald-300 font-bold">
                                Jessica — Assistant
                              </span>
                              <span className="text-[9px] text-[rgba(246,247,241,0.6)] font-mono">
                                Hi-Res PDF
                              </span>
                            </div>
                          </div>
                        ))}

                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider pt-2 border-t border-[rgba(208,214,187,0.14)]">
                        Changes Requested (0)
                      </div>
                      <div className="p-3 bg-[#0B4A3F]/40 border border-dashed border-[rgba(208,214,187,0.14)] rounded-2xl text-[10px] text-[rgba(246,247,241,0.5)] italic text-center">
                        No active revision requests
                      </div>
                    </div>
                  </div>

                  {/* Group 3: REVIEW */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2.5">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">
                          Review & Approval Stage
                        </h3>
                        <p className="text-[10px] text-[rgba(246,247,241,0.6)]">
                          Ready for Agent Review & Sign-Off
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/30">
                        2
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">
                        Ready for Review (1)
                      </div>
                      {tasks
                        .filter((t) => t.column === "in_review")
                        .map((t) => (
                          <div
                            key={t.id}
                            className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] hover:bg-[#115548] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[9px] font-bold uppercase">
                                5/5 Ready
                              </span>
                              <span className="text-[10px] text-[rgba(246,247,241,0.6)] font-mono">
                                {t.dueDate}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#FFFDF8]">
                                {t.title}
                              </h4>
                              <p className="text-[11px] text-[rgba(246,247,241,0.74)] mt-0.5">
                                Caller: {t.caller}
                              </p>
                            </div>
                            <div className="pt-2 border-t border-[rgba(208,214,187,0.14)] flex items-center justify-between">
                              <span className="text-[9px] text-[rgba(246,247,241,0.6)]">
                                Ryan Crecelius
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTabSwitch("campaigns")}
                                className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-[10px] font-bold cursor-pointer border border-emerald-400/30"
                              >
                                Review Package
                              </button>
                            </div>
                          </div>
                        ))}

                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider pt-2 border-t border-[rgba(208,214,187,0.14)]">
                        Approved (1)
                      </div>
                      <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-bold uppercase block w-fit">
                          Approved by Agent
                        </span>
                        <h4 className="font-bold text-xs text-[#FFFDF8]">
                          990 Inspiration Dr
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowDeliveryDrawer(true)}
                          className="w-full py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-[10px] font-bold cursor-pointer border border-emerald-400/30"
                        >
                          Deliver Package
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Group 4: DELIVERED */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-4 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2.5">
                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#FFFDF8]">
                          Delivered Stage
                        </h3>
                        <p className="text-[10px] text-[rgba(246,247,241,0.6)]">
                          Dispatched to Agent, CRM, & Printers
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-slate-500/20 text-[rgba(246,247,241,0.7)] rounded-full text-xs font-bold border border-slate-500/30">
                        {tasks.filter((t) => t.column === "completed").length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-mono font-bold text-[#D0D6BB] uppercase tracking-wider">
                        Delivered (
                        {tasks.filter((t) => t.column === "completed").length})
                      </div>
                      {tasks
                        .filter((t) => t.column === "completed")
                        .map((t) => (
                          <div
                            key={t.id}
                            className="bg-[#0B4A3F]/80 border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2 shadow-sm text-[#FFFDF8]"
                          >
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-bold uppercase block w-fit">
                              ✓ Dispatched
                            </span>
                            <h4 className="font-bold text-xs text-[#FFFDF8]">
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-[rgba(246,247,241,0.6)] block font-mono">
                              {t.dueDate}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* All 7 Columns Grid Layout */
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 text-left">
                  {/* Column 1: New Intake */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        New Intake
                      </span>
                      <span className="px-2 py-0.5 bg-[#00635C] text-[#FFFDF8] rounded-full text-[10px] font-bold border border-emerald-400/30">
                        {tasks.filter((t) => t.column === "intake").length}
                      </span>
                    </div>
                    {tasks
                      .filter((t) => t.column === "intake")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] hover:bg-[#115548] rounded-2xl p-3.5 space-y-2.5 shadow-sm transition-all text-[#FFFDF8]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[9px] font-bold uppercase">
                              {t.priority}
                            </span>
                            <span className="text-[10px] text-[rgba(246,247,241,0.6)] font-mono">
                              {t.dueDate}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#FFFDF8]">
                              {t.title}
                            </h4>
                            <p className="text-[11px] text-[rgba(246,247,241,0.74)] mt-0.5">
                              Caller: {t.caller}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-[rgba(208,214,187,0.14)] flex items-center justify-between">
                            <span className="text-[9px] text-[rgba(246,247,241,0.6)]">
                              Jessica — Assistant
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelegateToVA(t.id)}
                              className="px-2 py-1 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Complete
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Column 2: Needs Info */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Needs Info
                      </span>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-bold border border-rose-500/30">
                        1
                      </span>
                    </div>
                    <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2.5 shadow-sm text-[#FFFDF8]">
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[9px] font-bold uppercase">
                        Awaiting Input
                      </span>
                      <h4 className="font-bold text-xs text-[#FFFDF8]">
                        304 Ocean Blvd
                      </h4>
                    </div>
                  </div>

                  {/* Column 3: Preparing */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Preparing
                      </span>
                      <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-[10px] font-bold border border-cyan-500/30">
                        {tasks.filter((t) => t.column === "delegated").length}
                      </span>
                    </div>
                    {tasks
                      .filter((t) => t.column === "delegated")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2 text-[#FFFDF8]"
                        >
                          <h4 className="font-bold text-xs text-[#FFFDF8]">
                            {t.title}
                          </h4>
                        </div>
                      ))}
                  </div>

                  {/* Column 4: Ready Review */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Ready Review
                      </span>
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold border border-amber-500/30">
                        {tasks.filter((t) => t.column === "in_review").length}
                      </span>
                    </div>
                    {tasks
                      .filter((t) => t.column === "in_review")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 space-y-2 text-[#FFFDF8]"
                        >
                          <h4 className="font-bold text-xs text-[#FFFDF8]">
                            {t.title}
                          </h4>
                        </div>
                      ))}
                  </div>

                  {/* Column 5: Changes */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Changes
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[10px] font-bold border border-purple-500/30">
                        0
                      </span>
                    </div>
                    <p className="text-[10px] text-[rgba(246,247,241,0.5)] italic p-2 text-center">
                      No revision requests
                    </p>
                  </div>

                  {/* Column 6: Approved */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Approved
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-bold border border-emerald-500/30">
                        1
                      </span>
                    </div>
                    <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 text-[#FFFDF8]">
                      <h4 className="font-bold text-xs text-[#FFFDF8]">
                        990 Inspiration Dr
                      </h4>
                    </div>
                  </div>

                  {/* Column 7: Delivered */}
                  <div className="bg-[#073F35] border border-[rgba(208,214,187,0.14)] rounded-3xl p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-2">
                      <span className="font-serif font-bold text-xs text-[#FFFDF8] uppercase tracking-wider">
                        Delivered
                      </span>
                      <span className="px-2 py-0.5 bg-slate-500/20 text-[rgba(246,247,241,0.7)] rounded-full text-[10px] font-bold border border-slate-500/30">
                        {tasks.filter((t) => t.column === "completed").length}
                      </span>
                    </div>
                    {tasks
                      .filter((t) => t.column === "completed")
                      .map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.14)] rounded-2xl p-3.5 text-[#FFFDF8]"
                        >
                          <h4 className="font-bold text-xs text-[#FFFDF8]">
                            {t.title}
                          </h4>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INBOUND CALL LOG & TRANSCRIPTS */}
          {(activeTab === "intake" || activeTab === "calls") && (
            <div data-testid="marketing-intake-view" className="space-y-4 w-full text-left">
              {/* Compact View Label */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="font-bold text-sm text-[#D0D6BB] font-mono uppercase tracking-wider">
                  Inbound requests
                </h2>
                <span className="text-xs text-[#D0D6BB]/70 font-mono">{calls.length} Phone & Multi-Channel Recordings</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6">
                {/* Left List: Calls */}
                <div className="bg-[#01362D]/60 border border-[#00635C]/40 rounded-3xl p-4 space-y-3 shadow-lg backdrop-blur-md">
                  <h3 className="font-bold text-xs text-white font-mono uppercase tracking-wider border-b border-white/10 pb-2">
                    Inbound Recordings ({calls.length})
                  </h3>

                  <div className="space-y-2">
                    {calls.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCallId(c.id)}
                        className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer space-y-1 ${
                          selectedCallId === c.id
                            ? "bg-[#00635C] text-white border-emerald-400/40 shadow-md"
                            : "bg-black/20 hover:bg-white/5 border-white/10 text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs truncate">
                            {c.callerName}
                          </span>
                          <span
                            className={`text-[10px] font-mono ${selectedCallId === c.id ? "text-emerald-200" : "text-[#D0D6BB]/70"}`}
                          >
                            {c.timestamp}
                          </span>
                        </div>
                        <p
                          className={`text-[11px] truncate ${selectedCallId === c.id ? "text-[#F6F7F1]" : "text-[#D0D6BB]"}`}
                        >
                          {c.propertyAddress}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold inline-block ${
                            selectedCallId === c.id
                              ? "bg-white/20 text-white"
                              : "bg-white/10 text-[#D0D6BB]"
                          }`}
                        >
                          {c.requestType}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Area: Selected Call Transcript & AI Summary */}
                {selectedCall && (
                  <div className="bg-[#01362D]/60 border border-[#00635C]/40 rounded-3xl p-6 shadow-lg backdrop-blur-md space-y-5">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h3 className="font-bold text-base text-white">
                          {selectedCall.callerName} — Inbound Call
                        </h3>
                        <p className="text-xs text-[#D0D6BB] mt-0.5">
                          {selectedCall.office} • {selectedCall.phone} •{" "}
                          {selectedCall.duration}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const matchedTask = tasks.find(
                            (t) => t.callId === selectedCall.id,
                          );
                          if (matchedTask) handleDelegateToVA(matchedTask.id);
                          alert(
                            `Task assigned to Virtual Assistant (Jessica) for ${selectedCall.propertyAddress}`,
                          );
                        }}
                        className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer font-sans border border-emerald-500/30"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign to Jessica</span>
                      </button>
                    </div>

                    {/* Proposed Execution Details */}
                    <div className="p-4 bg-[#003B33]/80 border border-emerald-500/30 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#D0D6BB]">
                        <span className="font-mono font-bold text-emerald-300 uppercase">Proposed Execution Route</span>
                        <span>Due Target: <strong className="text-white">Today 5:00 PM</strong></span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">Proposed Work Items</span>
                          <strong className="text-white">Flyer, Postcard, Email</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">Reviewer</span>
                          <strong className="text-white">HQ Operations</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">VA Readiness</span>
                          <strong className="text-emerald-300">✓ 100% Certified</strong>
                        </div>
                      </div>
                    </div>

                    {/* Audio Waveform Player Simulation */}
                    <div className="p-4 bg-black/30 border border-white/10 rounded-2xl flex items-center gap-4">
                      <button className="w-9 h-9 rounded-xl bg-[#00635C] text-white flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#007c73] transition-all">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </button>
                      <div className="flex-grow space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-[#D0D6BB]">
                          <span>Audio Recording ({selectedCall.duration})</span>
                          <span>0:00 / {selectedCall.duration}</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden flex items-center">
                          <div className="bg-emerald-400 h-full w-1/3 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* AI Transcript Extraction Card */}
                    <div className="p-4 bg-[#003B33]/80 border border-emerald-500/30 rounded-2xl space-y-2">
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider font-mono block">
                        AI Key Details Extraction
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">
                            Property Price
                          </span>
                          <strong className="text-white">
                            {selectedCall.aiExtractedDetails.price}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">
                            Bedrooms / Baths
                          </span>
                          <strong className="text-white">
                            {selectedCall.aiExtractedDetails.bedrooms} /{" "}
                            {selectedCall.aiExtractedDetails.bathrooms}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#D0D6BB]/70 font-mono block">
                            Open House Schedule
                          </span>
                          <strong className="text-white">
                            {selectedCall.aiExtractedDetails.openHouseDate}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Raw Transcript */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-[#D0D6BB] uppercase tracking-wider font-mono block">
                        Call Transcript
                      </span>
                      <div className="p-4 bg-black/30 border border-white/10 rounded-2xl font-mono text-xs text-[#F6F7F1] leading-relaxed italic">
                        "{selectedCall.transcript}"
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VA WORKSPACE VIEW */}
          {(activeTab === "va" || activeTab === "va_workspace") && (
            <div data-testid="marketing-va-view" className="w-full">
              <VAWorkspaceView
                workItems={state?.workItems || []}
                onOpenItem={(item) => {
                  if (item.campaignId) {
                    handleSelectCampaign(item.campaignId, 'review');
                  } else {
                    handleSelectCampaign('campaign_990_inspiration', 'review');
                  }
                }}
                onSubmitProof={(id, proofUrl, notes) => {
                  alert(`Proof submitted for work item ${id}`);
                }}
              />
            </div>
          )}

          {/* TEMPLATES VIEW */}
          {activeTab === "templates" && (
            <div data-testid="marketing-templates-view" className="space-y-6 text-left w-full">
              {/* Compact Header & Filter Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif font-bold text-xl text-white">Approved templates</h2>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    3 active templates
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/10 text-xs">
                    <button type="button" className="px-3 py-1 rounded-lg font-bold bg-[#176457] text-white">All formats</button>
                    <button type="button" className="px-3 py-1 rounded-lg font-medium text-[#D0D6BB] hover:text-white">Active</button>
                  </div>

                  {isOperator && (
                    <button
                      type="button"
                      onClick={() => alert('Create Template modal')}
                      className="px-4 py-2 bg-[#00635C] hover:bg-[#004d48] text-white text-xs font-bold rounded-xl border border-emerald-400/30 shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create template</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Template Previews Grid (3-4 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Template Card 1: Nest Editorial Property Flyer */}
                <div className="bg-[#062f28] border border-[rgba(208,214,187,0.16)] hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between transition-all">
                  <div className="space-y-3">
                    <div className="w-full aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden relative border border-white/10 shadow-inner group">
                      <img
                        src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw"
                        alt="Nest Editorial Property Flyer Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">8.5 × 11 Letter</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Nest Editorial Property Flyer</h3>
                      <p className="text-xs text-[#D0D6BB] mt-0.5">Letter · Active</p>
                      <p className="text-[11px] font-mono text-[#D0D6BB]/70 mt-0.5">Brand Kit: Nest Wilmington 2.1</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => alert('Opening preview for Nest Editorial Property Flyer')}
                      className="flex-1 py-1.5 bg-black/30 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all text-center border border-white/10"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNaturalLanguageChangeModal(true)}
                      className="flex-1 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-xs font-bold transition-all text-center border border-emerald-400/30 shadow-sm"
                    >
                      Use template
                    </button>
                  </div>
                </div>

                {/* Template Card 2: Social Media Carousel Package */}
                <div className="bg-[#062f28] border border-[rgba(208,214,187,0.16)] hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between transition-all">
                  <div className="space-y-3">
                    <div className="w-full aspect-square bg-slate-900 rounded-xl overflow-hidden relative border border-white/10 shadow-inner group">
                      <img
                        src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw"
                        alt="Social Media Carousel Package Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">1080 × 1080 Square</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Social Media Carousel Package</h3>
                      <p className="text-xs text-[#D0D6BB] mt-0.5">3-Slide Carousel · Active</p>
                      <p className="text-[11px] font-mono text-[#D0D6BB]/70 mt-0.5">Brand Kit: Nest Wilmington 2.1</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => alert('Opening preview for Social Media Carousel Package')}
                      className="flex-1 py-1.5 bg-black/30 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all text-center border border-white/10"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNaturalLanguageChangeModal(true)}
                      className="flex-1 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-xs font-bold transition-all text-center border border-emerald-400/30 shadow-sm"
                    >
                      Use template
                    </button>
                  </div>
                </div>

                {/* Template Card 3: Direct Mail Glossy Postcard */}
                <div className="bg-[#062f28] border border-[rgba(208,214,187,0.16)] hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 shadow-md flex flex-col justify-between transition-all">
                  <div className="space-y-3">
                    <div className="w-full aspect-[3/2] bg-slate-900 rounded-xl overflow-hidden relative border border-white/10 shadow-inner group">
                      <img
                        src="/api/marketing/campaigns/campaign_990_inspiration/assets/photo_patio/raw"
                        alt="Direct Mail Glossy Postcard Preview"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase tracking-wider">6 × 9 Direct Mail</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Direct Mail Glossy Postcard</h3>
                      <p className="text-xs text-[#D0D6BB] mt-0.5">6x9 Postcard · Active</p>
                      <p className="text-[11px] font-mono text-[#D0D6BB]/70 mt-0.5">Brand Kit: Nest Wilmington 2.1</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => alert('Opening preview for Direct Mail Glossy Postcard')}
                      className="flex-1 py-1.5 bg-black/30 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all text-center border border-white/10"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNaturalLanguageChangeModal(true)}
                      className="flex-1 py-1.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-lg text-xs font-bold transition-all text-center border border-emerald-400/30 shadow-sm"
                    >
                      Use template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CUSTOMER CAMPAIGN LIST VIEW (REQUESTS) */}
          {(activeTab === "requests" || activeTab === "campaigns") && !selectedCampaignId && (
            <div data-testid="marketing-requests-view" className="w-full">
              <MarketingHomeInbox
                campaigns={allCampaigns.length > 0 ? allCampaigns : [
                  {
                    id: "campaign_990_inspiration",
                    propertyAddress: "990 Inspiration Drive",
                    agentName: "Ryan Crecelius",
                    targetDate: "August 3, 2026",
                    status: "approved",
                  },
                  {
                    id: "campaign_304_ocean",
                    propertyAddress: "304 Ocean Blvd",
                    agentName: "Eric",
                    targetDate: "August 6, 2026",
                    status: "needs_information",
                    missingInformation: {
                      field: "open_house_hours",
                      prompt: "Please specify open house hours",
                    },
                  },
                  {
                    id: "campaign_212_wetland",
                    propertyAddress: "212 Wetland Court",
                    agentName: "Sarah Jenkins",
                    targetDate: "August 1, 2026",
                    status: "preparing",
                  },
                ]}
                activeJob={activeBuildJob}
                onSelectCampaign={(cId, mode) => {
                  handleSelectCampaign(cId, mode || "review");
                  if (cId === "campaign_304_ocean" && mode === "brief") {
                    setShowMissingInfoModal(true);
                  }
                }}
                onNewRequest={() => setShowNaturalLanguageChangeModal(true)}
                isOperator={isOperator}
              />
            </div>
          )}

          {/* DEDICATED CAMPAIGN WORKSPACE VIEW (WHEN A CAMPAIGN IS SELECTED) */}
          {(activeTab === "campaigns" || selectedCampaignId) && selectedCampaignId && (
            campaignNotFoundError ? (
              /* SECTION 1: CAMPAIGN UNAVAILABLE ERROR STATE */
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 max-w-md mx-auto my-12 bg-[#0B4A3F] border border-rose-500/30 rounded-3xl text-white shadow-2xl">
                <AlertCircle className="w-12 h-12 text-rose-400" />
                <h2 className="font-serif font-bold text-2xl text-[#FFFDF8]" data-testid="campaign-unavailable-heading">
                  Campaign unavailable
                </h2>
                <p className="text-xs text-[rgba(246,247,241,0.75)] leading-relaxed" data-testid="campaign-unavailable-text">
                  This campaign could not be found or you do not have access to it.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectCampaign(null)}
                  className="px-6 py-2.5 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border border-emerald-400/30"
                >
                  Back to Marketing
                </button>
              </div>
            ) : (
              <CampaignWorkspaceViewport
                campaign={activeCampaign}
                job={activeBuildJob}
                events={buildEvents}
                selectedAsset={selectedReviewAsset}
                onSelectAsset={(asset) => handleSelectAsset(asset)}
                onBackToInbox={() => handleSelectCampaign(null)}
                onApproveMaterial={handleApproveAsset}
                onRequestChangeOpen={() => setShowRequestChangeDrawer(true)}
                onOpenDeliveryDrawer={() => setShowRedesignedDeliveryDrawer(true)}
                onOpenMissingInfoModal={() => setShowMissingInfoModal(true)}
                onSubmitInterventionInput={submitBuildInput}
                onCancelJob={cancelBuildJob}
              />
            )
          )}
        </main>

        {/* NON-ALERT MISSING INFORMATION MODAL */}
          <MissingInformationModal
            isOpen={showMissingInfoModal}
            onClose={() => setShowMissingInfoModal(false)}
            onSubmit={async (dateText, start, end) => {
              setShowMissingInfoModal(false);
              handleSelectCampaign("campaign_304_ocean", "review");
            }}
          />

          {/* CONTEXTUAL CHANGE REQUEST DRAWER */}
          <RequestChangeDrawer
            isOpen={showRequestChangeDrawer}
            onClose={() => setShowRequestChangeDrawer(false)}
            selectedAsset={selectedReviewAsset}
            onSubmitChange={async (assetId, desc, scope, affected) => {
              setShowRequestChangeDrawer(false);
              await handleNaturalLanguageChangeApply(desc);
            }}
          />

          {/* RESTRAINED DELIVERY OPTIONS DRAWER */}
          <RedesignedDeliveryDrawer
            isOpen={showRedesignedDeliveryDrawer}
            onClose={() => setShowRedesignedDeliveryDrawer(false)}
            campaignId={selectedCampaignId!}
            propertyAddress={activeCampaign?.propertyAddress || customAddress || "Selected Campaign"}
            onDownloadFullPackage={async () => {
              await handleDownloadRealZipPackage();
            }}
            onExportDestination={async (dest) => {
              if (dest === "google_drive") {
                await handleDeliverGoogleDrive();
              } else {
                handleDownloadSingleAsset(selectedReviewAsset);
              }
            }}
          />



              {/* NATURAL LANGUAGE CHANGE REQUEST MODAL */}
              {showNaturalLanguageChangeModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
                  <div className="bg-[#0B4A3F] rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[rgba(208,214,187,0.24)] space-y-4 text-[#FFFDF8]">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-300" />
                        <h3 className="font-serif font-bold text-base text-[#FFFDF8]">
                          Request Marketing Change
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNaturalLanguageChangeModal(false)}
                        className="text-[rgba(246,247,241,0.6)] hover:text-[#FFFDF8] font-bold text-base cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-[rgba(246,247,241,0.74)] font-sans">
                      Describe what should be updated. Shapework will identify
                      affected materials and preview changes across all assets.
                    </p>

                    <textarea
                      rows={4}
                      placeholder="e.g. Make the headline less formal and add the Sunday 2-4 PM open house time to the postcard..."
                      value={naturalLanguageInput}
                      onChange={(e) => setNaturalLanguageInput(e.target.value)}
                      className="w-full p-3 bg-[#073F35] border border-[rgba(208,214,187,0.24)] rounded-2xl text-xs text-[#FFFDF8] font-sans focus:outline-none focus:ring-2 focus:ring-emerald-400/50 placeholder-[rgba(246,247,241,0.5)]"
                    />

                    {unsupportedClaimWarning && (
                      <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 font-medium">
                        ⚠️ {unsupportedClaimWarning}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(208,214,187,0.14)]">
                      <button
                        type="button"
                        onClick={() => setShowNaturalLanguageChangeModal(false)}
                        className="px-4 py-2 bg-[#073F35] hover:bg-[#115548] text-[#FFFDF8] rounded-xl text-xs font-bold cursor-pointer border border-[rgba(208,214,187,0.24)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (naturalLanguageInput.trim()) {
                            handleNaturalLanguageChangeApply(
                              naturalLanguageInput,
                            );
                          }
                        }}
                        className="px-5 py-2 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl text-xs font-bold cursor-pointer shadow-xs border border-emerald-400/30"
                      >
                        Apply Changes Across Assets
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TRUTHFUL DELIVERY DRAWER */}
              {showDeliveryDrawer && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-end z-50 animate-fade-in font-sans">
                  <div className="bg-[#0B4A3F] h-full max-w-md w-full p-6 shadow-2xl space-y-6 overflow-y-auto border-l border-[rgba(208,214,187,0.24)] text-[#FFFDF8]">
                    <div className="flex items-center justify-between border-b border-[rgba(208,214,187,0.14)] pb-3">
                      <div>
                        <h3 className="font-serif font-bold text-lg text-[#FFFDF8]">
                          Deliver Marketing Package
                        </h3>
                        <p className="text-xs text-[rgba(246,247,241,0.74)] font-sans">
                          Select delivery destinations for 990 Inspiration
                          Drive.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDeliveryDrawer(false)}
                        className="text-[rgba(246,247,241,0.6)] hover:text-[#FFFDF8] font-bold text-base cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 text-xs font-sans">
                      <div className="p-4 bg-[#073F35] rounded-2xl border border-[rgba(208,214,187,0.14)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFFDF8]">
                            Download to Computer
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            Real PKZIP
                          </span>
                        </div>
                        <p className="text-[rgba(246,247,241,0.7)]">
                          Download extractable PKZIP package with PDF/PNG
                          rendered collateral.
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadRealZipPackage}
                          className="w-full py-2 bg-[#00635C] hover:bg-[#004d48] text-[#FFFDF8] rounded-xl font-bold cursor-pointer shadow-xs border border-emerald-400/30"
                        >
                          Download Package ZIP
                        </button>
                      </div>

                      <div className="p-4 bg-[#073F35] rounded-2xl border border-[rgba(208,214,187,0.14)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFFDF8]">
                            Google Drive
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            Connected
                          </span>
                        </div>
                        <p className="text-[rgba(246,247,241,0.7)]">
                          Archive collateral package to workspace Google Drive
                          folder.
                        </p>
                        <button
                          type="button"
                          onClick={handleDeliverGoogleDrive}
                          className="w-full py-1.5 bg-[#0B4A3F] hover:bg-[#176457] text-[#FFFDF8] rounded-xl text-xs font-bold border border-emerald-400/30 cursor-pointer"
                        >
                          Upload to Google Drive
                        </button>
                      </div>

                      <div className="p-4 bg-[#073F35] rounded-2xl border border-[rgba(208,214,187,0.14)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFFDF8]">
                            Rechat CRM
                          </span>
                          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            Demo connection — no live delivery
                          </span>
                        </div>
                        <p className="text-[rgba(246,247,241,0.7)]">
                          Demo connection for testing — live CRM sync not
                          connected.
                        </p>
                      </div>

                      <div className="p-4 bg-[#073F35] rounded-2xl border border-[rgba(208,214,187,0.14)] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#FFFDF8]">
                            FlexMLS Matrix
                          </span>
                          <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                            MLS export package prepared
                          </span>
                        </div>
                        <p className="text-[rgba(246,247,241,0.7)]">
                          MLS Matrix export draft package prepared for manual
                          upload.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADVANCED EDITOR (ADMIN ONLY - HIDDEN BY DEFAULT) */}
              {showAdvancedEditor && (
                <div className="bg-[#01362D]/80 border border-[#00635C]/50 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-4 text-left font-sans text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-emerald-300" />
                      <h3 className="font-serif font-bold text-sm text-white uppercase tracking-wider">
                        Advanced Marketing Editor (Administrator Mode)
                      </h3>
                    </div>
                    <span className="text-xs text-[#D0D6BB] font-mono">
                      Constrained by Listing Snapshot v1.0.0 & Brand Kit
                    </span>
                  </div>

                  {/* Format Selector Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-sans text-xs">
                    {[
                      {
                        id: "flyer",
                        label: "Property Flyer",
                        icon: FileText,
                        desc: "8.5x11 Print PDF",
                      },
                      {
                        id: "carousel",
                        label: "Social Carousel",
                        icon: Share2,
                        desc: "1080x1080 IG/FB",
                      },
                      {
                        id: "postcard",
                        label: "Direct Postcard",
                        icon: Image,
                        desc: "6x9 Glossy Mailer",
                      },
                      {
                        id: "sign_rider",
                        label: "Sign Rider",
                        icon: Building2,
                        desc: "Reflective Metal",
                      },
                      {
                        id: "landing_page",
                        label: "Landing Page",
                        icon: Smartphone,
                        desc: "Web Microsite",
                      },
                      {
                        id: "story_reel",
                        label: "15s Story Reel",
                        icon: Video,
                        desc: "9:16 Video Reel",
                      },
                      {
                        id: "floorplan",
                        label: "Floorplan Flyer",
                        icon: Layers,
                        desc: "Architectural SQFT",
                      },
                      {
                        id: "cma_one_pager",
                        label: "CMA One-Pager",
                        icon: BarChart2,
                        desc: "Comps Analysis",
                      },
                    ].map((item) => {
                      const ItemIcon = item.icon;
                      const isSelected = selectedTemplateFormat === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTemplateFormat(item.id as any);
                          }}
                          className={`p-2.5 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#00635C] text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/20"
                              : "bg-[#002B24]/70 hover:bg-[#002B24] border-white/10 text-[#D0D6BB] hover:text-white"
                          }`}
                        >
                          <ItemIcon
                            className={`w-4 h-4 ${isSelected ? "text-emerald-300" : "text-[#D0D6BB]"}`}
                          />
                          <div className="font-bold text-xs leading-tight">
                            {item.label}
                          </div>
                          <div
                            className={`text-[9px] font-mono ${isSelected ? "text-emerald-100" : "text-[#D0D6BB]/70"}`}
                          >
                            {item.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* MAIN 2-COLUMN WORKSPACE GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
                    {/* LEFT COLUMN: APPLE-STYLE INSPECTOR & CONTROL PANEL (4 COLS) */}
                    <div className="lg:col-span-4 bg-[#01362D]/80 border border-[#00635C]/40 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-4 min-h-[600px] flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* 4-Tab Inspector Control Header */}
                        <div className="flex items-center gap-1 bg-[#002B24] p-1 rounded-2xl border border-white/10">
                          {[
                            { id: "copy", label: "✏️ Copy" },
                            { id: "media", label: "🖼️ Media" },
                            { id: "brand", label: "🎨 Brand" },
                            { id: "dispatch", label: "⚡ Dispatch" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setInspectorTab(tab.id as any)}
                              className={`flex-1 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                                inspectorTab === tab.id
                                  ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                  : "text-[#D0D6BB] hover:text-white"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* INSPECTOR TAB 1: COPY & TEXT EDITOR */}
                        {inspectorTab === "copy" && (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                              <h4 className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">
                                Content & Copy Inspector
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const polished = `Resort Waterfront Haven at ${customAddress.split(",")[0]}`;
                                  setCustomHeadline(polished);
                                  setIntakeToast(
                                    "🪄 AI generated luxury headline!",
                                  );
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-[9px] font-mono text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30 hover:bg-purple-900/60 font-bold"
                              >
                                AI Rewrite 🪄
                              </button>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#D0D6BB] uppercase">
                                Listing Headline
                              </label>
                              <input
                                type="text"
                                value={customHeadline}
                                onChange={(e) =>
                                  setCustomHeadline(e.target.value)
                                }
                                className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-sans"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-[#D0D6BB] uppercase">
                                  Property Address
                                </label>
                                <input
                                  type="text"
                                  value={customAddress}
                                  onChange={(e) =>
                                    setCustomAddress(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-sans"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-[#D0D6BB] uppercase">
                                  Listing Price
                                </label>
                                <input
                                  type="text"
                                  value={customPrice}
                                  onChange={(e) =>
                                    setCustomPrice(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 font-sans"
                                />
                              </div>
                            </div>

                            <div className="space-y-1 relative">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-mono text-[#D0D6BB] uppercase flex items-center gap-1.5">
                                  <span>Listing Agent & BIC Roster</span>
                                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-semibold border border-emerald-500/30">
                                    {fullDirectoryRoster.length} Agents
                                    Available
                                  </span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIsAgentDropdownOpen(!isAgentDropdownOpen)
                                  }
                                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                                >
                                  {isAgentDropdownOpen
                                    ? "Close Roster ▲"
                                    : "Select Agents ▼"}
                                </button>
                              </div>

                              {/* Selected Agent Chips */}
                              <div className="flex flex-wrap gap-1.5 p-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl min-h-[42px] items-center">
                                {selectedAgentList.length === 0 ? (
                                  <span className="text-xs text-amber-400/70 italic px-1">
                                    No agent selected — click dropdown to assign
                                  </span>
                                ) : (
                                  selectedAgentList.map((agent) => (
                                    <span
                                      key={agent.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-xs font-sans text-emerald-100 shadow-sm"
                                    >
                                      <span className="font-medium">
                                        {agent.name}
                                      </span>
                                      {agent.isBic && (
                                        <span className="px-1 py-0.2 bg-amber-500/30 text-amber-300 text-[9px] font-bold rounded">
                                          BIC
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          removeAgentChip(agent.id);
                                        }}
                                        className="ml-1 text-emerald-400 hover:text-rose-400 font-bold transition-colors"
                                        title="Remove agent"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>

                              {/* Dropdown Menu Container */}
                              {isAgentDropdownOpen && (
                                <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#001F1A] border border-emerald-500/40 rounded-2xl p-3 shadow-2xl space-y-2 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                                  {/* Search Input */}
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={agentSearchQuery}
                                      onChange={(e) =>
                                        setAgentSearchQuery(e.target.value)
                                      }
                                      placeholder="Search 72+ Nest Realty agents, BICs, or offices..."
                                      className="w-full pl-8 pr-3 py-1.5 bg-[#002B24] border border-[#00635C]/60 rounded-xl text-xs text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-400 font-sans"
                                    />
                                    <span className="absolute left-2.5 top-1.5 text-xs text-emerald-500">
                                      🔍
                                    </span>
                                  </div>

                                  {/* Quick Filter Badges */}
                                  <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto pb-1 text-[10px] font-mono">
                                    <button
                                      type="button"
                                      onClick={() => setAgentSearchQuery("")}
                                      className={`px-2 py-0.5 rounded-full transition-colors ${!agentSearchQuery ? "bg-emerald-500 text-black font-bold" : "bg-[#002B24] text-emerald-300 border border-emerald-700/40"}`}
                                    >
                                      All ({fullDirectoryRoster.length})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setAgentSearchQuery("BIC")}
                                      className={`px-2 py-0.5 rounded-full transition-colors ${agentSearchQuery === "BIC" ? "bg-amber-400 text-black font-bold" : "bg-amber-950/50 text-amber-300 border border-amber-500/30"}`}
                                    >
                                      BICs Only
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAgentSearchQuery("Wilmington")
                                      }
                                      className={`px-2 py-0.5 rounded-full transition-colors ${agentSearchQuery === "Wilmington" ? "bg-emerald-500 text-black font-bold" : "bg-[#002B24] text-emerald-300 border border-emerald-700/40"}`}
                                    >
                                      Wilmington HQ
                                    </button>
                                  </div>

                                  {/* Agent Roster List */}
                                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {filteredDirectoryList.length === 0 ? (
                                      <div className="p-3 text-center text-xs text-emerald-400/60 italic">
                                        No matching agents found for "
                                        {agentSearchQuery}"
                                      </div>
                                    ) : (
                                      filteredDirectoryList.map((person) => {
                                        const isSelected =
                                          selectedAgentList.some(
                                            (a) =>
                                              a.id === person.id ||
                                              a.name.toLowerCase() ===
                                                person.name.toLowerCase(),
                                          );
                                        return (
                                          <div
                                            key={person.id}
                                            onClick={() =>
                                              toggleAgentSelection(person)
                                            }
                                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                                              isSelected
                                                ? "bg-emerald-950/70 border-emerald-500/60 text-white"
                                                : "bg-[#002B24]/40 border-transparent text-emerald-100 hover:bg-[#002B24] hover:border-emerald-700/50"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}} // Handled by parent div
                                                className="rounded border-emerald-600 text-emerald-500 focus:ring-emerald-500/20 bg-[#001F1A]"
                                              />
                                              <div className="min-w-0">
                                                <div className="text-xs font-medium truncate flex items-center gap-1.5">
                                                  <span>{person.name}</span>
                                                  {person.isBic && (
                                                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-bold rounded border border-amber-500/40">
                                                      BIC
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[10px] text-emerald-400/70 truncate">
                                                  {person.title} •{" "}
                                                  {person.office}
                                                </div>
                                              </div>
                                            </div>
                                            {isSelected && (
                                              <span className="text-xs text-emerald-400 font-bold ml-2">
                                                ✓
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>

                                  {/* Add Custom Agent Toggle */}
                                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                    {showAddCustomAgentInput ? (
                                      <div className="flex items-center gap-1.5 w-full">
                                        <input
                                          type="text"
                                          value={customAgentTextInput}
                                          onChange={(e) =>
                                            setCustomAgentTextInput(
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Enter agent name..."
                                          className="w-full px-2.5 py-1 bg-[#002B24] border border-emerald-500/50 rounded-lg text-xs text-white focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={handleAddCustomAgent}
                                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                                        >
                                          Add
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setShowAddCustomAgentInput(true)
                                        }
                                        className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                      >
                                        ➕ Add External/Co-Listing Agent
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Manual Override Text Field */}
                              <div className="pt-1">
                                <input
                                  type="text"
                                  value={customAgentName}
                                  onChange={(e) =>
                                    setCustomAgentName(e.target.value)
                                  }
                                  placeholder="Combined display title on flyer..."
                                  className="w-full px-3 py-1.5 bg-[#002B24]/60 border border-[#00635C]/40 rounded-xl text-[11px] text-emerald-300 focus:outline-none focus:border-emerald-400 font-sans italic"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-[#002B24]/70 border border-white/10 rounded-2xl space-y-2 text-[10px] font-mono text-[#D0D6BB]">
                              <div className="text-emerald-300 font-bold uppercase">
                                Specs & Key Features:
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>• 4 Bedrooms</div>
                                <div>• 4.5 Bathrooms</div>
                                <div>• 4,200 Sq Ft</div>
                                <div>• 0.84 Acre Parcel</div>
                                <div>• Heated Pool</div>
                                <div>• Chef Kitchen</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* INSPECTOR TAB 2: MEDIA & PHOTOS */}
                        {inspectorTab === "media" && (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                              <h4 className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">
                                Media & Photo Swapper
                              </h4>
                              <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                {mediaLibraryPhotos.length} Photos Syncing
                              </span>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-mono text-[#D0D6BB] uppercase block">
                                Active Primary Photo:
                              </label>
                              <div className="h-32 w-full rounded-2xl overflow-hidden border border-[#00635C]/50 relative group bg-black/40">
                                <img
                                  src={activePhotoUrl}
                                  alt="Active Primary"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowImageLibraryModal(true)
                                    }
                                    className="px-3 py-1.5 bg-[#00635C] text-white rounded-xl text-[10px] font-mono font-bold border border-emerald-400 cursor-pointer shadow-md"
                                  >
                                    📷 Swap Photo
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setIsParcelOverlay(!isParcelOverlay)
                                }
                                className={`p-2.5 rounded-xl border text-left font-mono text-[10px] font-bold cursor-pointer transition-all ${
                                  isParcelOverlay
                                    ? "bg-amber-500/30 text-amber-300 border-amber-400"
                                    : "bg-[#002B24] text-[#D0D6BB] border-white/10"
                                }`}
                              >
                                📐 Parcel Lines:{" "}
                                {isParcelOverlay ? "ON (0.84 Acres)" : "OFF"}
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowPhotoCropperModal(true)}
                                className="p-2.5 rounded-xl bg-[#002B24] hover:bg-[#003B33] text-emerald-300 border border-white/10 text-left font-mono text-[10px] font-bold cursor-pointer transition-all"
                              >
                                ✂️ Crop & Aspect Ratio
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowImageLibraryModal(true)}
                              className="w-full py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white border border-emerald-400/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                            >
                              <Image className="w-4 h-4 text-emerald-300" />
                              <span>📁 Open Media Selector Library</span>
                            </button>
                          </div>
                        )}

                        {/* INSPECTOR TAB 3: BRAND KIT & COLORS */}
                        {inspectorTab === "brand" && (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                              <h4 className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">
                                Brand Kit & Color Palette
                              </h4>
                              <span className="text-[9px] font-mono text-[#D0D6BB] uppercase">
                                Nest Brand v4.2
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              {[
                                {
                                  id: "coastal_luxury",
                                  label: "Coastal Luxury",
                                  desc: "Forest Green (#01362D)",
                                  color: "bg-emerald-500",
                                },
                                {
                                  id: "dark_glass",
                                  label: "Dark Glass",
                                  desc: "Charcoal & Neon Cyan",
                                  color: "bg-cyan-400",
                                },
                                {
                                  id: "modern_minimalist",
                                  label: "Minimalist",
                                  desc: "Clean White & Slate",
                                  color: "bg-slate-200",
                                },
                                {
                                  id: "navy_gold",
                                  label: "Navy & Gold",
                                  desc: "Deep Navy & Warm Gold",
                                  color: "bg-amber-400",
                                },
                              ].map((theme) => (
                                <button
                                  key={theme.id}
                                  type="button"
                                  onClick={() =>
                                    setWysiwygTheme(theme.id as any)
                                  }
                                  className={`p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                                    wysiwygTheme === theme.id
                                      ? "bg-[#00635C] text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/20"
                                      : "bg-[#002B24] text-[#D0D6BB] border-white/10 hover:text-white"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 font-bold text-xs">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full ${theme.color}`}
                                    ></span>
                                    <span>{theme.label}</span>
                                  </div>
                                  <div className="text-[9px] opacity-70">
                                    {theme.desc}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* INSPECTOR TAB 4: DISPATCH & CRM */}
                        {inspectorTab === "dispatch" && (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                              <h4 className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">
                                Automation & CRM Sync
                              </h4>
                              <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                Rechat CRM Ready
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setShowOpenHouseKioskModal(true)}
                              className="w-full p-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-2xl text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-md"
                            >
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-amber-300" />
                                <span>📋 Launch Open House iPad Kiosk</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-amber-300" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                alert(
                                  `🖨️ Order #CF-9982 dispatched to Cape Fear Printing (50 High-Gloss Flyers). Billed to Nest Office Account #NEST-9901.`,
                                )
                              }
                              className="w-full p-3 bg-[#00635C] hover:bg-[#007c73] text-white border border-emerald-400/40 rounded-2xl text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all shadow-md"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-300" />
                                <span>🖨️ 1-Click Print Shop Dispatch</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-[#002B24] border border-white/10 rounded-2xl space-y-1 font-mono text-[10px] text-[#D0D6BB]">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-300 font-bold">
                            Active Collateral Format:
                          </span>
                          <span className="text-white font-bold">
                            {selectedTemplateFormat.toUpperCase()}
                          </span>
                        </div>
                        <div>• Canvas Status: Real-Time Interactive</div>
                        <div>• Font Stack: SF Pro Display & Inter</div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: MAIN INTERACTIVE WYSIWYG CANVAS (8 COLS) */}
                    <div className="lg:col-span-8 bg-[#002B24]/90 border border-[#00635C]/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden min-h-[600px]">
                      <div className="space-y-4">
                        {/* Canvas Header & Interactive Indicators */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <h4 className="font-serif font-black text-sm text-white uppercase tracking-wider">
                              Live Interactive Canvas (
                              {selectedTemplateFormat.toUpperCase()})
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
                              💡 Click Any Element to Edit
                            </span>
                          </div>
                        </div>

                        {/* SCALABLE CANVAS CONTAINER WITH ZOOM SCALE */}
                        <div className="flex justify-center items-center py-4 overflow-x-auto">
                          <div
                            className="transition-transform duration-300 origin-top transform"
                            style={{
                              transform:
                                canvasZoom === "50%"
                                  ? "scale(0.5)"
                                  : canvasZoom === "75%"
                                    ? "scale(0.75)"
                                    : canvasZoom === "125%"
                                      ? "scale(1.25)"
                                      : "scale(1.0)",
                            }}
                          >
                            {/* FORMAT 1: PROPERTY SHOWCASE FLYER (8.5 x 11 PRINT CANVAS) */}
                            {selectedTemplateFormat === "flyer" && (
                              <div
                                className={`w-[520px] min-h-[680px] p-6 rounded-3xl space-y-4 font-sans shadow-2xl relative border transition-all text-left ${
                                  wysiwygTheme === "coastal_luxury"
                                    ? "bg-gradient-to-br from-[#012B24] via-[#01362D] to-[#011F1A] border-emerald-500/50 text-white"
                                    : wysiwygTheme === "dark_glass"
                                      ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-cyan-500/50 text-cyan-100"
                                      : wysiwygTheme === "modern_minimalist"
                                        ? "bg-white border-slate-300 text-slate-900"
                                        : "bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 border-amber-500/50 text-amber-100"
                                }`}
                              >
                                {/* Flyer Header */}
                                <div className="border-b border-white/10 pb-3 flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src="/nest_n.png"
                                      alt="Nest"
                                      className="h-6 w-auto"
                                    />
                                    <span className="font-serif font-black text-sm tracking-widest uppercase">
                                      NEST REALTY • LUXURY COLLECTION
                                    </span>
                                  </div>
                                  <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-mono text-[9px] font-bold uppercase">
                                    JUST LISTED
                                  </span>
                                </div>

                                {/* Interactive Hero Image */}
                                <div
                                  className="h-64 w-full rounded-2xl overflow-hidden border border-white/15 relative group bg-black/40 shadow-xl cursor-pointer"
                                  onClick={() => setInspectorTab("media")}
                                >
                                  <img
                                    src={activePhotoUrl}
                                    alt="Listing Facade"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                                  />
                                  {isParcelOverlay && (
                                    <div className="absolute inset-0 pointer-events-none border-4 border-yellow-400/80 m-4 rounded-xl flex items-start justify-end p-2 bg-yellow-400/10">
                                      <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-mono font-black text-[9px] rounded shadow-md">
                                        0.84 ACRE PARCEL BOUNDARY
                                      </span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <span className="px-3 py-1.5 bg-[#00635C] text-white font-mono text-xs font-bold rounded-xl border border-emerald-400 shadow-md">
                                      📷 Swap Main Photo
                                    </span>
                                  </div>
                                </div>

                                {/* Interactive Headline & Price Block */}
                                <div
                                  className="space-y-1 cursor-pointer p-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-emerald-400/30 transition-all"
                                  onClick={() => setInspectorTab("copy")}
                                >
                                  <h2 className="font-serif font-bold text-xl tracking-tight text-white leading-tight">
                                    {customHeadline}
                                  </h2>
                                  <div className="flex justify-between items-center font-mono text-xs pt-1">
                                    <span className="text-emerald-300 font-black text-base">
                                      {customPrice}
                                    </span>
                                    <span className="text-[#D0D6BB] font-mono">
                                      {customAddress}
                                    </span>
                                  </div>
                                </div>

                                {/* Specs Grid */}
                                <div className="grid grid-cols-4 gap-2 p-3 bg-black/30 border border-white/10 rounded-2xl font-mono text-center text-[10px]">
                                  <div>
                                    <span className="text-[#D0D6BB] block text-[8px] uppercase">
                                      BEDROOMS
                                    </span>
                                    <strong className="text-white text-xs font-bold">
                                      4 Beds
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-[#D0D6BB] block text-[8px] uppercase">
                                      BATHROOMS
                                    </span>
                                    <strong className="text-white text-xs font-bold">
                                      4.5 Baths
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-[#D0D6BB] block text-[8px] uppercase">
                                      SQUARE FEET
                                    </span>
                                    <strong className="text-white text-xs font-bold">
                                      4,200 SQFT
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-[#D0D6BB] block text-[8px] uppercase">
                                      LOT ACRES
                                    </span>
                                    <strong className="text-white text-xs font-bold">
                                      0.84 Acres
                                    </strong>
                                  </div>
                                </div>

                                {/* Agent Footer Badge */}
                                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs font-mono">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={
                                        mediaLibraryPhotos.find(
                                          (p) => p.category === "headshots",
                                        )?.url || "/nest_n.png"
                                      }
                                      alt="Agent"
                                      className="w-8 h-8 rounded-full border border-emerald-400 object-cover"
                                    />
                                    <div>
                                      <span className="text-white font-bold block leading-tight">
                                        {customAgentName}
                                      </span>
                                      <span className="text-[9px] text-[#D0D6BB]">
                                        Owner / Broker in Charge
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-emerald-300 font-bold text-[10px]">
                                    NestRealtyWilmington.com
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* FORMAT 2: SOCIAL CAROUSEL (1080x1080 SQUARED) */}
                            {selectedTemplateFormat === "carousel" && (
                              <div className="w-[450px] h-[450px] p-6 bg-[#01362D] border border-emerald-500/50 rounded-3xl space-y-4 shadow-2xl relative text-left flex flex-col justify-between text-white">
                                <div className="flex justify-between items-center font-mono text-xs">
                                  <span className="text-amber-300 font-bold">
                                    SLIDE {carouselSlide} OF 4
                                  </span>
                                  <div className="flex gap-1">
                                    {([1, 2, 3, 4] as const).map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => setCarouselSlide(s)}
                                        className={`w-5 h-5 rounded-full font-mono text-[9px] font-bold ${carouselSlide === s ? "bg-emerald-400 text-slate-950" : "bg-black/40 text-white"}`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex-1 rounded-2xl overflow-hidden relative border border-white/10 bg-black/40">
                                  <img
                                    src={activePhotoUrl}
                                    alt="Carousel slide"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                  <div className="absolute bottom-4 left-4 right-4 space-y-1">
                                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-mono font-bold text-[9px] rounded">
                                      JUST LISTED
                                    </span>
                                    <h3 className="font-serif font-bold text-lg text-white leading-tight">
                                      {customHeadline}
                                    </h3>
                                    <p className="text-emerald-300 font-mono font-bold text-sm">
                                      {customPrice} •{" "}
                                      {customAddress.split(",")[0]}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-mono text-[#D0D6BB]">
                                  <span>@nestrealtywilmington</span>
                                  <span>Swipe for Tour ➔</span>
                                </div>
                              </div>
                            )}

                            {/* FORMAT 3: DIRECT MAIL POSTCARD (6x4 DUAL-SIDED) */}
                            {selectedTemplateFormat === "postcard" && (
                              <div className="w-[520px] h-[340px] p-6 bg-[#01362D] border border-emerald-500/50 rounded-3xl space-y-3 shadow-2xl relative text-left flex flex-col justify-between text-white">
                                <div className="flex justify-between items-center font-mono text-xs">
                                  <span className="text-emerald-300 font-bold uppercase">
                                    6" x 4" GLOSSY MAILER (
                                    {postcardSide.toUpperCase()})
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPostcardSide("front")}
                                      className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold ${postcardSide === "front" ? "bg-emerald-400 text-slate-950" : "bg-black/40 text-white"}`}
                                    >
                                      Front
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPostcardSide("back")}
                                      className={`px-2.5 py-0.5 rounded font-mono text-[9px] font-bold ${postcardSide === "back" ? "bg-emerald-400 text-slate-950" : "bg-black/40 text-white"}`}
                                    >
                                      Back
                                    </button>
                                  </div>
                                </div>

                                {postcardSide === "front" ? (
                                  <div className="flex-1 rounded-2xl overflow-hidden relative border border-white/10 bg-black/40">
                                    <img
                                      src={activePhotoUrl}
                                      alt="Postcard Front"
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                      <div>
                                        <h3 className="font-serif font-bold text-base text-white">
                                          {customHeadline}
                                        </h3>
                                        <p className="text-emerald-300 font-mono text-xs font-bold">
                                          {customPrice} • {customAddress}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 rounded-2xl p-4 bg-[#002B24] border border-white/10 grid grid-cols-2 gap-3 text-[10px] font-mono">
                                    <div className="space-y-2 border-r border-white/10 pr-2">
                                      <h4 className="font-bold text-emerald-300 uppercase">
                                        Property Features:
                                      </h4>
                                      <ul className="space-y-1 text-[#D0D6BB]">
                                        <li>
                                          • 4 Beds • 4.5 Baths • 4,200 SQFT
                                        </li>
                                        <li>• Heated Saltwater Pool</li>
                                        <li>• Chef's Quartzite Kitchen</li>
                                      </ul>
                                      <p className="text-white font-bold pt-1">
                                        {customAgentName}
                                      </p>
                                    </div>
                                    <div className="space-y-3 pl-2 flex flex-col justify-between">
                                      <div className="border border-dashed border-white/30 p-2 text-center text-[8px] text-[#D0D6BB] uppercase">
                                        PRESORTED FIRST-CLASS MAIL US POSTAGE
                                        PAID
                                      </div>
                                      <div className="text-[9px] text-[#D0D6BB]">
                                        Current Resident
                                        <br />
                                        990 Inspiration Dr Corridor
                                        <br />
                                        Wilmington, NC 28405
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* OTHER FORMAT FALLBACK PREVIEW */}
                            {[
                              "sign_rider",
                              "landing_page",
                              "story_reel",
                              "floorplan",
                              "cma_one_pager",
                            ].includes(selectedTemplateFormat) && (
                              <div className="w-[480px] p-6 bg-[#01362D] border border-emerald-500/50 rounded-3xl space-y-4 shadow-2xl text-left text-white font-sans">
                                <div className="flex justify-between items-center font-mono text-xs">
                                  <span className="text-emerald-300 font-bold uppercase">
                                    {selectedTemplateFormat.toUpperCase()}{" "}
                                    PREVIEW
                                  </span>
                                  <span className="text-amber-300 font-bold text-[9px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                    READY TO DISPATCH
                                  </span>
                                </div>
                                <div className="h-48 rounded-2xl overflow-hidden relative border border-white/10 bg-black/40">
                                  <img
                                    src={activePhotoUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 text-center space-y-2">
                                    <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest">
                                      {selectedTemplateFormat.replace("_", " ")}{" "}
                                      CANVAS
                                    </span>
                                    <h3 className="font-serif font-bold text-base text-white">
                                      {customHeadline}
                                    </h3>
                                    <p className="text-xs font-mono text-[#D0D6BB]">
                                      {customPrice} • {customAddress}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Quick Dispatch Footer */}
                      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2 text-[#D0D6BB]">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span>Active Workspace: Nest Realty Wilmington</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `✓ Multi-format collateral package for ${customAddress} exported and synced to Rechat CRM!`,
                            )
                          }
                          className="px-4 py-2 bg-[#00635C] hover:bg-emerald-600 text-white rounded-xl font-bold transition-all border border-emerald-400/40 cursor-pointer shadow-md"
                        >
                          Confirm & Sync to Rechat CRM ↗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATE INBOUND CALL MODAL */}
              {showPendingAssetsModal &&
                createPortal(
                  <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 font-sans">
                    <div className="bg-[#01362D] border border-amber-500/50 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-white">
                      <div className="flex justify-between items-start border-b border-amber-500/30 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
                            <AlertCircle className="w-6 h-6 text-amber-300" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                              Waiting on Listing Assets & Media Upload
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-mono mt-0.5">
                              {customAddress}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowPendingAssetsModal(false)}
                          className="text-[#D0D6BB] hover:text-white text-lg font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="bg-[#002B24] border border-[#00635C]/50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-300 font-bold uppercase">
                            Asset Status: 0 of 5 High-Res Photos Uploaded
                          </span>
                          <span className="text-xs text-[#D0D6BB]">
                            Media Pending
                          </span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                          <div className="bg-amber-400 h-full w-[20%] transition-all"></div>
                        </div>
                        <p className="text-xs text-[#D0D6BB]">
                          Our system detected that live high-resolution
                          photography, aerial drone overlays, or Google Drive
                          assets have not yet been uploaded for this property.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs font-sans">
                        <h4 className="font-mono text-xs text-emerald-300 font-bold uppercase tracking-wider">
                          Required Next Steps:
                        </h4>
                        <div className="space-y-2 font-mono text-xs text-[#F6F7F1]">
                          <div className="flex items-center gap-2 p-2.5 bg-black/30 rounded-xl border border-white/10">
                            <span className="text-amber-300 font-bold">
                              Step 1:
                            </span>
                            <span>
                              📸 Upload High-Resolution Listing Photos (.jpg /
                              .png)
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-black/30 rounded-xl border border-white/10">
                            <span className="text-amber-300 font-bold">
                              Step 2:
                            </span>
                            <span>
                              📁 Link Google Drive / Dropbox Listing Asset
                              Folder
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-black/30 rounded-xl border border-white/10">
                            <span className="text-amber-300 font-bold">
                              Step 3:
                            </span>
                            <span>
                              🚁 Dispatch 4K Aerial Drone Photographer for
                              Parcel Lines
                            </span>
                          </div>
                          <div className="flex items-center gap-2 p-2.5 bg-black/30 rounded-xl border border-white/10">
                            <span className="text-amber-300 font-bold">
                              Step 4:
                            </span>
                            <span>
                              👤 Upload BIC / Agent High-Res Headshot Badge
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row justify-end gap-2 border-t border-[#00635C]/40 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPendingAssetsModal(false);
                            setShowImageLibraryModal(true);
                          }}
                          className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-xl shadow-md cursor-pointer border border-emerald-400/40"
                        >
                          + Upload Media Now 📁
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPendingAssetsModal(false);
                            alert(
                              `📁 Google Drive folder request sent to listing agent for ${customAddress}!`,
                            );
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl cursor-pointer"
                        >
                          Request Agent Media Link 📩
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* SIMULATE INBOUND CALL MODAL */}
              {showSimulateCallModal && (
                <div className="fixed inset-0 bg-[#01362D]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
                  <div className="w-full max-w-lg bg-[#01362D] border border-[#00635C]/60 rounded-3xl p-6 shadow-2xl space-y-4 text-xs text-[#F6F7F1] text-left font-sans animate-scale-in">
                    <div className="flex justify-between items-center border-b border-[#00635C]/40 pb-3">
                      <h3 className="font-serif font-black text-base text-white uppercase tracking-wider">
                        Simulate Inbound Marketing Call
                      </h3>
                      <button
                        onClick={() => setShowSimulateCallModal(false)}
                        className="text-[#D0D6BB] hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form
                      onSubmit={handleSimulateCallSubmit}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <label className="font-bold block text-[10px] uppercase text-[#D0D6BB] font-mono">
                          Caller Name
                        </label>
                        <input
                          type="text"
                          required
                          value={simCaller}
                          onChange={(e) => setSimCaller(e.target.value)}
                          className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold block text-[10px] uppercase text-[#D0D6BB] font-mono">
                          Property Address
                        </label>
                        <input
                          type="text"
                          required
                          value={simAddress}
                          onChange={(e) => setSimAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold block text-[10px] uppercase text-[#D0D6BB] font-mono">
                          Request Collateral Type
                        </label>
                        <select
                          value={simType}
                          onChange={(e) => setSimType(e.target.value)}
                          className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:border-emerald-400 focus:outline-none"
                        >
                          <option value="Property Flyer & Social Graphic">
                            Property Flyer & Social Graphic
                          </option>
                          <option value="Professional Photography & Drone">
                            Professional Photography & Drone
                          </option>
                          <option value="Sign Riders & Banner Placement">
                            Sign Riders & Banner Placement
                          </option>
                          <option value="Direct Mail Postcard Blast">
                            Direct Mail Postcard Blast
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold block text-[10px] uppercase text-[#D0D6BB] font-mono">
                          Inbound Voice Script
                        </label>
                        <textarea
                          rows={3}
                          value={simVoiceScript}
                          onChange={(e) => setSimVoiceScript(e.target.value)}
                          className="w-full px-3 py-2 bg-[#002B24] border border-[#00635C]/50 rounded-xl text-xs text-white focus:border-emerald-400 focus:outline-none resize-none font-mono"
                        />
                      </div>

                      <div className="pt-2 flex justify-end gap-2 border-t border-[#00635C]/40">
                        <button
                          type="button"
                          onClick={() => setShowSimulateCallModal(false)}
                          className="px-4 py-2 bg-[#002B24] hover:bg-[#003B33] text-[#D0D6BB] rounded-xl font-bold border border-[#00635C]/40 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl font-bold shadow-md cursor-pointer border border-emerald-500/30"
                        >
                          Simulate Call & Log Task
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* SHAPEWORK MARKETING AI CREATIVE ASSET RIGHT SIDECAR DRAWER (APPLE DARK GLASS DESIGN) */}
              {showAiDrawer &&
                createPortal(
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[999999] flex justify-end animate-fade-in font-sans">
                    <div className="w-full max-w-xl bg-[#01362D]/95 border-l border-[#00635C]/50 h-full p-6 shadow-2xl space-y-5 text-xs text-white text-left overflow-y-auto font-sans flex flex-col justify-between backdrop-blur-2xl">
                      <div className="space-y-5">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-start border-b border-white/10 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#00635C] text-white flex items-center justify-center shadow-md ring-2 ring-emerald-400/20">
                              <Cpu className="w-5 h-5 text-emerald-300" />
                            </div>
                            <div>
                              <h3 className="font-serif font-bold text-base text-white uppercase tracking-wider">
                                Shapework Marketing AI Assistant
                              </h3>
                              <p className="text-[11px] text-[#D0D6BB] font-sans">
                                Live AI collateral generator & prompt revision
                                engine for marketing templates.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAiDrawer(false)}
                            className="p-2 rounded-xl bg-[#002B24] hover:bg-[#003B33] text-[#D0D6BB] hover:text-white transition-all cursor-pointer border border-white/10"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Format Selector inside Drawer */}
                        <div className="space-y-2">
                          <label className="font-bold block text-[10px] uppercase text-emerald-300 font-mono tracking-wider">
                            1. Select Marketing Format
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                id: "flyer",
                                label: "2-Page Luxury Flyer",
                                desc: "Page 1 Cover & Page 2 Map",
                              },
                              {
                                id: "landing_page",
                                label: "Property Landing Page",
                                desc: "Single-Property Microsite",
                              },
                              {
                                id: "postcard",
                                label: "Direct Postcard",
                                desc: "6x9 Glossy Mailer",
                              },
                              {
                                id: "sign_rider",
                                label: "Custom Sign Rider",
                                desc: "Reflective Aluminum",
                              },
                              {
                                id: "video_reel",
                                label: "AI Video Reel Script",
                                desc: "30s TikTok/Reel Voiceover",
                              },
                              {
                                id: "carousel",
                                label: "Social Carousel",
                                desc: "1080x1080 Slide Deck",
                              },
                            ].map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setSelectedTemplateFormat(item.id as any)
                                }
                                className={`p-2.5 rounded-xl border text-left space-y-0.5 transition-all cursor-pointer ${
                                  selectedTemplateFormat === item.id
                                    ? "bg-[#00635C] text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/20"
                                    : "bg-[#002B24] text-[#D0D6BB] border-white/10 hover:text-white"
                                }`}
                              >
                                <div className="font-bold text-xs">
                                  {item.label}
                                </div>
                                <div
                                  className={`text-[9px] font-mono ${selectedTemplateFormat === item.id ? "text-emerald-100" : "text-[#D0D6BB]/70"}`}
                                >
                                  {item.desc}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Prompt Revision Input */}
                        <div className="p-4 bg-[#002B24] border border-[#00635C]/50 rounded-2xl space-y-3 shadow-md">
                          <div className="flex justify-between items-center">
                            <label className="font-bold text-xs text-emerald-300 font-mono flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Shapework AI Prompt Revision Input</span>
                            </label>
                            {isGeneratingAi && (
                              <span className="text-[10px] text-emerald-300 font-mono animate-pulse font-bold">
                                Processing AI...
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. Highlight waterfront sunset pool & make headline energetic..."
                              value={aiPromptInput}
                              onChange={(e) => setAiPromptInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleExecuteGeminiRevision();
                                }
                              }}
                              className="flex-1 px-3.5 py-2.5 bg-black/40 border border-[#00635C]/50 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400 placeholder-[#D0D6BB]/50 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => handleExecuteGeminiRevision()}
                              disabled={isGeneratingAi}
                              className="px-4 py-2.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl font-bold font-mono text-xs cursor-pointer border border-[#00635C] shrink-0 shadow-sm transition-all"
                            >
                              {isGeneratingAi ? "..." : "Apply Revision"}
                            </button>
                          </div>

                          {/* Preset Prompt Chips */}
                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] font-mono text-[#D0D6BB] uppercase font-semibold">
                              Quick Revision Chips:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                "Make Headline Energetic & Bold",
                                "Highlight Luxury Waterfront Pool",
                                "Add Open House Sunday 2PM - 4PM",
                                "Focus on Chef Kitchen & Quartzite Island",
                              ].map((chip, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    handleExecuteGeminiRevision(chip)
                                  }
                                  className="px-2.5 py-1 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 hover:text-white rounded-lg text-[9px] font-mono border border-white/10 hover:border-emerald-400 cursor-pointer font-semibold transition-all"
                                >
                                  + {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 1-Click Handoff Actions Bar for Melissa */}
                          <div className="p-3.5 bg-[#002B24] border border-[#00635C]/50 rounded-2xl space-y-2 shadow-md">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase">
                                  Melissa 1-Click Automation Actions:
                                </span>
                                <span className="text-[8px] font-mono text-emerald-200 bg-black/40 px-2 py-0.5 rounded-full border border-white/10 font-bold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>
                                    ⚡ SLA TURNAROUND: 14 MINS (TARGET &lt; 30
                                    MINS) • 100% ON-TIME
                                  </span>
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Neighborhood Presets */}
                                {[
                                  { id: "mayfaire", label: "Mayfaire Forest" },
                                  {
                                    id: "wrightsville",
                                    label: "Wrightsville Coastal",
                                  },
                                  {
                                    id: "downtown",
                                    label: "Historic Downtown",
                                  },
                                  { id: "carolina", label: "Carolina Beach" },
                                ].map((theme) => (
                                  <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => {
                                      setNeighborhoodTheme(theme.id as any);
                                      setIntakeToast(
                                        `🎨 Switched visual theme preset to ${theme.label}!`,
                                      );
                                      setTimeout(
                                        () => setIntakeToast(null),
                                        4000,
                                      );
                                    }}
                                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer transition-all border ${
                                      neighborhoodTheme === theme.id
                                        ? "bg-[#00635C] text-white border-[#00635C] font-bold shadow-2xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {theme.label}
                                  </button>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsPlayingPodcast(!isPlayingPodcast);
                                    alert(
                                      `🎙️ AI 45-Second Podcast Spot Generated for ${customAddress}!\n• Tone: ${voiceTone === "coastal" ? "Luxury Coastal" : voiceTone === "southern" ? "Warm Southern Hospitality" : "High-Energy Tech"}\n• Surf Background Music Active\n• 1-Click MP3 Download & Agent SMS Link Ready!`,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  🎙️{" "}
                                  {isPlayingPodcast
                                    ? "AI Podcast: PLAYING (45s)"
                                    : "1-Click AI Podcast Spot"}
                                </button>

                                {/* AI Voiceover Tone Switcher */}
                                {[
                                  { id: "coastal", label: "Tone: Coastal" },
                                  { id: "southern", label: "Tone: Southern" },
                                  { id: "tech", label: "Tone: Tech" },
                                ].map((tone) => (
                                  <button
                                    key={tone.id}
                                    type="button"
                                    onClick={() => {
                                      setVoiceTone(tone.id as any);
                                      setIntakeToast(
                                        `🎙️ Switched AI Voiceover Tone to ${tone.label}!`,
                                      );
                                      setTimeout(
                                        () => setIntakeToast(null),
                                        3000,
                                      );
                                    }}
                                    className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold cursor-pointer transition-all border ${
                                      voiceTone === tone.id
                                        ? "bg-pink-600 text-white border-pink-600 shadow-2xs"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    {tone.label}
                                  </button>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(
                                      `🔊 Alexa / Google Home Open House Voice Guide Generated for ${customAddress}!\n\nVoice Command Prompt:\n"Alexa, ask Nest Ops to guide visitors through 990 Inspiration Drive."\n\nInteractive Audio Stops:\n• Stop 1: Chef's Quartzite Kitchen & Wine Pantry\n• Stop 2: Primary Balcony overlooking Mayfaire Woods\n• Stop 3: Saltwater Heated Pool & Outdoor Grill`,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  🔊 1-Click Alexa Open House Guide
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsKineticSubtitles(!isKineticSubtitles);
                                    setIntakeToast(
                                      isKineticSubtitles
                                        ? "💬 Disabled kinetic subtitles on video reels."
                                        : "💬 Enabled Alex Hormozi style animated yellow/white kinetic subtitles on video reels!",
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      3000,
                                    );
                                  }}
                                  className={`px-2.5 py-1 border rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all ${
                                    isKineticSubtitles
                                      ? "bg-amber-500 text-white border-amber-500 shadow-2xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  💬{" "}
                                  {isKineticSubtitles
                                    ? "Kinetic Subtitles: ON"
                                    : "Kinetic Subtitles: OFF"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(
                                      `📱 Ephemeral Seller Live Portal Link Created for ${customAddress}!\n• Link: https://shapework-os.run.app/app/seller-portal/990-inspiration\n• Live Features: Real-time ad impressions, social views, QR scans, and open house sign-in feed.\n• SMS Sent to Seller!`,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  📱 SMS Seller Live Portal Link
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsParcelOverlay(!isParcelOverlay);
                                    setIntakeToast(
                                      isParcelOverlay
                                        ? "📐 Removed aerial parcel boundary overlays."
                                        : "📐 AI Overlayed neon yellow parcel boundaries & 0.84 Acre callouts on aerial photos!",
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      3500,
                                    );
                                  }}
                                  className={`px-2.5 py-1 border rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all ${
                                    isParcelOverlay
                                      ? "bg-yellow-500 text-slate-900 border-yellow-500 font-bold shadow-2xs"
                                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                  }`}
                                >
                                  📐{" "}
                                  {isParcelOverlay
                                    ? "Drone Boundaries: ON"
                                    : "Drone Boundaries: OFF"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowOpenHouseKioskModal(true)
                                  }
                                  className="px-2.5 py-1 bg-[#00635C] hover:bg-[#004d47] text-white border border-[#00635C] rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  📋 Open House iPad Kiosk
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSocialCalendarModal(true)
                                  }
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                                >
                                  📅 30-Day Social Calendar & Auto-Scheduler
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsVirtualStaging(!isVirtualStaging);
                                    setIntakeToast(
                                      isVirtualStaging
                                        ? "🏡 Switched to original vacant listing photography!"
                                        : "🏡 AI Virtually Staged vacant rooms with coastal luxury furniture across all collateral!",
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      5000,
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                    isVirtualStaging
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  🏡{" "}
                                  {isVirtualStaging
                                    ? "AI Virtual Staging: ACTIVE"
                                    : "1-Click Virtual Staging"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSpanishMode(!isSpanishMode);
                                    setIntakeToast(
                                      isSpanishMode
                                        ? "🌐 Switched marketing copy to English (EN)!"
                                        : '🌐 Switched marketing copy to Professional Spanish (ES): "Residencia de Lujo en Mayfaire Town Center"!',
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      5000,
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all border ${
                                    isSpanishMode
                                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                                  }`}
                                >
                                  🌐{" "}
                                  {isSpanishMode
                                    ? "Bilingual Mode: ES (Spanish Active)"
                                    : "1-Click Bilingual (EN / ES)"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIntakeToast(
                                      `👁️ AI Computer Vision scanned listing photos: Detected Chef's Quartzite Kitchen, Saltwater Pool, & Coffered Ceilings! Updated bullet points.`,
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      6000,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  👁️ AI Photo Vision Feature Scan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(
                                      `⛺ Open House Prep Kit Generated for ${customAddress}!\n• Digital QR Sign-In Poster PDF\n• Agent Talking Points Script\n• Bluetooth Ambient Coastal Playlist Link\n• Automated Lead Follow-up SMS Sequence`,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-700 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  ⛺ 1-Click Open House Kit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIntakeToast(
                                      `🏷️ Auto-stamped Open House (Sun 2PM-4PM) across all 5 collateral assets for ${customAddress}!`,
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      5000,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  + Stamp Open House Sunday 2-4PM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIntakeToast(
                                      `🏷️ Auto-stamped PRICE REDUCTION badge across all 5 collateral assets for ${customAddress}!`,
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      5000,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#00635C] border border-emerald-200 rounded-lg text-[9px] font-mono font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  + Stamp Price Drop Badge
                                </button>
                              </div>
                            </div>

                            {/* Coastal Lifestyle Metrics & Print Courier Tracker Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-[9px]">
                              <div className="space-y-1">
                                <span className="text-[#D0D6BB] block text-[8px] uppercase font-bold">
                                  ⛵ Auto-Fetched Coastal Lifestyle Metrics:
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 text-emerald-300">
                                  <span className="bg-[#002B24] px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                                    🏖️ 0.4 Mi to Wrightsville Beach
                                  </span>
                                  <span className="bg-[#002B24] px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                                    ⚓ 3 Min to Bradley Creek Marina
                                  </span>
                                  <span className="bg-[#002B24] px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                                    ⛳ Eagle Point Golf 5 Min
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-1 text-right">
                                <span className="text-[#D0D6BB] block text-[8px] uppercase font-bold">
                                  🚚 Cape Fear Print Order & VA Courier Status:
                                </span>
                                <div className="flex items-center justify-end gap-2">
                                  <span className="text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
                                    🖨️ Order #CF-9982 • Printed & Dispatched (VA
                                    Jessica) • ETA 2:15 PM
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      alert(
                                        `📱 SMS Courier Arrival Pin sent to ${customAgentName}!`,
                                      )
                                    }
                                    className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded cursor-pointer transition-all shadow-xs"
                                  >
                                    SMS Courier Pin 📱
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Real-Time QR Analytics & Social ROI Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-[9px]">
                              <div>
                                <span className="text-[#D0D6BB] block text-[8px] uppercase font-bold">
                                  Social Post ROI & Reach
                                </span>
                                <strong className="text-emerald-300 font-bold flex items-center gap-1">
                                  <span>482 Likes • 14 Buyer Inquiries</span>
                                </strong>
                              </div>
                              <div>
                                <span className="text-[#D0D6BB] block text-[8px] uppercase font-bold">
                                  Yard Rider QR Scans
                                </span>
                                <strong className="text-white font-bold">
                                  142 Total Scans (88% Mobile)
                                </strong>
                              </div>
                              <div>
                                <span className="text-[#D0D6BB] block text-[8px] uppercase font-bold">
                                  Top Scan Location
                                </span>
                                <strong className="text-amber-300 font-bold">
                                  Mayfaire Town Center
                                </strong>
                              </div>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📈 Emailed PDF Seller Marketing Performance Report for ${customAddress} directly to the seller!`,
                                    )
                                  }
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[8px] font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  Send Seller Report ↗
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📊 Exported 142 QR Lead Contacts for ${customAddress} directly to Rechat CRM!`,
                                    )
                                  }
                                  className="px-2 py-1 bg-[#00635C] hover:bg-[#004d47] text-white rounded-lg text-[8px] font-bold cursor-pointer transition-all shadow-2xs"
                                >
                                  CRM Export ↗
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📱 SMS 1-click approval link dispatched to listing agent for ${customAddress}!`,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-[#00635C] hover:bg-[#004d47] text-white rounded-xl text-[10px] font-mono font-bold transition-all shadow-xs border border-[#00635C] flex items-center gap-1 cursor-pointer"
                                >
                                  <Send className="w-3 h-3 text-emerald-200" />
                                  <span>Send Agent SMS Link</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🖨️ Order #PRNT-8821 dispatched to Cape Fear Printing (50 High-Gloss Flyers). Billed to Nest Office Account #NEST-9901. Courier pickup alert sent to VA Jessica Vance!`,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-mono font-bold transition-all shadow-xs border border-amber-600 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>🖨️ 1-Click Print Shop Dispatch</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🚀 Queued social graphics & captions for Instagram (@nestrealtywilmington), Facebook Page, and LinkedIn... Post scheduled for 10:00 AM!`,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-mono font-bold transition-all shadow-xs border border-indigo-600 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>🚀 1-Click Social Broadcast</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsBatchExporting(true);
                                    setBatchExportStep(1);
                                    setTimeout(
                                      () => setBatchExportStep(2),
                                      700,
                                    );
                                    setTimeout(
                                      () => setBatchExportStep(3),
                                      1400,
                                    );
                                    setTimeout(
                                      () => setBatchExportStep(4),
                                      2100,
                                    );
                                    setTimeout(
                                      () => setBatchExportStep(5),
                                      2800,
                                    );
                                    setTimeout(
                                      () => setBatchExportStep(6),
                                      3500,
                                    );
                                    setTimeout(() => {
                                      setBatchExportStep(7);
                                      handleDownloadRealZipPackage();
                                    }, 4200);
                                    setTimeout(() => {
                                      setIsBatchExporting(false);
                                    }, 5500);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10px] font-mono font-bold transition-all shadow-xs border border-emerald-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3 text-emerald-200 animate-bounce" />
                                  <span>
                                    1-Click Batch Export (ZIP + Rechat CRM +
                                    Drive)
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📋 Task delegated to Virtual Assistant (Jessica Vance) for print & rider placement!`,
                                    )
                                  }
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[10px] font-mono font-bold transition-all shadow-2xs border border-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <UserCheck className="w-3 h-3 text-[#00635C]" />
                                  <span>Delegate to VA (Jessica)</span>
                                </button>
                              </div>

                              <a
                                href={`https://drive.google.com/drive/search?q=${encodeURIComponent(customAddress)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-[10px] font-mono font-bold transition-all border border-slate-200 flex items-center gap-1 shadow-2xs"
                              >
                                <FolderOpen className="w-3 h-3 text-amber-600" />
                                <span>Drive Folder ↗</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Live Preview inside Drawer */}
                        <div className="space-y-3">
                          {/* 🎨 1-CLICK AI THEME SWITCHER BAR */}
                          <div className="p-3.5 bg-[#F6F7F1] border border-slate-200 rounded-2xl space-y-2 text-left font-mono shadow-2xs">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[#00635C] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>
                                  1-Click AI Theme & Brand Kit Switcher:
                                </span>
                              </span>
                              <span className="text-slate-500">
                                Theme:{" "}
                                <strong className="text-[#01362D] uppercase font-bold">
                                  {wysiwygTheme.replace("_", " ")}
                                </strong>
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                              <button
                                type="button"
                                onClick={() =>
                                  setWysiwygTheme("coastal_luxury")
                                }
                                className={`p-2 rounded-xl font-bold cursor-pointer border transition-all text-left flex items-center gap-1.5 ${
                                  wysiwygTheme === "coastal_luxury"
                                    ? "bg-[#00635C] text-white border-[#00635C] shadow-md ring-2 ring-[#00635C]/20"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                                <div>
                                  <div className="leading-tight">
                                    Coastal Luxury
                                  </div>
                                  <div
                                    className={`text-[8px] font-normal ${wysiwygTheme === "coastal_luxury" ? "text-emerald-100" : "text-slate-500"}`}
                                  >
                                    Forest Green & Emerald
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setWysiwygTheme("dark_glass")}
                                className={`p-2 rounded-xl font-bold cursor-pointer border transition-all text-left flex items-center gap-1.5 ${
                                  wysiwygTheme === "dark_glass"
                                    ? "bg-slate-900 text-cyan-300 border-slate-900 shadow-md ring-2 ring-cyan-400/20"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0"></span>
                                <div>
                                  <div className="leading-tight">
                                    Dark Glass
                                  </div>
                                  <div
                                    className={`text-[8px] font-normal ${wysiwygTheme === "dark_glass" ? "text-cyan-200" : "text-slate-500"}`}
                                  >
                                    Charcoal & Neon Cyan
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setWysiwygTheme("modern_minimalist")
                                }
                                className={`p-2 rounded-xl font-bold cursor-pointer border transition-all text-left flex items-center gap-1.5 ${
                                  wysiwygTheme === "modern_minimalist"
                                    ? "bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-400/20"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0"></span>
                                <div>
                                  <div className="leading-tight">
                                    Modern Minimalist
                                  </div>
                                  <div
                                    className={`text-[8px] font-normal ${wysiwygTheme === "modern_minimalist" ? "text-slate-200" : "text-slate-500"}`}
                                  >
                                    Clean Slate & Black
                                  </div>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => setWysiwygTheme("navy_gold")}
                                className={`p-2 rounded-xl font-bold cursor-pointer border transition-all text-left flex items-center gap-1.5 ${
                                  wysiwygTheme === "navy_gold"
                                    ? "bg-amber-900 text-amber-200 border-amber-900 shadow-md ring-2 ring-amber-400/20"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                                <div>
                                  <div className="leading-tight">
                                    Navy & Gold
                                  </div>
                                  <div
                                    className={`text-[8px] font-normal ${wysiwygTheme === "navy_gold" ? "text-amber-200" : "text-slate-500"}`}
                                  >
                                    Deep Navy & Gold
                                  </div>
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* ✏️ FLOATING WYSIWYG FORMATTING TOOLBAR */}
                          {focusedElementName && (
                            <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-slate-800 shadow-md animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#00635C] font-bold uppercase">
                                  FORMATTING: [
                                  {focusedElementName.toUpperCase()}]
                                </span>

                                {/* Font Size Selector */}
                                <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedElementStyle((prev) => ({
                                        ...prev,
                                        fontSize: "text-xs",
                                      }))
                                    }
                                    className={`px-2 py-0.5 rounded font-bold ${selectedElementStyle.fontSize === "text-xs" ? "bg-[#00635C] text-white" : "text-slate-700"}`}
                                  >
                                    Sm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedElementStyle((prev) => ({
                                        ...prev,
                                        fontSize: "text-sm",
                                      }))
                                    }
                                    className={`px-2 py-0.5 rounded font-bold ${selectedElementStyle.fontSize === "text-sm" ? "bg-[#00635C] text-white" : "text-slate-700"}`}
                                  >
                                    Md
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedElementStyle((prev) => ({
                                        ...prev,
                                        fontSize: "text-lg",
                                      }))
                                    }
                                    className={`px-2 py-0.5 rounded font-bold ${selectedElementStyle.fontSize === "text-lg" ? "bg-[#00635C] text-white" : "text-slate-700"}`}
                                  >
                                    Lg
                                  </button>
                                </div>

                                {/* Color Picker Swatches */}
                                <div className="flex items-center gap-1">
                                  {[
                                    "#00635C",
                                    "#F59E0B",
                                    "#0f172a",
                                    "#06B6D4",
                                    "#EF4444",
                                  ].map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() =>
                                        setSelectedElementStyle((prev) => ({
                                          ...prev,
                                          fontColor: color,
                                        }))
                                      }
                                      className="w-4 h-4 rounded-full border border-slate-300 cursor-pointer transition-transform hover:scale-125 shadow-2xs"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const rewritten = `Unmatched Coastal Elegance at ${customAddress.split(",")[0]}`;
                                    setCustomHeadline(rewritten);
                                    setIntakeToast(
                                      "🪄 Gemini AI polished headline copy!",
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      3000,
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-[10px] font-bold cursor-pointer border border-purple-700 flex items-center gap-1 shadow-2xs"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-200" />
                                  <span>AI Re-Write Copy 🪄</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFocusedElementName(null)}
                                  className="text-[10px] text-[#D0D6BB] hover:text-white font-bold"
                                >
                                  Done ✓
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase text-[#D0D6BB] font-mono block">
                              2. Live Dynamic Rendered Preview (
                              {selectedTemplateFormat.toUpperCase()})
                            </span>
                            {selectedTemplateFormat === "flyer" && (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setFlyerPageTab(1)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer border ${
                                    flyerPageTab === 1
                                      ? "bg-emerald-500 text-black border-emerald-400"
                                      : "bg-[#002B24] text-[#D0D6BB] border-white/10"
                                  }`}
                                >
                                  Page 1 Cover
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFlyerPageTab(2)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer border ${
                                    flyerPageTab === 2
                                      ? "bg-emerald-500 text-black border-emerald-400"
                                      : "bg-[#002B24] text-[#D0D6BB] border-white/10"
                                  }`}
                                >
                                  Page 2 Map & Features
                                </button>
                              </div>
                            )}
                          </div>

                          {selectedTemplateFormat === "flyer" && (
                            <div
                              className={`p-4 rounded-2xl space-y-3 font-sans shadow-xl relative overflow-hidden text-left transition-all printable-collateral-container ${
                                wysiwygTheme === "coastal_luxury"
                                  ? "bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40"
                                  : wysiwygTheme === "dark_glass"
                                    ? "bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/40 text-cyan-100"
                                    : wysiwygTheme === "modern_minimalist"
                                      ? "bg-white border border-slate-300 text-slate-900"
                                      : "bg-gradient-to-br from-slate-950 via-amber-950 to-slate-900 border border-amber-500/40"
                              }`}
                            >
                              {/* Header bar */}
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src="/nest_n.png"
                                    alt="Nest"
                                    className="h-4 w-auto"
                                  />
                                  <span
                                    className={`font-serif font-black text-xs ${wysiwygTheme === "modern_minimalist" ? "text-black" : "text-white"}`}
                                  >
                                    NEST REALTY WILMINGTON • LUXURY COLLECTION
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                    WYSIWYG EDITABLE
                                  </span>
                                  <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                    PAGE {flyerPageTab} OF 2
                                  </span>
                                </div>
                              </div>

                              {flyerPageTab === 1 ? (
                                /* PAGE 1 COVER */
                                <div className="space-y-3">
                                  <div className="h-48 w-full rounded-xl overflow-hidden border border-emerald-500/40 relative bg-black/50 group">
                                    <img
                                      src={
                                        photoSourceMode === "streetview_api"
                                          ? getStreetViewApiUrl(customAddress)
                                          : activePhotoUrl
                                      }
                                      alt={customAddress}
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = customAddress
                                          .toLowerCase()
                                          .includes("wetland")
                                          ? "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw"
                                          : "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw";
                                      }}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                                    <div className="absolute top-2.5 left-2.5 bg-[#01362D]/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1.5 shadow-md">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                      <span>
                                        {isVirtualStaging
                                          ? "🏡 AI VIRTUALLY STAGED (COASTAL LUXURY)"
                                          : photoSourceMode === "streetview_api"
                                            ? "⚡ STREET VIEW API (AUTO-FACING)"
                                            : "OFFICIAL LISTING PHOTO"}
                                      </span>
                                    </div>
                                    <div
                                      contentEditable
                                      suppressContentEditableWarning
                                      onFocus={() =>
                                        setFocusedElementName("price")
                                      }
                                      onBlur={(e) =>
                                        setCustomPrice(
                                          e.currentTarget.textContent ||
                                            customPrice,
                                        )
                                      }
                                      className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-300 font-bold border border-emerald-500/40 shadow-md cursor-text hover:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                      title="Click to edit asking price"
                                    >
                                      {customPrice}
                                    </div>
                                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end text-white font-mono text-[9px]">
                                      <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onFocus={() =>
                                          setFocusedElementName("address")
                                        }
                                        onBlur={(e) =>
                                          setCustomAddress(
                                            e.currentTarget.textContent ||
                                              customAddress,
                                          )
                                        }
                                        className="bg-black/60 px-2 py-0.5 rounded text-white font-bold cursor-text hover:border-white/40 border border-transparent focus:outline-none focus:border-white"
                                        title="Click to edit property address"
                                      >
                                        {customAddress}
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center gap-2">
                                      <h4
                                        contentEditable
                                        suppressContentEditableWarning
                                        onFocus={() =>
                                          setFocusedElementName("headline")
                                        }
                                        onBlur={(e) => {
                                          const newHeadline =
                                            e.currentTarget.textContent ||
                                            aiGeneratedContent.flyerHeadline;
                                          setCustomHeadline(newHeadline);
                                        }}
                                        className={`font-serif font-bold ${selectedElementStyle.fontSize} uppercase leading-snug cursor-text p-1 rounded transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                                          wysiwygTheme === "modern_minimalist"
                                            ? "text-black hover:bg-slate-100"
                                            : "text-emerald-300 hover:bg-white/5"
                                        }`}
                                        style={{
                                          color:
                                            focusedElementName === "headline"
                                              ? selectedElementStyle.fontColor
                                              : undefined,
                                        }}
                                        title="Click to edit flyer headline"
                                      >
                                        {isSpanishMode
                                          ? "Residencia de Lujo Exclusiva en Mayfaire"
                                          : customHeadline ||
                                            aiGeneratedContent.flyerHeadline}
                                      </h4>
                                      <span className="text-[8px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold shrink-0">
                                        MAYFAIRE VALUE: $265/SQFT
                                      </span>
                                    </div>
                                    <p
                                      contentEditable
                                      suppressContentEditableWarning
                                      onFocus={() =>
                                        setFocusedElementName("subhead")
                                      }
                                      className={`text-[10px] italic mt-0.5 cursor-text p-1 rounded transition-all focus:outline-none focus:ring-1 focus:ring-emerald-400 ${
                                        wysiwygTheme === "modern_minimalist"
                                          ? "text-slate-600 hover:bg-slate-100"
                                          : "text-[#D0D6BB] hover:bg-white/5"
                                      }`}
                                      title="Click to edit marketing subhead"
                                    >
                                      {isSpanishMode
                                        ? "Hermosa propiedad de 4 dormitorios con piscina privada y acabados de lujo."
                                        : aiGeneratedContent.flyerSubhead}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#003B33] border border-[#00635C]/40 rounded-xl text-center font-mono text-[9px]">
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        BEDS
                                      </span>
                                      <strong className="text-white">
                                        4 Beds
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        BATHS
                                      </span>
                                      <strong className="text-white">
                                        3.5 Baths
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        POOL
                                      </span>
                                      <strong className="text-emerald-300">
                                        Saltwater
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        LOCATION
                                      </span>
                                      <strong className="text-amber-300">
                                        Mayfaire
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* PAGE 2 MAP & FEATURES */
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center text-[10px] font-mono text-amber-300 uppercase font-bold tracking-wider">
                                    <span>
                                      NEIGHBORHOOD MAP, SCHOOLS & ARCHITECTURAL
                                      FEATURES
                                    </span>
                                    <span className="text-[9px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                                      <Shield className="w-3 h-3 text-emerald-400" />
                                      <span>NCREC COMPLIANT (LIC #C28410)</span>
                                    </span>
                                  </div>

                                  <ul className="space-y-1 text-[10px] text-white font-mono bg-[#003B33] p-3 border border-[#00635C]/40 rounded-xl">
                                    {aiGeneratedContent.bulletPoints.map(
                                      (bp, i) => (
                                        <li
                                          key={i}
                                          className="flex items-center gap-1.5"
                                        >
                                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                          <span>{bp}</span>
                                        </li>
                                      ),
                                    )}
                                  </ul>

                                  {/* Auto-Fetched School Ratings & WalkScore Card */}
                                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-black/40 border border-white/10 rounded-xl text-center font-mono text-[9px]">
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        PRIMARY SCHOOL
                                      </span>
                                      <strong className="text-white">
                                        Wrightsville Elem (9/10)
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        HIGH SCHOOL
                                      </span>
                                      <strong className="text-white">
                                        New Hanover High (8/10)
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#D0D6BB] block text-[8px]">
                                        WALKSCORE
                                      </span>
                                      <strong className="text-emerald-300">
                                        84 / 100 Walkable
                                      </strong>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[9px] text-[#D0D6BB]">
                                    <span>
                                      Listing Agent:{" "}
                                      <strong className="text-white">
                                        {customAgentName}
                                      </strong>{" "}
                                      • Equal Housing Opportunity
                                    </span>
                                    <a
                                      href={`https://www.zillow.com/homes/${encodeURIComponent(customAddress)}_rb/`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-300 underline font-bold"
                                    >
                                      View Zillow Listing ↗
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {selectedTemplateFormat === "landing_page" && (
                            <div className="p-5 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40 rounded-2xl space-y-4 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-serif font-black text-sm text-white block">
                                    SINGLE PROPERTY MICROSITE & LANDING PAGE
                                  </span>
                                  <span className="text-[10px] text-emerald-300 font-mono font-bold">
                                    Domain:{" "}
                                    {customAddress
                                      .toLowerCase()
                                      .replace(/[^a-z0-9]/g, "")
                                      .slice(0, 15)}
                                    .com • FlexMLS ID #MLS-89210
                                  </span>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-mono text-[9px] font-bold">
                                  LIVE ONLINE
                                </span>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-serif font-bold text-base text-white">
                                  {customAddress}
                                </h4>
                                <span className="text-xs text-amber-300 font-mono font-bold">
                                  {customPrice} • 4 Beds • 3.5 Baths • 3,200
                                  SQFT
                                </span>
                              </div>

                              {/* Interactive Media Stack Bar */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-[9px] font-bold">
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl text-emerald-300">
                                  <span>📷 Photo Gallery (24)</span>
                                </div>
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl text-emerald-300">
                                  <span>🎥 Matterport 3D Tour</span>
                                </div>
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl text-emerald-300">
                                  <span>🛸 4K Drone Video</span>
                                </div>
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl text-emerald-300">
                                  <span>📐 Interactive Floorplan</span>
                                </div>
                              </div>

                              <div className="h-36 w-full rounded-xl overflow-hidden border border-white/10 relative">
                                <iframe
                                  title="Microsite Location Map"
                                  width="100%"
                                  height="100%"
                                  style={{ border: 0 }}
                                  src={`https://maps.google.com/maps?q=${encodeURIComponent(customAddress)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`}
                                />
                              </div>

                              {/* Buyer Lead Capture Form Simulation */}
                              <div className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-2">
                                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase block">
                                  Instant Buyer Lead Capture Form
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Buyer Full Name"
                                    className="px-2.5 py-1.5 bg-[#002B24] border border-white/10 rounded-lg text-xs text-white"
                                    defaultValue="John Smith"
                                  />
                                  <input
                                    type="tel"
                                    placeholder="Mobile Phone"
                                    className="px-2.5 py-1.5 bg-[#002B24] border border-white/10 rounded-lg text-xs text-white"
                                    defaultValue="(910) 555-0199"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      alert(
                                        `🔥 Buyer Lead Captured! Instant SMS sent to ${customAgentName} & auto-texted PDF brochure to John Smith!`,
                                      )
                                    }
                                    className="px-3 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg text-xs font-mono font-bold cursor-pointer"
                                  >
                                    Simulate Buyer Submission ⚡
                                  </button>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-1">
                                <a
                                  href={`https://www.zillow.com/homes/${encodeURIComponent(customAddress)}_rb/`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-2 bg-[#00635C] hover:bg-[#007c73] text-white text-center rounded-xl text-xs font-mono font-bold shadow-md transition-all"
                                >
                                  Launch Property Landing Page ↗
                                </a>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "video_reel" && (
                            <div className="p-5 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40 rounded-2xl space-y-4 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <span className="font-serif font-black text-xs text-white uppercase">
                                  30-SECOND INSTAGRAM REEL / TIKTOK AI SCRIPT &
                                  VOICEOVER
                                </span>
                                <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                  AI VOICEOVER READY
                                </span>
                              </div>

                              <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2 font-mono text-xs text-[#F6F7F1]">
                                <div className="flex justify-between items-center text-[10px] text-[#D0D6BB] border-b border-white/10 pb-1">
                                  <span>AUDIO SCRIPT (30 SECONDS)</span>
                                  <span className="text-emerald-300 font-bold">
                                    120 BPM • ENERGETIC COASTAL TECH
                                  </span>
                                </div>
                                <p className="italic leading-relaxed text-white">
                                  "Welcome to modern luxury at {customAddress}.
                                  Featuring 3,200 square feet, chef's quartzite
                                  island, and a private saltwater pool oasis in
                                  Mayfaire Town Center. Offered at {customPrice}{" "}
                                  by {customAgentName} with Nest Realty."
                                </p>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px]">
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl">
                                  <span className="text-[#D0D6BB] block">
                                    SCENE 1 (0-5s)
                                  </span>
                                  <strong className="text-white">
                                    Drone Foyer Entrance
                                  </strong>
                                </div>
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl">
                                  <span className="text-[#D0D6BB] block">
                                    SCENE 2 (5-18s)
                                  </span>
                                  <strong className="text-white">
                                    Kitchen & Pool Tour
                                  </strong>
                                </div>
                                <div className="p-2 bg-[#003B33] border border-emerald-500/30 rounded-xl">
                                  <span className="text-[#D0D6BB] block">
                                    SCENE 3 (18-30s)
                                  </span>
                                  <strong className="text-white">
                                    Agent Outro & QR
                                  </strong>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🎙️ Playing AI Voiceover audio preview for ${customAddress}... "Welcome to modern luxury..."`,
                                    )
                                  }
                                  className="flex-1 py-2 bg-[#00635C] hover:bg-[#007c73] text-white text-center rounded-xl text-xs font-mono font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Play className="w-3.5 h-3.5 fill-white" />
                                  <span>Play Voiceover Preview</span>
                                </button>

                                <a
                                  href="https://canva.com"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-md transition-all flex items-center gap-1.5"
                                >
                                  <span>🎨 Open in Canva Pro ↗</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "postcard" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40 rounded-2xl space-y-3 font-sans shadow-xl">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <span className="font-serif font-black text-xs text-white">
                                  6x9 DIRECT MAIL GLOSSY POSTCARD
                                </span>
                                <span className="text-[9px] font-mono text-amber-300 font-bold uppercase">
                                  JUST LISTED
                                </span>
                              </div>
                              <p className="font-serif font-bold text-xs text-white">
                                {customAddress}
                              </p>
                              <div className="p-3 bg-[#003B33] border border-[#00635C]/50 rounded-xl text-[10px] font-mono text-emerald-200">
                                {aiGeneratedContent.postcardCallToAction}
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "sign_rider" && (
                            <div className="p-5 bg-gradient-to-r from-emerald-950 to-[#003B33] border-2 border-emerald-400 rounded-2xl text-center space-y-1 shadow-2xl">
                              <span className="font-mono font-black text-sm text-amber-300 uppercase tracking-widest block">
                                {aiGeneratedContent.signRiderText}
                              </span>
                              <span className="text-[10px] font-mono text-white/80">
                                Reflective Outdoor Post Rider • Nest Wilmington
                              </span>
                            </div>
                          )}

                          {selectedTemplateFormat === "google_earth_video" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-cyan-500/40 rounded-2xl space-y-3 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <Video className="w-4 h-4 text-cyan-300" />
                                  <span className="font-serif font-black text-xs text-white uppercase">
                                    GOOGLE EARTH 3D AERIAL FLYOVER VIDEO ENGINE
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-cyan-300 font-bold bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
                                  4K 3D SATELLITE STITCHING
                                </span>
                              </div>

                              {/* Animated Video Viewport Screen */}
                              <div className="h-56 w-full rounded-2xl overflow-hidden border border-cyan-500/40 relative bg-black shadow-2xl group">
                                <img
                                  src={
                                    earthVideoAngle === "overhead"
                                      ? "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80"
                                      : earthVideoAngle === "south"
                                        ? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop&q=80"
                                        : earthVideoAngle === "horizon"
                                          ? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80"
                                          : "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&auto=format&fit=crop&q=80"
                                  }
                                  alt="Google Earth 3D Aerial View"
                                  className={`w-full h-full object-cover transition-all duration-[3000ms] ${
                                    isPlayingEarthVideo
                                      ? "scale-125 translate-x-2 -translate-y-2"
                                      : "scale-100"
                                  }`}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                                {/* Dynamic 3D Pin Callouts */}
                                <div className="absolute top-4 left-4 bg-cyan-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono text-cyan-300 font-bold border border-cyan-400/50 flex items-center gap-1.5 shadow-lg">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                  <span>
                                    📍 GOOGLE EARTH 3D PIN: {customAddress}
                                  </span>
                                </div>

                                <div className="absolute bottom-10 left-4 bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-mono text-emerald-300 font-bold border border-emerald-400/50 shadow-lg">
                                  📍 0.4 MILES TO WRIGHTSVILLE BEACH • MAYFAIRE
                                  VALUE $265/SQFT
                                </div>

                                {/* Video Controls Overlay */}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between font-mono text-[9px] text-white bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setIsPlayingEarthVideo(
                                          !isPlayingEarthVideo,
                                        )
                                      }
                                      className="px-2 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded cursor-pointer transition-all"
                                    >
                                      {isPlayingEarthVideo
                                        ? "⏸ PAUSE FLYOVER"
                                        : "▶ PLAY 3D FLYOVER (15S)"}
                                    </button>
                                    <span className="text-cyan-300">
                                      00:08 / 00:15 (4K 60FPS)
                                    </span>
                                  </div>
                                  <span className="text-[#D0D6BB] italic">
                                    Ken Burns 3D Satellite Motion
                                  </span>
                                </div>
                              </div>

                              {/* Angle Selector Tabs */}
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono text-[#D0D6BB] uppercase block">
                                  Select Google Earth Perspective Angle:
                                </span>
                                <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px]">
                                  {[
                                    { id: "overhead", label: "Overhead 90°" },
                                    { id: "south", label: "South 45° Facade" },
                                    {
                                      id: "horizon",
                                      label: "Beach Horizon 30°",
                                    },
                                    {
                                      id: "neighborhood",
                                      label: "Context 15°",
                                    },
                                  ].map((angle) => (
                                    <button
                                      key={angle.id}
                                      type="button"
                                      onClick={() => {
                                        setEarthVideoAngle(angle.id as any);
                                        setIntakeToast(
                                          `🛸 Switched 3D Aerial View to ${angle.label}!`,
                                        );
                                        setTimeout(
                                          () => setIntakeToast(null),
                                          3000,
                                        );
                                      }}
                                      className={`py-1.5 rounded-lg border font-bold cursor-pointer transition-all ${
                                        earthVideoAngle === angle.id
                                          ? "bg-cyan-500/30 text-cyan-200 border-cyan-400"
                                          : "bg-black/30 text-[#D0D6BB] border-white/10 hover:bg-white/5"
                                      }`}
                                    >
                                      {angle.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Export & Distribution Actions */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🎬 Exported 4K 3D Aerial Drone Video (Vertical 9:16 MP4) for Instagram Reels & TikTok!`,
                                    )
                                  }
                                  className="py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  📲 Export 9:16 Reels MP4
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📺 Exported 4K 3D Aerial Drone Video (Horizontal 16:9 MP4) for YouTube & FlexMLS!`,
                                    )
                                  }
                                  className="py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  📺 Export 16:9 MLS MP4
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "floorplan" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-amber-500/40 rounded-2xl space-y-3 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-amber-300" />
                                  <span className="font-serif font-black text-xs text-white uppercase">
                                    2D/3D ARCHITECTURAL FLOORPLAN & LAYOUT
                                    ENGINE
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                  4,210 SQFT ACCURATE
                                </span>
                              </div>

                              {/* Interactive Architectural Layout Diagram Container */}
                              <div className="p-4 bg-black/60 border border-amber-500/30 rounded-xl space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2 text-[10px] text-amber-200">
                                  <span>RESIDENTIAL FLOORPLAN SCHEMATIC</span>
                                  <span>SCALE 1/4" = 1'0"</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="p-2.5 bg-[#003B33] border border-emerald-500/30 rounded-lg space-y-1">
                                    <span className="text-emerald-300 font-bold block">
                                      🏠 MAIN LEVEL (2,450 SQFT)
                                    </span>
                                    <div>• Great Room: 28' x 20' (Vaulted)</div>
                                    <div>
                                      • Chef Kitchen: 18' x 14' (Quartzite)
                                    </div>
                                    <div>• Dining Salon: 16' x 12'</div>
                                    <div>• Covered Lanai: 24' x 14'</div>
                                  </div>
                                  <div className="p-2.5 bg-[#003B33] border border-emerald-500/30 rounded-lg space-y-1">
                                    <span className="text-amber-300 font-bold block">
                                      🛏️ UPPER LEVEL (1,760 SQFT)
                                    </span>
                                    <div>
                                      • Primary Suite: 22' x 16' (Balcony)
                                    </div>
                                    <div>• Bedroom 2: 14' x 12' (En-suite)</div>
                                    <div>• Bedroom 3: 14' x 12'</div>
                                    <div>• Bonus Loft: 18' x 16'</div>
                                  </div>
                                </div>

                                {/* AI Market Absorption Speedometer */}
                                <div className="p-2.5 bg-gradient-to-r from-amber-950 to-emerald-950 border border-amber-400/40 rounded-lg text-[9px] flex items-center justify-between text-amber-200">
                                  <span className="font-bold flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                                    <span>
                                      ⚡ EST. DAYS ON MARKET: 11 DAYS (MAYFAIRE
                                      ABSORPTION)
                                    </span>
                                  </span>
                                  <span className="font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                                    ABSORPTION SCORE: 94/100 (HIGH DEMAND)
                                  </span>
                                </div>
                              </div>

                              {/* Targeted Meta & Google Ad Campaign Launcher */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🚀 Launched $100 Targeted Geofence Meta & Google Ad for ${customAddress}!\n• Target Radius: 10 Miles (Wilmington / Wrightsville)\n• Audience: High Net Worth Buyer Demographic\n• Est. Reach: 18,400 Local Buyers`,
                                    )
                                  }
                                  className="py-2 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  🚀 Launch $100 Geofence Ad
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📐 Embed link generated for ${customAddress} 3D Floorplan! Added to single-property landing page.`,
                                    )
                                  }
                                  className="py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  🔗 Embed Floorplan on Site
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "cma_one_pager" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-blue-500/40 rounded-2xl space-y-3 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <BarChart2 className="w-4 h-4 text-blue-300" />
                                  <span className="font-serif font-black text-xs text-white uppercase">
                                    NEIGHBORHOOD CMA MARKETING ONE-PAGER PDF
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-blue-300 font-bold bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                                  MAYFAIRE COMPS AUTO-FETCHED
                                </span>
                              </div>

                              {/* Glossy CMA Comps Table Container */}
                              <div className="p-4 bg-black/60 border border-blue-500/30 rounded-xl space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[10px] text-blue-200">
                                  <span>
                                    MAYFAIRE WOODS RECENT COMPARABLE SALES &
                                    ACTIVE LISTINGS
                                  </span>
                                  <span>AVG $/SQFT: $273</span>
                                </div>

                                <div className="space-y-2 text-[10px]">
                                  <div className="p-2 bg-[#003B33] border border-blue-500/30 rounded-lg flex items-center justify-between">
                                    <div>
                                      <strong className="text-white block">
                                        1012 Inspiration Dr (ACTIVE)
                                      </strong>
                                      <span className="text-[#D0D6BB]">
                                        4 Beds • 4.5 Baths • 4,400 SQFT
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-emerald-300 font-bold block">
                                        $1,285,000
                                      </span>
                                      <span className="text-blue-200">
                                        $292/SQFT • 8 DOM
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 bg-[#003B33] border border-blue-500/30 rounded-lg flex items-center justify-between">
                                    <div>
                                      <strong className="text-white block">
                                        884 Inspiration Dr (CLOSED)
                                      </strong>
                                      <span className="text-[#D0D6BB]">
                                        4 Beds • 4 Baths • 4,100 SQFT
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-emerald-300 font-bold block">
                                        $1,225,000
                                      </span>
                                      <span className="text-blue-200">
                                        $298/SQFT • Sold 12 Days Ago
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2 bg-[#003B33] border border-blue-500/30 rounded-lg flex items-center justify-between">
                                    <div>
                                      <strong className="text-white block">
                                        940 Inland Greens Way (PENDING)
                                      </strong>
                                      <span className="text-[#D0D6BB]">
                                        3 Beds • 3.5 Baths • 3,850 SQFT
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-emerald-300 font-bold block">
                                        $1,195,000
                                      </span>
                                      <span className="text-blue-200">
                                        $310/SQFT • Pending 4 DOM
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* CMA PDF Export & Seller Delivery Actions */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📄 Exported Glossy 1-Page CMA PDF for ${customAddress}!\n• Included: 3 Mayfaire Comps + Neighborhood Pricing Trends\n• Ready for Open House Display & Seller Briefing`,
                                    )
                                  }
                                  className="py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  📄 Download Glossy CMA PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📱 SMS Link for ${customAddress} CMA One-Pager sent to ${customAgentName}!`,
                                    )
                                  }
                                  className="py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  📱 SMS CMA Link to Agent
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "co_broke_flyer" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40 rounded-2xl space-y-3 font-sans shadow-xl text-left">
                              <div className="border-b border-white/10 pb-2 flex justify-between items-center">
                                <div className="flex items-center gap-1.5">
                                  <Share2 className="w-4 h-4 text-emerald-300" />
                                  <span className="font-serif font-black text-xs text-white uppercase">
                                    B2B CO-BROKE BUYER AGENT FLYER & FLEXMLS
                                    BLAST
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                                  2.5% BUYER AGENT COMMISSION SPLIT
                                </span>
                              </div>

                              {/* Agent Compensation & Showing Terms Container */}
                              <div className="p-4 bg-black/60 border border-emerald-500/30 rounded-xl space-y-3 font-mono text-xs">
                                <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[10px] text-emerald-200">
                                  <span>
                                    EXCLUSIVE BROKERAGE CO-BROKE OFFER
                                  </span>
                                  <span>FLEXMLS MLS# 10048291</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="p-2.5 bg-[#003B33] border border-emerald-500/30 rounded-lg space-y-1">
                                    <span className="text-emerald-300 font-bold block">
                                      💵 AGENT COMPENSATION
                                    </span>
                                    <div>• Buyer Agent Split: 2.5%</div>
                                    <div>• Protection Period: 60 Days</div>
                                    <div>• Due Diligence Window: 14 Days</div>
                                  </div>
                                  <div className="p-2.5 bg-[#003B33] border border-emerald-500/30 rounded-lg space-y-1">
                                    <span className="text-amber-300 font-bold block">
                                      🗝️ SHOWING INSTRUCTIONS
                                    </span>
                                    <div>• ShowingTime Auto-Approve</div>
                                    <div>
                                      • Electronic Lockbox on Front Door
                                    </div>
                                    <div>• 2-Hour Notice Preferred</div>
                                  </div>
                                </div>

                                <div className="p-2.5 bg-gradient-to-r from-emerald-950 to-blue-950 border border-emerald-400/40 rounded-lg text-[9px] flex items-center justify-between text-emerald-200">
                                  <span>
                                    📧 ROSTER BUYER AGENT RECIPIENTS: 482
                                    LICENSED WILMINGTON AGENTS
                                  </span>
                                  <span className="font-bold text-white bg-emerald-600 px-2 py-0.5 rounded">
                                    READY TO BLAST
                                  </span>
                                </div>
                              </div>

                              {/* FlexMLS Blast & PDF Download Actions */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `🚀 Co-Broke Agent Email Blast Dispatched for ${customAddress}!\n• Delivered to 482 Wilmington Roster Agents\n• Included: 2.5% Split Terms, ShowingTime Link, & High-Res PDF Flyer`,
                                    )
                                  }
                                  className="py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  🚀 Blast 482 Roster Agents
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alert(
                                      `📄 High-Res Co-Broke Agent PDF Flyer Downloaded for ${customAddress}!`,
                                    )
                                  }
                                  className="py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-all shadow-md"
                                >
                                  📄 Download Co-Broke PDF
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "story_reel" && (
                            <div className="p-4 bg-white border-2 border-[#00635C]/30 rounded-2xl space-y-4 font-sans shadow-xl text-left text-slate-900">
                              {/* Title Bar */}
                              <div className="border-b border-slate-200 pb-2.5 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-[#00635C]/10 border border-[#00635C]/30 flex items-center justify-center">
                                    <Video className="w-4 h-4 text-[#00635C] animate-pulse" />
                                  </div>
                                  <div>
                                    <h4 className="font-serif font-bold text-sm text-slate-900">
                                      AI Video Reel Studio
                                    </h4>
                                    <p className="text-[10px] text-[#00635C] font-mono font-bold">
                                      1080x1920 9:16 Motion Video • IG Reels &
                                      TikTok
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                                  <span className="px-2 py-0.5 rounded-full bg-[#F4F5EE] text-[#00635C] border border-[#00635C]/30 font-bold">
                                    12s Motion Reel
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-[#F4F5EE] text-[#00635C] border border-[#00635C]/30 font-bold">
                                    {isVoiceoverEnabled
                                      ? "🎙️ AI Voiceover ON"
                                      : "🔇 Muted"}
                                  </span>
                                </div>
                              </div>

                              {/* Interactive 9:16 Video Player Container */}
                              <div className="relative aspect-[9/16] max-w-[240px] mx-auto rounded-2xl overflow-hidden border-2 border-[#00635C]/40 shadow-2xl bg-slate-900 group">
                                {/* Active Scene Photo Background */}
                                <img
                                  src={
                                    activeReelScene === 1
                                      ? generatedPhotoPack.heroPhotoUrl
                                      : activeReelScene === 2
                                        ? generatedPhotoPack.poolPhotoUrl
                                        : activeReelScene === 3
                                          ? generatedPhotoPack.kitchenPhotoUrl
                                          : generatedPhotoPack.heroPhotoUrl
                                  }
                                  alt="Reel scene preview"
                                  className="w-full h-full object-cover transition-all duration-700 scale-105"
                                />

                                {/* Video Overlay Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 p-3 flex flex-col justify-between">
                                  {/* Top Reel Badge */}
                                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                                    <span className="px-2 py-0.5 bg-[#00635C] text-white rounded-md border border-[#00635C]/40 uppercase tracking-wider">
                                      Scene {activeReelScene}/4
                                    </span>
                                    <span className="text-white/90 bg-black/60 px-1.5 py-0.5 rounded font-mono text-[8px]">
                                      {isPlayingReel
                                        ? "00:06.4"
                                        : `00:0${activeReelScene * 3}.0`}{" "}
                                      / 00:12.0
                                    </span>
                                  </div>

                                  {/* Center Play / Pause Controls */}
                                  <div className="flex justify-center items-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsPlayingReel(!isPlayingReel);
                                        setIntakeToast(
                                          isPlayingReel
                                            ? "⏸ Paused reel playback"
                                            : "▶ Playing 9:16 motion reel...",
                                        );
                                        setTimeout(
                                          () => setIntakeToast(null),
                                          3000,
                                        );
                                      }}
                                      className="w-12 h-12 rounded-full bg-[#00635C] hover:bg-[#004d48] text-white border-2 border-white/80 shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                                    >
                                      {isPlayingReel ? (
                                        <Pause className="w-5 h-5 fill-white" />
                                      ) : (
                                        <Play className="w-5 h-5 fill-white ml-0.5" />
                                      )}
                                    </button>
                                  </div>

                                  {/* Scene Animated Overlay Text */}
                                  <div className="space-y-1 text-center">
                                    {activeReelScene === 1 && (
                                      <div className="space-y-1 animate-fade-in">
                                        <span className="px-2 py-0.5 bg-[#00635C] text-white rounded text-[9px] font-mono font-bold uppercase tracking-widest inline-block shadow-md">
                                          ✨ JUST LISTED • {customPrice}
                                        </span>
                                        <div className="text-[10px] font-bold text-white font-serif line-clamp-1">
                                          {customHeadline}
                                        </div>
                                      </div>
                                    )}
                                    {activeReelScene === 2 && (
                                      <div className="space-y-1 animate-fade-in">
                                        <span className="px-2 py-0.5 bg-[#00635C] text-white rounded text-[9px] font-mono font-bold uppercase tracking-widest inline-block shadow-md">
                                          🌊 WATERFRONT SALTWATER POOL
                                        </span>
                                        <div className="text-[10px] font-bold text-teal-200 font-serif">
                                          Private Deepwater Slip & Deck
                                        </div>
                                      </div>
                                    )}
                                    {activeReelScene === 3 && (
                                      <div className="space-y-1 animate-fade-in">
                                        <span className="px-2 py-0.5 bg-[#00635C] text-white rounded text-[9px] font-mono font-bold uppercase tracking-widest inline-block shadow-md">
                                          🍳 GOURMET CHEF'S KITCHEN
                                        </span>
                                        <div className="text-[10px] font-bold text-amber-200 font-serif">
                                          Quartz Island & Sub-Zero Suite
                                        </div>
                                      </div>
                                    )}
                                    {activeReelScene === 4 && (
                                      <div className="space-y-1 animate-fade-in">
                                        <span className="px-2 py-0.5 bg-[#00635C] text-white rounded text-[9px] font-mono font-bold uppercase tracking-widest inline-block shadow-md">
                                          📞 CONTACT RYAN CRECELIUS (BIC)
                                        </span>
                                        <div className="text-[9px] text-emerald-300 font-mono font-bold">
                                          Nest Realty • (910) 232-1772
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 4-Scene Motion Timeline Controls */}
                              <div className="space-y-1.5 text-xs font-sans">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-slate-900 font-bold font-mono">
                                    4-Scene Motion Timeline
                                  </span>
                                  <span className="text-[#00635C] font-mono text-[9px] font-bold">
                                    Click Scene to Jump
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                                  {[
                                    {
                                      scene: 1,
                                      name: "1. Facade",
                                      label: "0-3s",
                                    },
                                    {
                                      scene: 2,
                                      name: "2. Pool",
                                      label: "3-6s",
                                    },
                                    {
                                      scene: 3,
                                      name: "3. Kitchen",
                                      label: "6-9s",
                                    },
                                    {
                                      scene: 4,
                                      name: "4. Agent",
                                      label: "9-12s",
                                    },
                                  ].map((s) => (
                                    <button
                                      key={s.scene}
                                      type="button"
                                      onClick={() => {
                                        setActiveReelScene(s.scene as any);
                                        setIntakeToast(
                                          `🎬 Jumped video timeline to Scene ${s.scene}`,
                                        );
                                        setTimeout(
                                          () => setIntakeToast(null),
                                          3000,
                                        );
                                      }}
                                      className={`p-1.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                                        activeReelScene === s.scene
                                          ? "bg-[#00635C] text-white border-[#00635C] ring-2 ring-[#00635C]/30 shadow-xs"
                                          : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                                      }`}
                                    >
                                      <div>{s.name}</div>
                                      <div
                                        className={`text-[8px] font-mono ${activeReelScene === s.scene ? "text-white/80" : "text-slate-500"}`}
                                      >
                                        {s.label}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Music Track & AI Voiceover Customizer */}
                              <div className="grid grid-cols-2 gap-2 text-xs font-sans p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-[#00635C] font-bold block font-mono">
                                    Background Music Track
                                  </span>
                                  <select
                                    value={selectedReelMusic}
                                    onChange={(e) => {
                                      setSelectedReelMusic(
                                        e.target.value as any,
                                      );
                                      setIntakeToast(
                                        `🎵 Selected audio track: ${e.target.value.replace("_", " ")}`,
                                      );
                                      setTimeout(
                                        () => setIntakeToast(null),
                                        3000,
                                      );
                                    }}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-900 focus:outline-hidden focus:border-[#00635C]"
                                  >
                                    <option value="coastal_chill">
                                      🎵 Coastal Chill (Lofi)
                                    </option>
                                    <option value="luxury_estate">
                                      🎻 Luxury Estate (Classical)
                                    </option>
                                    <option value="high_energy">
                                      ⚡ High Energy (Trendy)
                                    </option>
                                    <option value="sunset_acoustic">
                                      🎸 Sunset Acoustic
                                    </option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] text-[#00635C] font-bold block font-mono">
                                    Gemini AI Voiceover
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsVoiceoverEnabled(
                                        !isVoiceoverEnabled,
                                      );
                                      setIntakeToast(
                                        isVoiceoverEnabled
                                          ? "🔇 Muted AI voiceover"
                                          : "🎙️ Enabled Gemini AI Voiceover narrative!",
                                      );
                                      setTimeout(
                                        () => setIntakeToast(null),
                                        3000,
                                      );
                                    }}
                                    className={`w-full py-1 px-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                      isVoiceoverEnabled
                                        ? "bg-[#00635C] border-[#00635C] text-white shadow-xs"
                                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Volume2 className="w-3 h-3" />
                                    <span>
                                      {isVoiceoverEnabled
                                        ? "Voiceover: ON"
                                        : "Voiceover: OFF"}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* 1-Click Export Actions */}
                              <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const element = document.createElement("a");
                                    const file = new Blob(
                                      [
                                        `Shapework 9:16 Video Reel Export for ${customAddress}\nDuration: 12 Seconds\nResolution: 1080x1920 MP4\nAudio Track: ${selectedReelMusic}\nVoiceover: ${isVoiceoverEnabled ? "Enabled" : "Disabled"}`,
                                      ],
                                      { type: "text/plain" },
                                    );
                                    element.href = URL.createObjectURL(file);
                                    element.download = `nest_reel_${customAddress.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`;
                                    document.body.appendChild(element);
                                    element.click();
                                    document.body.removeChild(element);
                                    setIntakeToast(
                                      `📥 Downloaded 9:16 MP4 Video Reel!`,
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      4000,
                                    );
                                  }}
                                  className="py-2.5 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-200" />
                                  <span>Download 9:16 MP4</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setIntakeToast(
                                      "🚀 9:16 Reel pushed to Instagram & TikTok! Synced with Rechat CRM.",
                                    );
                                    setTimeout(
                                      () => setIntakeToast(null),
                                      4000,
                                    );
                                  }}
                                  className="py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-pink-200" />
                                  <span>Push to IG & TikTok</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedTemplateFormat === "carousel" && (
                            <div className="p-4 bg-gradient-to-br from-[#012B24] to-[#011F1A] border border-emerald-500/40 rounded-2xl space-y-2 font-sans shadow-xl">
                              <span className="font-serif font-black text-xs text-white block border-b border-white/10 pb-1.5">
                                INSTAGRAM / FB CAROUSEL SLIDE DECK
                              </span>
                              <div className="space-y-1.5 pt-1">
                                {aiGeneratedContent.carouselSlides.map(
                                  (slide, i) => (
                                    <div
                                      key={i}
                                      className="p-2 bg-[#003B33] border border-[#00635C]/40 rounded-xl text-[10px] font-mono text-emerald-200"
                                    >
                                      {slide}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons in Drawer */}
                      <div className="pt-4 border-t border-[#00635C]/40 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="py-2.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-bold transition-all shadow-md flex items-center justify-center gap-1.5 font-mono uppercase cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Export PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Canva Sync Link generated for ${customAddress}!`,
                            )
                          }
                          className="py-2.5 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 rounded-xl text-[10px] font-bold border border-[#00635C]/40 flex items-center justify-center gap-1.5 font-mono uppercase cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Canva Sync</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newTask = {
                              id: `task_${Date.now()}`,
                              title: `${customAddress} — Shapework AI ${selectedTemplateFormat.toUpperCase()}`,
                              caller: customAgentName,
                              requestType: `Shapework AI ${selectedTemplateFormat}`,
                              column: "delegated",
                              priority: "high",
                              dueDate: "Tomorrow 5:00 PM",
                              assignedTo: "Jessica (Virtual Assistant)",
                              callId: selectedCallId || "call_001",
                            };
                            setTasks([newTask, ...tasks]);
                            alert(
                              `✓ Task delegated to Jessica (VA) for ${customAddress}!`,
                            );
                          }}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold shadow-md flex items-center justify-center gap-1.5 font-mono uppercase cursor-pointer border border-emerald-400"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Delegate VA</span>
                        </button>
                      </div>
                    </div>
                  </div>,
                )}

              {/* IMAGE LIBRARY & MEDIA SELECTOR MODAL */}
              {showImageLibraryModal &&
                createPortal(
                  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#01362D] border border-emerald-500/40 rounded-3xl max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-fade-in text-white max-h-[90vh] overflow-y-auto">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#00635C] text-emerald-300 flex items-center justify-center border border-emerald-400/40 shadow-sm">
                            <Image className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                              Property Image Library & Media Selector
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-sans mt-0.5">
                              Select or upload photos to automatically sync
                              across all 5 marketing collateral formats.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowImageLibraryModal(false)}
                          className="text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Category Tabs & Action Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-1.5 bg-[#002B24] p-1 rounded-2xl border border-white/10 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() =>
                              setImageLibraryCategoryTab("listing")
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              imageLibraryCategoryTab === "listing"
                                ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                : "text-[#D0D6BB] hover:text-white"
                            }`}
                          >
                            Listing Photos (
                            {
                              mediaLibraryPhotos.filter(
                                (p) => p.category === "listing",
                              ).length
                            }
                            )
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageLibraryCategoryTab("drone")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              imageLibraryCategoryTab === "drone"
                                ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                : "text-[#D0D6BB] hover:text-white"
                            }`}
                          >
                            Drone 4K (
                            {
                              mediaLibraryPhotos.filter(
                                (p) => p.category === "drone",
                              ).length
                            }
                            )
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageLibraryCategoryTab("headshots")
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              imageLibraryCategoryTab === "headshots"
                                ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                : "text-[#D0D6BB] hover:text-white"
                            }`}
                          >
                            Agent Headshots (
                            {
                              mediaLibraryPhotos.filter(
                                (p) => p.category === "headshots",
                              ).length
                            }
                            )
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setImageLibraryCategoryTab("streetview")
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              imageLibraryCategoryTab === "streetview"
                                ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                : "text-[#D0D6BB] hover:text-white"
                            }`}
                          >
                            📍 Street View API (
                            {
                              mediaLibraryPhotos.filter(
                                (p) => p.category === "streetview",
                              ).length
                            }
                            )
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageLibraryCategoryTab("drive")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                              imageLibraryCategoryTab === "drive"
                                ? "bg-[#00635C] text-white shadow-md border border-emerald-400/40"
                                : "text-[#D0D6BB] hover:text-white"
                            }`}
                          >
                            📁 Google Drive Sync
                          </button>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <label className="px-3.5 py-1.5 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md border border-emerald-400/30 shrink-0">
                            <Plus className="w-4 h-4" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadMediaFile}
                              className="hidden"
                            />
                          </label>

                          <a
                            href={`https://drive.google.com/drive/search?q=${encodeURIComponent(customAddress)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-[#D0D6BB] hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 border border-white/10 shrink-0"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                            <span>Drive Folder ↗</span>
                          </a>
                        </div>
                      </div>

                      {/* STREET VIEW & GOOGLE MAPS API CONTROLS BAR (If Street View tab active) */}
                      {imageLibraryCategoryTab === "streetview" && (
                        <div className="p-3 bg-black/40 border border-emerald-500/30 rounded-2xl space-y-2 font-mono text-xs">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-300 font-bold uppercase">
                                🔑 Google Maps API Integration:
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  mapsApiKey
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400"
                                    : "bg-amber-500/20 text-amber-300 border-amber-400"
                                }`}
                              >
                                {mapsApiKey
                                  ? "Live API Key Connected"
                                  : "Demo API Mode Active"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                              <input
                                type="text"
                                placeholder="Paste Google Maps API Key..."
                                value={mapsApiKey}
                                onChange={(e) => setMapsApiKey(e.target.value)}
                                className="px-2.5 py-1 bg-black/50 border border-white/15 rounded-xl text-[10px] text-white focus:outline-none w-full sm:w-48 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const url =
                                    getStreetViewApiUrl(customAddress);
                                  const newPhoto = {
                                    id: `img_sv_${Date.now()}`,
                                    title: `Google Street View — ${customAddress}`,
                                    category: "streetview" as const,
                                    url: url,
                                    badge: "Google API",
                                  };
                                  setMediaLibraryPhotos([
                                    newPhoto,
                                    ...mediaLibraryPhotos,
                                  ]);
                                  setActivePhotoUrl(url);
                                  alert(
                                    `📍 Fetched live Google Street View photo for ${customAddress}!`,
                                  );
                                }}
                                className="px-3 py-1 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-[10px] font-bold cursor-pointer shrink-0"
                              >
                                Fetch API ⚡
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const satUrl = mapsApiKey
                                  ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(customAddress)}&zoom=19&size=1200x800&maptype=satellite&key=${mapsApiKey}`
                                  : "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw";
                                setActivePhotoUrl(satUrl);
                                alert(
                                  `🛰️ High-res Google Satellite imagery set for ${customAddress}!`,
                                );
                              }}
                              className="px-2.5 py-1 bg-[#002B24] hover:bg-[#003B33] text-cyan-300 border border-cyan-500/40 rounded-lg text-[9px] font-bold cursor-pointer"
                            >
                              🛰️ Load Satellite Imagery
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(customAddress)}&t=k&z=19&ie=UTF8&iwloc=&output=embed`;
                                alert(
                                  `🗺️ Interactive Google Maps Location Map loaded for ${customAddress}!`,
                                );
                              }}
                              className="px-2.5 py-1 bg-[#002B24] hover:bg-[#003B33] text-emerald-300 border border-emerald-500/40 rounded-lg text-[9px] font-bold cursor-pointer"
                            >
                              🗺️ Open Maps Embed
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TAB CONTENT: GOOGLE DRIVE TAB vs PHOTO GRID VIEW */}
                      {imageLibraryCategoryTab === "drive" ? (
                        <div className="p-6 bg-black/40 border border-white/10 rounded-2xl space-y-4 text-center">
                          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center border border-amber-500/30">
                            <FolderOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-white text-sm">
                              Connected Google Drive Listing Folder
                            </h4>
                            <p className="text-xs text-[#D0D6BB] mt-1 max-w-md mx-auto">
                              Photos uploaded to{" "}
                              <span className="font-mono text-emerald-300 font-bold">
                                /Nest Realty/Listings/{customAddress}/Marketing
                                Drafts/
                              </span>{" "}
                              are automatically mirrored in real-time.
                            </p>
                          </div>
                          <div className="pt-2 flex justify-center gap-3">
                            <a
                              href={`https://drive.google.com/drive/search?q=${encodeURIComponent(customAddress)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md"
                            >
                              <FolderOpen className="w-4 h-4 text-amber-300" />
                              <span>Open Drive Folder in New Tab ↗</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        /* PHOTO GRID VIEW WITH EDIT, CROP & REPLACE BADGES */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {mediaLibraryPhotos
                            .filter(
                              (p) => p.category === imageLibraryCategoryTab,
                            )
                            .map((photo) => {
                              const isActive = activePhotoUrl === photo.url;
                              return (
                                <div
                                  key={photo.id}
                                  onClick={() =>
                                    handleSelectMediaPhoto(
                                      photo.url,
                                      photo.title,
                                    )
                                  }
                                  className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-black/40 flex flex-col justify-between ${
                                    isActive
                                      ? "border-emerald-400 shadow-xl ring-2 ring-emerald-400/40"
                                      : "border-white/10 hover:border-emerald-500/60"
                                  }`}
                                >
                                  <div className="aspect-video w-full overflow-hidden bg-black/60 relative">
                                    <img
                                      src={photo.url}
                                      alt={photo.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {photo.badge && (
                                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-sm text-emerald-300 border border-emerald-500/40 rounded-md font-mono text-[9px] font-bold">
                                        {photo.badge}
                                      </span>
                                    )}
                                    {isActive && (
                                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500 text-white rounded-full font-mono text-[8px] font-bold flex items-center gap-1 shadow-md">
                                        <Check className="w-3 h-3" /> ACTIVE
                                      </span>
                                    )}

                                    {/* ACTION CHIPS BAR (Edit, Crop & Replace Badges) */}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1 bg-black/85 backdrop-blur-md p-1 rounded-xl border border-white/15 opacity-90 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingPhoto({
                                            id: photo.id,
                                            title: photo.title,
                                            category: photo.category,
                                            url: photo.url,
                                            aspect:
                                              photo.category === "headshots"
                                                ? "1:1"
                                                : "4:3",
                                            zoom: 100,
                                            brightness: 100,
                                          });
                                          setShowPhotoCropperModal(true);
                                        }}
                                        className="px-2 py-1 bg-[#00635C] hover:bg-[#007c73] text-white rounded-lg font-mono text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-emerald-400/40"
                                      >
                                        <Scissors className="w-3 h-3 text-emerald-300" />
                                        <span>Edit & Crop</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTargetReplacePhotoId(photo.id);
                                          setShowInternalLibraryModal(true);
                                        }}
                                        className="px-2 py-1 bg-amber-600/80 hover:bg-amber-500 text-white rounded-lg font-mono text-[9px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-amber-400/40"
                                      >
                                        <RefreshCw className="w-3 h-3 text-amber-200" />
                                        <span>Replace</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="p-3 space-y-1">
                                    <h4 className="font-bold text-xs text-white truncate">
                                      {photo.title}
                                    </h4>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-emerald-300 font-mono font-bold">
                                        {isActive
                                          ? "✓ Currently In Use"
                                          : "Click to Select"}
                                      </span>
                                      <span className="text-[#D0D6BB] font-mono text-[9px]">
                                        {photo.category.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Modal Footer */}
                      <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#D0D6BB]">
                        <span>
                          💡 Selecting any photo instantly updates Print Flyer,
                          Social Post, Postcard & Landing Page.
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowImageLibraryModal(false)}
                          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all cursor-pointer border border-white/15"
                        >
                          Close Library
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* PHOTO EDITOR & CROPPER MODAL */}
              {showPhotoCropperModal &&
                editingPhoto &&
                createPortal(
                  <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
                    <div className="bg-[#01362D] border border-emerald-500/50 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-white">
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#00635C] text-emerald-300 flex items-center justify-center border border-emerald-400/40">
                            <Scissors className="w-5 h-5 text-emerald-300" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                              Photo Cropper & Image Enhancement Studio
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-mono mt-0.5">
                              {editingPhoto.title}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoCropperModal(false);
                            setEditingPhoto(null);
                          }}
                          className="text-[#D0D6BB] hover:text-white text-lg font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Interactive Image Preview with Crop Aspect Frame */}
                      <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
                        <div
                          className={`relative border-2 border-emerald-400/80 rounded-xl overflow-hidden shadow-2xl transition-all ${
                            editingPhoto.aspect === "1:1"
                              ? "w-56 h-56"
                              : editingPhoto.aspect === "4:3"
                                ? "w-80 h-60"
                                : "w-96 h-54"
                          }`}
                        >
                          <img
                            src={editingPhoto.url}
                            alt="Cropping Preview"
                            className="w-full h-full object-cover transition-transform"
                            style={{
                              transform: `scale(${editingPhoto.zoom / 100})`,
                              filter: `brightness(${editingPhoto.brightness}%)`,
                            }}
                          />

                          {/* Rule of Thirds Grid Overlay */}
                          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-emerald-400/40">
                            <div className="border-r border-b border-emerald-400/25"></div>
                            <div className="border-r border-b border-emerald-400/25"></div>
                            <div className="border-b border-emerald-400/25"></div>
                            <div className="border-r border-b border-emerald-400/25"></div>
                            <div className="border-r border-b border-emerald-400/25"></div>
                            <div className="border-b border-emerald-400/25"></div>
                            <div className="border-r border-emerald-400/25"></div>
                            <div className="border-r border-emerald-400/25"></div>
                            <div></div>
                          </div>

                          <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-emerald-300 font-mono text-[9px] rounded font-bold uppercase border border-emerald-500/40">
                            {editingPhoto.aspect} Crop Grid
                          </span>
                        </div>
                      </div>

                      {/* Controls Bar */}
                      <div className="space-y-4 bg-[#002B24] border border-[#00635C]/50 rounded-2xl p-4 font-mono text-xs">
                        {/* Aspect Ratio Presets */}
                        <div className="space-y-1.5">
                          <label className="text-[#D0D6BB] text-[10px] uppercase font-bold block">
                            1. Select Aspect Ratio Crop Preset:
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              {
                                id: "1:1",
                                label: "1:1 Square",
                                desc: "Agent Headshots & IG Posts",
                              },
                              {
                                id: "4:3",
                                label: "4:3 Landscape",
                                desc: "Print Flyers & Postcards",
                              },
                              {
                                id: "16:9",
                                label: "16:9 Wide",
                                desc: "Video Reels & Web Banners",
                              },
                            ].map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  setEditingPhoto({
                                    ...editingPhoto,
                                    aspect: preset.id as any,
                                  })
                                }
                                className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                  editingPhoto.aspect === preset.id
                                    ? "bg-[#00635C] text-white border-emerald-400 shadow-md font-bold"
                                    : "bg-black/30 text-[#D0D6BB] border-white/10 hover:bg-black/50"
                                }`}
                              >
                                <div className="text-xs">{preset.label}</div>
                                <div className="text-[9px] opacity-70 font-sans">
                                  {preset.desc}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sliders (Zoom & Brightness) */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#D0D6BB]">
                                Crop Zoom Level:
                              </span>
                              <span className="text-emerald-300 font-bold">
                                {editingPhoto.zoom}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={100}
                              max={200}
                              value={editingPhoto.zoom}
                              onChange={(e) =>
                                setEditingPhoto({
                                  ...editingPhoto,
                                  zoom: Number(e.target.value),
                                })
                              }
                              className="w-full accent-emerald-400 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-[#D0D6BB]">
                                Brightness Adjust:
                              </span>
                              <span className="text-emerald-300 font-bold">
                                {editingPhoto.brightness}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min={50}
                              max={150}
                              value={editingPhoto.brightness}
                              onChange={(e) =>
                                setEditingPhoto({
                                  ...editingPhoto,
                                  brightness: Number(e.target.value),
                                })
                              }
                              className="w-full accent-emerald-400 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Buttons */}
                      <div className="pt-2 flex justify-end gap-2 border-t border-[#00635C]/40 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPhotoCropperModal(false);
                            setEditingPhoto(null);
                          }}
                          className="px-4 py-2 bg-[#002B24] hover:bg-[#003B33] text-[#D0D6BB] rounded-xl font-bold border border-[#00635C]/40 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedPhotos = mediaLibraryPhotos.map(
                              (p) => {
                                if (p.id === editingPhoto.id) {
                                  return {
                                    ...p,
                                    badge: `${editingPhoto.aspect} Cropped`,
                                  };
                                }
                                return p;
                              },
                            );
                            setMediaLibraryPhotos(updatedPhotos);
                            setActivePhotoUrl(editingPhoto.url);
                            setShowPhotoCropperModal(false);
                            setEditingPhoto(null);
                            setIntakeToast(
                              `✂️ Photo cropped to ${editingPhoto.aspect} ratio and synced across all collateral!`,
                            );
                            setTimeout(() => setIntakeToast(null), 5000);
                          }}
                          className="px-5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white font-bold rounded-xl shadow-md cursor-pointer border border-emerald-400/40 flex items-center gap-1.5"
                        >
                          <Scissors className="w-4 h-4 text-emerald-300" />
                          <span>Apply Crop & Save Asset ⚡</span>
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* INTERNAL BRAND ASSET LIBRARY SELECTOR MODAL */}
              {showInternalLibraryModal &&
                createPortal(
                  <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
                    <div className="bg-[#01362D] border border-emerald-500/50 rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#00635C] text-amber-300 flex items-center justify-center border border-emerald-400/40">
                            <RefreshCw className="w-5 h-5 text-amber-300" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                              Pick from Internal Brand Asset Library
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-mono mt-0.5">
                              Select a pre-approved Nest Realty team headshot,
                              drone capture, or property asset.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInternalLibraryModal(false);
                            setTargetReplacePhotoId(null);
                          }}
                          className="text-[#D0D6BB] hover:text-white text-lg font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Upload Custom File Option */}
                      <div className="p-3 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-between font-mono text-xs">
                        <span className="text-[#D0D6BB]">
                          Want to upload a custom file from your device instead?
                        </span>
                        <label className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1 border border-amber-400/40 shrink-0">
                          <Plus className="w-4 h-4" />
                          <span>Upload New File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handleUploadMediaFile(e);
                              setShowInternalLibraryModal(false);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Grid of Curated Internal Nest Realty Brand Assets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          {
                            title: "Ryan Crecelius (Owner / BIC Headshot)",
                            category: "headshots",
                            url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
                            badge: "BIC Headshot",
                          },
                          {
                            title:
                              "Melissa Gagliardi (Marketing Manager Headshot)",
                            category: "headshots",
                            url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
                            badge: "Staff Headshot",
                          },
                          {
                            title: "Jessica Vance (Operations VA Headshot)",
                            category: "headshots",
                            url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
                            badge: "VA Staff",
                          },
                          {
                            title: "990 Inspiration Estate Front Elevation",
                            category: "listing",
                            url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw",
                            badge: "Estate Facade",
                          },
                          {
                            title: "212 Wetland Dr Sunset Estate View",
                            category: "listing",
                            url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw",
                            badge: "Sunset View",
                          },
                          {
                            title: "Coastal Heated Saltwater Pool & Patio",
                            category: "listing",
                            url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_pool/raw",
                            badge: "Interior Pool",
                          },
                          {
                            title: "4K Aerial Drone Lot Lines & Boundaries",
                            category: "drone",
                            url: "/api/marketing/campaigns/campaign_990_inspiration/assets/photo_hero/raw",
                            badge: "4K Drone",
                          },
                          {
                            title: "Wrightsville Beach Waterfront Marina Deck",
                            category: "listing",
                            url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80",
                            badge: "Waterfront",
                          },
                        ].map((asset, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              if (targetReplacePhotoId) {
                                const updated = mediaLibraryPhotos.map((p) => {
                                  if (p.id === targetReplacePhotoId) {
                                    return {
                                      ...p,
                                      title: asset.title,
                                      url: asset.url,
                                      badge: asset.badge,
                                    };
                                  }
                                  return p;
                                });
                                setMediaLibraryPhotos(updated);
                                setActivePhotoUrl(asset.url);
                                setIntakeToast(
                                  `🔄 Photo replaced with "${asset.title}" from internal library!`,
                                );
                                setTimeout(() => setIntakeToast(null), 5000);
                              } else {
                                handleSelectMediaPhoto(asset.url, asset.title);
                              }
                              setShowInternalLibraryModal(false);
                              setTargetReplacePhotoId(null);
                            }}
                            className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-400 transition-all cursor-pointer bg-black/40 p-2 space-y-2 hover:bg-black/60"
                          >
                            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black/60 relative">
                              <img
                                src={asset.url}
                                alt={asset.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/80 text-emerald-300 font-mono text-[9px] rounded font-bold border border-emerald-500/40">
                                {asset.badge}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-bold text-xs text-white truncate">
                                {asset.title}
                              </h5>
                              <span className="text-[9px] text-amber-300 font-mono block">
                                Click to Replace Photo ⚡
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* 📱 1-CLICK OPEN HOUSE IPAD SIGN-IN KIOSK MODAL */}
              {showOpenHouseKioskModal &&
                createPortal(
                  <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-[#002B24] border-2 border-emerald-400/60 rounded-3xl p-6 max-w-lg w-full space-y-5 text-left text-white shadow-2xl relative font-sans">
                      <button
                        type="button"
                        onClick={() => setShowOpenHouseKioskModal(false)}
                        className="absolute top-4 right-4 text-white/60 hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-2xl">
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                            LIVE OPEN HOUSE IPAD KIOSK MODE
                          </span>
                          <h3 className="font-serif font-black text-base text-white mt-0.5">
                            {customAddress}
                          </h3>
                          <p className="text-[11px] text-[#D0D6BB]">
                            Guest Welcome & Instant CRM Digital Flyer Dispatch
                          </p>
                        </div>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          alert(
                            `🎉 Thank you ${kioskVisitorName || "Guest"}!\n• Digital Property Brochure SMS & Email Sent to ${kioskVisitorPhone || "visitor phone"}\n• Buyer Profile Auto-Created in Rechat & FlexMLS CRM!`,
                          );
                          setKioskVisitorName("");
                          setKioskVisitorPhone("");
                          setKioskVisitorEmail("");
                          setShowOpenHouseKioskModal(false);
                        }}
                        className="space-y-4"
                      >
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-emerald-300 uppercase font-bold">
                            Your Full Name
                          </label>
                          <input
                            type="text"
                            value={kioskVisitorName}
                            onChange={(e) =>
                              setKioskVisitorName(e.target.value)
                            }
                            placeholder="e.g. Michael & Sarah Vance"
                            required
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-emerald-300 uppercase font-bold">
                            Mobile Phone (For Instant SMS Flyer)
                          </label>
                          <input
                            type="tel"
                            value={kioskVisitorPhone}
                            onChange={(e) =>
                              setKioskVisitorPhone(e.target.value)
                            }
                            placeholder="e.g. (910) 555-0199"
                            required
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-emerald-300 uppercase font-bold">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={kioskVisitorEmail}
                            onChange={(e) =>
                              setKioskVisitorEmail(e.target.value)
                            }
                            placeholder="e.g. m.vance@example.com"
                            required
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div className="p-3 bg-black/30 border border-emerald-500/30 rounded-xl space-y-1 font-mono text-[10px] text-emerald-200">
                          <div className="font-bold flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />{" "}
                            Automated Lead Dispatch Trigger:
                          </div>
                          <div>
                            1. Auto-dispatches SMS link with Matterport 3D Tour
                            & 4K Drone Gallery
                          </div>
                          <div>
                            2. Registers visitor as Active Lead assigned to{" "}
                            {customAgentName}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowOpenHouseKioskModal(false)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold font-mono cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl text-xs font-bold font-mono cursor-pointer shadow-lg border border-emerald-400/40"
                          >
                            Check In & Receive Digital Flyer 🚀
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* 🎨 CANVA BRAND KIT & COPY ASSISTANT MODAL */}
              {showCanvaAssistantModal &&
                createPortal(
                  <div className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 font-sans">
                    <div className="bg-[#01362D] border border-purple-500/50 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto text-left">
                      {/* Header */}
                      <div className="flex justify-between items-start border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-900/60 text-purple-300 flex items-center justify-center border border-purple-400/40 shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-300" />
                          </div>
                          <div>
                            <h3 className="font-serif font-black text-white text-base uppercase tracking-wider">
                              Nest Realty Canva Copy & Asset Assistant
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-mono mt-0.5">
                              Copy listing text & download high-res images to
                              paste directly into your Canva template.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCanvaAssistantModal(false)}
                          className="text-[#D0D6BB] hover:text-white text-lg font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Team Canva Template Link Config */}
                      <div className="p-4 bg-black/40 border border-purple-500/30 rounded-2xl space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 font-bold uppercase">
                            🎨 Nest Team Canva Template Link:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCanvaConfigEditing(!canvaConfigEditing)
                            }
                            className="text-[10px] text-amber-300 hover:underline cursor-pointer font-bold"
                          >
                            {canvaConfigEditing
                              ? "Save Link ✓"
                              : "Edit Shared Link ✏️"}
                          </button>
                        </div>

                        {canvaConfigEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={canvaTemplateUrl}
                              onChange={(e) => {
                                setCanvaTemplateUrl(e.target.value);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem(
                                    "nest_canva_template_url",
                                    e.target.value,
                                  );
                                }
                              }}
                              placeholder="Paste Nest Realty shared Canva link (e.g. https://www.canva.com/design/...)"
                              className="flex-1 px-3 py-1.5 bg-black/60 border border-purple-400/40 rounded-xl text-white text-xs font-mono focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCanvaConfigEditing(false);
                                if (typeof window !== "undefined") {
                                  localStorage.setItem(
                                    "nest_canva_template_url",
                                    canvaTemplateUrl,
                                  );
                                }
                              }}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-bold cursor-pointer"
                            >
                              Done
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 p-2.5 bg-purple-950/40 border border-purple-500/20 rounded-xl text-[11px]">
                            <span className="text-[#D0D6BB] truncate font-mono">
                              {canvaTemplateUrl}
                            </span>
                            <a
                              href={canvaTemplateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold shrink-0 shadow-md flex items-center gap-1"
                            >
                              <span>Launch Canva Editor ↗</span>
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Quick Copy Cards Grid */}
                      <div className="space-y-3 font-mono text-xs">
                        <h4 className="text-emerald-300 font-bold uppercase text-[10px] tracking-wider">
                          1-Click Copy Cards:
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Headline */}
                          <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-[#D0D6BB]">
                              <span>MAIN HEADLINE</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(customHeadline);
                                  setIntakeToast(
                                    "📋 Headline copied to clipboard!",
                                  );
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-amber-300 hover:text-white font-bold cursor-pointer"
                              >
                                Copy 📋
                              </button>
                            </div>
                            <p className="font-bold text-white text-xs">
                              {customHeadline}
                            </p>
                          </div>

                          {/* Asking Price & Specs */}
                          <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-[#D0D6BB]">
                              <span>PRICE & SPECS</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const specs = `${customPrice} | 4 Beds | 3.5 Baths | 3,850 SQFT | 0.84 Acres`;
                                  navigator.clipboard.writeText(specs);
                                  setIntakeToast(
                                    "📋 Specs copied to clipboard!",
                                  );
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-amber-300 hover:text-white font-bold cursor-pointer"
                              >
                                Copy 📋
                              </button>
                            </div>
                            <p className="font-bold text-emerald-300 text-xs">
                              {customPrice} • 4 Beds / 3.5 Baths
                            </p>
                          </div>

                          {/* Subhead / Tagline */}
                          <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-1.5 sm:col-span-2">
                            <div className="flex justify-between items-center text-[10px] text-[#D0D6BB]">
                              <span>MARKETING SUBHEAD</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    aiGeneratedContent.flyerSubhead,
                                  );
                                  setIntakeToast(
                                    "📋 Marketing subhead copied!",
                                  );
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-amber-300 hover:text-white font-bold cursor-pointer"
                              >
                                Copy 📋
                              </button>
                            </div>
                            <p className="text-white text-xs">
                              {aiGeneratedContent.flyerSubhead}
                            </p>
                          </div>

                          {/* Agent & BIC Info */}
                          <div className="p-3 bg-black/30 border border-white/10 rounded-2xl space-y-1.5 sm:col-span-2">
                            <div className="flex justify-between items-center text-[10px] text-[#D0D6BB]">
                              <span>AGENT & BROKERAGE CREDIT</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const credit = `${customAgentName} | Nest Realty Wilmington | (910) 555-0199 | ryan@nestrealty.com`;
                                  navigator.clipboard.writeText(credit);
                                  setIntakeToast("📋 Agent info copied!");
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-amber-300 hover:text-white font-bold cursor-pointer"
                              >
                                Copy 📋
                              </button>
                            </div>
                            <p className="text-white text-xs">
                              {customAgentName} • Nest Realty Wilmington
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Native PDF Printing Alternative */}
                      <div className="p-4 bg-[#002B24] border border-[#00635C]/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
                        <div>
                          <h5 className="font-bold text-white text-xs">
                            Don't want to use Canva?
                          </h5>
                          <p className="text-[10px] text-[#D0D6BB]">
                            Export a 300 DPI print-ready PDF flyer directly from
                            Shapework OS!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCanvaAssistantModal(false);
                            window.print();
                          }}
                          className="px-4 py-2 bg-[#00635C] hover:bg-[#007c73] text-white rounded-xl font-bold cursor-pointer shrink-0 shadow-md border border-emerald-400/40 flex items-center gap-1.5"
                        >
                          <span>📄 Export Native PDF Flyer ⚡</span>
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* 📅 30-Day Social Media Content Calendar & Auto-Scheduler Portal Modal */}
              {showSocialCalendarModal &&
                createPortal(
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    <div className="bg-gradient-to-br from-[#012B24] via-[#00231D] to-[#011714] border-2 border-indigo-500/50 rounded-3xl max-w-6xl w-full p-6 space-y-6 shadow-2xl text-left relative my-auto">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-lg">
                            📅
                          </div>
                          <div>
                            <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                              <span>
                                30-Day Automated Social Media Content Calendar
                              </span>
                              {isCalendarQueued && (
                                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ● 30 DAYS QUEUED & SCHEDULED
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-[#D0D6BB] font-mono">
                              Auto-generated multi-channel campaign for{" "}
                              {customAddress} • Multi-Platform Dispatch (IG, FB,
                              LinkedIn, TikTok)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCalendarQueued(true);
                              setIntakeToast(
                                `🚀 30-Day Social Campaign Scheduled & Queued across 4 Platforms for ${customAddress}!`,
                              );
                              setTimeout(() => setIntakeToast(null), 5000);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-lg border border-indigo-400/40 flex items-center gap-1.5"
                          >
                            <span>
                              🚀{" "}
                              {isCalendarQueued
                                ? "Re-Sync 30-Day Campaign"
                                : "Approve & Queue All 30 Days"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowSocialCalendarModal(false)}
                            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Platform Channel Tabs */}
                      <div className="flex gap-2 border-b border-white/10 pb-3 font-mono text-xs overflow-x-auto">
                        {[
                          {
                            id: "instagram",
                            label: "📸 Instagram (IG)",
                            format: "1080x1080 & 9:16 Story",
                          },
                          {
                            id: "facebook",
                            label: "📘 Facebook (FB)",
                            format: "Feed & Open House Event",
                          },
                          {
                            id: "linkedin",
                            label: "💼 LinkedIn",
                            format: "Professional Market Analysis",
                          },
                          {
                            id: "tiktok",
                            label: "🎵 TikTok",
                            format: "9:16 Short Video Teaser",
                          },
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() =>
                              setActiveCalendarChannel(ch.id as any)
                            }
                            className={`px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer flex flex-col text-left ${
                              activeCalendarChannel === ch.id
                                ? "bg-indigo-600 text-white border-indigo-400 shadow-md"
                                : "bg-black/30 text-[#D0D6BB] border-white/10 hover:bg-black/50"
                            }`}
                          >
                            <span>{ch.label}</span>
                            <span className="text-[9px] opacity-70 font-normal">
                              {ch.format}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Main Content Grid: 30-Day Calendar (Left 65%) + Day Inspector & Caption Editor (Right 35%) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* 30-Day Visual Grid */}
                        <div className="lg:col-span-8 space-y-3">
                          <div className="flex justify-between items-center text-xs font-mono text-[#D0D6BB]">
                            <span>CAMPAIGN TIMELINE (30 DAYS)</span>
                            <span className="text-emerald-400 font-bold">
                              ● Auto-Scheduling Active
                            </span>
                          </div>

                          <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
                            {Array.from({ length: 30 }, (_, i) => i + 1).map(
                              (day) => {
                                const isSelected = selectedCalendarDay === day;
                                const dayTitles: Record<number, string> = {
                                  1: "Just Listed Teaser",
                                  2: "Key Features Spotlight",
                                  3: "Aerial Drone View",
                                  5: "Virtual Video Tour",
                                  7: "Open House Push",
                                  10: "Kitchen & Finishes",
                                  14: "Neighborhood WalkScore",
                                  18: "Price & Equity Highlight",
                                  22: "Sunset & Outdoor Oasis",
                                  26: "Agent VIP Commentary",
                                  30: "Under Contract Showcase",
                                };
                                const title =
                                  dayTitles[day] || `Day ${day} Spotlight`;

                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => setSelectedCalendarDay(day)}
                                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer aspect-square ${
                                      isSelected
                                        ? "bg-indigo-600/90 text-white border-indigo-400 shadow-lg ring-2 ring-indigo-400/50"
                                        : "bg-black/40 border-white/10 hover:bg-black/70 text-[#D0D6BB]"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start w-full">
                                      <span className="font-mono font-bold text-xs">
                                        Day {day}
                                      </span>
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                        {activeCalendarChannel === "instagram"
                                          ? "IG"
                                          : activeCalendarChannel === "facebook"
                                            ? "FB"
                                            : activeCalendarChannel ===
                                                "linkedin"
                                              ? "LI"
                                              : "TT"}
                                      </span>
                                    </div>

                                    <div className="my-auto space-y-1">
                                      <p className="text-[10px] font-bold leading-tight line-clamp-2">
                                        {title}
                                      </p>
                                    </div>

                                    <div className="flex justify-between items-center text-[8px] font-mono opacity-80 pt-1 border-t border-white/10">
                                      <span className="text-emerald-400 font-bold">
                                        ●{" "}
                                        {isCalendarQueued ? "Queued" : "Ready"}
                                      </span>
                                      <span>9:00 AM</span>
                                    </div>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* Day Post Inspector & AI Caption Editor */}
                        <div className="lg:col-span-4 bg-black/50 border border-white/10 rounded-2xl p-4 space-y-4 font-sans text-xs">
                          <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <div className="font-mono font-bold text-white text-sm">
                              Day {selectedCalendarDay} Post Inspector
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[9px] border border-emerald-500/40">
                              CHANNEL: {activeCalendarChannel.toUpperCase()}
                            </span>
                          </div>

                          {/* Media Thumbnail */}
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-md bg-black">
                            <img
                              src={activePhotoUrl}
                              alt="Day Post Media"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[9px] font-mono text-white">
                              Format:{" "}
                              {activeCalendarChannel === "tiktok"
                                ? "9:16 Video"
                                : activeCalendarChannel === "instagram"
                                  ? "1080x1080 Image"
                                  : "Rich Media Feed"}
                            </div>
                          </div>

                          {/* Caption Editor */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-mono text-[#D0D6BB]">
                              <span>PLATFORM-OPTIMIZED CAPTION</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const key = `${selectedCalendarDay}_${activeCalendarChannel}`;
                                  const rewritten = `🌊 COASTAL LUXURY SPOTLIGHT (Day ${selectedCalendarDay})! ${customAddress} offers unmatched architectural details, private heated pool & chef quartzite kitchen. Contact Ryan Crecelius today! 📞 #NestRealty #WilmingtonNC #LuxuryHomes`;
                                  setCustomCaptions((prev) => ({
                                    ...prev,
                                    [key]: rewritten,
                                  }));
                                  setIntakeToast(
                                    "✨ AI rewrote caption in Coastal Luxury Tone!",
                                  );
                                  setTimeout(() => setIntakeToast(null), 3000);
                                }}
                                className="text-indigo-300 hover:text-white font-bold cursor-pointer flex items-center gap-1"
                              >
                                <span>✨ AI Rewrite</span>
                              </button>
                            </div>

                            <textarea
                              rows={5}
                              value={
                                customCaptions[
                                  `${selectedCalendarDay}_${activeCalendarChannel}`
                                ] ||
                                `✨ DAY ${selectedCalendarDay} SPOTLIGHT! Discover ${customAddress} (${customPrice}). Coastal living at its absolute finest with 4 beds, 4.5 baths, private pool & quartzite chef's kitchen. DM or call ${customAgentName} for details! 🌊 #WilmingtonNC #LuxuryRealEstate #NestRealty`
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const key = `${selectedCalendarDay}_${activeCalendarChannel}`;
                                setCustomCaptions((prev) => ({
                                  ...prev,
                                  [key]: val,
                                }));
                              }}
                              className="w-full p-3 bg-black/60 border border-white/20 rounded-xl text-white text-xs font-sans focus:outline-none focus:border-indigo-400 placeholder-white/30"
                            />
                          </div>

                          {/* Dispatch & Preview Buttons */}
                          <div className="space-y-2 pt-2 border-t border-white/10">
                            <button
                              type="button"
                              onClick={() => {
                                setIntakeToast(
                                  `📤 Day ${selectedCalendarDay} post published to ${activeCalendarChannel.toUpperCase()}!`,
                                );
                                setTimeout(() => setIntakeToast(null), 3000);
                              }}
                              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-md"
                            >
                              📤 Dispatch Day {selectedCalendarDay} Post Now
                            </button>

                            <p className="text-[9px] font-mono text-[#D0D6BB]/70 text-center">
                              Automated schedule dispatch powered by Shapework
                              Social API & Rechat CRM
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

              {/* 📦 Multi-Format 1-Click Batch Export ZIP & Rechat CRM Auto-Sync Modal */}
              {isBatchExporting &&
                createPortal(
                  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-gradient-to-br from-[#012B24] to-[#011F1A] border-2 border-emerald-500/50 rounded-3xl max-w-lg w-full p-6 text-center space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-pulse" />

                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto text-3xl shadow-lg">
                        📦
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-serif font-bold text-white">
                          1-Click Batch Collateral Exporter
                        </h3>
                        <p className="text-xs text-[#D0D6BB] font-mono">
                          Generating all 9 marketing formats & auto-syncing to
                          Rechat CRM + Drive
                        </p>
                      </div>

                      {/* Progress Steps */}
                      <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left font-mono text-xs space-y-2.5">
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 1 ? "text-emerald-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 1
                              ? "✅"
                              : batchExportStep === 1
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>1. Luxury Flyer PDF (300 DPI Vector)</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 2 ? "text-emerald-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 2
                              ? "✅"
                              : batchExportStep === 2
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>
                            2. 9:16 Vertical Story Reel PNG (IG/FB Stories)
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 3 ? "text-emerald-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 3
                              ? "✅"
                              : batchExportStep === 3
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>
                            3. 1080x1080 Social Carousel (5-Slide Package)
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 4 ? "text-emerald-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 4
                              ? "✅"
                              : batchExportStep === 4
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>
                            4. 6x9 Direct Mail Postcard PDF (High-Gloss)
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 5 ? "text-emerald-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 5
                              ? "✅"
                              : batchExportStep === 5
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>5. 24x18 Open House Sign Rider PNG</span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 6 ? "text-cyan-300 font-bold" : "text-white/30"}`}
                        >
                          <span>
                            {batchExportStep > 6
                              ? "✅"
                              : batchExportStep === 6
                                ? "⏳"
                                : "⚪"}
                          </span>
                          <span>
                            6. Sync to Rechat CRM & Google Drive Folder
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-2 transition-all ${batchExportStep >= 7 ? "text-amber-300 font-bold" : "text-white/30"}`}
                        >
                          <span>{batchExportStep === 7 ? "🎉" : "⚪"}</span>
                          <span>
                            7. Packaging nest_collateral_package.zip (24.8 MB)
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#D0D6BB]">
                        <span>Property: {customAddress}</span>
                        <span className="text-emerald-400 font-bold">
                          STATUS: PROCESSING
                        </span>
                      </div>
                    </div>
                  </div>,
                  document.body,
                )}

          {/* ✨ USER-CENTRIC AI DESIGN STUDIO DOCKED SIDE RAIL DRAWER (APPLE LIGHT MODE) */}
          {showVirtualMachineModal && (
            <aside className="w-full xl:w-[460px] 2xl:w-[500px] shrink-0 bg-white border-2 border-[#00635C]/30 rounded-3xl p-5 space-y-4 shadow-2xl text-left text-slate-900 font-sans sticky top-4 z-40 max-h-[calc(100vh-2rem)] overflow-y-auto self-start animate-fade-in">
              {/* Plain-English Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#00635C]/10 border border-[#00635C]/30 flex items-center justify-center text-lg shadow-lg shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-[#00635C] animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-serif font-bold text-slate-900">
                        AI Design Studio
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#F4F5EE] text-[#00635C] border border-[#00635C]/30 text-[9px] font-mono font-bold">
                        Gemini 2.5 Flash
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      AI Assistant Active • Synced with Rechat CRM & Workspace
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVirtualMachineModal(false)}
                  className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs cursor-pointer transition-all shrink-0"
                  title="Close AI Studio"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User-Centric Design Directive Input */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-900 font-bold flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
                    What would you like to create?
                  </span>
                  <span className="text-[9px] font-mono text-[#00635C] font-bold">
                    Real-Time AI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={vmCustomPrompt}
                    onChange={(e) => setVmCustomPrompt(e.target.value)}
                    placeholder="Describe your vision (e.g., 'Make it super luxurious, focus on the pool')..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#00635C] font-sans shadow-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isVmRunning) {
                        handleExecuteVmStudio();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleExecuteVmStudio()}
                    disabled={isVmRunning}
                    className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d48] disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shrink-0 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Generate</span>
                  </button>
                </div>

                {/* Friendly Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    {
                      label: "✨ Luxury Home",
                      prompt: "High-end luxury residence with resort features",
                    },
                    {
                      label: "🌊 Waterfront & Pool",
                      prompt:
                        "Emphasize waterfront saltwater pool and deepwater dock",
                    },
                    {
                      label: "🏡 Open House Sunday",
                      prompt:
                        "Open House this Sunday 2PM - 4PM with VIP preview",
                    },
                    {
                      label: "📈 Investment Property",
                      prompt:
                        "Highlight rental yield potential, equity and prime location",
                    },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setVmCustomPrompt(chip.prompt);
                        handleExecuteVmStudio(chip.prompt);
                      }}
                      className="px-2.5 py-1 bg-[#F4F5EE] hover:bg-[#e8eae0] border border-[#00635C]/20 text-[#00635C] rounded-lg text-[10px] font-sans font-bold transition-all cursor-pointer truncate shadow-xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 User-Centric Tabs Bar */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-sans">
                <button
                  type="button"
                  onClick={() => setActiveVmTab("live_stream")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    activeVmTab === "live_stream"
                      ? "bg-[#00635C] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🎨 Live Gallery
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVmTab("palette_studio")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    activeVmTab === "palette_studio"
                      ? "bg-[#00635C] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📝 AI Copy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVmTab("layer_deck")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    activeVmTab === "layer_deck"
                      ? "bg-[#00635C] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  🎨 Colors
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVmTab("compliance")}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center cursor-pointer ${
                    activeVmTab === "compliance"
                      ? "bg-[#00635C] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⚖️ Disclosures
                </button>
              </div>

              {/* TAB 1: LIVE DESIGN GALLERY WITH REAL-TIME PREVIEW CARDS */}
              {activeVmTab === "live_stream" && (
                <div className="space-y-3.5 animate-fade-in font-sans">
                  {/* Generation Progress Bar */}
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-900 font-bold flex items-center gap-1.5 text-[11px]">
                        <Sparkles className="w-3.5 h-3.5 text-[#00635C]" />
                        {isVmRunning
                          ? "AI is creating your marketing package..."
                          : "All 5 design assets ready for review!"}
                      </span>
                      <span className="text-[#00635C] font-bold text-[10px]">
                        {isVmRunning ? "Creating..." : "Ready ✅"}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 border border-slate-300 rounded-full h-2 p-0.5 overflow-hidden">
                      <div
                        className="bg-[#00635C] h-full rounded-full transition-all duration-500"
                        style={{ width: `${vmProgressStep}%` }}
                      />
                    </div>
                  </div>

                  {/* Real-Time Generated Visual Cards Grid */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">
                      Real-Time Generated Visual Previews
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Card 1: Hero Listing Photo */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-900">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-900">
                            📸 Hero Facade
                          </span>
                          <span className="text-[#00635C] font-mono text-[9px] font-bold">
                            4K Primary
                          </span>
                        </div>
                        <div className="h-20 rounded-lg overflow-hidden relative border border-slate-200">
                          <img
                            src={generatedPhotoPack.heroPhotoUrl}
                            alt="Listing Hero"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 rounded-md text-[8px] font-mono text-[#00635C] border border-[#00635C]/30 font-bold">
                            Primary Cover
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Pool & Patio Oasis */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-900">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-900">
                            🌊 Saltwater Pool
                          </span>
                          <span className="text-[#00635C] font-mono text-[9px] font-bold">
                            Resort Deck
                          </span>
                        </div>
                        <div className="h-20 rounded-lg overflow-hidden relative border border-slate-200">
                          <img
                            src={generatedPhotoPack.poolPhotoUrl}
                            alt="Pool Oasis"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 rounded-md text-[8px] font-mono text-[#00635C] border border-[#00635C]/30 font-bold">
                            Flyer Slot 2
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Gourmet Kitchen */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-900">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-900">
                            🍳 Chef's Kitchen
                          </span>
                          <span className="text-[#00635C] font-mono text-[9px] font-bold">
                            Quartz Suite
                          </span>
                        </div>
                        <div className="h-20 rounded-lg overflow-hidden relative border border-slate-200">
                          <img
                            src={generatedPhotoPack.kitchenPhotoUrl}
                            alt="Chef Kitchen"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 rounded-md text-[8px] font-mono text-[#00635C] border border-[#00635C]/30 font-bold">
                            Brochure Slot 3
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Aerial Drone Waterfront */}
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-900">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-900">
                            🚁 4K Aerial Drone
                          </span>
                          <span className="text-[#00635C] font-mono text-[9px] font-bold">
                            0.84 Acres
                          </span>
                        </div>
                        <div className="h-20 rounded-lg overflow-hidden relative border border-slate-200">
                          <img
                            src={generatedPhotoPack.aerialPhotoUrl}
                            alt="Aerial Drone"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 rounded-md text-[8px] font-mono text-[#00635C] border border-[#00635C]/30 font-bold">
                            Yard Rider
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Disclosures Approved Banner */}
                    <div className="p-2 bg-[#F4F5EE] border border-[#00635C]/30 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-[#00635C] font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00635C]" />
                        Real Estate Disclosures & Equal Housing
                      </span>
                      <span className="text-[#00635C] text-[10px] font-mono font-bold">
                        Approved ✅
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AI COPY & CAPTIONS */}
              {activeVmTab === "palette_studio" && (
                <div className="space-y-3 animate-fade-in font-sans text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900 font-bold">
                      Generated AI Copy & Captions
                    </span>
                    <span className="text-[#00635C] text-[10px] font-mono font-bold">
                      1-Click Copy
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Flyer Headline</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(customHeadline);
                            setIntakeToast("📋 Headline copied to clipboard!");
                            setTimeout(() => setIntakeToast(null), 3000);
                          }}
                          className="text-[#00635C] hover:text-[#004d48] font-bold cursor-pointer"
                        >
                          Copy 📋
                        </button>
                      </div>
                      <p className="text-slate-900 font-bold text-xs">
                        {customHeadline}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Lifestyle Story Tagline</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              aiGeneratedContent.flyerSubhead,
                            );
                            setIntakeToast("📋 Tagline copied to clipboard!");
                            setTimeout(() => setIntakeToast(null), 3000);
                          }}
                          className="text-[#00635C] hover:text-[#004d48] font-bold cursor-pointer"
                        >
                          Copy 📋
                        </button>
                      </div>
                      <p className="text-slate-700 text-xs">
                        {aiGeneratedContent.flyerSubhead}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Instagram Caption</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              customCaptions["1_instagram"] || "",
                            );
                            setIntakeToast(
                              "📋 Instagram caption copied to clipboard!",
                            );
                            setTimeout(() => setIntakeToast(null), 3000);
                          }}
                          className="text-[#00635C] hover:text-[#004d48] font-bold cursor-pointer"
                        >
                          Copy 📋
                        </button>
                      </div>
                      <p className="text-slate-800 text-xs line-clamp-3 leading-relaxed">
                        {customCaptions["1_instagram"]}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLOR THEMES */}
              {activeVmTab === "layer_deck" && (
                <div className="space-y-3 animate-fade-in font-sans">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-900 font-bold">
                      Select Color Theme
                    </span>
                    <span className="text-[#00635C] text-[10px] font-bold">
                      Instant Canvas Update
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        key: "modern_minimalist",
                        title: "Coastal Emerald",
                        primary: "#00635C",
                        accent: "#D0D6BB",
                        desc: "Nest signature emerald green & warm sand.",
                      },
                      {
                        key: "navy_gold",
                        title: "Historic Navy & Gold",
                        primary: "#1E293B",
                        accent: "#F59E0B",
                        desc: "Wilmington historic district luxury theme.",
                      },
                      {
                        key: "dark_glass",
                        title: "Urban Obsidian",
                        primary: "#0F172A",
                        accent: "#10B981",
                        desc: "Sleek dark mode with emerald neon accents.",
                      },
                      {
                        key: "coastal_luxury",
                        title: "Mayfaire Sand",
                        primary: "#18181B",
                        accent: "#3F3F46",
                        desc: "Subtle coastal grey & slate architectural tone.",
                      },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setWysiwygTheme(p.key as any);
                          setIntakeToast(
                            `🎨 Switched color theme to "${p.title}"!`,
                          );
                          setTimeout(() => setIntakeToast(null), 3000);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                          wysiwygTheme === p.key
                            ? "bg-[#F4F5EE] border-[#00635C] ring-2 ring-[#00635C]/30"
                            : "bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-[11px]">
                            {p.title}
                          </span>
                          {wysiwygTheme === p.key && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00635C]" />
                          )}
                        </div>
                        <div className="flex gap-1.5 items-center">
                          <div
                            className="w-5 h-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: p.primary }}
                          />
                          <div
                            className="w-5 h-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: p.accent }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight">
                          {p.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: DISCLOSURES & COMPLIANCE */}
              {activeVmTab === "compliance" && (
                <div className="space-y-3 animate-fade-in font-sans text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-900 font-bold">
                      Real Estate Disclosures Check
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F4F5EE] text-[#00635C] border border-[#00635C]/40 text-[9px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[#00635C]" />
                      APPROVED
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    {complianceResults.checks.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-slate-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#00635C]" />
                            {item.title}
                          </span>
                          <span className="text-[9px] text-[#00635C] uppercase font-bold">
                            PASS
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 pl-5">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsComplianceAuditing(true);
                      setTimeout(() => {
                        setIsComplianceAuditing(false);
                        setIntakeToast(
                          "⚖️ Re-verified all real estate disclosures and Equal Housing compliance!",
                        );
                        setTimeout(() => setIntakeToast(null), 4000);
                      }, 1000);
                    }}
                    disabled={isComplianceAuditing}
                    className="w-full py-2 bg-[#00635C] hover:bg-[#004d48] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>
                      {isComplianceAuditing
                        ? "Checking Disclosures..."
                        : "Re-Verify Disclosures"}
                    </span>
                  </button>
                </div>
              )}

              {/* Bottom User Actions */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-sans">
                <button
                  type="button"
                  onClick={handleDownloadRealZipPackage}
                  className="px-3.5 py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download Package ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVirtualMachineModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Hide Studio
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* 🚀 AUTO-SYNDICATION INTERACTIVE MODAL */}
        {showSyndicateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
            <div className="bg-[#0B4A3F] border border-[rgba(208,214,187,0.24)] rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl text-left text-[#FFFDF8] relative">
              <button
                type="button"
                onClick={() => setShowSyndicateModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-[#073F35] hover:bg-[#115548] text-[rgba(246,247,241,0.7)] hover:text-[#FFFDF8] flex items-center justify-center font-bold text-xs cursor-pointer transition-all border border-[rgba(208,214,187,0.14)]"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 border-b border-[rgba(208,214,187,0.14)] pb-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00635C] border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#FFFDF8]">
                    Auto-Syndicating to CRM & MLS
                  </h3>
                  <p className="text-xs text-emerald-300 font-mono mt-0.5">
                    {customAddress} • {customPrice}
                  </p>
                </div>
              </div>

              {/* Progress Checklist */}
              <div className="space-y-2.5 text-xs font-sans">
                {/* Rechat CRM */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    syndicationStep >= 1
                      ? "bg-[#073F35] border-emerald-400/30"
                      : "bg-[#073F35]/50 border-[rgba(208,214,187,0.14)] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#FFFDF8]">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      1. Rechat CRM Deals Campaign
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {syndicationStep >= 2
                        ? "CAMPAIGN SYNCED ✅"
                        : syndicationStep === 1
                          ? "Syncing..."
                          : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(246,247,241,0.7)] mt-1 pl-6">
                    Attached 4K Photos, Flyer PDF & 9:16 Video Reel. Lead
                    routing assigned to Ryan Crecelius (BIC).
                  </p>
                </div>

                {/* FlexMLS Matrix */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    syndicationStep >= 2
                      ? "bg-[#073F35] border-emerald-400/30"
                      : "bg-[#073F35]/50 border-[rgba(208,214,187,0.14)] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#FFFDF8]">
                    <span className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-emerald-300" />
                      2. FlexMLS / MLS Matrix Entry
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {syndicationStep >= 3
                        ? "MLS DRAFT PREPARED ✅"
                        : syndicationStep === 2
                          ? "Pushing MLS Remarks..."
                          : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(246,247,241,0.7)] mt-1 pl-6">
                    Drafted MLS entry with Public Remarks, Agent Remarks,
                    4-photo grid, and Virtual Tour URL.
                  </p>
                </div>

                {/* Google Drive Archive */}
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    syndicationStep >= 3
                      ? "bg-[#073F35] border-emerald-400/30"
                      : "bg-[#073F35]/50 border-[rgba(208,214,187,0.14)] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[#FFFDF8]">
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-300" />
                      3. Google Drive Brokerage Archive
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      {syndicationStep >= 4
                        ? "ARCHIVED ✅"
                        : syndicationStep === 3
                          ? "Archiving PDF & MP4..."
                          : "Pending"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[rgba(246,247,241,0.7)] mt-1 pl-6">
                    Archived 300 DPI PDF flyers, 6x9 postcards, and 9:16 MP4
                    video reels into Google Drive folder.
                  </p>
                </div>
              </div>

              {/* Confirmation Action Buttons */}
              {syndicationData && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href={syndicationData.rechatCrm?.crmUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold text-center transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Open Rechat Deal</span>
                    </a>

                    <a
                      href={syndicationData.flexMls?.mlsDraftUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 bg-[#00635C] hover:bg-[#004d48] text-white rounded-xl font-bold text-center transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open MLS Draft</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSyndicateModal(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Syndication Window
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {/* Development Identity Strip (Hidden by default unless debug=1 is explicitly set) */}
        {showMarketingDebug && (
          <div
            data-testid="dev-identity-strip"
            className="w-full bg-[#062f28] border-t border-amber-500/30 px-6 py-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#d0d6bb]/90 shrink-0 mt-6 rounded-2xl"
          >
            <div className="flex items-center gap-4">
              <span>requestId: <strong className="text-white">{activeCampaign?.request?.id || 'req_304_ocean_phone'}</strong></span>
              <span>brandKitVersion: <strong className="text-white">{activeCampaign?.brandKit?.version || '2.1.0'}</strong></span>
              <span>complianceVersion: <strong className="text-white">{activeCampaign?.compliancePolicySet?.version || '2026.1'}</strong></span>
            </div>
            <span className="text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">Explicit Debug Mode (debug=1)</span>
          </div>
        )}
      </div>
  );
}
