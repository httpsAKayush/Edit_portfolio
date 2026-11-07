import React, { useState, useRef } from 'react';
import { Project, PortfolioMode, ProjectCategory } from '../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  ArrowRight, 
  Film, 
  Mail, 
  Copy, 
  Check, 
  Video, 
  Sparkles, 
  Maximize, 
  Eye, 
  ChevronDown,
  Layers,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDriveOrMailAction } from '../constants';

interface HomeGatewayProps {
  onSelectMode: (mode: PortfolioMode) => void;
  featuredProject?: Project;
  projects: Project[];
}

export const HomeGateway: React.FC<HomeGatewayProps> = ({ 
  onSelectMode, 
  featuredProject,
  projects 
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('ALL');
  const [selectedVideo, setSelectedVideo] = useState<Project | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Spotlight project: TEXTURE MOTION EDIT (p2)
  const hero = featuredProject || projects.find(p => p.id === 'p2' || p.title.toLowerCase().includes('texture motion')) || projects[0];

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('ak4895931@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
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

  // Filter projects for the quick preview grid (excluding sphere-only videos)
  const filteredProjects = projects.filter(p => {
    if (p.sphereOnly) return false;
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'COMMERCIAL') return p.category === 'COMMERCIAL' || p.tags.some(t => /commercial|corporate|brand/i.test(t));
    if (activeCategory === 'REEL') return p.category === 'REEL' || p.aspectRatio === '9:16' || p.tags.some(t => /reel|vertical|action/i.test(t));
    if (activeCategory === 'MOTION') return p.category === 'MOTION' || p.tags.some(t => /motion|animation|vfx/i.test(t));
    if (activeCategory === 'NARRATIVE') return p.category === 'NARRATIVE' || p.tags.some(t => /narrative|short film/i.test(t));
    return true;
  }).slice(0, 8); // Top 8 featured works

  return (
    <div className="min-h-screen w-full bg-[#07080b] text-white flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {copiedEmail && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 font-medium"
          >
            <Check size={14} />
            <span>Email copied to clipboard! (ak4895931@gmail.com)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-blue-700/15 via-sky-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* TOP HEADER */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center font-black tracking-tighter text-blue-400 text-sm shadow-md">
            AY
          </div>
          <div>
            <span className="text-sm font-black tracking-widest text-white uppercase block leading-none">
              AYUSH
            </span>
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
              VIDEO EDITOR · 2026
            </span>
          </div>
        </div>

        {/* Action shortcuts */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onSelectMode('CLIENT')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Video size={13} />
            <span className="hidden sm:inline">Client Showcase</span>
            <span className="sm:hidden">Showcase</span>
          </button>
          
          <button
            onClick={() => onSelectMode('EDITOR')}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Editor Workstation</span>
            <span className="sm:hidden">Editor</span>
          </button>

          <button
            onClick={handleCopyEmail}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Copy email address"
          >
            <Mail size={14} />
          </button>
        </div>
      </header>

      {/* MAIN HERO: HIGH IMPACT VIDEO EDITOR PORTFOLIO CENTERPIECE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-16 space-y-16 sm:space-y-24 z-10">
        
        {/* CENTERPIECE HERO CONTAINER (Inspired directly by user's reference designs) */}
        <section className="relative text-center flex flex-col items-center justify-center pt-2 md:pt-6">
          
          {/* Subtle Editor Bounding Box Frame (Reference image 1 style) */}
          <div className="relative w-full max-w-4xl mx-auto p-4 sm:p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-sm overflow-hidden">
            
            {/* Top Editor Timeline Coordinates / Corner Marks */}
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>REC_001 · 24FPS</span>
                <span className="hidden sm:inline">· 4K PRORES</span>
              </div>
              <div className="tracking-widest uppercase text-blue-400 font-semibold">
                VIDEO EDITOR | 2026
              </div>
              <div className="font-mono text-zinc-400">
                TC: 00:01:24:18
              </div>
            </div>

            {/* Huge Headline: AYUSH PORTFOLIO with creative typography */}
            <div className="my-6 sm:my-10 relative">
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase text-white leading-none select-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                  PoRT
                </span>
                <span className="text-blue-500 italic drop-shadow-[0_0_35px_rgba(59,130,246,0.6)]">
                  FOLIO
                </span>
              </h1>
              <p className="mt-3 text-xs sm:text-sm font-mono uppercase tracking-[0.3em] text-zinc-400">
                Ayush · Commercial & Motion Video Editor
              </p>
            </div>

            {/* Hero Interactive Video Window (Reference Image 2 & 3 style) */}
            <div className="relative w-full aspect-video sm:aspect-[21/9] max-h-[360px] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl group mx-auto my-4">
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

              {/* Glass overlay with controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4 opacity-90 group-hover:opacity-100 transition-opacity">
                
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 font-mono text-[11px]">
                    <span className="text-blue-400">SPOTLIGHT</span>
                    <span>·</span>
                    <span>{hero.title}</span>
                    <span className="hidden sm:inline bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded font-mono border border-blue-500/30">1080p FULL HD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const action = getDriveOrMailAction(hero);
                      return (
                        <a
                          href={action.url}
                          target={action.target}
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-full border border-blue-400/40 flex items-center gap-1 shadow-md transition-all cursor-pointer font-medium"
                          title={action.tooltip}
                        >
                          <ExternalLink size={11} />
                          <span>{action.isDrive ? 'Drive Full HD' : 'Drive HD'}</span>
                        </a>
                      );
                    })()}
                    <span className="font-mono text-[11px] bg-black/60 px-2.5 py-1 rounded-full border border-white/10">
                      {hero.aspectRatio}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-0.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectMode('CLIENT')}
                      className="text-xs bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer font-medium"
                    >
                      <span>Showcase</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPERIENCE SELECTION: The core question in sleek, graphic cards - 1 row on mobile */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs uppercase font-mono tracking-widest text-zinc-400 mb-4">
                — Select Your Viewing Experience —
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 max-w-2xl mx-auto">
                {/* 1. Client Showcase Button */}
                <button
                  onClick={() => onSelectMode('CLIENT')}
                  className="group relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-900/40 via-blue-950/30 to-zinc-900 border border-blue-500/40 hover:border-blue-400 text-left transition-all duration-200 hover:scale-[1.02] shadow-lg cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <ArrowRight size={14} className="text-blue-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <div className="font-bold text-white text-xs sm:text-base leading-tight">Client & Brand</div>
                    <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 leading-snug sm:leading-relaxed">
                      Simple video portfolio. Commercial reels, vertical cuts & rates.
                    </p>
                  </div>
                </button>

                {/* 2. Editor Workstation Button */}
                <button
                  onClick={() => onSelectMode('EDITOR')}
                  className="group relative p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all duration-200 hover:scale-[1.02] shadow-lg cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                        <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <ArrowRight size={14} className="text-cyan-400 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                    <div className="font-bold text-white text-xs sm:text-base leading-tight">Editor Workstation</div>
                    <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 leading-snug sm:leading-relaxed">
                      Interactive 3D Sphere, multi-track timeline, grading & cuts.
                    </p>
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Quick indicator to scroll down */}
          <div className="mt-8 flex flex-col items-center text-zinc-400 text-xs font-mono gap-1">
            <span>SCROLL TO BROWSE WORK</span>
            <ChevronDown size={14} className="animate-bounce text-blue-400" />
          </div>
        </section>

        {/* WORK HIGHLIGHTS GRID (Directly scrollable on the home page) */}
        <section className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-blue-400 block mb-1">
                Portfolio Reel Library
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                Featured Edits
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {(['ALL', 'COMMERCIAL', 'REEL', 'MOTION', 'NARRATIVE'] as ProjectCategory[]).map(cat => {
                const label = 
                  cat === 'ALL' ? 'All' :
                  cat === 'COMMERCIAL' ? 'Commercials' :
                  cat === 'REEL' ? 'Reels (9:16)' :
                  cat === 'MOTION' ? 'Motion' : 'Narrative';
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProjects.map((project) => {
              const isUnclickable = !!project.unclickable;
              return (
                <div
                  key={project.id}
                  onClick={() => {
                    if (!isUnclickable) setSelectedVideo(project);
                  }}
                  className={`group relative bg-zinc-900/70 border border-white/10 rounded-xl overflow-hidden transition-all duration-200 shadow-md flex flex-col justify-between ${
                    isUnclickable ? 'opacity-75 cursor-default' : 'hover:border-blue-500/50 hover:-translate-y-1 cursor-pointer'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${!isUnclickable ? 'group-hover:scale-105' : 'grayscale-[0.3]'}`}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />

                    {/* Play Button or In Production / Full HD */}
                    {!isUnclickable ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                            <Play size={16} className="translate-x-0.5" />
                          </div>
                        </div>

                        {(() => {
                          const action = getDriveOrMailAction(project);
                          return (
                            <a
                              href={action.url}
                              target={action.target}
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-black/80 hover:bg-blue-600 text-white border border-white/20 text-[9px] font-mono flex items-center gap-1 transition-all backdrop-blur-sm shadow-md cursor-pointer"
                              title={action.tooltip}
                            >
                              <ExternalLink size={9} />
                              <span>DRIVE HD</span>
                            </a>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-zinc-700 text-zinc-400 text-[9px] font-mono uppercase px-2 py-0.5 rounded">
                        In Production
                      </div>
                    )}

                    {/* Duration and Aspect */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded text-zinc-300 backdrop-blur-sm">
                      <span>{project.aspectRatio}</span>
                      <span>·</span>
                      <span>{isUnclickable ? 'Upcoming' : project.duration}</span>
                    </div>
                  </div>

                  {/* Card Title and Details */}
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">
                        {project.client} · {project.year}
                      </div>
                      <h3 className={`text-sm font-bold text-white line-clamp-1 ${!isUnclickable ? 'group-hover:text-blue-300 transition-colors' : ''}`}>
                        {project.title}
                      </h3>
                    </div>

                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed pt-1">
                      {project.description}
                    </p>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                      {!isUnclickable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideo(project);
                          }}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <Play size={11} /> Play Video
                        </button>
                      ) : (
                        <span className="text-zinc-500 font-mono text-[10px]">
                          In Production · Future Edit
                        </span>
                      )}
                      <span className="font-mono text-zinc-400">{project.idealGrade || 'REC709'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={() => onSelectMode('CLIENT')}
              className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span>Explore All {projects.filter(p => !p.sphereOnly).length} Projects in Client Showcase</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* EDITING EXPERTISE & PROCESS */}
        <section className="p-6 sm:p-10 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-8">
          <div className="max-w-2xl">
            <span className="text-xs uppercase font-mono tracking-widest text-blue-400 block mb-1">
              Creative Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              Crafting Edits That Hold Attention
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-blue-400 font-mono text-sm font-bold">01 / RETENTION</div>
              <h3 className="text-base font-bold text-white">Dynamic Rhythmic Pacing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hooks calibrated within the first 2 seconds, precision match-cuts, and beat-accurate transitions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-sky-400 font-mono text-sm font-bold">02 / COLOR</div>
              <h3 className="text-base font-bold text-white">Cinematic Look & Tone</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Bespoke color science: Bleach bypass, Film emulation, balanced REC709 skin tones, and moody contrast.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <div className="text-cyan-400 font-mono text-sm font-bold">03 / AUDIO</div>
              <h3 className="text-base font-bold text-white">Spatial Sound Design</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Layered cinematic impacts, ambient textures, risers, and vocal polish that make videos feel massive.
              </p>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black uppercase text-white">
            Have a project in mind?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Available for brand campaigns, high-retention social series, commercial spots, and motion edits.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:ak4895931@gmail.com"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Mail size={16} />
              <span>Email: ak4895931@gmail.com</span>
            </a>
            <button
              onClick={handleCopyEmail}
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Copy size={15} />
              <span>Copy Email</span>
            </button>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <div>
          <span>AYUSH · VIDEO EDITOR PORTFOLIO 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onSelectMode('CLIENT')} className="hover:text-zinc-300 transition-colors cursor-pointer">
            Client Mode
          </button>
          <span className="text-zinc-700">·</span>
          <button onClick={() => onSelectMode('EDITOR')} className="hover:text-cyan-400 transition-colors cursor-pointer">
            Editor Workstation ⚡
          </button>
          <span className="text-zinc-700">·</span>
          <a href="mailto:ak4895931@gmail.com" className="hover:text-zinc-300 transition-colors">
            Contact
          </a>
        </div>
      </footer>

      {/* QUICK VIDEO PREVIEW MODAL */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-white">{selectedVideo.title}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">{selectedVideo.client}</span>
                  <span className="text-zinc-500">·</span>
                  <span className="text-blue-400 font-mono">{selectedVideo.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const action = getDriveOrMailAction(selectedVideo);
                    return (
                      <a
                        href={action.url}
                        target={action.target}
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        title={action.tooltip}
                      >
                        <ExternalLink size={12} />
                        <span>{action.isDrive ? 'Drive Link (Full HD)' : 'Request Full HD'}</span>
                      </a>
                    );
                  })()}
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-zinc-400 hover:text-white px-2 py-1 text-xs cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              <div className="aspect-video bg-black flex items-center justify-center">
                {selectedVideo.videoUrl ? (
                  <video
                    src={selectedVideo.videoUrl}
                    poster={selectedVideo.thumbnail}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedVideo.thumbnail}
                    alt={selectedVideo.title}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="p-4 bg-zinc-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-zinc-400">
                <p className="line-clamp-1">{selectedVideo.description}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      onSelectMode('CLIENT');
                    }}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    Open in Client Showcase →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
