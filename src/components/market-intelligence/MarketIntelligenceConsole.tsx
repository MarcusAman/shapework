/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  MapPin,
  TrendingUp,
  Award,
  Shield,
  Bot,
  Brain,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import SpatialCompsView from "../comps/SpatialCompsView";
import { BrokerageMarketingRoiCommandCenter } from "../marketing/BrokerageMarketingRoiCommandCenter";
import { RecruitingAndMarketShareCommandCenter } from "../recruiting/RecruitingAndMarketShareCommandCenter";
import { BicComplianceCommandCenter } from "../compliance/BicComplianceCommandCenter";
import { NoraAutonomousEmployeeHub } from "../voice/NoraAutonomousEmployeeHub";
import {
  MarketIntelligenceSubtab,
  MARKET_INTELLIGENCE_SUBTABS,
  MARKET_INTELLIGENCE_ALIASES
} from "./marketIntelligenceSubtabs";

export interface MarketIntelligenceConsoleProps {
  state?: any;
  initialTab?: MarketIntelligenceSubtab;
  onNavigateToTab?: (tab: string) => void;
}

export function MarketIntelligenceConsole({
  state,
  initialTab,
  onNavigateToTab
}: MarketIntelligenceConsoleProps) {
  const [activeTab, setActiveTab] = useState<MarketIntelligenceSubtab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab") || params.get("subtab");
      if (urlTab && MARKET_INTELLIGENCE_ALIASES[urlTab.toLowerCase()]) {
        return MARKET_INTELLIGENCE_ALIASES[urlTab.toLowerCase()];
      }
    }
    return initialTab || "comps";
  });

  const [toast, setToast] = useState<string | null>(null);

  // Sync with URL query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("subtab") !== activeTab && url.searchParams.get("tab") !== activeTab) {
        url.searchParams.set("subtab", activeTab);
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [activeTab]);

  const handleTabSwitch = (tabId: MarketIntelligenceSubtab) => {
    setActiveTab(tabId);
  };

  const getSubtabIcon = (id: MarketIntelligenceSubtab) => {
    switch (id) {
      case "comps":
        return <MapPin className="w-3.5 h-3.5" />;
      case "roi":
        return <TrendingUp className="w-3.5 h-3.5" />;
      case "recruiting":
        return <Award className="w-3.5 h-3.5" />;
      case "bic_compliance":
        return <Shield className="w-3.5 h-3.5" />;
      case "nora_employee":
        return <Bot className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-800 p-3 sm:p-5 lg:p-6 font-sans text-left"
      data-testid="market-intelligence-shell"
    >
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-white border border-[#00635C] text-slate-900 px-5 py-3 rounded-2xl shadow-2xl text-xs font-sans font-bold flex items-center gap-3 animate-bounce max-w-md">
          <Bot className="w-5 h-5 text-[#00635C] shrink-0" />
          <span>{toast}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="w-full max-w-[1680px] mx-auto space-y-5">
        {/* TOP HEADER & SUBTAB NAVIGATION */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E5EFEA] text-[#00635C] flex items-center justify-center font-bold shadow-xs">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Market Intelligence</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E5EFEA] text-[#00635C] border border-[#00635C]/20">
                    Live Analytics
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Spatial comps, executive ROI velocity, MLS recruiting market share, BIC compliance & autonomous operations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                Wilmington MLS & Brokerage Layer
              </span>
            </div>
          </div>

          {/* SUBTAB PILL BAR */}
          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3"
            data-testid="market-intelligence-navigation"
          >
            {MARKET_INTELLIGENCE_SUBTABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabSwitch(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  data-testid={`market-nav-${tab.id}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    isActive
                      ? "bg-[#00635C] text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {getSubtabIcon(tab.id)}
                  <span>{tab.label}</span>
                  {tab.secondaryLabel && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-500 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      {tab.secondaryLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN VIEW CONTENT CONTAINER */}
        <main
          data-testid="market-intelligence-content"
          className="w-full min-w-0 space-y-6"
        >
          {/* 1. SPATIAL COMPS & OFFER MAP VIEW */}
          {(activeTab === "comps") && (
            <div data-testid="market-intelligence-comps-view" className="w-full">
              <SpatialCompsView
                initialSubjectId="prop_1104_arboretum"
                onNavigateToMarketing={(address) => {
                  if (onNavigateToTab) {
                    onNavigateToTab("Marketing Intake");
                  }
                }}
              />
            </div>
          )}

          {/* 2. EXECUTIVE MARKETING ROI COMMAND CENTER */}
          {(activeTab === "roi") && (
            <div data-testid="market-intelligence-roi-view" className="w-full">
              <BrokerageMarketingRoiCommandCenter />
            </div>
          )}

          {/* 3. RECRUITING & MLS MARKET SHARE COMMAND CENTER */}
          {(activeTab === "recruiting") && (
            <div data-testid="market-intelligence-recruiting-view" className="w-full">
              <RecruitingAndMarketShareCommandCenter />
            </div>
          )}

          {/* 4. BIC REGULATORY COMPLIANCE & TRUST ACCOUNT SENTINEL */}
          {(activeTab === "bic_compliance") && (
            <div data-testid="market-intelligence-bic-view" className="w-full">
              <BicComplianceCommandCenter />
            </div>
          )}

          {/* 5. NORA AUTONOMOUS EMPLOYEE COMMAND HUB */}
          {(activeTab === "nora_employee") && (
            <div data-testid="market-intelligence-nora-view" className="w-full">
              <NoraAutonomousEmployeeHub />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default MarketIntelligenceConsole;
