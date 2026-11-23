import React, { useState, useMemo } from 'react';
import { PortfolioMode } from '../../types';
import { Mail, Copy, ArrowUpRight, Pause, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ContactProjectorSectionProps {
  onSelectMode: (mode: PortfolioMode) => void;
  onCopyEmail: () => void;
}

interface BriefPreset {
  id: string;
  label: string;
  projectedTitle: string;
  kicker: string;
  deliverables: string;
  turnaround: string;
  mailSubject: string;
  mailBody: string;
}

const BRIEF_PRESETS: BriefPreset[] = [
  {
    id: 'general',
    label: 'All Briefs',
    projectedTitle: "LET'S CUT IT.",
    kicker: 'Have a project in mind?',
    deliverables: 'Commercial cuts · Social reels · Motion & color',
    turnaround: '24h response',
    mailSubject: 'Project Inquiry — Video Editing & Motion',
    mailBody:
      'Hi Ayush,\n\nI have a project in mind and would love to discuss editing, timeline, and raw footage delivery.\n\nProject link / notes:\n'
  },
  {
    id: 'commercial',
    label: 'Commercial',
    projectedTitle: 'COMMERCIAL CUT',
    kicker: 'Brand campaigns & hero spots',
    deliverables: '16:9 & 9:16 masters · Rhythm cut · Sound mix',
    turnaround: '3–5 days',
    mailSubject: 'Commercial Edit Brief — Brand Campaign',
    mailBody:
      'Hi Ayush,\n\nLooking to book a commercial edit for an upcoming campaign.\n\nTarget length & deliverables:\nFootage link:\nDeadline:\n'
  },
  {
    id: 'reels',
    label: 'Reels 9:16',
    projectedTitle: 'REELS 9:16',
    kicker: 'High-retention vertical edits',
    deliverables: 'Frame-accurate hooks · Kinetic captions · SFX',
    turnaround: '48–72h',
    mailSubject: 'Vertical Reels / Short-Form Editing Inquiry',
    mailBody:
      'Hi Ayush,\n\nInterested in high-retention 9:16 reels editing.\n\nVolume / cadence:\nReference style:\nRaw footage link:\n'
  },
  {
    id: 'motion',
    label: 'Motion & VFX',
    projectedTitle: 'MOTION & VFX',
    kicker: 'Title design & kinetic compositing',
    deliverables: 'Logo animation · Speed ramps · Clean masking',
    turnaround: '3–4 days',
    mailSubject: 'Motion Graphics & VFX Compositing Brief',
    mailBody:
      'Hi Ayush,\n\nLooking for kinetic motion graphics, transitions, or logo animation.\n\nBrand assets / brief:\nTarget delivery date:\n'
  },
  {
    id: 'color',
    label: 'Color Grade',
    projectedTitle: 'COLOR GRADE',
    kicker: 'Custom film-emulation grading',
    deliverables: 'LOG to Rec.709 · Skin balance · Halation & grain',
    turnaround: '2–3 days',
    mailSubject: 'Color Grading Inquiry',
    mailBody:
      'Hi Ayush,\n\nLooking for color grading and look development on a cut.\n\nCamera / codec:\nRuntime:\nFootage link:\n'
  }
];

interface FilmReelProps {
  cx: number;
  cy: number;
  r: number;
  maskId: string;
  spinClass: string;
  paused: boolean;
  onClick: () => void;
  ariaLabel: string;
}

const FilmReel: React.FC<FilmReelProps> = ({
  cx,
  cy,
  r,
  maskId,
  spinClass,
  paused,
  onClick,
  ariaLabel
}) => {
  const outerHoles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const deg = i * 60 - 30;
      const rad = (deg * Math.PI) / 180;
      return {
        x: Math.cos(rad) * r * 0.61,
        y: Math.sin(rad) * r * 0.61,
        hr: r * 0.23
      };
    });
  }, [r]);

  const innerPins = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const deg = i * 60;
      const rad = (deg * Math.PI) / 180;
      return {
        x: Math.cos(rad) * r * 0.22,
        y: Math.sin(rad) * r * 0.22,
        pr: r * 0.052
      };
    });
  }, [r]);

  return (
    <g
      transform={`translate(${cx}, ${cy})`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer outline-none focus-visible:opacity-90"
    >
      <defs>
        <mask id={maskId}>
          <circle cx={0} cy={0} r={r} fill="white" />
          {outerHoles.map((hole, idx) => (
            <circle key={`o-${idx}`} cx={hole.x} cy={hole.y} r={hole.hr} fill="black" />
          ))}
          {innerPins.map((pin, idx) => (
            <circle key={`i-${idx}`} cx={pin.x} cy={pin.y} r={pin.pr} fill="black" />
          ))}
          <circle cx={0} cy={0} r={r * 0.088} fill="black" />
        </mask>
      </defs>

      {/* Dark coiled 35mm film pack inside the vermilion reel */}
      <circle cx={0} cy={0} r={r * 0.78} fill="#0A0A0B" />

      {/* Rotating Signal Vermilion perforated cinema reel flange */}
      <g className={`${spinClass} ${paused ? 'anim-paused' : ''}`}>
        <circle cx={0} cy={0} r={r} fill="#EB4A1D" mask={`url(#${maskId})`} />
        <circle
          cx={0}
          cy={0}
          r={r - 0.75}
          fill="none"
          stroke="#EFE6D5"
          strokeOpacity={0.22}
          strokeWidth={1.2}
        />
      </g>

      {/* Center spindle pin */}
      <circle cx={0} cy={0} r={r * 0.045} fill="#EFE6D5" />
    </g>
  );
};

