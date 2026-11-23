import { PanelHeader, EditorButton } from './EditorUI';
import { Project, GradeMode, AspectRatio, SequencePart, EditorViewMode } from '../types';
import { Monitor, Play, SkipBack, SkipForward, Pause, RotateCcw, Volume2, VolumeX, Maximize, Settings, Crop, Smartphone, Monitor as MonitorIcon, Square, Move3d, ArrowLeft, Minimize2, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { formatTimecode, parseDurationToSeconds } from '../lib/utils';
import { DiscoverySphere } from './DiscoverySphere';
import { getDriveOrMailAction } from '../constants';

interface PreviewMonitorProps {
  project?: Project;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  gradeMode: GradeMode;
  showGuides: boolean;
  onToggleGuides: () => void;
  sequence?: SequencePart[];
  viewMode: EditorViewMode;
  onSelectProject: (p: Project) => void;
  onReturnToDiscovery: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  onSeek?: (time: number) => void;
}

export const PreviewMonitor = memo(function PreviewMonitor({
  project,
  currentTime,
  isPlaying,
  onTogglePlay,
  gradeMode,
  showGuides,
  onToggleGuides,
  sequence,
  viewMode,
  onSelectProject,
  onReturnToDiscovery,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
  onSeek
}: PreviewMonitorProps) {
  const [sequenceRatio, setSequenceRatio] = useState<AspectRatio | 'AUTO'>('AUTO');
  const [isFreeRoam, setIsFreeRoam] = useState(false);
  const [freeRoamState] = useState({ rotation: [0, 0, 0] as [number, number, number], zoom: 10 });
  const [isFullscreenInternal, setIsFullscreenInternal] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  const monitorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef(currentTime);
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);
  const volumeRef = useRef(volume);

  currentTimeRef.current = currentTime;
  isPlayingRef.current = isPlaying;
  isMutedRef.current = isMuted;
  volumeRef.current = volume;

  const getFilter = (mode: GradeMode) => {
    switch (mode) {
      case 'LOG': return 'saturate(0.4) contrast(0.8) brightness(1.2) grayscale(0.1)';
      case 'BLEACH': return 'saturate(0.5) contrast(1.4) brightness(0.9) grayscale(0.2)';
      case 'CINEMA': return 'saturate(1.2) contrast(1.1) brightness(0.95) sepia(0.1) hue-rotate(-5deg)';
      case 'MONO': return 'grayscale(1) contrast(1.5) brightness(0.8)';
      default: return 'none';
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenInternal(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Reset buffering/error state whenever the active video changes
  useEffect(() => {
    if (project?.videoUrl && viewMode !== 'DISCOVERY') {
      setIsBuffering(true);
      setHasVideoError(false);
    } else {
      setIsBuffering(false);
      setHasVideoError(false);
    }
  }, [project?.id, project?.videoUrl, viewMode]);

  const getRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '9:16': return 'aspect-[9/16] h-full max-h-full max-w-full';
      case '1:1': return 'aspect-square h-full max-h-full max-w-full';
      case '2.35:1': return 'aspect-[2.35/1] w-full max-w-full max-h-full';
      case '8:3.5': return 'aspect-[8/3.5] w-full max-w-full max-h-full';
      default: return 'aspect-video w-full max-w-full max-h-full';
    }
  };

  const activeRatio = sequenceRatio === 'AUTO' ? (project?.aspectRatio || '16:9') : sequenceRatio;
  const totalDuration = project ? parseDurationToSeconds(project.duration) : 120;

  const safePlay = useCallback((video: HTMLVideoElement) => {
    video.muted = isMutedRef.current;
    video.volume = volumeRef.current;
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err) => {
        // If browser blocks unmuted autoplay, fallback cleanly to muted playback
        if (err?.name === 'NotAllowedError' && !video.muted) {
          video.muted = true;
          onToggleMute();
          video.play().catch(() => {});
        }
      });
    }
  }, [onToggleMute]);

  // Sync play/pause whenever isPlaying, project, or viewMode changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || viewMode === 'DISCOVERY' || !project?.videoUrl) return;

    if (isPlaying) {
      safePlay(video);
    } else {
      video.pause();
    }
  }, [isPlaying, project?.id, project?.videoUrl, viewMode, safePlay]);

  // Sync mute & volume whenever audio state or project changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
    video.volume = volume;
  }, [isMuted, volume, project?.id, project?.videoUrl, viewMode]);

  // Sync timeline currentTime to video WITHOUT interrupting buffering
  useEffect(() => {
    const video = videoRef.current;
    if (!video || viewMode === 'DISCOVERY' || !project?.videoUrl) return;
    if (video.readyState < 1 || video.seeking) return;

    const maxTime = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : totalDuration;
    const targetTime = Math.max(0, Math.min(currentTime, Math.max(0, maxTime - 0.05)));
    const drift = Math.abs(video.currentTime - targetTime);

    if (!isPlaying) {
      // When paused/scrubbing, seek accurately once metadata is loaded
      if (drift > 0.1) {
        video.currentTime = targetTime;
      }
    } else {
      // During playback, ONLY force-seek when video has data ready AND drift is large
      // (e.g., manual timeline click or V1/V2 smart-skip jump), never while buffering!
      if (video.readyState >= 3 && !video.paused && drift > 1.2) {
        video.currentTime = targetTime;
      }
    }
  }, [currentTime, isPlaying, totalDuration, viewMode, project?.videoUrl]);

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMutedRef.current;
    video.volume = volumeRef.current;
    const maxTime = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : totalDuration;
    const targetTime = Math.max(0, Math.min(currentTimeRef.current, Math.max(0, maxTime - 0.05)));
    if (targetTime > 0.15 && Math.abs(video.currentTime - targetTime) > 0.15) {
      video.currentTime = targetTime;
    }
  };

  const handleVideoCanPlay = () => {
    setIsBuffering(false);
    setHasVideoError(false);
    const video = videoRef.current;
    if (!video) return;
    if (isPlayingRef.current && video.paused) {
      safePlay(video);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * totalDuration;
    onSeek(newTime);
    if (videoRef.current && videoRef.current.readyState >= 1) {
      const maxTime = Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0 ? videoRef.current.duration : totalDuration;
      videoRef.current.currentTime = Math.max(0, Math.min(newTime, Math.max(0, maxTime - 0.05)));
    }
  };

  const handleReset = () => {
    if (onSeek) onSeek(0);
    if (videoRef.current && videoRef.current.readyState >= 1) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleSkip = (deltaSeconds: number) => {
    const target = Math.max(0, Math.min(totalDuration, currentTime + deltaSeconds));
    if (onSeek) onSeek(target);
    if (videoRef.current && videoRef.current.readyState >= 1) {
      const maxTime = Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0 ? videoRef.current.duration : totalDuration;
      videoRef.current.currentTime = Math.max(0, Math.min(target, Math.max(0, maxTime - 0.05)));
    }
  };

  const toggleFullscreen = () => {
    if (!monitorRef.current) return;
    if (!document.fullscreenElement) {
      void monitorRef.current.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  const progressPercent = Math.min(100, Math.max(0, (currentTime / Math.max(1, totalDuration)) * 100));

  return (
    <div ref={monitorRef} className={`h-full flex flex-col bg-black overflow-hidden relative ${isFullscreenInternal ? 'p-0' : ''}`}>
      {viewMode !== 'DISCOVERY' && !isFullscreenInternal && (
        <PanelHeader
          title={project?.title || 'No Source'}
          icon={Monitor}
          actions={
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={onReturnToDiscovery}
                className="flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 bg-editor-bg border border-editor-border rounded text-[8px] md:text-[9px] font-bold uppercase text-editor-muted hover:text-white transition-all hover:border-editor-accent cursor-pointer"
              >
                <ArrowLeft size={10} className="md:w-3 md:h-3" />
                <span>Sphere</span>
              </button>
              <div className="flex bg-editor-bg border border-editor-border rounded p-0.5 scale-90 md:scale-100 origin-right">
                {[
                  { id: 'AUTO', icon: RotateCcw, label: 'Auto' },
                  { id: '16:9', icon: MonitorIcon, label: '16:9' },
                  { id: '9:16', icon: Smartphone, label: '9:16' },
                  { id: '1:1', icon: Square, label: '1:1' },
                  { id: '8:3.5', icon: Crop, label: '8:3.5' }
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setSequenceRatio(btn.id as AspectRatio | 'AUTO')}
                    className={`p-1 rounded transition-all cursor-pointer ${sequenceRatio === btn.id ? 'bg-editor-accent text-white' : 'text-editor-muted hover:text-white'}`}
                    title={btn.label}
                  >
                    <btn.icon size={11} />
                  </button>
                ))}
              </div>
              {project && (() => {
                const action = getDriveOrMailAction(project);
                return (
                  <a
                    href={action.url}
                    target={action.target}
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 rounded text-[8px] md:text-[9px] font-bold uppercase text-blue-300 hover:text-white transition-all shadow-sm"
                    title={action.tooltip}
                  >
                    <ExternalLink size={10} />
                    <span>{action.isDrive ? 'Drive Full HD' : 'Drive HD'}</span>
                  </a>
                );
              })()}
              <button
                onClick={onToggleGuides}
                className={`text-[8px] md:text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${showGuides ? 'bg-editor-accent border-editor-accent text-white' : 'border-editor-border text-editor-muted hover:text-white'}`}
              >
                GUIDES
              </button>
            </div>
          }
        />
      )}

      <div className="relative flex-1 min-h-0 bg-[#020202] flex items-center justify-center overflow-hidden group/monitor">
        {viewMode === 'DISCOVERY' ? (
          <>
            <DiscoverySphere
              currentTime={currentTime}
              totalDuration={100}
              onSelectProject={onSelectProject}
              selectedProject={null}
              isFreeRoam={isFreeRoam}
              freeRoamState={freeRoamState}
            />

            {/* Free Roam Toggle Button - Discovery specific UI */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
              <button
                onClick={() => setIsFreeRoam(!isFreeRoam)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-300 backdrop-blur-md shadow-lg cursor-pointer ${
                  isFreeRoam
                    ? 'bg-editor-accent border-editor-accent text-white shadow-editor-accent/40 scale-105'
                    : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                <Move3d size={14} className={isFreeRoam ? 'animate-pulse' : ''} />
                <span>Free Roam {isFreeRoam ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Ambient background */}
            <AnimatePresence>
              {project && (
                <motion.div
                  key={project.id + '-ambient'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                >
                  <img
                    src={project.thumbnail}
                    className="w-full h-full object-cover blur-[80px] scale-110 saturate-150"
                    alt="ambient"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scanline & Noise */}
            <div className="scanline opacity-5 pointer-events-none" />
            <div className="noise-overlay pointer-events-none" />

            {/* Camera Frame Wrapper with bounded padding so aspect box never collapses */}
            <div className="relative z-20 w-full h-full p-2 md:p-4 flex items-center justify-center min-h-0 min-w-0">
              <div
                className={`relative bg-black shadow-[0_0_120px_rgba(0,0,0,1)] border-2 border-white/10 overflow-hidden flex items-center justify-center transition-all duration-300 ${getRatioClass(activeRatio)}`}
              >
                {/* Safe Area Guides inside the frame */}
                {showGuides && (
                  <div className="absolute inset-0 z-20 pointer-events-none border border-white/10 mx-[10%] my-[10%] opacity-30">
                    <div className="absolute inset-[10%] border border-white/5" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white/40 flex items-center justify-center">
                      +
                    </div>
                  </div>
                )}

                {project ? (
                  <div
                    className="absolute inset-0 w-full h-full bg-black"
                    style={{ filter: getFilter(gradeMode) }}
                  >
                    {project.videoUrl && !hasVideoError ? (
                      <video
                        key={`${project.id}-${project.videoUrl}`}
                        ref={videoRef}
                        src={project.videoUrl.toLowerCase().endsWith('.mov') ? undefined : project.videoUrl}
                        poster={project.thumbnail}
                        preload="auto"
                        muted={isMuted}
                        playsInline
                        loop
                        onClick={onTogglePlay}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onLoadedData={() => setIsBuffering(false)}
                        onCanPlay={handleVideoCanPlay}
                        onPlaying={() => {
                          setIsBuffering(false);
                          setHasVideoError(false);
                        }}
                        onWaiting={() => setIsBuffering(true)}
                        onError={() => {
                          setIsBuffering(false);
                          setHasVideoError(true);
                        }}
                        className="absolute inset-0 w-full h-full object-contain bg-black cursor-pointer"
                      >
                        {project.videoUrl.toLowerCase().endsWith('.mov') && (
                          <>
                            <source src={project.videoUrl} type="video/mp4" />
                            <source
                              src={project.videoUrl}
                              type="video/quicktime"
                              onError={() => {
                                setIsBuffering(false);
                                setHasVideoError(true);
                              }}
                            />
                          </>
                        )}
                      </video>
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="w-full h-full object-contain bg-black"
                        />
                        {hasVideoError && (() => {
                          const action = getDriveOrMailAction(project);
                          return (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-30">
                              <AlertCircle size={28} className="text-blue-400" />
                              <p className="text-xs text-zinc-200 font-medium max-w-xs">
                                This format ({project.videoUrl?.split('.').pop()?.toUpperCase()}) is not natively supported by this browser.
                              </p>
                              <a
                                href={action.url}
                                target={action.target}
                                rel="noopener noreferrer"
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <ExternalLink size={12} />
                                <span>{action.isDrive ? 'Watch Full HD in Drive' : 'Request Full HD Link'}</span>
                              </a>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Subtle buffering indicator */}
                    {isBuffering && !hasVideoError && project.videoUrl && (
                      <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/30 pointer-events-none">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 border border-white/15 text-xs font-mono text-zinc-200 backdrop-blur-md">
                          <Loader2 size={14} className="animate-spin text-blue-400" />
                          <span>Loading video…</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 opacity-20 select-none">
                    <Monitor size={48} strokeWidth={1} />
                    <span className="text-xs uppercase tracking-[0.2em] font-mono">No Source</span>
                  </div>
                )}
              </div>
            </div>

            {/* Play Overlay */}
            {!isPlaying && project && !hasVideoError && (
              <button
                onClick={onTogglePlay}
                className="absolute inset-0 flex items-center justify-center group z-30 cursor-pointer"
                aria-label="Play video"
              >
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-white/15 bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-editor-accent/20 group-hover:border-editor-accent group-hover:scale-110 transition-all duration-300">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-editor-accent flex items-center justify-center shadow-[0_0_30px_#0078d4]">
                    <Play size={28} className="text-white ml-1 fill-white" />
                  </div>
                </div>
              </button>
            )}

            {/* Fullscreen HUD Overlay */}
            {isFullscreenInternal && (
              <div className="absolute inset-x-0 bottom-0 z-40 p-4 pb-8 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono text-white tabular-nums drop-shadow-lg">
                    {formatTimecode(currentTime)}
                  </span>
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer">
                      {isPlaying ? <Pause size={20} fill="white" className="text-white" /> : <Play size={20} fill="white" className="text-white ml-1" />}
                    </button>
                    <button onClick={toggleFullscreen} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 text-white cursor-pointer">
                      <Minimize2 size={20} />
                    </button>
                  </div>
                </div>
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-editor-accent transition-all duration-75" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transport Controls */}
      {viewMode !== 'DISCOVERY' && !isFullscreenInternal && (
        <div className="bg-editor-panel border-t border-editor-border p-2 md:p-4 pt-1 md:pt-3">
          {/* Timecode & Enhanced Progress */}
          <div className="flex items-center gap-3 md:gap-6 px-1 md:px-2 mb-1.5 md:mb-3">
            <span className="text-lg md:text-2xl font-mono text-editor-accent tabular-nums tracking-tighter">
              {formatTimecode(currentTime)}
            </span>
            <div
              ref={progressBarRef}
              onClick={handleProgressClick}
              className="flex-1 h-1.5 md:h-2 bg-editor-bg rounded-full relative cursor-pointer group"
            >
              <div className="absolute inset-0 bg-white/5 rounded-full" />
              <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-editor-accent/40 to-editor-accent rounded-full transition-all duration-75" style={{ width: `${progressPercent}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 md:w-4 h-3 md:h-4 bg-white border border-editor-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between px-2 md:px-4">
            <div className="flex items-center gap-1 md:gap-1.5">
              <div className="hidden md:block">
                <EditorButton icon={RotateCcw} tooltip="Reset Sequence" onClick={handleReset} />
              </div>
              <EditorButton
                icon={isMuted ? VolumeX : Volume2}
                tooltip={isMuted ? 'Unmute' : 'Mute'}
                onClick={onToggleMute}
                active={!isMuted}
              />
            </div>
            <div className="flex items-center gap-4 md:gap-5 scale-90 md:scale-100">
              <EditorButton icon={SkipBack} size={18} tooltip="Back 5s" onClick={() => handleSkip(-5)} />
              <button
                onClick={onTogglePlay}
                className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl group cursor-pointer"
              >
                {isPlaying ?
                  <Pause size={18} className="text-black md:w-5 md:h-5 group-hover:text-editor-accent transition-colors" /> :
                  <Play size={18} className="text-black ml-0.5 md:ml-1 md:w-5 md:h-5 group-hover:text-editor-accent transition-colors" />
                }
              </button>
              <EditorButton icon={SkipForward} size={18} tooltip="Forward 5s" onClick={() => handleSkip(5)} />
            </div>
            <div className="flex items-center gap-1 md:gap-1.5">
              <EditorButton icon={Settings} tooltip="Project Settings" />
              <EditorButton
                icon={Maximize}
                tooltip="Preview Full Screen"
                onClick={toggleFullscreen}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
