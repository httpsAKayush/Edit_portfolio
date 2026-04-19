import { PanelHeader, EditorButton } from './EditorUI';
import { Scissors, MousePointer2, Type, Layers, Magnet, Ruler, ZoomIn, ZoomOut, Eye, EyeOff, Play, Pause, RotateCcw, Lock, Unlock } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useRef, useState, useEffect, memo } from 'react';
import { Project, SequencePart, EditorViewMode, EditorTool } from '../types';
import { PROJECTS } from '../constants';
import { formatTimecode, parseDurationToSeconds } from '../lib/utils';

interface TimelineProps {
  viewMode: EditorViewMode;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  sequence?: SequencePart[];
  visibleTracks?: Set<string>;
  onToggleTrack?: (id: string) => void;
  project?: Project;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  selectedTool?: EditorTool;
  onSelectTool?: (tool: string) => void;
  onSplit?: (time?: number) => void;
  onUpdatePart?: (partId: string, updates: Partial<SequencePart>) => void;
  onResetTimeline?: () => void;
  onSaveCheckpoint?: () => void;
  onRestoreCheckpoint?: () => void;
  hasCheckpoint?: boolean;
  isLocked?: boolean;
}

export const Timeline = memo(function Timeline({ 
  viewMode, 
  currentTime, 
  onTimeUpdate, 
  sequence, 
  visibleTracks = new Set(['V1', 'V2']), 
  onToggleTrack, 
  project, 
  isPlaying, 
  onTogglePlay,
  selectedTool = 'SELECT',
  onSelectTool,
  onSplit,
  onUpdatePart,
  onResetTimeline,
  onSaveCheckpoint,
  onRestoreCheckpoint,
  hasCheckpoint,
  isLocked
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(0); // 0 = Fit, 1 = Max Zoom
  const [containerWidth, setContainerWidth] = useState(0);
  const totalDuration = viewMode === 'DISCOVERY' ? 100 : (project ? parseDurationToSeconds(project.duration) : 100);
  
  // Track container width for adaptive fitting
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      setContainerWidth(containerRef.current?.clientWidth || 0);
    };
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    updateWidth();
    return () => observer.disconnect();
  }, []);

  // Calculate pixels per second based on "Fit" logic
  // At zoom = 0, the entire duration fits the viewport (with a bit of padding)
  const fitPixelsPerSecond = containerWidth > 100 ? (containerWidth - 100) / totalDuration : 10;
  const pixelsPerSecond = fitPixelsPerSecond * Math.pow(5, zoom * 2.5); 
  const totalWidth = Math.max(containerWidth, totalDuration * pixelsPerSecond + 100);
  
  const tracksRef = useRef<HTMLDivElement>(null);

  // Dynamic Ruler Intervals Logic
  const CANDIDATE_INTERVALS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600];
  const minLabelSpacing = 100;
  const rulerInterval = CANDIDATE_INTERVALS.find(i => i * pixelsPerSecond >= minLabelSpacing) || 3600;

  // Zoom to Playhead Logic
  const handleZoomChange = (newZoom: number) => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const oldPixelsPerSecond = pixelsPerSecond;
    
    // Zoom to Playhead Logic
    const nextPixelsPerSecond = fitPixelsPerSecond * Math.pow(5, newZoom * 2.5);
    
    // The user wants to zoom around the playhead (currentTime)
    // We calculate how far the playhead is from the left edge of the visible area
    const playheadPx = currentTime * oldPixelsPerSecond;
    const playheadOffset = playheadPx - container.scrollLeft;

    setZoom(newZoom);
    
    requestAnimationFrame(() => {
      // We want to keep the playhead at the same offset after the zoom
      const newPlayheadPx = currentTime * nextPixelsPerSecond;
      container.scrollLeft = newPlayheadPx - playheadOffset;
    });
  };

  // Shortcut for zooming with Alt + Mouse Wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        const delta = -e.deltaY;
        const zoomStep = 0.05;
        const nextZoom = Math.min(1, Math.max(0, zoom + (delta > 0 ? zoomStep : -zoomStep)));
        handleZoomChange(nextZoom);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [zoom, pixelsPerSecond, fitPixelsPerSecond]);

  const isV1Visible = visibleTracks.has('V1');
  const isV2Visible = visibleTracks.has('V2');

  const v1Parts = sequence?.filter(p => p.type === 'NORMAL') || [];
  const v2Parts = sequence?.filter(p => p.type === 'HIGHLIGHT') || [];

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [mouseTime, setMouseTime] = useState<number | null>(null);
  const [resizingPart, setResizingPart] = useState<{ id: string, edge: 'left' | 'right' } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isLocked) {
      if ((e.target as HTMLElement).closest('.resize-handle')) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setIsScrubbing(true);
      updateTimeFromPointer(e.clientX);
      return;
    }
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsScrubbing(true);
    updateTimeFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isLocked) {
      if (isScrubbing) {
        updateTimeFromPointer(e.clientX);
      }
      return;
    }
    if (resizingPart && tracksRef.current && sequence) {
       const rect = tracksRef.current.getBoundingClientRect();
       const x = e.clientX - rect.left + containerRef.current!.scrollLeft;
       const time = Math.max(0, x / pixelsPerSecond);
       const part = sequence.find(p => p.id === resizingPart.id);
       if (part) {
          if (resizingPart.edge === 'left') {
             onUpdatePart?.(resizingPart.id, { start: Math.min(time, part.end - 0.1) });
          } else {
             onUpdatePart?.(resizingPart.id, { end: Math.max(time, part.start + 0.1) });
          }
       }
       return;
    }

    if (isScrubbing) {
      updateTimeFromPointer(e.clientX);
    }
    
    if (selectedTool === 'RAZOR' && tracksRef.current) {
      const rect = tracksRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current!.scrollLeft;
      setMouseTime(x / pixelsPerSecond);
    } else {
      setMouseTime(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsScrubbing(false);
    setResizingPart(null);
  };

  const startResizing = (e: React.PointerEvent, id: string, edge: 'left' | 'right') => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setResizingPart({ id, edge });
  };

  const updateTimeFromPointer = (clientX: number) => {
    if (!tracksRef.current || !containerRef.current) return;
    const rect = tracksRef.current.getBoundingClientRect();
    const x = clientX - rect.left + containerRef.current.scrollLeft;
    
    // For DISCOVERY mode, allow seamless wrapping for a "perfect loop" feel
    if (viewMode === 'DISCOVERY') {
       let progress = x / (totalDuration * pixelsPerSecond);
       // Continuous wrapping: if progress is 1.1, wrap to 0.1
       const wrappedProgress = ((progress % 1) + 1) % 1;
       onTimeUpdate(wrappedProgress * totalDuration);
    } else {
       const time = x / pixelsPerSecond;
       onTimeUpdate(Math.min(totalDuration, Math.max(0, time)));
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.playhead-handle')) return;
    
    // We need to check if the click was on the tracks area
    if (tracksRef.current && containerRef.current) {
      const rect = tracksRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;
      const time = x / pixelsPerSecond;
      
      if (selectedTool === 'RAZOR') {
        if (!isLocked) onSplit?.(time);
      } else {
        onTimeUpdate(Math.min(totalDuration, Math.max(0, time)));
      }
    }
  };

  const formatTimeLabel = (val: number) => {
    if (viewMode === 'DISCOVERY') return `${val}%`;
    return formatTimecode(val);
  };

  return (
    <div 
      className="h-full flex flex-col bg-editor-timeline border-t border-editor-border"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <PanelHeader 
        title={viewMode === 'DISCOVERY' ? 'Discovery: Spatial Path [PROXIMITY_MAPPING]' : 'Sequence: Portfolio_V4_MASTER'} 
        icon={Layers}
        actions={
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 border-r border-editor-border pr-3">
                <button 
                  onClick={onSaveCheckpoint}
                  className="px-2 py-0.5 bg-editor-panel border border-editor-border text-white rounded text-[9px] font-bold uppercase hover:bg-editor-accent/20 transition-all active:scale-95"
                  title="Save Current State"
                >
                  Save
                </button>
                <button 
                  onClick={onRestoreCheckpoint}
                  disabled={!hasCheckpoint}
                  className={`px-2 py-0.5 border text-white rounded text-[9px] font-bold uppercase transition-all active:scale-95 ${
                    hasCheckpoint 
                      ? 'bg-editor-panel border-editor-border hover:bg-editor-accent/20 cursor-pointer' 
                      : 'bg-black/20 border-white/5 opacity-30 cursor-not-allowed'
                  }`}
                  title="Restore to Last Checkpoint"
                >
                  Checkpoint
                </button>
                <button 
                  onClick={onResetTimeline}
                  className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded text-[9px] font-bold uppercase hover:bg-red-500/20 active:scale-95 transition-all"
                  title="Factory Reset (Clear all changes)"
                >
                  <RotateCcw size={10} />
                  <span>Reset</span>
                </button>
             </div>
             {viewMode === 'DISCOVERY' && (
               <div className="flex items-center gap-1.5 border-r border-editor-border pr-3">
                  <button 
                    onClick={() => onTimeUpdate(0)}
                    className="p-1 text-editor-muted hover:text-white transition-colors"
                  >
                    <RotateCcw size={12} />
                  </button>
                  <button 
                    onClick={onTogglePlay}
                    className="flex items-center gap-1.5 px-2 py-0.5 bg-editor-accent text-white rounded text-[9px] font-bold uppercase shadow-[0_0_10px_#0078d4] hover:brightness-110 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause size={10} /> : <Play size={10} />}
                    <span>{isPlaying ? 'Pause' : 'Play Path'}</span>
                  </button>
               </div>
             )}
             <div className="flex items-center gap-1 bg-editor-bg px-1.5 py-0.5 rounded border border-editor-border text-[10px]">
                {isLocked ? (
                  <div className="flex items-center gap-1 text-red-500 animate-pulse">
                    <Lock size={10} />
                    <span className="font-bold">LOCKED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-500">
                    <Unlock size={10} />
                    <span className="font-bold">ACTIVE</span>
                  </div>
                )}
             </div>
             <div className="flex items-center gap-1 bg-editor-bg px-1.5 py-0.5 rounded border border-editor-border text-[10px] text-editor-muted">
                <Magnet size={10} className="text-editor-accent shadow-[0_0_5px_#0078d4]" />
                <span className="font-bold">SNAPPING: ON</span>
             </div>
             <div className="flex items-center gap-2 group/zoom">
                <button 
                  onClick={() => handleZoomChange(Math.max(0, zoom - 0.1))}
                  className="hover:scale-110 transition-transform"
                >
                  <ZoomOut size={12} className="text-editor-muted hover:text-white cursor-pointer" />
                </button>
                <div className="w-24 h-1 bg-editor-bg rounded-full relative group-hover/zoom:h-1.5 transition-all">
                   <input 
                     type="range"
                     min="0"
                     max="1"
                     step="0.01"
                     value={zoom}
                     onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                     className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                   />
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 h-full bg-editor-accent rounded-full transition-all duration-300" 
                     style={{ width: `${zoom * 100}%` }}
                   />
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-editor-accent shadow-lg pointer-events-none transition-all duration-300" 
                     style={{ left: `${zoom * 100}%`, transform: 'translate(-50%, -50%)' }}
                   />
                </div>
                <button 
                  onClick={() => handleZoomChange(Math.min(1, zoom + 0.1))}
                  className="hover:scale-110 transition-transform"
                >
                  <ZoomIn size={12} className="text-editor-muted hover:text-white cursor-pointer" />
                </button>
             </div>
          </div>
        }
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Tool Sidebar */}
        {viewMode !== 'DISCOVERY' && (
          <div className="w-10 border-r border-editor-border bg-editor-panel flex flex-col items-center py-3 gap-1.5 flex-shrink-0 z-30 shadow-xl overflow-hidden relative">
             {isLocked && (
               <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-[2px]">
                 <Lock size={12} className="text-white/40" />
               </div>
             )}
             <EditorButton 
               icon={MousePointer2} 
               active={selectedTool === 'SELECT'} 
               onClick={() => !isLocked && onSelectTool?.('SELECT')}
               tooltip={isLocked ? "Editing Locked" : "Selection Tool (V)"} 
             />
             <EditorButton 
               icon={Scissors} 
               active={selectedTool === 'RAZOR'} 
               onClick={() => !isLocked && onSelectTool?.('RAZOR')}
               tooltip={isLocked ? "Editing Locked" : "Razor Blade (C)"} 
             />
             <EditorButton 
               icon={Ruler} 
               active={selectedTool === 'STRETCH'} 
               onClick={() => !isLocked && onSelectTool?.('STRETCH')}
               tooltip={isLocked ? "Editing Locked" : "Rate Stretch (R)"} 
             />
             <EditorButton 
               icon={Type} 
               active={selectedTool === 'TEXT'} 
               onClick={() => !isLocked && onSelectTool?.('TEXT')}
               tooltip={isLocked ? "Editing Locked" : "Type Tool (T)"} 
             />
          </div>
        )}

        {/* --- TRACK HEADERS (Fixed Left) --- */}
        <div className="w-24 border-r border-editor-border bg-editor-panel flex flex-col flex-shrink-0 z-20 overflow-hidden shadow-r-lg">
           {/* Header Header Spacer */}
           <div className="h-7 bg-editor-panel border-b border-editor-border/50 flex items-center px-2">
              <span className="text-[8px] font-black text-editor-muted tracking-widest uppercase">Tracks</span>
           </div>
           
           {viewMode === 'DISCOVERY' ? (
              <div className="h-16 border-b border-white/5 flex flex-col justify-center px-3 transition-opacity">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-3 bg-editor-accent rounded-full shadow-[0_0_8px_#0078d4]" />
                    <span className="text-[10px] font-black text-editor-accent">PATH</span>
                 </div>
                 <span className="text-[9px] truncate uppercase tracking-widest text-editor-muted mt-1 font-bold">Guided Mode</span>
              </div>
           ) : (
              <>
                 {/* V2 Header */}
                 <div className={`h-16 border-b border-white/5 flex flex-col justify-center px-3 transition-opacity duration-300 ${!isV2Visible ? 'opacity-30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3 bg-editor-accent rounded-full shadow-[0_0_8px_#0078d4] animate-pulse" />
                        <span className="text-[10px] font-black text-sky-400">V2</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleTrack?.('V2'); }}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      >
                         {isV2Visible ? <Eye size={10} className="text-editor-accent" /> : <EyeOff size={10} className="text-editor-muted" />}
                      </button>
                    </div>
                    <span className="text-[9px] truncate uppercase tracking-widest text-editor-muted mt-1 font-bold">Main Edit</span>
                 </div>

                 {/* V1 Header */}
                 <div className={`h-16 border-b border-white/5 flex flex-col justify-center px-3 transition-opacity duration-300 ${!isV1Visible ? 'opacity-30' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-3 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                        <span className="text-[10px] font-black text-emerald-400">V1</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleTrack?.('V1'); }}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      >
                         {isV1Visible ? <Eye size={10} className="text-editor-accent" /> : <EyeOff size={10} className="text-editor-muted" />}
                      </button>
                    </div>
                    <span className="text-[9px] truncate uppercase tracking-widest text-emerald-500/60 mt-1">Normal Flow</span>
                 </div>
              </>
           )}

           {/* Audio Header */}
        </div>

        {/* --- SCROLLABLE TIMELINE CONTENT (Ruler + Tracks) --- */}
        <div 
          ref={containerRef}
          className={`flex-1 overflow-x-auto overflow-y-hidden relative bg-editor-bg/30 select-none scrollbar-hide ${selectedTool === 'RAZOR' ? 'cursor-none' : 'cursor-crosshair'}`}
          onScroll={(e) => {
            if (tracksRef.current && e.currentTarget) {
              // Syncing potential separate headers if we had them, 
              // but here we just ensure the layout stays clean
            }
          }}
        >
           <div ref={tracksRef} className="relative" style={{ width: totalWidth }}>
              {/* Time Ruler */}
              <div className="h-7 border-b border-editor-border bg-editor-panel/70 flex items-center relative z-10" onClick={handleTimelineClick}>
                 {Array.from({ length: Math.ceil(totalDuration / rulerInterval) + 1 }).map((_, i) => (
                   <div 
                     key={i} 
                     className="absolute top-0 bottom-0 border-l border-editor-border/40 group pointer-events-none"
                     style={{ left: i * rulerInterval * pixelsPerSecond }}
                   >
                      <div className="h-2 w-px bg-white/50" />
                      <span className="absolute left-1 bottom-0.5 text-[9px] font-mono text-editor-muted tracking-tighter tabular-nums">
                        {formatTimeLabel(i * rulerInterval)}
                      </span>
                      
                      {/* Optional Sub-ticks for extra polish if interval is not too small */}
                      {rulerInterval > 0.5 && [1,2,3,4].map(t => (
                        <div 
                          key={t}
                          className="absolute top-0 h-1 w-px bg-white/10"
                          style={{ left: (t * rulerInterval / 5) * pixelsPerSecond }}
                        />
                      ))}
                   </div>
                 ))}
              </div>

              {/* Tracks Layout */}
              <div 
                className="flex flex-col h-full pb-12 relative" 
                onClick={handleTimelineClick}
                onPointerLeave={() => setMouseTime(null)}
              >
                 {selectedTool === 'RAZOR' && mouseTime !== null && viewMode === 'EDITOR' && (
                   <div 
                     className="absolute top-0 bottom-0 w-[1px] bg-sky-400 pointer-events-none z-50 flex flex-col items-center shadow-[0_0_10px_#0078d4]"
                     style={{ 
                       left: mouseTime * pixelsPerSecond
                     }}
                   >
                     <div className="bg-sky-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-sm absolute top-0 -translate-y-full whitespace-nowrap">
                       SPLIT @ {formatTimecode(mouseTime)}
                     </div>
                     <div className="absolute top-0 w-3 h-3 border-l border-t border-sky-400 -translate-x-1/2" />
                     <div className="absolute bottom-12 w-3 h-3 border-l border-b border-sky-400 -translate-x-1/2" />
                   </div>
                 )}
                 
                 {viewMode === 'DISCOVERY' ? (
                    /* Discovery Track Area - Unified Continuous Path */
                    <div className="relative h-16 border-b border-white/5 flex items-center bg-editor-accent/5 overflow-hidden">
                       <div className="flex-1 h-full relative">
                          {/* Continuous Background Track */}
                          <div className="absolute inset-x-0 h-10 top-3 bg-white/[0.03] border border-white/10 rounded-sm" />
                          
                          {/* Dynamic Path Indicator */}
                          <div 
                             className="absolute h-1 top-[11px] left-0 bg-editor-accent shadow-[0_0_15px_#0078d4] transition-all duration-300"
                             style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                          />

                          {/* Node Markers (Visualization Only) */}
                          {PROJECTS.map((project, idx) => {
                             const pos = (idx / PROJECTS.length) * 100;
                             const isActive = Math.abs((currentTime / totalDuration) * 100 - pos) < (100 / PROJECTS.length / 2);
                             
                             return (
                                <div 
                                   key={project.id}
                                   className="absolute h-10 top-3 flex flex-col items-center group/node transition-all"
                                   style={{ left: `${pos}%`, width: `${(1 / PROJECTS.length) * 100}%` }}
                                >
                                   <div className={`mt-3 w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-editor-accent scale-150 shadow-[0_0_8px_#0078d4]' : 'bg-white/20'}`} />
                                   <div className={`mt-2 text-[8px] font-black uppercase tracking-widest truncate max-w-full px-2 transition-colors duration-500 ${isActive ? 'text-white' : 'text-editor-muted'}`}>
                                      {project.title}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    </div>
                 ) : (
                    <>
                       {/* V2 TRACK Area */}
                       <div className={`group relative h-16 border-b border-white/5 flex items-center bg-white/[0.04] transition-opacity duration-300 ${!isV2Visible ? 'opacity-20 grayscale bg-black/40 pointer-events-none' : 'bg-white/[0.04]'}`}>
                          <div className="flex-1 h-full relative">
                             {v2Parts.map((part) => {
                               const isCollapsed = (part.end - part.start) < 0.01;
                               return (
                               <motion.div 
                                 key={part.id}
                                 className={`absolute h-10 top-3 border border-white/20 overflow-visible flex flex-col shadow-2xl transition-all hover:shadow-editor-accent/20 group/clip ${isCollapsed ? 'z-30 w-[4px] bg-white shadow-[0_0_8px_white]' : ''}`}
                                 style={{ 
                                   left: part.start * pixelsPerSecond - (isCollapsed ? 2 : 0), 
                                   width: isCollapsed ? 4 : (part.end - part.start) * pixelsPerSecond, 
                                   backgroundColor: isCollapsed ? '#fff' : '#0078d444' 
                                 }}
                               >
                                  {!isCollapsed && <div className="h-1 w-full bg-editor-accent brightness-125" />}
                                  <div className="p-2 flex items-center h-full text-white/90 relative group/handle">
                                     <div className={`text-[10px] font-black truncate uppercase tracking-tighter ${isCollapsed ? 'hidden' : ''}`}>
                                       {project ? `${project.title} - Main Edit` : part.label}
                                     </div>
                                     {selectedTool === 'STRETCH' && (
                                       <>
                                         <div className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/40 z-20" onPointerDown={(e) => startResizing(e, part.id, 'left')} />
                                         <div className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/40 z-20" onPointerDown={(e) => startResizing(e, part.id, 'right')} />
                                       </>
                                     )}
                                  </div>
                               </motion.div>
                               );
                             })}
                          </div>
                       </div>

                       {/* V1 TRACK Area */}
                       <div className={`group relative h-16 border-b border-white/5 flex items-center bg-white/[0.02] transition-opacity duration-300 ${!isV1Visible ? 'opacity-20 grayscale bg-black/40 pointer-events-none' : 'bg-white/[0.02]'}`}>
                          <div className="flex-1 h-full relative">
                             {v1Parts.map((part) => {
                               const isCollapsed = (part.end - part.start) < 0.01;
                               return (
                               <motion.div 
                                 key={part.id}
                                 className={`absolute h-10 top-3 border transition-all flex flex-col group/clip ${isCollapsed ? 'z-30 w-[4px] bg-white border-white shadow-[0_0_8px_white]' : 'bg-emerald-500/20 border-emerald-500/30 rounded overflow-visible hover:bg-emerald-500/30'}`}
                                 style={{ 
                                   left: part.start * pixelsPerSecond - (isCollapsed ? 2 : 0), 
                                   width: isCollapsed ? 4 : (part.end - part.start) * pixelsPerSecond 
                                 }}
                               >
                                  <div className="p-2 flex items-center h-full relative">
                                     <div className={`text-[10px] font-medium text-emerald-200 truncate uppercase tracking-widest ${isCollapsed ? 'hidden' : ''}`}>
                                       {part.label}
                                     </div>
                                     {selectedTool === 'STRETCH' && (
                                       <>
                                         <div className="resize-handle absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/40 z-20" onPointerDown={(e) => startResizing(e, part.id, 'left')} />
                                         <div className="resize-handle absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/40 z-20" onPointerDown={(e) => startResizing(e, part.id, 'right')} />
                                       </>
                                     )}
                                  </div>
                               </motion.div>
                               );
                             })}
                          </div>
                       </div>
                    </>
                 )}

                 {/* Audio Track Visual Area */}
              </div>

              {/* Playhead - Positioned relative to tracksRef to span Ruler + Tracks */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-editor-accent z-40 touch-none flex flex-col items-center group/playhead pointer-events-none"
                style={{ left: currentTime * pixelsPerSecond }}
              >
                 <div 
                   onPointerDown={handlePointerDown}
                   onPointerMove={handlePointerMove}
                   onPointerUp={handlePointerUp}
                   className="playhead-handle w-5 h-7 bg-editor-accent rounded-b-sm shadow-[0_0_20px_#0078d4] flex items-center justify-center cursor-ew-resize active:scale-110 active:brightness-125 transition-all z-50 pointer-events-auto"
                 >
                    <div className="w-0.5 h-3 bg-white/60 rounded-full" />
                 </div>
                 <div className={`flex-1 w-px ${isScrubbing ? 'bg-white shadow-[0_0_15px_white]' : 'bg-editor-accent shadow-[0_0_10px_#0078d4]'}`} />
                 
                 <div className="bg-editor-accent text-white px-2 rounded py-1 text-[12px] font-mono absolute -bottom-8 shadow-2xl border border-white/20 whitespace-nowrap z-50 transition-transform">
                    {formatTimeLabel(currentTime)}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
});
