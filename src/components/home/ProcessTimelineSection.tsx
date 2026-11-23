import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'motion/react';

interface ProcessStage {
  id: string;
  trackCode: string;
  trackName: string;
  title: string;
  summary: string;
  deliverables: string;
  playheadTarget: number; // percentage 0..100
}

const STAGES: ProcessStage[] = [
  {
    id: 'picture',
    trackCode: 'V1',
    trackName: 'Picture Cut',
    title: '01. Assembly & Rhythmic Structure',
    summary:
      'Every project begins by logging selects, locking the 2-second opening hook, and carving out dead frames until the visual spine moves effortlessly on mute.',
    deliverables: 'Selects reel · Hook architecture · Frame-accurate rough cut',
    playheadTarget: 18
  },
  {
    id: 'motion',
    trackCode: 'V3',
    trackName: 'Motion & Titles',
    title: '02. Kinetic Graphics & Transitions',
    summary:
      'Custom masking wipes, speed-ramped motion, and modular typography keyframed directly onto visual beats.',
    deliverables: 'Masking transitions · Kinetic titles · Speed-ramp keyframes',
    playheadTarget: 46
  },
  {
    id: 'colour',
    trackCode: 'V2',
    trackName: 'Colour Pipeline',
    title: '03. Look Development & Grading',
    summary:
      'Shot-by-shot exposure matching, balanced skin tones, film grain texture, and signature color contrast unify multi-camera footage into one cohesive visual language.',
    deliverables: 'Primary balance · Custom LUT grade · Shot-to-shot matching',
    playheadTarget: 68
  },
  {
    id: 'sound',
    trackCode: 'A1',
    trackName: 'Sound Mix',
    title: '04. Spatial Audio & Mastering',
    summary:
      'Risers, sub-hits, foley texture, and music stems are sculpted around cut points and mastered to broadcast & social loudness standards before final Full HD export.',
    deliverables: 'SFX & foley layers · Dynamic music edit · Full HD / 4K master',
    playheadTarget: 86
  }
];

// Website-native Swiss/Bauhaus palette chevron stripes (Obsidian, Warm Bone, Signal Vermilion, Muted Sand)
const LEFT_CHEVRONS = [
  { x: 0, color: '#EB4A1D' },
  { x: 46, color: '#EFE6D5' },
  { x: 92, color: '#262321' },
  { x: 138, color: '#B9A992' }
];

const RIGHT_CHEVRONS = [
  { x: 0, color: '#B9A992' },
  { x: 46, color: '#262321' },
  { x: 92, color: '#EFE6D5' },
  { x: 138, color: '#EB4A1D' }
];

/**
 * Section 04 — The Process expressed as a unified Cinema Clapperboard Timeline:
 * - Animated Upper V-Clapper Stick (website color palette) carrying the active track title & sync cue
 * - Stationary Lower Clapper Bar carrying the selected track's editorial description inside
 * - Clapperboard Body housing the complete interactive 4-track frosted-glass editing timeline
 */