const SprocketTrack: React.FC<{ running: boolean; boosted: boolean }> = ({
  running,
  boosted
}) => {
  const animClass = boosted ? 'animate-sprocket-feed-fast' : 'animate-sprocket-feed';
  return (
    <div className="w-full h-[12px] sm:h-[15px] lg:h-[18px] overflow-hidden relative flex items-center select-none pointer-events-none">
      {/* Uniform 24px horizontal pitch (10px hole + 14px gap) loops seamlessly at every breakpoint */}
      <div
        className={`flex items-center gap-[14px] w-max ${animClass} ${
          running ? '' : 'anim-paused'
        }`}
      >
        {Array.from({ length: 90 }).map((_, idx) => (
          <span
            key={idx}
            className="block w-[10px] h-[7px] sm:h-[8px] lg:h-[10px] bg-[#EFE6D5]/85 shrink-0"
          />
        ))}
      </div>
    </div>
  );
};

export const ContactProjectorSection: React.FC<ContactProjectorSectionProps> = ({
  onSelectMode,
  onCopyEmail
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isBoosted, setIsBoosted] = useState(false);

  const activePreset = BRIEF_PRESETS[selectedIndex];

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(activePreset.mailSubject);
    const body = encodeURIComponent(activePreset.mailBody);
    return `mailto:ak4895931@gmail.com?subject=${subject}&body=${body}`;
  }, [activePreset]);

  const handleCyclePreset = () => {
    setSelectedIndex((prev) => (prev + 1) % BRIEF_PRESETS.length);
  };

  const handleToggleTransport = () => {
    setIsRunning((prev) => !prev);
  };

  return (
    <section
      id="section-contact"
      aria-label="Contact and Booking"
      className="relative z-10 w-full py-12 sm:py-16 lg:py-20"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Sharp-bordered translucent frosted glass cinema stage letting moving background film strips shine through */}
        <div className="relative overflow-hidden border border-[#EFE6D5]/28 bg-gradient-to-br from-[#EFE6D5]/[0.11] via-[#EFE6D5]/[0.05] to-[#1A1715]/[0.20] backdrop-blur-[14px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_60px_rgba(0,0,0,0.48)] pt-6 sm:pt-8 lg:pt-9">
          {/* Subtle optical projector beam light falloff across the frosted glass */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_48%_at_58%_34%,rgba(235,74,29,0.11),transparent_72%)]"
          />

          {/* TOP HORIZONTAL BAND: BAUHAUS CINEMA PROJECTOR + KICKER + 35MM FILM STRIP BEAM */}
          <div className="relative z-10 w-full flex items-start">
            {/* LEFT: WARM BONE DUAL-REEL PROJECTOR HEAD + BEVELED LENS */}
            {/* Exact scale factors of viewBox 380x270: mobile 0.45x (171x122) | sm 0.60x (228x162) | lg 0.80x (304x216) */}
            <div className="shrink-0 pl-2 sm:pl-5 lg:pl-8">
              <svg
                viewBox="0 0 380 270"
                className="block w-[171px] h-[122px] sm:w-[228px] sm:h-[162px] lg:w-[304px] lg:h-[216px] overflow-visible"
                aria-label="Interactive 35mm cinema projector"
              >
                {/* Warm Bone Camera / Projector Body flush to bottom edge y=270 */}
                <rect x={74} y={138} width={190} height={132} fill="#EFE6D5" />

                {/* Subtle recessed mechanical panel line on camera body */}
                <rect
                  x={86}
                  y={150}
                  width={166}
                  height={108}
                  fill="none"
                  stroke="#111010"
                  strokeOpacity={0.14}
                  strokeWidth={1.5}
                />

                {/* Straight Lens Barrel + 45-deg Beveled Gate Flare terminating flush at x=380 (y=145..255, h=110) */}
                <path
                  d="M 264 170 L 322 170 L 350 145 L 380 145 L 380 255 L 350 255 L 322 234 L 264 234 Z"
                  fill="#EFE6D5"
                />

                {/* Dark optical lens aperture slit leading directly into the 35mm film strip */}
                <path
                  d="M 353 151 L 380 151 L 380 249 L 353 249 L 336 232 L 336 172 Z"
                  fill="#0B0A0A"
                  fillOpacity={0.82}
                />

                {/* Rear Smaller Signal Vermilion Film Reel */}
                <FilmReel
                  cx={70}
                  cy={124}
                  r={52}
                  maskId="contact-reel-rear"
                  spinClass={isBoosted ? 'animate-reel-rear-fast' : 'animate-reel-rear'}
                  paused={!isRunning}
                  onClick={handleToggleTransport}
                  ariaLabel={isRunning ? 'Pause rear film reel' : 'Resume rear film reel'}
                />

                {/* Front Larger Signal Vermilion Film Reel */}
                <FilmReel
                  cx={192}
                  cy={90}
                  r={76}
                  maskId="contact-reel-front"
                  spinClass={isBoosted ? 'animate-reel-front-fast' : 'animate-reel-front'}
                  paused={!isRunning}
                  onClick={handleToggleTransport}
                  ariaLabel={isRunning ? 'Pause front film reel' : 'Resume front film reel'}
                />
              </svg>
            </div>

            {/* RIGHT: KICKER ROW ABOVE + SEAMLESS 35MM PERFORATED FILM STRIP BEAM */}
            <div className="flex-1 min-w-0 -ml-px flex flex-col">
              {/* Upper-Right Header Bar occupying exact lens top offset: y=145 * (0.45 / 0.60 / 0.80) = 65px / 87px / 116px */}
              <div className="h-[65px] sm:h-[87px] lg:h-[116px] px-3 sm:px-6 lg:px-8 pb-2.5 sm:pb-3 flex items-end justify-between gap-3">
                <span className="text-[11px] sm:text-xs font-mono tracking-widest uppercase text-[#EB4A1D] font-semibold truncate">
                  05 · Contact &amp; Booking
                </span>

                <button
                  type="button"
                  onClick={handleToggleTransport}
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#B9A992] hover:text-[#EFE6D5] transition-colors cursor-pointer py-1 whitespace-nowrap shrink-0"
                  aria-label={isRunning ? 'Pause projector reels' : 'Play projector reels'}
                >
                  {isRunning ? <Pause size={12} /> : <Play size={12} />}
                  <span className="hidden sm:inline">{isRunning ? 'Pause Reel' : 'Run Reel'}</span>
                </button>
              </div>

              {/* 35mm Film Strip matching exact lens gate height: h=110 * (0.45 / 0.60 / 0.80) = 50px / 66px / 88px */}
              <button
                type="button"
                onClick={handleCyclePreset}
                onMouseEnter={() => setIsBoosted(true)}
                onMouseLeave={() => setIsBoosted(false)}
                title="Click to cycle project brief on film strip"
                className="group w-full h-[50px] sm:h-[66px] lg:h-[88px] bg-[#0A0A0B]/88 border-y border-[#EFE6D5]/32 flex flex-col justify-between py-[2px] sm:py-[4px] lg:py-[5px] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#EB4A1D] focus-visible:outline-offset-2"
              >
                {/* Top 35mm Sprocket Perforations */}
                <SprocketTrack running={isRunning} boosted={isBoosted} />

                {/* Projected Signal Vermilion Display Headline */}
                <div className="w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4 overflow-hidden">
                  <div className="min-w-0 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activePreset.id}
                        initial={{ opacity: 0, x: -22 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 22 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display font-black uppercase text-[#EB4A1D] tracking-[0.04em] leading-none text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-[44px] whitespace-nowrap truncate"
                      >
                        {activePreset.projectedTitle}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Frame index counter inside film gate */}
                  <span className="hidden md:inline-block font-mono tabular-nums text-[11px] text-[#EFE6D5]/55 group-hover:text-[#EFE6D5] transition-colors shrink-0 tracking-widest">
                    0{selectedIndex + 1} / 0{BRIEF_PRESETS.length}
                  </span>
                </div>

                {/* Bottom 35mm Sprocket Perforations */}
                <SprocketTrack running={isRunning} boosted={isBoosted} />
              </button>
            </div>
          </div>

          {/* LOWER POSTER STAGE: COMPACT INVERTED-V TRIPOD LEGS (LEFT) + TIGHT EDITORIAL CONTACT BLOCK (RIGHT) */}
          <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-stretch">
            {/* LEFT: WARM BONE INVERTED-V GEOMETRIC TRIPOD ALIGNED 1:1 TO PROJECTOR SVG (w=304px + pl-8 = 336px) */}
            <div className="hidden lg:block w-[336px] pl-8 shrink-0 overflow-hidden">
              <svg
                viewBox="0 0 380 540"
                preserveAspectRatio="xMinYMin slice"
                className="block w-[304px] h-full min-h-[235px]"
                aria-hidden="true"
              >
                {/* Semicircular Tripod Mount Head centered directly under camera body (cx=169) */}
                <path d="M 143 0 A 26 26 0 0 0 195 0 Z" fill="#EFE6D5" />

                {/* Left Tapered Geometric Tripod Leg extending flush to bottom glass border */}
                <polygon points="151,14 166,14 68,540 54,540" fill="#EFE6D5" />

                {/* Right Tapered Geometric Tripod Leg extending flush to bottom glass border */}
                <polygon points="172,14 187,14 284,540 270,540" fill="#EFE6D5" />
              </svg>
            </div>

            {/* RIGHT: COMPACT SWISS EDITORIAL CONTACT & BOOKING BLOCK ON FROSTED GLASS */}
            <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 pt-5 pb-8 sm:pt-6 sm:pb-9 lg:pt-5 lg:pb-9 flex items-end">
              <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-end">
                {/* Editorial Heading + Brief Scope Selector */}
                <div className="xl:col-span-7">
                  <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-[34px] text-[#EFE6D5] tracking-tight leading-[1.06] text-balance">
                    {activePreset.kicker}
                  </h2>
                  <p className="text-sm text-[#B9A992] mt-2 leading-relaxed max-w-xl">
                    Available for commercial campaigns, high-retention social reels, kinetic motion edits, and custom color grading. Select a format or send your raw footage link directly.
                  </p>

                  {/* Interactive Project Scope Selector (Sharp Architectural Buttons — Zero Pills) */}
                  <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Project inquiry type">
                    {BRIEF_PRESETS.map((preset, idx) => {
                      const isActive = idx === selectedIndex;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setSelectedIndex(idx)}
                          onMouseEnter={() => setIsBoosted(true)}
                          onMouseLeave={() => setIsBoosted(false)}
                          className={`px-3 py-2 text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                            isActive
                              ? 'bg-[#EFE6D5] text-[#111010] border-[#EFE6D5] font-semibold'
                              : 'bg-[#0A0A0B]/35 text-[#EFE6D5]/85 border-[#EFE6D5]/22 hover:border-[#EFE6D5]/60 hover:bg-[#EFE6D5]/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Clean Unboxed Scope Metadata Row */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-[#B9A992]">
                    <span className="text-[#EB4A1D] font-semibold tabular-nums">
                      {activePreset.turnaround}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activePreset.deliverables}</span>
                  </div>
                </div>

                {/* Direct Booking CTAs */}
                <div className="xl:col-span-5 space-y-2.5">
                  <a
                    href={mailtoHref}
                    onMouseEnter={() => setIsBoosted(true)}
                    onMouseLeave={() => setIsBoosted(false)}
                    className="w-full px-5 py-3.5 bg-[#EB4A1D] hover:bg-[#ff5a2b] text-white font-semibold text-sm flex items-center justify-between gap-3 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Mail size={15} className="shrink-0" />
                      <span className="font-mono text-xs sm:text-sm truncate">
                        ak4895931@gmail.com
                      </span>
                    </span>
                    <ArrowUpRight size={15} className="shrink-0" />
                  </a>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={onCopyEmail}
                      className="px-2.5 py-2.5 bg-[#0A0A0B]/40 hover:bg-[#EFE6D5] text-[#EFE6D5] hover:text-[#111010] border border-[#EFE6D5]/25 hover:border-[#EFE6D5] text-[11px] sm:text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Copy size={12} className="shrink-0" />
                      <span>Copy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectMode('CLIENT')}
                      className="px-2.5 py-2.5 bg-[#0A0A0B]/40 hover:bg-[#EFE6D5] text-[#EFE6D5] hover:text-[#111010] border border-[#EFE6D5]/25 hover:border-[#EFE6D5] text-[11px] sm:text-xs font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Showcase</span>
                      <ArrowUpRight size={12} className="shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectMode('EDITOR')}
                      className="px-2.5 py-2.5 bg-[#0A0A0B]/40 hover:bg-[#EFE6D5] text-[#EFE6D5] hover:text-[#111010] border border-[#EFE6D5]/25 hover:border-[#EFE6D5] text-[11px] sm:text-xs font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Workstation</span>
                      <ArrowUpRight size={12} className="shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
