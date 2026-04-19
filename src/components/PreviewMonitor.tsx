import { PanelHeader, EditorButton } from './EditorUI';
import { Project, GradeMode, AspectRatio, SequencePart, EditorViewMode } from '../types';
import { Monitor, Play, SkipBack, SkipForward, Pause, RotateCcw, Volume2, VolumeX, Maximize, Settings, Crop, Smartphone, Monitor as MonitorIcon, Square, Move3d, Compass, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useRef, useEffect, memo } from 'react';
import { formatTimecode, parseDurationToSeconds } from '../lib/utils';
import { DiscoverySphere } from './DiscoverySphere';

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
  onReturnToDiscovery
}: PreviewMonitorProps) {
  const [sequenceRatio, setSequenceRatio] = useState<AspectRatio | 'AUTO'>('AUTO');
  const [isFreeRoam, setIsFreeRoam] = useState(false);
  const [freeRoamState, setFreeRoamState] = useState({ rotation: [0, 0, 0] as [number, number, number], zoom: 10 });
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const getFilter = (mode: GradeMode) => {
    switch(mode) {
      case 'LOG': return 'saturate(0.4) contrast(0.8) brightness(1.2) grayscale(0.1)';
      case 'BLEACH': return 'saturate(0.5) contrast(1.4) brightness(0.9) grayscale(0.2)';
      case 'CINEMA': return 'saturate(1.2) contrast(1.1) brightness(0.95) sepia(0.1) hue-rotate(-5deg)';
      case 'MONO': return 'grayscale(1) contrast(1.5) brightness(0.8)';
      default: return 'none';
    }
  };

  const getRatioClass = (ratio: AspectRatio) => {
    switch(ratio) {
      case '9:16': return 'aspect-[9/16] max-h-full max-w-full w-auto h-auto min-h-[50%]';
      case '1:1': return 'aspect-square max-h-full max-w-full w-auto h-auto min-h-[50%]';
      case '2.35:1': return 'aspect-[2.35/1] max-h-full max-w-full w-auto h-auto min-w-[50%]';
      case '8:3.5': return 'aspect-[8/3.5] max-h-full max-w-full w-auto h-auto min-w-[50%]';
      default: return 'aspect-video max-h-full max-w-full w-auto h-auto min-w-[50%]';
    }
  };

  const activeRatio = sequenceRatio === 'AUTO' ? (project?.aspectRatio || '16:9') : sequenceRatio;
  const totalDuration = project ? parseDurationToSeconds(project.duration) : 120;

  const currentPart = sequence?.find(p => currentTime >= p.start && currentTime < p.end);
  const monitorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      const drift = Math.abs(videoRef.current.currentTime - currentTime);
      // Only sync if strictly necessary (scrubbing or significant drift > 0.3s)
      if (drift > 0.3 || !isPlaying) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isPlaying]);

  const toggleFullscreen = () => {
    if (!monitorRef.current) return;
    if (!document.fullscreenElement) {
      void monitorRef.current.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  return (
    <div ref={monitorRef} className="h-full flex flex-col bg-black overflow-hidden relative">
      {viewMode !== 'DISCOVERY' && (
        <PanelHeader 
          title={`Program: ${project?.title || 'No Source'} [${activeRatio}]`} 
          icon={Monitor}
          actions={
            <div className="flex items-center gap-2">
              <button 
                onClick={onReturnToDiscovery}
                className="flex items-center gap-1.5 px-2 py-0.5 bg-editor-bg border border-editor-border rounded text-[9px] font-bold uppercase text-editor-muted hover:text-white transition-all hover:border-editor-accent"
              >
                 <ArrowLeft size={12} />
                 <span>Sphere</span>
              </button>
              <div className="flex bg-editor-bg border border-editor-border rounded p-0.5">
                 {[
                   { id: 'AUTO', icon: RotateCcw, label: 'Auto' },
                   { id: '16:9', icon: MonitorIcon, label: '16:9' },
                   { id: '9:16', icon: Smartphone, label: '9:16' },
                   { id: '1:1', icon: Square, label: '1:1' },
                   { id: '8:3.5', icon: Crop, label: '8:3.5' }
                 ].map(btn => (
                   <button
                     key={btn.id}
                     onClick={() => setSequenceRatio(btn.id as any)}
                     className={`p-1 rounded transition-all ${sequenceRatio === btn.id ? 'bg-editor-accent text-white' : 'text-editor-muted hover:text-white'}`}
                     title={btn.label}
                   >
                     <btn.icon size={12} />
                   </button>
                 ))}
              </div>
              <button 
                onClick={onToggleGuides}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${showGuides ? 'bg-editor-accent border-editor-accent text-white' : 'border-editor-border text-editor-muted hover:text-white'}`}
              >
                GUIDES
              </button>
            </div>
          }
        />
      )}
      
      <div className="relative flex-1 bg-[#020202] flex items-center justify-center overflow-hidden group/monitor cursor-crosshair">
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
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-300 backdrop-blur-md shadow-lg ${
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


        {/* --- DYNAMIC BACKGROUND TO FILL EMPTY SPACE --- */}
        <AnimatePresence>
          {project && (
            <motion.div 
               key={project.id + "-ambient"}
               initial={{ opacity: 0 }}
               animate={{ opacity: 0.3 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-0 overflow-hidden"
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

        {/* Scanline & Noise (Applied to whole area but subtle) */}
        <div className="scanline opacity-5" />
        <div className="noise-overlay" />

        {/* The Animated Camera Frame / Canvas */}
        <motion.div 
          layout
          className={`relative shadow-[0_0_120px_rgba(0,0,0,1)] border-2 border-white/10 overflow-hidden flex items-center justify-center transition-all duration-700 ease-in-out z-20 ${getRatioClass(activeRatio)}`}
          animate={{ scale: isPlaying ? [1, 1.005, 1] : 1 }}
        >
          {/* Safe Area Guides inside the frame */}
          {showGuides && (
            <div className="absolute inset-0 z-20 pointer-events-none border border-white/10 mx-[10%] my-[10%] opacity-30">
               <div className="absolute inset-[10%] border border-white/5" />
               <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5" />
               <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5" />
               {/* Center Cross */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white/40 flex items-center justify-center">
                 +
               </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {project ? (
              <motion.div 
                key={project.id + activeRatio}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full relative"
                style={{ filter: getFilter(gradeMode) }}
              >
                {project.videoUrl ? (
                  <video 
                    ref={videoRef}
                    src={project.videoUrl} 
                    className="w-full h-full object-contain bg-black"
                    playsInline
                    loop
                  />
                ) : (
                  <img 
                    src={project.thumbnail} 
                    alt={project.title} 
                    className="w-full h-full object-contain bg-black" 
                  />
                )}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3 opacity-20 select-none">
                <Monitor size={48} strokeWidth={1} />
                <span className="text-xs uppercase tracking-[0.2em] font-mono">No Source</span>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Play Overlay */}
        {!isPlaying && project && (
          <button 
            onClick={onTogglePlay}
            className="absolute inset-0 flex items-center justify-center group z-30"
          >
            <div className="w-24 h-24 rounded-full border border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-center group-hover:bg-editor-accent/20 group-hover:border-editor-accent group-hover:scale-110 transition-all duration-500">
               <div className="w-16 h-16 rounded-full bg-editor-accent flex items-center justify-center shadow-[0_0_30px_#0078d4]">
                  <Play size={32} className="text-white ml-1 fill-white" />
               </div>
            </div>
          </button>
        )}
        </>
      )}
      </div>

      {/* Transport Controls */}
      {viewMode !== 'DISCOVERY' && (
        <div className="bg-editor-panel border-t border-editor-border p-4 pt-3">
          {/* Timecode & Enhanced Progress */}
          <div className="flex items-center gap-6 px-2 mb-3">
            <span className="text-2xl font-mono text-editor-accent tabular-nums tracking-tighter">
              {formatTimecode(currentTime)}
            </span>
            <div className="flex-1 h-2 bg-editor-bg rounded-full relative cursor-pointer group">
               <div className="absolute inset-0 bg-white/5 rounded-full" />
               <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-editor-accent/40 to-editor-accent rounded-full transition-all duration-75" style={{ width: `${(currentTime / totalDuration) * 100}%` }} />
               <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-editor-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-1.5">
               <EditorButton icon={RotateCcw} tooltip="Reset Sequence" />
               <EditorButton 
                 icon={isMuted ? VolumeX : Volume2} 
                 tooltip={isMuted ? "Unmute" : "Mute"} 
                 onClick={() => setIsMuted(!isMuted)}
                 active={!isMuted}
               />
            </div>
            <div className="flex items-center gap-5">
               <EditorButton icon={SkipBack} />
               <button 
                 onClick={onTogglePlay}
                 className="w-11 h-11 rounded-full bg-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl group"
               >
                 {isPlaying ? 
                   <Pause size={22} className="text-black group-hover:text-editor-accent transition-colors" /> : 
                   <Play size={22} className="text-black ml-1 group-hover:text-editor-accent transition-colors" />
                 }
               </button>
               <EditorButton icon={SkipForward} />
            </div>
            <div className="flex items-center gap-1.5">
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