export const ProcessTimelineSection: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>('picture');
  const [playheadPct, setPlayheadPct] = useState<number>(18);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [clapTick, setClapTick] = useState<number>(0);
  const [syncFlash, setSyncFlash] = useState<boolean>(false);
  const rulerRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<string>('picture');

  const triggerClap = useCallback(() => {
    setClapTick((c) => c + 1);
    window.setTimeout(() => {
      setSyncFlash(true);
      window.setTimeout(() => setSyncFlash(false), 180);
    }, 175);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setPlayheadPct((prev) => {
        const next = prev + 0.55;
        return next >= 100 ? 0 : next;
      });
    }, 45);
    return () => window.clearInterval(interval);
  }, [isPlaying]);

  // Sync highlighted stage & fire clapperboard snap when playhead crosses edit zones while playing
  useEffect(() => {
    if (!isPlaying) return;
    let nextStage = 'sound';
    if (playheadPct < 30) nextStage = 'picture';
    else if (playheadPct < 56) nextStage = 'motion';
    else if (playheadPct < 78) nextStage = 'colour';

    if (nextStage !== prevStageRef.current) {
      prevStageRef.current = nextStage;
      setActiveStageId(nextStage);
      triggerClap();
    }
  }, [playheadPct, isPlaying, triggerClap]);

  const handleSelectStage = (stage: ProcessStage) => {
    setIsPlaying(false);
    prevStageRef.current = stage.id;
    setActiveStageId(stage.id);
    setPlayheadPct(stage.playheadTarget);
    triggerClap();
  };

  const handleRulerScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setPlayheadPct(pct);
    let nextStage = 'sound';
    if (pct < 30) nextStage = 'picture';
    else if (pct < 56) nextStage = 'motion';
    else if (pct < 78) nextStage = 'colour';
    if (nextStage !== prevStageRef.current) {
      prevStageRef.current = nextStage;
      setActiveStageId(nextStage);
      triggerClap();
    }
  };

  const activeStage = STAGES.find((s) => s.id === activeStageId) || STAGES[0];
  const currentSeconds = Math.round((playheadPct / 100) * 60);
  const formattedTC = `00:00:${String(currentSeconds).padStart(2, '0')}:12`;

  return (
    <section
      id="section-timeline"
      className="relative z-10 w-full py-16 sm:py-24 border-b border-[#EFE6D5]/10"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#EFE6D5]/12">
          <div>
            <div className="text-xs font-mono text-[#EB4A1D] tracking-widest uppercase">
              04 · The Process / Edit Architecture
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#EFE6D5] tracking-tight uppercase mt-2">
              Inside The Timeline
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-[#EFE6D5] bg-[#EFE6D5]/[0.08] backdrop-blur-[14px] backdrop-saturate-150 border border-[#EFE6D5]/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] px-3 py-2">
              TC {formattedTC}
            </span>
            <button
              onClick={() => {
                setIsPlaying((p) => {
                  if (!p) triggerClap();
                  return !p;
                });
              }}
              className="px-4 py-2 bg-[#EB4A1D] hover:bg-[#ff5a2b] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} className="fill-white" />}
              <span>{isPlaying ? 'Pause Playhead' : 'Play Sequence'}</span>
            </button>
          </div>
        </div>

        {/* Stage Selector Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-8 pb-4">
          {STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            return (
              <button
                key={stage.id}
                onClick={() => handleSelectStage(stage)}
                className={`p-3.5 text-left border backdrop-blur-[14px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_30px_rgba(0,0,0,0.35)] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-br from-[#EB4A1D]/[0.24] via-[#EB4A1D]/[0.12] to-[#EFE6D5]/[0.06] border-[#EB4A1D]'
                    : 'bg-gradient-to-br from-[#EFE6D5]/[0.1] via-[#EFE6D5]/[0.05] to-[#1A1715]/[0.15] border-[#EFE6D5]/28 hover:border-[#EFE6D5]/50 hover:from-[#EFE6D5]/[0.14]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={isActive ? 'text-[#EB4A1D] font-bold' : 'text-[#B9A992]'}>
                    {stage.trackCode} · {stage.trackName}
                  </span>
                </div>
                <div className="font-display font-bold text-xs sm:text-sm text-[#EFE6D5] mt-1">
                  {stage.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* UNIFIED CLAPPERBOARD MULTI-TRACK TIMELINE
            - Top Animated Upper V-Stick carries Active Track Header & Website-Palette Chevrons
            - Lower Stationary Clapper Bar carries Selected Track Description & Deliverables directly inside
            - Complete Interactive 4-Track Frosted-Glass Timeline forms the Clapperboard Body */}
        <div className="relative pt-20 sm:pt-28 lg:pt-36">
          {/* CLAPPER V-HEAD ASSEMBLY */}
          <div className="relative w-full">
            {/* UPPER HINGED V-CLAPPER STICK (Website palette + Active Track Title embedded inside!) */}
            <motion.button
              key={`clapper-upper-${clapTick}`}
              type="button"
              onClick={triggerClap}
              title="Click to clap slate"
              aria-label="Animate clapperboard upper stick"
              initial={{ rotate: -5.2 }}
              animate={
                clapTick > 0
                  ? { rotate: [-5.2, -7, 0, -0.9, -5.2] }
                  : { rotate: -5.2 }
              }
              transition={
                clapTick > 0
                  ? { duration: 0.58, times: [0, 0.14, 0.34, 0.45, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeInOut'] }
                  : { duration: 0.3 }
              }
              style={{ transformOrigin: '28px 100%' }}
              className="absolute bottom-full left-0 w-full z-10 cursor-pointer text-left p-0 border border-[#EFE6D5]/30 bg-gradient-to-r from-[#141312]/95 via-[#171514]/88 to-[#141312]/95 backdrop-blur-[14px] shadow-[0_-12px_32px_rgba(0,0,0,0.55)] overflow-hidden"
            >
              <div className="relative flex items-center justify-between min-h-[48px] sm:min-h-[56px]">
                {/* Left Hinge Clearance + Angled Website-Palette Chevron Stripes (`\` slant) */}
                <div className="flex items-center shrink-0 pl-14 sm:pl-20 h-12 sm:h-14">
                  <svg
                    viewBox="0 0 210 56"
                    preserveAspectRatio="none"
                    className="w-24 sm:w-44 h-full block"
                  >
                    {LEFT_CHEVRONS.map((bar) => (
                      <polygon
                        key={`upper-l-${bar.x}`}
                        points={`${bar.x},0 ${bar.x + 36},0 ${bar.x + 62},56 ${bar.x + 26},56`}
                        fill={bar.color}
                      />
                    ))}
                  </svg>
                </div>

                {/* CONTENT INSIDE THE UPPER V-CLAPPER STICK */}
                <div className="flex-1 min-w-0 px-3 sm:px-5 py-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <span className="px-2 py-0.5 bg-[#EB4A1D] text-white text-[10px] sm:text-xs font-mono font-bold tracking-wider shrink-0">
                      {activeStage.trackCode}
                    </span>
                    <span className="font-display font-black text-xs sm:text-base lg:text-lg text-[#EFE6D5] uppercase tracking-tight truncate">
                      {activeStage.title}
                    </span>
                  </div>
                  <div className="hidden md:flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[#B9A992] shrink-0">
                    <span>{activeStage.trackName}</span>
                    <span className="text-[#EFE6D5]/25">|</span>
                    <span className="text-[#EFE6D5] tabular-nums">{formattedTC}</span>
                  </div>
                </div>

                {/* Right Angled Website-Palette Chevron Stripes (`\` slant) */}
                <div className="hidden sm:flex items-center shrink-0 h-12 sm:h-14">
                  <svg
                    viewBox="0 0 210 56"
                    preserveAspectRatio="none"
                    className="w-28 lg:w-44 h-full block"
                  >
                    {RIGHT_CHEVRONS.map((bar) => (
                      <polygon
                        key={`upper-r-${bar.x}`}
                        points={`${bar.x},0 ${bar.x + 36},0 ${bar.x + 62},56 ${bar.x + 26},56`}
                        fill={bar.color}
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </motion.button>

            {/* LOWER STATIONARY CLAPPER BAR (Welded to top of Timeline Board — holds Selected Track Description directly inside!) */}
            <div className="relative z-20 w-full border-x border-t border-[#EFE6D5]/32 bg-gradient-to-r from-[#EFE6D5]/[0.11] via-[#EFE6D5]/[0.06] to-[#1A1715]/[0.24] backdrop-blur-[14px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] overflow-hidden">
              {/* Sync Flash Pulse along the clap seam on impact */}
              <div
                className={`h-[2px] w-full transition-opacity duration-150 ${
                  syncFlash ? 'bg-[#EB4A1D] opacity-100' : 'bg-transparent opacity-0'
                }`}
              />

              <div className="flex items-stretch justify-between">
                {/* Left Matching Opposing Chevron Stripes (`/` slant) */}
                <div
                  onClick={triggerClap}
                  className="hidden sm:flex items-stretch shrink-0 pl-20 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 185 80"
                    preserveAspectRatio="none"
                    className="w-28 lg:w-40 h-full block"
                  >
                    {LEFT_CHEVRONS.map((bar) => (
                      <polygon
                        key={`lower-l-${bar.x}`}
                        points={`${bar.x + 26},0 ${bar.x + 62},0 ${bar.x + 36},80 ${bar.x},80`}
                        fill={bar.color}
                        fillOpacity="0.92"
                      />
                    ))}
                  </svg>
                </div>

                {/* SELECTED TRACK DESCRIPTION & DELIVERABLES INSIDE THE CLAPPER BAR */}
                <div className="flex-1 pl-16 sm:pl-5 pr-4 sm:pr-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-center">
                  <div className="lg:col-span-8">
                    <p className="text-xs sm:text-sm text-[#EFE6D5]/92 leading-relaxed">
                      {activeStage.summary}
                    </p>
                  </div>
                  <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-[#EFE6D5]/20 pt-2.5 lg:pt-0 lg:pl-5">
                    <div className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#EB4A1D]">
                      Stage Deliverables
                    </div>
                    <div className="text-[11px] sm:text-xs font-mono text-[#EFE6D5] mt-1 leading-snug">
                      {activeStage.deliverables}
                    </div>
                  </div>
                </div>

                {/* Right Matching Opposing Chevron Stripes (`/` slant) */}
                <div
                  onClick={triggerClap}
                  className="hidden md:flex items-stretch shrink-0 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 185 80"
                    preserveAspectRatio="none"
                    className="w-24 lg:w-40 h-full block"
                  >
                    {RIGHT_CHEVRONS.map((bar) => (
                      <polygon
                        key={`lower-r-${bar.x}`}
                        points={`${bar.x + 26},0 ${bar.x + 62},0 ${bar.x + 36},80 ${bar.x},80`}
                        fill={bar.color}
                        fillOpacity="0.92"
                      />
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            {/* 3-RIVET CHAMFERED MATTE HINGE BRACKET ON LEFT JOINT */}
            <button
              type="button"
              onClick={triggerClap}
              title="Click hinge to clap"
              aria-label="Clap hinge"
              className="absolute -top-7 sm:-top-8 left-0 w-14 h-[74px] sm:w-[76px] sm:h-[88px] z-30 cursor-pointer p-0 border-0 bg-transparent"
            >
              <svg viewBox="0 0 84 94" className="w-full h-full drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]">
                <path
                  d="M 4 8 Q 4 4 8 4 L 34 4 Q 40 4 44 8 L 78 52 Q 80 55 80 60 L 80 86 Q 80 90 76 90 L 8 90 Q 4 90 4 86 Z"
                  fill="#141312"
                  stroke="#EFE6D5"
                  strokeOpacity="0.32"
                  strokeWidth="2"
                />
                {/* 3 Machined Warm-Bone Rivets */}
                <circle cx="20" cy="21" r="6" fill="#D6C4A8" stroke="#0A0A0B" strokeWidth="1.5" />
                <circle cx="18.5" cy="19.5" r="2" fill="#FFFFFF" fillOpacity="0.6" />

                <circle cx="20" cy="72" r="6" fill="#D6C4A8" stroke="#0A0A0B" strokeWidth="1.5" />
                <circle cx="18.5" cy="70.5" r="2" fill="#FFFFFF" fillOpacity="0.6" />

                <circle cx="62" cy="72" r="6" fill="#EB4A1D" stroke="#0A0A0B" strokeWidth="1.5" />
                <circle cx="60.5" cy="70.5" r="2" fill="#FFFFFF" fillOpacity="0.6" />
              </svg>
            </button>
          </div>

          {/* CLAPPERBOARD BODY = COMPLETE INTERACTIVE MULTI-TRACK TIMELINE SURFACE (SHARP-BORDERED FROSTED GLASS) */}
          <div className="border border-[#EFE6D5]/30 bg-gradient-to-br from-[#EFE6D5]/[0.1] via-[#EFE6D5]/[0.045] to-[#141210]/[0.18] backdrop-blur-[14px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Click-to-scrub Timecode Ruler */}
            <div className="flex border-b border-[#EFE6D5]/22 bg-[#EFE6D5]/[0.06]">
              <div className="w-28 sm:w-40 shrink-0 px-3 py-2.5 border-r border-[#EFE6D5]/22 text-[10px] font-mono text-[#B9A992] uppercase">
                Track Lane
              </div>
              <div
                ref={rulerRef}
                onClick={handleRulerScrub}
                className="relative flex-1 h-9 cursor-ew-resize select-none"
                title="Click to move playhead"
              >
                <div className="absolute inset-0 flex justify-between items-end px-2 pb-1 text-[9px] font-mono text-[#B9A992] tabular-nums">
                  {['00:00', '00:10', '00:20', '00:30', '00:40', '00:50', '01:00'].map((mark) => (
                    <span key={mark}>{mark}</span>
                  ))}
                </div>
                {/* Playhead Cap */}
                <div
                  className="absolute top-0 bottom-0 z-30 pointer-events-none"
                  style={{ left: `${playheadPct}%` }}
                >
                  <div
                    className="-translate-x-1/2 w-3 h-3 bg-[#EB4A1D]"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                  />
                </div>
              </div>
            </div>

            {/* Tracks Stack with Live Vertical Playhead Line */}
            <div className="relative">
              {/* Full-height Vermilion Playhead Line */}
              <div className="pointer-events-none absolute top-0 bottom-0 left-28 sm:left-40 right-0 z-20">
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] bg-[#EB4A1D]"
                  style={{ left: `${playheadPct}%` }}
                />
              </div>

              {/* TRACK V3: MOTION & TITLES */}
              <div
                onClick={() => handleSelectStage(STAGES[1])}
                className={`flex items-center border-b border-[#EFE6D5]/16 cursor-pointer transition-colors ${
                  activeStageId === 'motion' ? 'bg-[#EB4A1D]/[0.14]' : 'hover:bg-[#EFE6D5]/[0.05]'
                }`}
              >
                <div className="w-28 sm:w-40 shrink-0 px-3 py-4 border-r border-[#EFE6D5]/18">
                  <div className="text-[11px] font-mono font-bold text-[#EFE6D5]">V3 · MOTION</div>
                  <div className="text-[10px] font-mono text-[#B9A992]">Keyframes</div>
                </div>
                <div className="relative flex-1 h-14 overflow-hidden">
                  <div
                    className={`absolute top-2.5 bottom-2.5 left-[24%] w-[28%] border backdrop-blur-[4px] flex items-center justify-between px-3 ${
                      activeStageId === 'motion'
                        ? 'bg-[#EB4A1D]/28 border-[#EB4A1D] text-[#EFE6D5]'
                        : 'bg-[#1A1918]/45 border-[#EFE6D5]/26 text-[#B9A992]'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rotate-45 bg-[#EB4A1D] shrink-0" />
                    <span className="text-[10px] font-mono truncate px-2">Kinetic Title + Mask Wipe</span>
                    <span className="w-2.5 h-2.5 rotate-45 bg-[#EFE6D5] shrink-0" />
                  </div>
                  <div
                    className={`absolute top-2.5 bottom-2.5 left-[60%] w-[20%] border backdrop-blur-[4px] flex items-center justify-between px-2.5 ${
                      activeStageId === 'motion'
                        ? 'bg-[#EB4A1D]/28 border-[#EB4A1D] text-[#EFE6D5]'
                        : 'bg-[#1A1918]/45 border-[#EFE6D5]/26 text-[#B9A992]'
                    }`}
                  >
                    <span className="w-2 h-2 rotate-45 bg-[#EB4A1D] shrink-0" />
                    <span className="text-[10px] font-mono truncate px-1">Speed Ramp</span>
                    <span className="w-2 h-2 rotate-45 bg-[#EFE6D5] shrink-0" />
                  </div>
                </div>
              </div>

              {/* TRACK V2: COLOUR PIPELINE */}
              <div
                onClick={() => handleSelectStage(STAGES[2])}
                className={`flex items-center border-b border-[#EFE6D5]/16 cursor-pointer transition-colors ${
                  activeStageId === 'colour' ? 'bg-[#EB4A1D]/[0.14]' : 'hover:bg-[#EFE6D5]/[0.05]'
                }`}
              >
                <div className="w-28 sm:w-40 shrink-0 px-3 py-4 border-r border-[#EFE6D5]/18">
                  <div className="text-[11px] font-mono font-bold text-[#EFE6D5]">V2 · COLOUR</div>
                  <div className="text-[10px] font-mono text-[#B9A992]">LUT / Nodes</div>
                </div>
                <div className="relative flex-1 h-14 overflow-hidden">
                  <div
                    className={`absolute top-2.5 bottom-2.5 left-[8%] w-[86%] border backdrop-blur-[4px] flex items-center justify-between px-3 ${
                      activeStageId === 'colour'
                        ? 'border-[#EB4A1D] bg-gradient-to-r from-[#2B2622]/55 via-[#4A261B]/60 to-[#23201E]/55'
                        : 'border-[#EFE6D5]/24 bg-[#171615]/42'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-[#EFE6D5] truncate">
                      Adjustment Layer · LOG → REC709 → Film Grain
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <span className="w-3.5 h-3.5 bg-[#0A0A0B] border border-[#EFE6D5]/30" />
                      <span className="w-3.5 h-3.5 bg-[#6E5C4B]" />
                      <span className="w-3.5 h-3.5 bg-[#C8A87A]" />
                      <span className="w-3.5 h-3.5 bg-[#EB4A1D]" />
                      <span className="w-3.5 h-3.5 bg-[#EFE6D5]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACK V1: PICTURE CUT */}
              <div
                onClick={() => handleSelectStage(STAGES[0])}
                className={`flex items-center border-b border-[#EFE6D5]/16 cursor-pointer transition-colors ${
                  activeStageId === 'picture' ? 'bg-[#EB4A1D]/[0.14]' : 'hover:bg-[#EFE6D5]/[0.05]'
                }`}
              >
                <div className="w-28 sm:w-40 shrink-0 px-3 py-4 border-r border-[#EFE6D5]/18">
                  <div className="text-[11px] font-mono font-bold text-[#EFE6D5]">V1 · PICTURE</div>
                  <div className="text-[10px] font-mono text-[#B9A992]">Main Spine</div>
                </div>
                <div className="relative flex-1 h-14 overflow-hidden">
                  {[
                    { left: '2%', width: '18%', label: 'A01 · 2s Hook' },
                    { left: '21%', width: '24%', label: 'A02 · Match Cut' },
                    { left: '46%', width: '26%', label: 'A03 · Hero Sequence' },
                    { left: '73%', width: '23%', label: 'A04 · Tag / Endframe' }
                  ].map((clip) => (
                    <div
                      key={clip.label}
                      style={{ left: clip.left, width: clip.width }}
                      className={`absolute top-2.5 bottom-2.5 border backdrop-blur-[4px] px-2.5 flex items-center ${
                        activeStageId === 'picture'
                          ? 'bg-[#EFE6D5]/90 text-[#0A0A0B] border-[#EB4A1D] font-semibold'
                          : 'bg-[#201E1C]/48 text-[#EFE6D5] border-[#EFE6D5]/26'
                      }`}
                    >
                      <span className="text-[10px] font-mono truncate">{clip.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TRACK A1: SOUND MIX */}
              <div
                onClick={() => handleSelectStage(STAGES[3])}
                className={`flex items-center cursor-pointer transition-colors ${
                  activeStageId === 'sound' ? 'bg-[#EB4A1D]/[0.14]' : 'hover:bg-[#EFE6D5]/[0.05]'
                }`}
              >
                <div className="w-28 sm:w-40 shrink-0 px-3 py-4 border-r border-[#EFE6D5]/18">
                  <div className="text-[11px] font-mono font-bold text-[#EFE6D5]">A1 · SOUND</div>
                  <div className="text-[10px] font-mono text-[#B9A992]">SFX + Master</div>
                </div>
                <div className="relative flex-1 h-14 px-2 py-2 overflow-hidden">
                  <svg viewBox="0 0 800 44" preserveAspectRatio="none" className="w-full h-full">
                    <line x1="0" y1="22" x2="800" y2="22" stroke="#EFE6D5" strokeOpacity="0.2" strokeWidth="1" />
                    {Array.from({ length: 80 }, (_, i) => {
                      const wave =
                        8 +
                        Math.abs(Math.sin(i * 0.42)) * 18 +
                        (i % 11 === 0 ? 14 : 0) +
                        (i % 7 === 0 ? 6 : 0);
                      const h = Math.min(40, wave);
                      const isPeak = h > 30;
                      return (
                        <rect
                          key={i}
                          x={i * 10 + 2}
                          y={22 - h / 2}
                          width="4"
                          height={h}
                          fill={activeStageId === 'sound' && isPeak ? '#EB4A1D' : '#EFE6D5'}
                          fillOpacity={activeStageId === 'sound' ? (isPeak ? 0.95 : 0.72) : 0.4}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            {/* Compact Ruled Clapperboard Footer Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-t border-[#EFE6D5]/20 bg-[#EFE6D5]/[0.05] text-[10px] font-mono uppercase tracking-[0.18em] text-[#B9A992]">
              <span>SLATE · AYUSH EDIT ARCHITECTURE</span>
              <span>24 FPS · REC709 · CLICK CLAPPER OR ANY TRACK</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
