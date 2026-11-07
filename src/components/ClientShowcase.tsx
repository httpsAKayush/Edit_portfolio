import React, { useState, useRef, useEffect } from 'react';
import { Project, ProjectCategory, PortfolioMode } from '../types';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ExternalLink, 
  Check, 
  Copy, 
  Sliders, 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Film, 
  Clock, 
  Calendar, 
  Eye, 
  Share2, 
  X,
  Compass,
  ArrowUpRight,
  ArrowRight,
  MonitorPlay,
  CheckCircle2,
  Tv
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDriveOrMailAction } from '../constants';

interface ClientShowcaseProps {
  projects: Project[];
  onSwitchToEditor: () => void;
  onReturnToGateway: () => void;
}

export const ClientShowcase: React.FC<ClientShowcaseProps> = ({
  projects,
  onSwitchToEditor,
  onReturnToGateway
}) => {
  // Filter state
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('ALL');
  
  // Active modal video
  const [activeModalProject, setActiveModalProject] = useState<Project | null>(null);
  
  // Hero featured video player
  const [heroProject, setHeroProject] = useState<Project>(() => {
    // Spotlight default: TEXTURE MOTION EDIT (p2)
    return projects.find(p => p.id === 'p2' || p.title.toLowerCase().includes('texture motion')) || projects[0];
  });
  
  const [isHeroPlaying, setIsHeroPlaying] = useState(false);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  
  // Link copied toast
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Filter projects by category (excluding sphere-only projects)
  const filteredProjects = projects.filter(p => {
    if (p.sphereOnly) return false;
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'COMMERCIAL') {
      return p.category === 'COMMERCIAL' || p.tags.some(t => /commercial|corporate|lifestyle|fashion|brand/i.test(t));
    }
    if (activeCategory === 'REEL') {
      return p.category === 'REEL' || p.aspectRatio === '9:16' || p.tags.some(t => /reel|vertical|tiktok|action|adventure/i.test(t));
    }
    if (activeCategory === 'MOTION') {
      return p.category === 'MOTION' || p.tags.some(t => /motion|logo|animation|vfx|visual/i.test(t));
    }
    if (activeCategory === 'NARRATIVE') {
      return p.category === 'NARRATIVE' || p.tags.some(t => /short film|documentary|music video|narrative|story/i.test(t));
    }
    return true;
  });

  const toggleHeroPlay = () => {
    if (!heroVideoRef.current) return;
    if (heroVideoRef.current.paused) {
      heroVideoRef.current.play().catch(e => console.log('Autoplay error', e));
      setIsHeroPlaying(true);
    } else {
      heroVideoRef.current.pause();
      setIsHeroPlaying(false);
    }
  };

  const toggleHeroMute = () => {
    if (!heroVideoRef.current) return;
    heroVideoRef.current.muted = !heroVideoRef.current.muted;
    setIsHeroMuted(heroVideoRef.current.muted);
  };

  const copyDirectProjectLink = (project: Project) => {
    const url = `${window.location.origin}${window.location.pathname}?project=${project.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('ak4895931@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {(copiedLink || copiedEmail) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 font-medium"
          >
            <Check size={14} />
            <span>{copiedEmail ? 'Email address copied to clipboard!' : 'Project direct link copied to clipboard!'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0a0b0e]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onReturnToGateway}
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Return to Experience Selection"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Role Selection</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white uppercase">AYUSH</span>
              <span className="text-xs text-zinc-500 font-medium">/</span>
              <span className="text-xs text-zinc-400">Showcase</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switcher Button */}
            <button
              onClick={onSwitchToEditor}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-cyan-400/50"
              title="Switch to full 3D NLE workstation with timeline"
            >
              <Sliders size={13} className="text-cyan-400" />
              <span className="hidden sm:inline">Switch to Editor Workstation ⚡</span>
              <span className="sm:hidden">Editor Workstation ⚡</span>
            </button>

            <button
              onClick={copyEmail}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Mail size={13} />
              <span className="hidden sm:inline">Hire Ayush</span>
              <span className="sm:hidden">Hire</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-12 space-y-12 sm:space-y-16">
        
        {/* HERO SECTION: Spotlight Feature Reel */}
        <section className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Video Player Display */}
            <div className="lg:col-span-8 bg-black relative aspect-video flex items-center justify-center overflow-hidden group">
              {heroProject.videoUrl ? (
                <video
                  ref={heroVideoRef}
                  src={heroProject.videoUrl}
                  poster={heroProject.thumbnail}
                  className="w-full h-full object-contain"
                  loop
                  playsInline
                  muted={isHeroMuted}
                  onPlay={() => setIsHeroPlaying(true)}
                  onPause={() => setIsHeroPlaying(false)}
                />
              ) : (
                <img
                  src={heroProject.thumbnail}
                  alt={heroProject.title}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Big overlay play button */}
              <div 
                onClick={toggleHeroPlay}
                className={`absolute inset-0 flex items-center justify-center cursor-pointer transition-opacity ${isHeroPlaying ? 'opacity-0 group-hover:opacity-100 bg-black/30' : 'opacity-100 bg-black/40'}`}
              >
                <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-blue-500 transition-all">
                  {isHeroPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
                </div>
              </div>

              {/* Player bottom bar */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <button onClick={toggleHeroPlay} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {isHeroPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={toggleHeroMute} className="hover:text-blue-400 transition-colors cursor-pointer">
                    {isHeroMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span className="font-mono text-[11px] text-zinc-300">{heroProject.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const action = getDriveOrMailAction(heroProject);
                    return (
                      <a
                        href={action.url}
                        target={action.target}
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 text-zinc-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title={action.tooltip}
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">{action.isDrive ? 'Drive Full HD' : 'Drive HD'}</span>
                      </a>
                    );
                  })()}
                  <button
                    onClick={() => setActiveModalProject(heroProject)}
                    className="hover:text-blue-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Maximize size={15} />
                    <span className="text-[11px] hidden sm:inline">Theater View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Video Details Column */}
            <div className="lg:col-span-4 p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-zinc-800 bg-zinc-900/40">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                  <span className="text-blue-400 uppercase tracking-wider font-semibold">Featured Edit</span>
                  <span aria-hidden="true">·</span>
                  <span>{heroProject.client}</span>
                  <span aria-hidden="true">·</span>
                  <span>{heroProject.year}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  {heroProject.title}
                </h2>

                <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                  {heroProject.description}
                </p>

                {/* Unboxed Metadata List */}
                <div className="space-y-2 pt-3 border-t border-zinc-800 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Aspect Ratio</span>
                    <span className="font-mono text-zinc-200">{heroProject.aspectRatio}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Duration</span>
                    <span className="font-mono text-zinc-200">{heroProject.duration}</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Role / Deliverables</span>
                    <span className="text-zinc-200 font-medium">Full Edit, Color, Sound</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800 flex items-center gap-2.5">
                <button
                  onClick={() => setActiveModalProject(heroProject)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play size={14} />
                  <span>Open Full Screen</span>
                </button>
                <button
                  onClick={() => copyDirectProjectLink(heroProject)}
                  className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy shareable link"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* WORK GALLERY SECTION */}
        <section className="space-y-6">
          {/* Section Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">Curated Projects</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Commercial campaigns, vertical social reels, and dynamic motion edits.
              </p>
            </div>

            {/* Filter Tabs (Interactive button segmented control) */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-hide">
              {(['ALL', 'COMMERCIAL', 'REEL', 'MOTION', 'NARRATIVE'] as ProjectCategory[]).map(cat => {
                const label = 
                  cat === 'ALL' ? 'All Work' :
                  cat === 'COMMERCIAL' ? 'Commercials' :
                  cat === 'REEL' ? 'Reels & 9:16' :
                  cat === 'MOTION' ? 'Motion & VFX' : 'Narrative';
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const hasVideo = !!project.videoUrl;
              const isUnclickable = !!project.unclickable;
              return (
                <div
                  key={project.id}
                  className={`group relative bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                    isUnclickable ? 'opacity-75 hover:border-zinc-800' : 'hover:bg-zinc-900 hover:border-zinc-700'
                  }`}
                >
                  {/* Thumbnail & Video Preview */}
                  <div 
                    onClick={() => {
                      if (isUnclickable) return;
                      if (hasVideo) setActiveModalProject(project);
                      else setHeroProject(project);
                    }}
                    className={`relative aspect-video bg-black overflow-hidden ${isUnclickable ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className={`w-full h-full object-cover transition-transform duration-300 ${!isUnclickable ? 'group-hover:scale-105' : 'grayscale-[0.3]'}`}
                      loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />

                    {/* Aspect & Duration tag (unboxed text inside subtle dark badge) */}
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-[10px] text-zinc-300 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded font-mono">
                      <span>{project.aspectRatio}</span>
                      <span>·</span>
                      <span>{isUnclickable ? 'Upcoming' : project.duration}</span>
                    </div>

                    {/* Overlay Indicator & Full HD link */}
                    {!isUnclickable ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                            <Play size={20} className="translate-x-0.5" />
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
                              className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded bg-black/80 hover:bg-blue-600 text-white border border-white/20 text-[9px] font-mono flex items-center gap-1 transition-all backdrop-blur-sm shadow-md cursor-pointer"
                              title={action.tooltip}
                            >
                              <ExternalLink size={9} />
                              <span>DRIVE HD</span>
                            </a>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-sm border border-zinc-700 text-zinc-400 text-[9px] font-mono uppercase px-2 py-0.5 rounded">
                        In Production
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      {/* Unboxed Metadata line */}
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <span className="text-blue-400 font-medium">{project.client}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.year}</span>
                        {project.tags?.[0] && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-zinc-400">{project.tags[0]}</span>
                          </>
                        )}
                      </div>

                      <h4 className={`text-base font-bold text-white line-clamp-1 ${!isUnclickable ? 'group-hover:text-blue-300 transition-colors' : ''}`}>
                        {project.title}
                      </h4>

                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      {!isUnclickable ? (
                        <>
                          <button
                            onClick={() => {
                              if (hasVideo) setActiveModalProject(project);
                              else {
                                setHeroProject(project);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Play size={13} />
                            <span>Watch Video</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setHeroProject(project);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
                              title="Set as Hero Spotlight"
                            >
                              <Tv size={14} />
                            </button>
                            <button
                              onClick={() => copyDirectProjectLink(project)}
                              className="text-zinc-400 hover:text-white p-1 transition-colors cursor-pointer"
                              title="Copy direct link"
                            >
                              <Share2 size={14} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between text-[11px] text-zinc-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock size={12} className="text-zinc-500" />
                            <span>In Production · Reel Pending</span>
                          </span>
                          <span className="text-zinc-600 font-mono text-[10px]">Archive</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* VALUE / EDITING SERVICES SECTION */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 sm:p-10 space-y-8">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-blue-400 mb-1">
              Editing DNA & Capabilities
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What I Bring To Your Production
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              High-retention editing engineered for brand conversion, social algorithm momentum, and broadcast polish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                01
              </div>
              <h4 className="text-sm font-bold text-white">Rhythmic Pacing</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Frame-accurate cuts synced to music beats and audio cues to maximize watch-time and hook retention.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
                02
              </div>
              <h4 className="text-sm font-bold text-white">Cinematic Color Grade</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Custom LUTs, film emulation (bleach bypass, Kodak tones), skin tone preservation, and REC709 balance.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                03
              </div>
              <h4 className="text-sm font-bold text-white">Spatial Sound Design</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Multi-layer SFX design, risers, whooshes, sub-hits, and vocal clarity tuning that bring visuals to life.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                04
              </div>
              <h4 className="text-sm font-bold text-white">Kinetic Motion & VFX</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Seamless rotoscoping, clean masking, kinetic typography, and motion overlays with zero fluff.
              </p>
            </div>
          </div>
        </section>

        {/* WORKSTATION PROMO BANNER */}
        <section className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-zinc-900 to-zinc-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold tracking-wide uppercase">
              <Sliders size={14} />
              <span>For Editors & Technical Directors</span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-white">
              Want to see the raw cuts, tracks, and 3D navigation?
            </h4>
            <p className="text-xs text-zinc-400 max-w-xl">
              Launch the full NLE Workstation featuring the 3D Discovery Sphere, live multi-track timeline, color grading simulation, and inspection meters.
            </p>
          </div>

          <button
            onClick={onSwitchToEditor}
            className="shrink-0 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 cursor-pointer"
          >
            <span>Open Editor Workstation</span>
            <ArrowRight size={15} />
          </button>
        </section>

        {/* CONTACT / HIRE SECTION */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              Ready To Create Something Great?
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Available for freelance commercials, brand campaigns, YouTube series, and viral short-form editing.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="mailto:ak4895931@gmail.com"
              className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/25"
            >
              <Mail size={16} />
              <span>Email: ak4895931@gmail.com</span>
            </a>
            <button
              onClick={copyEmail}
              className="py-3 px-5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Copy size={16} />
              <span>Copy Email Address</span>
            </button>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 px-6 py-8 mt-12 bg-[#08090c]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            <span>Ayush · Video Editor & Motion Architect · 2026 Portfolio</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onReturnToGateway} className="hover:text-zinc-300 transition-colors cursor-pointer">
              Role Gateway
            </button>
            <span className="text-zinc-700">·</span>
            <button onClick={onSwitchToEditor} className="hover:text-cyan-400 transition-colors cursor-pointer">
              Editor Workstation ⚡
            </button>
            <span className="text-zinc-700">·</span>
            <a href="mailto:ak4895931@gmail.com" className="hover:text-zinc-300 transition-colors">
              ak4895931@gmail.com
            </a>
          </div>
        </div>
      </footer>

      {/* THEATER VIDEO MODAL */}
      <AnimatePresence>
        {activeModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">{activeModalProject.title}</span>
                  <span className="text-xs text-zinc-500">·</span>
                  <span className="text-xs text-zinc-400">{activeModalProject.client}</span>
                  <span className="text-xs text-zinc-500">·</span>
                  <span className="text-xs text-blue-400 font-mono">{activeModalProject.duration}</span>
                </div>

                <div className="flex items-center gap-2">
                  {(() => {
                    const action = getDriveOrMailAction(activeModalProject);
                    return (
                      <a
                        href={action.url}
                        target={action.target}
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title={action.tooltip}
                      >
                        <ExternalLink size={13} />
                        <span>{action.isDrive ? 'Drive Link (Full HD)' : 'Request Full HD'}</span>
                      </a>
                    );
                  })()}
                  <button
                    onClick={() => copyDirectProjectLink(activeModalProject)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy direct link"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => setActiveModalProject(null)}
                    className="p-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Modal Video Player */}
              <div className="relative bg-black flex items-center justify-center aspect-video max-h-[60vh] overflow-hidden">
                {activeModalProject.videoUrl ? (
                  <video
                    src={activeModalProject.videoUrl}
                    poster={activeModalProject.thumbnail}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={activeModalProject.thumbnail}
                      alt={activeModalProject.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute text-center bg-black/60 p-4 rounded-xl backdrop-blur-sm">
                      <p className="text-xs text-zinc-300">High-Resolution Master Stored Locally</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Info Footer */}
              <div className="p-6 bg-zinc-900/60 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeModalProject.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono pt-1">
                    <span>Aspect: {activeModalProject.aspectRatio}</span>
                    <span>·</span>
                    <span>Grade Mode: {activeModalProject.idealGrade || 'REC709'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => {
                      setHeroProject(activeModalProject);
                      setActiveModalProject(null);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Tv size={14} />
                    <span>Set as Hero Reel</span>
                  </button>
                  <button
                    onClick={() => setActiveModalProject(null)}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Done Watching
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
