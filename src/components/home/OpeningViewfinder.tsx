import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, PortfolioMode } from '../../types';
import { getDriveOrMailAction } from '../../constants';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Video,
  Sliders,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SectionTarget {
  id: string;
  num: string;
  label: string;
  fStop: string;
}

const SECTIONS: SectionTarget[] = [
  { id: 'section-viewfinder', num: '01', label: 'Viewfinder', fStop: 'f/1.4' },
  { id: 'section-iris', num: '02', label: 'Projects', fStop: 'f/2.8' },
  { id: 'section-capabilities', num: '03', label: 'Craft', fStop: 'f/5.6' },
  { id: 'section-timeline', num: '04', label: 'Timeline', fStop: 'f/8.0' },
  { id: 'section-contact', num: '05', label: 'Contact', fStop: 'f/16' }
];

interface ViewfinderSlide {
  id: string;
  index: string;
  focal: string;
  label: string;
  kicker: string;
}

const VIEWFINDER_SLIDES: ViewfinderSlide[] = [
  { id: 'spotlight', index: '01', focal: '24mm', label: 'Spotlight', kicker: 'Featured Cut' },
  { id: 'profile', index: '02', focal: '35mm', label: 'Profile', kicker: 'About Ayush' },
  { id: 'philosophy', index: '03', focal: '50mm', label: 'Philosophy', kicker: 'Editorial Ethos' },
  { id: 'direction', index: '04', focal: '85mm', label: 'Direction', kicker: '2026 Focus' }
];

interface OpeningViewfinderProps {
  hero: Project;
  onSelectMode: (mode: PortfolioMode) => void;
  onCopyEmail: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const OpeningViewfinder: React.FC<OpeningViewfinderProps> = ({
  hero,
  onSelectMode,
  onCopyEmail,
  onNavigateSection
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [shutterKey, setShutterKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const leftArcRef = useRef<SVGSVGElement>(null);
  const rightArcRef = useRef<SVGSVGElement>(null);

  // Track window scroll to move indicator along the left aperture arc ring
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.max(0, Math.min(1, window.scrollY / docHeight)) : 0;
      setScrollProgress(ratio);

      // Determine active section
      const offsets = SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return Number.POSITIVE_INFINITY;
        return Math.abs(el.getBoundingClientRect().top - window.innerHeight * 0.25);
      });
      const closest = offsets.indexOf(Math.min(...offsets));
      if (closest >= 0) setActiveSectionIdx(closest);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchSlide = useCallback((nextIdx: number) => {
    const normalized = (nextIdx + VIEWFINDER_SLIDES.length) % VIEWFINDER_SLIDES.length;
    setActiveSlide(normalized);
    setShutterKey((k) => k + 1);
  }, []);

  // Keyboard arrow navigation when hero is in view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (window.scrollY > window.innerHeight * 0.7) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight') switchSlide(activeSlide + 1);
      if (e.key === 'ArrowLeft') switchSlide(activeSlide - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSlide, switchSlide]);

  // Dragging Left Arc Ring directly scrolls the page
  const scrubPageFromPointer = useCallback((clientY: number) => {
    if (!leftArcRef.current) return;
    const rect = leftArcRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: ratio * maxScroll, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (!isDraggingLeft) return;
    const onMove = (e: PointerEvent) => scrubPageFromPointer(e.clientY);
    const onUp = () => setIsDraggingLeft(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingLeft, scrubPageFromPointer]);

  // Dragging Right Arc Ring switches Viewfinder frames (24mm -> 85mm)
  const scrubSlideFromPointer = useCallback(
    (clientY: number) => {
      if (!rightArcRef.current) return;
      const rect = rightArcRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(0.999, (clientY - rect.top) / rect.height));
      const idx = Math.floor(ratio * VIEWFINDER_SLIDES.length);
      if (idx !== activeSlide) {
        switchSlide(idx);
      }
    },
    [activeSlide, switchSlide]
  );

