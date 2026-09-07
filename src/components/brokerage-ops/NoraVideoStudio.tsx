import React, { useState, useEffect } from 'react';
import {
  Video,
  Clapperboard,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Copy,
  CheckCircle2,
  Tv,
  Film,
  Camera,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface VideoScriptSegment {
  timeCode: string;
  narration: string;
  onScreenText: string;
  cameraDirection: string;
  bRollPrompt: string;
}

interface GeneratedVideoScript {
  id: string;
  title: string;
  propertyAddress: string;
  format: 'tiktok_reels_30s' | 'instagram_walkthrough_60s' | 'youtube_luxury_2min';
  formatLabel: string;
  estimatedDurationSeconds: number;
  wordCount: number;
  recommendedWpm: number;
  suggestedMusicVibe: string;
  hookVariant: string;
  callToAction: string;
  segments: VideoScriptSegment[];
  teleprompterText: string;
}

interface VideoTutorial {
  id: string;
  title: string;
  category: string;
  durationMinutes: string;
  videoUrl: string;
  description: string;
  instructor: string;
}

export const NoraVideoStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scriptwriter' | 'tutorials' | 'teleprompter'>('scriptwriter');
  const [propertyAddress, setPropertyAddress] = useState('312 Mayfaire Way, Wilmington NC');
  const [format, setFormat] = useState<'tiktok_reels_30s' | 'instagram_walkthrough_60s' | 'youtube_luxury_2min'>('tiktok_reels_30s');
  const [price, setPrice] = useState('$720,000');
  const [agentName, setAgentName] = useState('Ryan Crecelius');
  const [script, setScript] = useState<GeneratedVideoScript | null>(null);
  const [tutorials, setTutorials] = useState<VideoTutorial[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Teleprompter Player State
  const [isPrompterRunning, setIsPrompterRunning] = useState(false);
  const [prompterSpeed, setPrompterSpeed] = useState(2);
  const [prompterFontSize, setPrompterFontSize] = useState(24);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchTutorials();
    generateScript();
  }, []);

  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/nora/video-studio/tutorials');
      const data = await res.json();
      if (data.success) setTutorials(data.tutorials || []);
    } catch (e) {
      console.error(e);
    }
  };

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/nora/video-studio/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAddress,
          format,
          price,
          agentName
        })
      });
      const data = await res.json();
      if (data.success) setScript(data.script);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Teleprompter Auto-Scroll Loop
  useEffect(() => {
    let interval: any;
    if (isPrompterRunning && activeTab === 'teleprompter') {
      interval = setInterval(() => {
        setScrollPosition(prev => prev + prompterSpeed);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPrompterRunning, prompterSpeed, activeTab]);

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script.teleprompterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Subtab Navigation (Apple Light Mode) */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scriptwriter')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'scriptwriter'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5 text-[#00635C]" />
            AI Video Script & Shot List Engine
          </button>
          <button
            onClick={() => setActiveTab('teleprompter')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'teleprompter'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-blue-600" />
            In-App Teleprompter Studio
          </button>
          <button
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tutorials'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/60'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-amber-600" />
            Brokerage Video SOP Vault ({tutorials.length})
          </button>
        </div>
      </div>

      {/* 1. Video Scriptwriter View */}
      {activeTab === 'scriptwriter' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls & Generation Form */}
          <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-stone-900 pb-2 border-b border-stone-100">
              Video Script Parameters
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">Property Address</label>
                <input
                  type="text"
                  value={propertyAddress}
                  onChange={e => setPropertyAddress(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">Video Format</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                >
                  <option value="tiktok_reels_30s">30s TikTok / Instagram Reel (Viral Hook)</option>
                  <option value="instagram_walkthrough_60s">60s Room-by-Room Walkthrough</option>
                  <option value="youtube_luxury_2min">2-Minute Cinematic Luxury Tour (YouTube)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Price</label>
                  <input
                    type="text"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">Host Broker</label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={e => setAgentName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/50 text-stone-900"
                  />
                </div>
              </div>

              <button
                onClick={generateScript}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGenerating ? 'Generating Video Script...' : 'Regenerate Script & Shot List'}
              </button>
            </div>
          </div>

          {/* Script & B-Roll Shot List Display */}
          <div className="lg:col-span-2 space-y-4">
            {script && (
              <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                      {script.formatLabel}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900">{script.propertyAddress}</h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      🎵 Music Vibe: <em>{script.suggestedMusicVibe}</em>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all"
                    >
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Full Script
                    </button>
                    <button
                      onClick={() => setActiveTab('teleprompter')}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#00635C] hover:bg-[#00524C] rounded-lg shadow-sm"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      Launch Teleprompter
                    </button>
                  </div>
                </div>

                {/* Scene-by-Scene Breakdown */}
                <div className="space-y-3">
                  {script.segments.map((seg, i) => (
                    <div key={i} className="bg-stone-50/70 p-4 rounded-xl border border-stone-200/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#00635C]">
                          Scene {i + 1} ({seg.timeCode})
                        </span>
                        <span className="text-[10px] font-mono text-stone-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                          Overlay: {seg.onScreenText}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-stone-900 leading-relaxed">
                        🗣️ Narration: "{seg.narration}"
                      </p>
                      <div className="flex items-start gap-1.5 text-[11px] text-stone-600 pt-1 border-t border-stone-200/50">
                        <Camera className="w-3.5 h-3.5 text-stone-600 mt-0.5 shrink-0" />
                        <span><strong>Camera Direction:</strong> {seg.cameraDirection}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Interactive Teleprompter Studio */}
      {activeTab === 'teleprompter' && script && (
        <div className="bg-stone-900 rounded-2xl p-6 text-white shadow-xl space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrompterRunning(!isPrompterRunning)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00635C] hover:bg-[#00524C] text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                {isPrompterRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                {isPrompterRunning ? 'Pause Prompter' : 'Start Prompter'}
              </button>
              <button
                onClick={() => {
                  setIsPrompterRunning(false);
                  setScrollPosition(0);
                }}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"
                title="Reset to Top"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span>Speed:</span>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={prompterSpeed}
                  onChange={e => setPrompterSpeed(Number(e.target.value))}
                  className="w-20 accent-[#00635C]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>Font Size:</span>
                <input
                  type="range"
                  min="18"
                  max="36"
                  value={prompterFontSize}
                  onChange={e => setPrompterFontSize(Number(e.target.value))}
                  className="w-20 accent-[#00635C]"
                />
              </div>
            </div>
          </div>

          {/* Teleprompter Scrolling Viewport */}
          <div className="h-96 overflow-hidden relative bg-black/40 rounded-xl border border-stone-800 p-8 flex justify-center">
            {/* Guide line */}
            <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-emerald-500/40 pointer-events-none z-10" />

            <div
              className="max-w-2xl text-center space-y-8 transition-transform duration-75 ease-linear"
              style={{
                transform: `translateY(-${scrollPosition}px)`,
                fontSize: `${prompterFontSize}px`,
                lineHeight: 1.6
              }}
            >
              <div className="text-emerald-400 text-sm font-mono uppercase tracking-widest pb-4">
                --- START RECORDING ---
              </div>
              {script.segments.map((seg, i) => (
                <div key={i} className="space-y-2">
                  <span className="text-stone-500 text-xs font-mono block">[{seg.timeCode}]</span>
                  <p className="font-bold text-white tracking-wide">{seg.narration}</p>
                </div>
              ))}
              <div className="text-emerald-400 text-sm font-mono uppercase tracking-widest pt-8">
                --- CUT & WRAP ---
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Brokerage Video SOP Tutorial Library */}
      {activeTab === 'tutorials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutorials.map(tut => (
            <div key={tut.id} className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-sm space-y-3 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {tut.category}
                  </span>
                  <span className="text-xs font-mono text-stone-600">{tut.durationMinutes}</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900">{tut.title}</h4>
                <p className="text-[11px] text-stone-600">{tut.description}</p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-600 font-medium">Instructor: {tut.instructor}</span>
                <a
                  href={tut.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#00635C] font-semibold hover:underline"
                >
                  Watch Video SOP
                  <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