  useEffect(() => {
    if (!isDraggingRight) return;
    const onMove = (e: PointerEvent) => scrubSlideFromPointer(e.clientY);
    const onUp = () => setIsDraggingRight(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingRight, scrubSlideFromPointer]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Polar helper for Left Arc (center at x=-180, y=260, radius=245, spanning -52deg to +52deg)
  const polarLeft = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: -168 + r * Math.cos(rad),
      y: 260 + r * Math.sin(rad)
    };
  };

  // Polar helper for Right Arc (center at x=308, y=260, radius=245, spanning 128deg to 232deg)
  const polarRight = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: 308 + r * Math.cos(rad),
      y: 260 + r * Math.sin(rad)
    };
  };

  const leftTickAngles = Array.from({ length: 41 }, (_, i) => -50 + i * 2.5);
  const leftPointerAngle = -46 + scrollProgress * 92;

  const rightTickAngles = Array.from({ length: 37 }, (_, i) => 130 + i * 2.77);
  const rightSlideFraction = activeSlide / (VIEWFINDER_SLIDES.length - 1);
  const rightPointerAngle = 224 - rightSlideFraction * 88;
  const rightRingRotation = (activeSlide - 1.5) * 4;

  const currentSlide = VIEWFINDER_SLIDES[activeSlide];
  const heroDriveAction = getDriveOrMailAction(hero);

  return (
    <section
      id="section-viewfinder"
      className="relative w-full min-h-[100svh] flex flex-col justify-between overflow-hidden border-b border-[#EFE6D5]/10 bg-[#0A0A0B]"
    >
      {/* Subtle Architectural Grid Hairlines behind Opening Section */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #EFE6D5 1px, transparent 1px), linear-gradient(to bottom, #EFE6D5 1px, transparent 1px)',
          backgroundSize: '96px 96px'
        }}
      />

      {/* INTEGRATED TOP HEADER BAR (3-Zone Contract: Brand — Concise Nav — Primary CTA) */}
      <header className="relative z-30 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-6 border-b border-[#EFE6D5]/10">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigateSection('section-viewfinder')}
          className="flex items-center gap-2.5 text-[#EFE6D5] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <svg viewBox="0 0 28 28" className="w-6 h-6 shrink-0" aria-hidden="true">
            <circle cx="14" cy="14" r="12.5" fill="none" stroke="#EFE6D5" strokeWidth="1.2" />
            <polygon points="14,5 21,11 18,21 10,21 7,11" fill="none" stroke="#EB4A1D" strokeWidth="1.4" />
            <circle cx="14" cy="14" r="3.2" fill="#EB4A1D" />
          </svg>
          <span className="font-display font-black text-base sm:text-lg tracking-tight uppercase">
            Ayush
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Section Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide text-[#B9A992]">
          {SECTIONS.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => onNavigateSection(sec.id)}
              className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeSectionIdx === idx ? 'text-[#EFE6D5]' : 'hover:text-[#EFE6D5]'
              }`}
            >
              <span>{sec.label}</span>
              <span
                className={`absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#EB4A1D] transition-transform duration-200 origin-left ${
                  activeSectionIdx === idx ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </button>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectMode('EDITOR')}
            className="px-3.5 sm:px-4 py-2 bg-[#EFE6D5] hover:bg-[#EB4A1D] text-[#0A0A0B] hover:text-white text-xs font-semibold tracking-tight transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Editor Workstation
          </button>
        </div>
      </header>

      {/* MAIN OPENING COMPOSITION: Left Aperture Arc + Central Abstract Viewfinder + Right Zoom Arc */}
      <div className="relative z-20 flex-1 w-full max-w-[1720px] mx-auto flex flex-col justify-center px-3 sm:px-6 lg:px-10 py-3 sm:py-4">
        {/* Mobile Compact Optical Arc Strip (< lg) */}
        <div className="flex lg:hidden items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#EFE6D5]/10">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {SECTIONS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => onNavigateSection(s.id)}
                className={`px-2 py-1 text-[10px] font-mono tabular-nums whitespace-nowrap transition-colors cursor-pointer ${
                  activeSectionIdx === idx
                    ? 'bg-[#EB4A1D] text-white font-semibold'
                    : 'text-[#B9A992] hover:text-[#EFE6D5]'
                }`}
              >
                {s.num} {s.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-[#EB4A1D] tabular-nums shrink-0">
            {currentSlide.focal}
          </span>
        </div>

        <div className="relative flex items-center justify-center w-full gap-2 xl:gap-4">
          {/* LEFT QUADRANT ARC RING — Section Scroll / Aperture Measurement Ring (Opening Section Only) */}
          <aside
            aria-label="Section scroll aperture ring"
            className="hidden lg:flex flex-col items-start justify-center w-[124px] xl:w-[144px] shrink-0 select-none"
          >
            <div className="text-[10px] font-mono text-[#B9A992] tracking-widest uppercase mb-1 pl-1">
              Aperture · Scroll
            </div>
            <svg
              ref={leftArcRef}
              viewBox="0 0 140 520"
              className="w-[124px] xl:w-[140px] h-[440px] xl:h-[500px] overflow-visible cursor-ns-resize touch-none"
              onPointerDown={(e) => {
                setIsDraggingLeft(true);
                scrubPageFromPointer(e.clientY);
              }}
            >
              {/* Outer structural barrel arc */}
              <path
                d={`M ${polarLeft(-52, 266).x} ${polarLeft(-52, 266).y} A 266 266 0 0 1 ${polarLeft(52, 266).x} ${polarLeft(52, 266).y}`}
                fill="none"
                stroke="#EFE6D5"
                strokeOpacity="0.22"
                strokeWidth="1"
              />
              {/* Inner vernier track arc */}
              <path
                d={`M ${polarLeft(-50, 232).x} ${polarLeft(-50, 232).y} A 232 232 0 0 1 ${polarLeft(50, 232).x} ${polarLeft(50, 232).y}`}
                fill="none"
                stroke="#EFE6D5"
                strokeOpacity="0.14"
                strokeWidth="1"
              />
              {/* Active swept arc up to scroll indicator */}
              <path
                d={`M ${polarLeft(-48, 248).x} ${polarLeft(-48, 248).y} A 248 248 0 0 1 ${polarLeft(leftPointerAngle, 248).x} ${polarLeft(leftPointerAngle, 248).y}`}
                fill="none"
                stroke="#EB4A1D"
                strokeWidth="2.2"
              />

              {/* Graduated knurled ticks */}
              {leftTickAngles.map((ang, i) => {
                const isMajor = i % 10 === 0;
                const isMid = i % 5 === 0 && !isMajor;
                const isPassed = ang <= leftPointerAngle;
                const p1 = polarLeft(ang, isMajor ? 228 : isMid ? 236 : 242);
                const p2 = polarLeft(ang, 258);
                return (
                  <line
                    key={ang}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={isPassed ? '#EB4A1D' : '#EFE6D5'}
                    strokeOpacity={isPassed ? 0.95 : isMajor ? 0.55 : 0.25}
                    strokeWidth={isMajor ? 1.5 : 0.9}
                  />
                );
              })}

              {/* Clickable Section Markers along the Left Arc */}
              {SECTIONS.map((sec, idx) => {
                const ang = -46 + idx * 23;
                const labelPos = polarLeft(ang, 276);
                const isActive = activeSectionIdx === idx;
                return (
                  <g
                    key={sec.id}
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateSection(sec.id);
                    }}
                  >
                    <circle
                      cx={polarLeft(ang, 248).x}
                      cy={polarLeft(ang, 248).y}
                      r={isActive ? 4 : 2.5}
                      fill={isActive ? '#EB4A1D' : '#0A0A0B'}
                      stroke={isActive ? '#EFE6D5' : '#B9A992'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={labelPos.x + 6}
                      y={labelPos.y - 2}
                      fill={isActive ? '#EFE6D5' : '#B9A992'}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {sec.num} {sec.fStop}
                    </text>
                    <text
                      x={labelPos.x + 6}
                      y={labelPos.y + 10}
                      fill={isActive ? '#EB4A1D' : '#7C7469'}
                      fontSize="8.5"
                      fontFamily="DM Sans, sans-serif"
                      letterSpacing="0.06em"
                    >
                      {sec.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Movable Draggable Vermilion Pointer Triangle */}
              {(() => {
                const tip = polarLeft(leftPointerAngle, 224);
                const b1 = polarLeft(leftPointerAngle - 2.6, 208);
                const b2 = polarLeft(leftPointerAngle + 2.6, 208);
                return (
                  <polygon
                    points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`}
                    fill="#EB4A1D"
                    stroke="#EFE6D5"
                    strokeWidth="0.8"
                  />
                );
              })()}
            </svg>
            <div className="text-[9px] font-mono text-[#7C7469] pl-1 mt-1">
              Drag ring to scroll
            </div>
          </aside>

          {/* CENTER: ABSTRACT CAMERA VIEWFINDER MECHANISM + NESTED FRAMES */}
          <div className="flex-1 min-w-0 max-w-[1160px] mx-auto flex flex-col gap-3">
            {/* Editorial Title + Active Frame Readout Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
              <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap">
                <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-none text-[#EFE6D5] uppercase">
                  I Make Images{' '}
                  <span className="text-[#EB4A1D] italic">Move.</span>
                </h1>
                <span className="text-xs sm:text-sm text-[#B9A992] font-normal">
                  Ayush · Commercial & Motion Video Editor
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-[#B9A992] tabular-nums shrink-0">
                <span className="text-[#EFE6D5] font-semibold">
                  Frame {currentSlide.index} / 04
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#EB4A1D]">{currentSlide.focal}</span>
                <span aria-hidden="true">·</span>
                <span>{currentSlide.label}</span>
              </div>
            </div>

            {/* NESTED BAUHAUS / OPTICAL VIEWFINDER FRAME */}
            <div className="relative w-full p-2 sm:p-3 border border-[#EFE6D5]/20 bg-[#11100F]">
              {/* Outer Mechanical Corner Registration Brackets */}
              <span aria-hidden="true" className="pointer-events-none absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[#EB4A1D]" />
              <span aria-hidden="true" className="pointer-events-none absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[#EB4A1D]" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[#EB4A1D]" />
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[#EB4A1D]" />

              {/* Second Nested Concentric Frame */}
              <div className="relative w-full border border-[#EFE6D5]/12 bg-[#09090A] p-1.5 sm:p-2">
                {/* Main Active Viewing Gate */}
                <div className="relative w-full h-[38vh] min-h-[250px] sm:h-[46vh] sm:min-h-[320px] lg:h-[50vh] max-h-[500px] overflow-hidden bg-[#060607] border border-[#EFE6D5]/15">
                  {/* Subtle Optical Reticle Overlay (Pointer-Events-None) */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 1000 500"
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-0 w-full h-full z-20 opacity-30"
                  >
                    {/* Rule of thirds hairlines */}
                    <line x1="333" y1="0" x2="333" y2="500" stroke="#EFE6D5" strokeWidth="0.5" strokeOpacity="0.25" />
                    <line x1="666" y1="0" x2="666" y2="500" stroke="#EFE6D5" strokeWidth="0.5" strokeOpacity="0.25" />
                    <line x1="0" y1="166" x2="1000" y2="166" stroke="#EFE6D5" strokeWidth="0.5" strokeOpacity="0.25" />
                    <line x1="0" y1="333" x2="1000" y2="333" stroke="#EFE6D5" strokeWidth="0.5" strokeOpacity="0.25" />
                    {/* Inner corner crop L-marks */}
                    <polyline points="26,52 26,22 58,22" fill="none" stroke="#EFE6D5" strokeWidth="1.2" />
                    <polyline points="942,22 974,22 974,52" fill="none" stroke="#EFE6D5" strokeWidth="1.2" />
                    <polyline points="26,448 26,478 58,478" fill="none" stroke="#EFE6D5" strokeWidth="1.2" />
                    <polyline points="942,478 974,478 974,448" fill="none" stroke="#EFE6D5" strokeWidth="1.2" />
                  </svg>

                  {/* Mechanical Optical Shutter Wipe Animation on Slide Change */}
                  <AnimatePresence>
                    <motion.div
                      key={`shutter-${shutterKey}`}
                      initial={{ scaleY: 0.45, opacity: 0.9 }}
                      animate={{ scaleY: 0, opacity: 0 }}
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="pointer-events-none absolute inset-0 z-30 origin-top bg-[#0A0A0B] border-b border-[#EB4A1D]"
                    />
                  </AnimatePresence>

                  {/* SLIDE CONTENT STATES */}
                  <AnimatePresence mode="wait">
                    {activeSlide === 0 && (
                      <motion.div
                        key="slide-spotlight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full h-full"
                      >
                        {hero.videoUrl ? (
                          <video
                            ref={videoRef}
                            src={hero.videoUrl}
                            poster={hero.thumbnail}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        ) : (
                          <img
                            src={hero.thumbnail}
                            alt={hero.title}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {/* Scrim + Minimal Spotlight Controls */}
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-black/45 flex flex-col justify-between p-3 sm:p-5">
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-[#EFE6D5] font-mono text-[11px] truncate">
                              <span className="text-[#EB4A1D] font-semibold">SPOTLIGHT</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{hero.title}</span>
                              <span className="hidden sm:inline text-[#B9A992]">· {hero.aspectRatio}</span>
                            </div>

                            <a
                              href={heroDriveAction.url}
                              target={heroDriveAction.target}
                              rel="noopener noreferrer"
                              title={heroDriveAction.tooltip}
                              className="px-3 py-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                            >
                              <ExternalLink size={11} />
                              <span>{heroDriveAction.isDrive ? 'Drive Full HD' : 'Request Full HD'}</span>
                            </a>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={togglePlay}
                                className="w-9 h-9 bg-[#EB4A1D] hover:bg-[#ff5a2b] text-white flex items-center justify-center transition-colors cursor-pointer"
                                title={isPlaying ? 'Pause' : 'Play'}
                              >
                                {isPlaying ? <Pause size={15} /> : <Play size={15} className="translate-x-0.5" />}
                              </button>
                              <button
                                onClick={toggleMute}
                                className="w-9 h-9 bg-black/75 hover:bg-black border border-[#EFE6D5]/25 text-[#EFE6D5] flex items-center justify-center transition-colors cursor-pointer"
                                title={isMuted ? 'Unmute' : 'Mute'}
                              >
                                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                              </button>
                            </div>

                            <button
                              onClick={() => onNavigateSection('section-iris')}
                              className="px-3.5 py-1.5 bg-black/75 hover:bg-[#EFE6D5] text-[#EFE6D5] hover:text-[#0A0A0B] border border-[#EFE6D5]/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Browse Project Iris</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeSlide === 1 && (
                      <motion.div
                        key="slide-profile"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full h-full bg-[#11100F] p-5 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto"
                      >
                        {/* Geometric Bauhaus half-circle accent */}
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 220 220"
                          className="pointer-events-none absolute right-6 top-6 w-32 sm:w-44 h-32 sm:h-44 opacity-25"
                        >
                          <circle cx="110" cy="110" r="96" fill="none" stroke="#EFE6D5" strokeWidth="1" />
                          <circle cx="110" cy="110" r="68" fill="none" stroke="#EB4A1D" strokeWidth="1.2" strokeDasharray="4 4" />
                          <path d="M 110 14 A 96 96 0 0 1 110 206 Z" fill="#EB4A1D" fillOpacity="0.35" />
                        </svg>

                        <div className="max-w-2xl relative z-10">
                          <div className="text-xs font-mono text-[#EB4A1D] tracking-widest uppercase mb-2">
                            02 · Profile
                          </div>
                          <h2 className="font-display font-black text-2xl sm:text-4xl text-[#EFE6D5] tracking-tight leading-tight text-balance">
                            Ayush — Commercial &amp; Motion Video Editor
                          </h2>
                          <p className="mt-3 text-sm sm:text-base text-[#B9A992] leading-relaxed max-w-xl">
                            I build rhythmic commercial edits, high-retention social reels, kinetic motion graphics, and bespoke color grades. Every timeline is engineered like a precision lens — tuned for visual tension, clean pacing, and unmistakable brand impact.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 mt-4 border-t border-[#EFE6D5]/12 relative z-10 text-left">
                          <div>
                            <div className="text-[11px] font-mono text-[#7C7469]">Primary Cut</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#EFE6D5] mt-0.5">Premiere Pro</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-mono text-[#7C7469]">Color Pipeline</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#EFE6D5] mt-0.5">DaVinci Resolve</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-mono text-[#7C7469]">Motion &amp; VFX</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#EFE6D5] mt-0.5">After Effects</div>
                          </div>
                          <div>
                            <div className="text-[11px] font-mono text-[#7C7469]">Spatial 3D</div>
                            <div className="text-xs sm:text-sm font-semibold text-[#EFE6D5] mt-0.5">Blender</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeSlide === 2 && (
                      <motion.div
                        key="slide-philosophy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full h-full bg-[#EFE6D5] text-[#0A0A0B] p-6 sm:p-10 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Op-Art Concentric Rings Motif (Inspired by Swiss/Op-Art Reference) */}
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 320 320"
                          className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 w-60 sm:w-80 h-60 sm:h-80 opacity-85"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <circle
                              key={i}
                              cx="180"
                              cy="160"
                              r={24 + i * 11}
                              fill="none"
                              stroke="#0A0A0B"
                              strokeWidth="1.2"
                              strokeOpacity={0.22 + (i % 3) * 0.15}
                            />
                          ))}
                          <circle cx="122" cy="160" r="64" fill="#EB4A1D" fillOpacity="0.92" />
                        </svg>

                        <div className="text-xs font-mono tracking-widest uppercase text-[#0A0A0B]/70 relative z-10">
                          03 · Editorial Ethos
                        </div>

                        <div className="max-w-xl relative z-10 my-auto">
                          <blockquote className="font-display font-black text-3xl sm:text-5xl tracking-tight leading-[1.05] text-balance">
                            Every frame has a feeling.
                          </blockquote>
                          <p className="mt-4 text-sm sm:text-base text-[#0A0A0B]/80 leading-relaxed max-w-md">
                            Great editing lives in the micro-seconds between shots — where optical rhythm, sound transients, and visual geometry lock together so viewers feel the cut before they notice it.
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-[#0A0A0B]/70 relative z-10">
                          <span>24 FPS Discipline</span>
                          <span aria-hidden="true">·</span>
                          <span>Match-Cut Precision</span>
                          <span aria-hidden="true">·</span>
                          <span>Audio-First Pacing</span>
                        </div>
                      </motion.div>
                    )}

                    {activeSlide === 3 && (
                      <motion.div
                        key="slide-direction"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="relative w-full h-full bg-[#101012] p-5 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto"
                      >
                        <div className="flex items-baseline justify-between gap-4 border-b border-[#EFE6D5]/12 pb-3">
                          <div>
                            <div className="text-xs font-mono text-[#EB4A1D] tracking-widest uppercase">
                              04 · Creative Direction
                            </div>
                            <h2 className="font-display font-black text-2xl sm:text-3xl text-[#EFE6D5] mt-1">
                              What I’m Building in 2026
                            </h2>
                          </div>
                          <button
                            onClick={onCopyEmail}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EB4A1D] hover:bg-[#ff5a2b] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            <Mail size={12} />
                            <span>Book a Project</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 my-auto py-4">
                          <div className="border-t border-[#EB4A1D] pt-3">
                            <div className="text-xs font-mono text-[#EB4A1D]">01. Commercial Spots</div>
                            <p className="text-xs sm:text-sm text-[#EFE6D5] mt-1.5 leading-relaxed">
                              Launch films and product spots paced for instant visual clarity and kinetic brand recall.
                            </p>
                          </div>
                          <div className="border-t border-[#EFE6D5]/30 pt-3">
                            <div className="text-xs font-mono text-[#B9A992]">02. Motion &amp; Masking</div>
                            <p className="text-xs sm:text-sm text-[#EFE6D5] mt-1.5 leading-relaxed">
                              Seamless camera-whip transitions, kinetic typography, and tactile analog-inspired graphics.
                            </p>
                          </div>
                          <div className="border-t border-[#EFE6D5]/30 pt-3">
                            <div className="text-xs font-mono text-[#B9A992]">03. Vertical Reels</div>
                            <p className="text-xs sm:text-sm text-[#EFE6D5] mt-1.5 leading-relaxed">
                              9:16 social campaigns structured around 2-second visual hooks and layered spatial audio.
                            </p>
                          </div>
                        </div>

                        <div className="text-xs font-mono text-[#7C7469] flex items-center justify-between border-t border-[#EFE6D5]/10 pt-3">
                          <span>Available for freelance &amp; agency collaborations</span>
                          <span className="text-[#EFE6D5]">ak4895931@gmail.com</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* VIEWFINDER BOTTOM EXPOSURE METER + LEFT/RIGHT FRAME CONTROLS */}
                <div className="flex items-center justify-between gap-3 pt-2 px-1">
                  <button
                    onClick={() => switchSlide(activeSlide - 1)}
                    className="flex items-center gap-1 text-xs font-mono text-[#EFE6D5] hover:text-[#EB4A1D] transition-colors py-1 px-2 border border-[#EFE6D5]/15 hover:border-[#EB4A1D] cursor-pointer whitespace-nowrap"
                  >
                    <ChevronLeft size={14} />
                    <span>Prev Frame</span>
                  </button>

                  {/* Camera Exposure Meter Scale (-3 .. 0 .. +3) + Frame Selector */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="hidden md:inline text-[10px] font-mono text-[#7C7469] tabular-nums">
                      -3 · -2 · -1 · <span className="text-[#EB4A1D]">0</span> · +1 · +2 · +3 EV
                    </span>
                    <div className="flex items-center gap-1.5">
                      {VIEWFINDER_SLIDES.map((s, idx) => (
                        <button
                          key={s.id}
                          onClick={() => switchSlide(idx)}
                          aria-label={`View ${s.label}`}
                          className={`h-2 transition-all cursor-pointer ${
                            activeSlide === idx
                              ? 'w-7 bg-[#EB4A1D]'
                              : 'w-2.5 bg-[#EFE6D5]/25 hover:bg-[#EFE6D5]/60'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => switchSlide(activeSlide + 1)}
                    className="flex items-center gap-1 text-xs font-mono text-[#EFE6D5] hover:text-[#EB4A1D] transition-colors py-1 px-2 border border-[#EFE6D5]/15 hover:border-[#EB4A1D] cursor-pointer whitespace-nowrap"
                  >
                    <span>Next Frame</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* VIEWING EXPERIENCE ROW (Visible Above the Fold, 1 Row on Mobile & Desktop) */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#B9A992] mb-2 px-0.5">
                <span>Select Your Viewing Experience</span>
                <span className="hidden sm:inline text-[#7C7469]">Two Ways to Explore</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                <button
                  onClick={() => onSelectMode('CLIENT')}
                  className="group p-2.5 sm:p-3.5 bg-[#141312] hover:bg-[#1B1917] border border-[#EFE6D5]/15 hover:border-[#EB4A1D] text-left transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Video size={14} className="text-[#EB4A1D] shrink-0" />
                      <span className="font-display font-bold text-xs sm:text-sm text-[#EFE6D5] truncate">
                        Client &amp; Brand
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#B9A992] mt-0.5 line-clamp-1">
                      Clean showcase · Commercial reels, vertical cuts &amp; Drive HD
                    </p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-[#B9A992] group-hover:text-[#EB4A1D] group-hover:translate-x-1 transition-all shrink-0"
                  />
                </button>

                <button
                  onClick={() => onSelectMode('EDITOR')}
                  className="group p-2.5 sm:p-3.5 bg-[#141312] hover:bg-[#1B1917] border border-[#EFE6D5]/15 hover:border-[#EFE6D5] text-left transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Sliders size={14} className="text-[#EFE6D5] shrink-0" />
                      <span className="font-display font-bold text-xs sm:text-sm text-[#EFE6D5] truncate">
                        Editor Workstation
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-[#B9A992] mt-0.5 line-clamp-1">
                      3D Discovery Sphere · Multi-track NLE timeline &amp; LUT grading
                    </p>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-[#B9A992] group-hover:text-[#EFE6D5] group-hover:translate-x-1 transition-all shrink-0"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT QUADRANT ARC RING — Zoom / Focal Frame Selector Ring (Opening Section Only) */}
          <aside
            aria-label="Focal zoom viewfinder ring"
            className="hidden lg:flex flex-col items-end justify-center w-[124px] xl:w-[144px] shrink-0 select-none"
          >
            <div className="text-[10px] font-mono text-[#B9A992] tracking-widest uppercase mb-1 pr-1">
              Zoom · Frames
            </div>
            <svg
              ref={rightArcRef}
              viewBox="0 0 140 520"
              className="w-[124px] xl:w-[140px] h-[440px] xl:h-[500px] overflow-visible cursor-ns-resize touch-none"
              onPointerDown={(e) => {
                setIsDraggingRight(true);
                scrubSlideFromPointer(e.clientY);
              }}
            >
              {/* Rotating technical lens barrel group */}
              <g
                style={{
                  transform: `rotate(${rightRingRotation}deg)`,
                  transformOrigin: '308px 260px',
                  transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Outer knurled dashed barrel arc */}
                <path
                  d={`M ${polarRight(128, 266).x} ${polarRight(128, 266).y} A 266 266 0 0 1 ${polarRight(232, 266).x} ${polarRight(232, 266).y}`}
                  fill="none"
                  stroke="#EFE6D5"
                  strokeOpacity="0.22"
                  strokeWidth="1"
                  strokeDasharray="6 4"
                />
                {/* Inner concentric optical ring */}
                <path
                  d={`M ${polarRight(130, 232).x} ${polarRight(130, 232).y} A 232 232 0 0 1 ${polarRight(230, 232).x} ${polarRight(230, 232).y}`}
                  fill="none"
                  stroke="#EFE6D5"
                  strokeOpacity="0.14"
                  strokeWidth="1"
                />

                {/* Zoom ring ticks */}
                {rightTickAngles.map((ang, i) => {
                  const isMajor = i % 9 === 0;
                  const p1 = polarRight(ang, isMajor ? 228 : 242);
                  const p2 = polarRight(ang, 258);
                  return (
                    <line
                      key={ang}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="#EFE6D5"
                      strokeOpacity={isMajor ? 0.65 : 0.24}
                      strokeWidth={isMajor ? 1.5 : 0.9}
                    />
                  );
                })}
              </g>

              {/* Clickable Focal Frame Stops (24mm -> 85mm) */}
              {VIEWFINDER_SLIDES.map((slide, idx) => {
                const frac = idx / (VIEWFINDER_SLIDES.length - 1);
                const ang = 224 - frac * 88;
                const dotPos = polarRight(ang, 248);
                const labelPos = polarRight(ang, 278);
                const isActive = activeSlide === idx;
                return (
                  <g
                    key={slide.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      switchSlide(idx);
                    }}
                  >
                    <circle
                      cx={dotPos.x}
                      cy={dotPos.y}
                      r={isActive ? 4.2 : 2.6}
                      fill={isActive ? '#EB4A1D' : '#0A0A0B'}
                      stroke={isActive ? '#EFE6D5' : '#B9A992'}
                      strokeWidth="1.2"
                    />
                    <text
                      x={labelPos.x - 8}
                      y={labelPos.y - 2}
                      textAnchor="end"
                      fill={isActive ? '#EFE6D5' : '#B9A992'}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {slide.focal}
                    </text>
                    <text
                      x={labelPos.x - 8}
                      y={labelPos.y + 10}
                      textAnchor="end"
                      fill={isActive ? '#EB4A1D' : '#7C7469'}
                      fontSize="8.5"
                      fontFamily="DM Sans, sans-serif"
                      letterSpacing="0.06em"
                    >
                      {slide.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* Right Pointer Triangle */}
              {(() => {
                const tip = polarRight(rightPointerAngle, 224);
                const b1 = polarRight(rightPointerAngle - 2.6, 208);
                const b2 = polarRight(rightPointerAngle + 2.6, 208);
                return (
                  <polygon
                    points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`}
                    fill="#EB4A1D"
                    stroke="#EFE6D5"
                    strokeWidth="0.8"
                  />
                );
              })()}
            </svg>
            <div className="text-[9px] font-mono text-[#7C7469] pr-1 mt-1">
              Click or drag to switch
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
