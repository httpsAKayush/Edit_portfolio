import { useState, useEffect, useRef, useCallback } from 'react';
import { MediaBin } from './components/MediaBin';
import { PreviewMonitor } from './components/PreviewMonitor';
import { Timeline } from './components/Timeline';
import { Inspector } from './components/Inspector';
import { Project, EditorState, GradeMode, EditorTool, SequencePart } from './types';
import { PROJECTS } from './constants';
import { parseDurationToSeconds } from './lib/utils';
import { Github, Twitter, Youtube, Mail, Film, Command, GripVertical, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [state, setState] = useState<EditorState>({
    currentTime: 10,
    isPlaying: false,
    selectedProject: null,
    showGuides: true,
    viewMode: 'DISCOVERY',
    timelineZoom: 0,
    selectedTool: 'SELECT',
    isTimelineLocked: true,
    gradeMode: (localStorage.getItem('gradeMode') as GradeMode) || 'REC709'
  });

  // Effect to persist editor settings
  useEffect(() => {
    localStorage.setItem('gradeMode', state.gradeMode);
  }, [state.gradeMode]);

  const discoverySequence = PROJECTS.map((p, idx) => ({
    id: `seg-${p.id}`,
    start: idx * (100 / PROJECTS.length),
    end: (idx + 1) * (100 / PROJECTS.length),
    type: 'NODE_FOCUS' as const,
    label: p.title
  }));

  const [visibleTracks, setVisibleTracks] = useState<Set<string>>(new Set(['V2']));
  const [checkpoint, setCheckpoint] = useState<{ [projectId: string]: SequencePart[] }>({});

  // Resize State
  const [leftPanelWidth, setLeftPanelWidth] = useState(24);
  const [discoveryPanelHeight, setDiscoveryPanelHeight] = useState(18);
  const [editorPanelHeight, setEditorPanelHeight] = useState(35);
  const [inspectorWidth, setInspectorWidth] = useState(22);
  
  const bottomPanelHeight = state.viewMode === 'DISCOVERY' ? discoveryPanelHeight : editorPanelHeight;
  const setBottomPanelHeight = state.viewMode === 'DISCOVERY' ? setDiscoveryPanelHeight : setEditorPanelHeight;
  
  const isResizing = useRef<string | null>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const startResizing = (id: string) => {
    isResizing.current = id;
    document.body.style.cursor = id === 'main-h' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = useCallback(() => {
    isResizing.current = null;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;

    if (isResizing.current === 'left-col') {
      const p = (e.clientX / window.innerWidth) * 100;
      setLeftPanelWidth(Math.max(15, Math.min(40, p)));
    } else if (isResizing.current === 'main-h') {
      const p = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
      const val = Math.max(10, Math.min(60, p));
      if (state.viewMode === 'DISCOVERY') setDiscoveryPanelHeight(val);
      else setEditorPanelHeight(val);
    } else if (isResizing.current === 'inspector-col') {
      const p = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      setInspectorWidth(Math.max(15, Math.min(30, p)));
    }
  }, [state.viewMode]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [onMouseMove, stopResizing]);

  // Sequence Generation Logic
  const generateSequence = (project: Project) => {
    const duration = parseDurationToSeconds(project.duration);
    return [{
      id: `p-full-${project.id}`,
      start: 0,
      end: duration,
      type: 'HIGHLIGHT' as const,
      label: `${project.title} - Master Clip`
    }];
  };

  const handleProjectSelect = useCallback((p: Project) => {
    // For this special "Main Edit" mode, we'll favor the generated sequence 
    // to ensure it matches the user's latest track preference (V2)
    let sequence = generateSequence(p);
    
    // Check local storage for saved sequence ONLY if it has more than 1 part (user started editing)
    const saved = localStorage.getItem(`sequence_${p.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 1) {
          sequence = parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved sequence", e);
      }
    }

    setState(prev => ({ 
      ...prev, 
      selectedProject: { ...p, sequence },
      currentTime: 0,
      isPlaying: false,
      viewMode: 'EDITOR',
      selectedTool: 'SELECT'
    }));
  }, []);

  // Effect to persist sequence changes to local storage
  useEffect(() => {
    if (state.selectedProject?.id && state.selectedProject?.sequence) {
      localStorage.setItem(`sequence_${state.selectedProject.id}`, JSON.stringify(state.selectedProject.sequence));
    }
  }, [state.selectedProject?.sequence, state.selectedProject?.id]);

  const updateGrade = useCallback((grade: GradeMode) => {
    setState(prev => ({ ...prev, gradeMode: grade }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const toggleGuides = useCallback(() => {
    setState(prev => ({ ...prev, showGuides: !prev.showGuides }));
  }, []);

  const updateTime = useCallback((t: number) => {
    setState(prev => ({ ...prev, currentTime: t }));
  }, []);

  const handleReturnToDiscovery = useCallback(() => {
    setState(prev => ({ ...prev, viewMode: 'DISCOVERY', selectedProject: null, currentTime: 20 }));
  }, []);

  const handleSaveCheckpoint = useCallback(() => {
    setState(prev => {
      if (!prev.selectedProject?.id || !prev.selectedProject?.sequence) return prev;
      setCheckpoint(c => ({ ...c, [prev.selectedProject!.id]: prev.selectedProject!.sequence! }));
      return prev;
    });
  }, []);

  const handleRestoreCheckpoint = useCallback(() => {
    setState(prev => {
      if (!prev.selectedProject?.id || !checkpoint[prev.selectedProject.id]) return prev;
      return {
        ...prev,
        selectedProject: { ...prev.selectedProject, sequence: checkpoint[prev.selectedProject.id] }
      };
    });
  }, [checkpoint]);

  const handleResetTimeline = useCallback(() => {
    setState(prev => {
      if (!prev.selectedProject?.id) return prev;
      
      // Clear persistence for this project
      localStorage.removeItem(`sequence_${prev.selectedProject.id}`);
      
      // Re-generate default sequence
      const defaultSequence = generateSequence(prev.selectedProject);
      
      return {
        ...prev,
        selectedProject: { ...prev.selectedProject, sequence: defaultSequence }
      };
    });
  }, []);

  const handleSplit = useCallback((timeAtClick?: number) => {
    setState(prev => {
      if (!prev.selectedProject || !prev.selectedProject.sequence) return prev;
      
      const actualSplitTime = timeAtClick !== undefined ? timeAtClick : prev.currentTime;
      const sequence = [...prev.selectedProject.sequence];
      
      const partIdx = sequence.findIndex(p => actualSplitTime > p.start && actualSplitTime < p.end);
      if (partIdx === -1) return prev;
      
      const part = sequence[partIdx];
      if (actualSplitTime - part.start < 0.1 || part.end - actualSplitTime < 0.1) return prev;

      const newPart1 = { ...part, end: actualSplitTime, id: `${part.id}_${Math.random().toString(36).substr(2, 4)}` };
      const newPart2 = { 
        ...part, 
        start: actualSplitTime, 
        id: `${part.id}_${Math.random().toString(36).substr(2, 4)}`,
        type: part.type === 'NORMAL' ? 'HIGHLIGHT' as const : 'NORMAL' as const 
      };
      
      const newSequence = [
        ...sequence.slice(0, partIdx),
        newPart1,
        newPart2,
        ...sequence.slice(partIdx + 1)
      ].sort((a, b) => a.start - b.start);
      
      return {
        ...prev,
        selectedProject: { ...prev.selectedProject!, sequence: newSequence }
      };
    });
  }, []);

  const handleUpdatePart = useCallback((partId: string, updates: Partial<SequencePart>) => {
    setState(prev => {
      if (!prev.selectedProject || !prev.selectedProject.sequence) return prev;
      
      const currentSequence = prev.selectedProject.sequence;
      const targetPart = currentSequence.find(p => p.id === partId);
      if (!targetPart) return prev;

      let constrainedUpdates = { ...updates };
      const sameTrackParts = currentSequence.filter(p => p.type === targetPart.type && p.id !== targetPart.id);

      // 1. Same-Track Non-Overlap Constraints
      if (updates.start !== undefined) {
        const leftNeighbor = sameTrackParts.filter(p => p.end <= targetPart.start).sort((a, b) => b.end - a.end)[0];
        constrainedUpdates.start = Math.max(leftNeighbor ? leftNeighbor.end : 0, updates.start);
        // Allow clip to reach zero duration (it will be filtered out below)
        constrainedUpdates.start = Math.min(constrainedUpdates.start, targetPart.end);
      }

      if (updates.end !== undefined) {
        const rightNeighbor = sameTrackParts.filter(p => p.start >= targetPart.end).sort((a, b) => a.start - b.start)[0];
        const maxEnd = rightNeighbor ? rightNeighbor.start : Infinity;
        constrainedUpdates.end = Math.min(maxEnd, updates.end);
        // Allow clip to reach zero duration (it will be filtered out below)
        constrainedUpdates.end = Math.max(constrainedUpdates.end, targetPart.start);
      }

      // 2. Cross-Track Sync Constraints (only if STRETCH)
      // Removed minimum buffer logic to allow clips to be pushed into extinction (zero duration)

      let newSequence = currentSequence.map(p => 
        p.id === partId ? { ...p, ...constrainedUpdates } : p
      );

      // Apply Synchronization
      if (prev.selectedTool === 'STRETCH') {
        const otherType = targetPart.type === 'NORMAL' ? 'HIGHLIGHT' : 'NORMAL';
        
        if (constrainedUpdates.start !== undefined) {
          const oldStart = targetPart.start;
          const newStart = constrainedUpdates.start;
          newSequence = newSequence.map(p => {
            if (p.type === otherType && Math.abs(p.end - oldStart) < 0.01) {
              return { ...p, end: newStart };
            }
            return p;
          });
        }
        
        if (constrainedUpdates.end !== undefined) {
          const oldEnd = targetPart.end;
          const newEnd = constrainedUpdates.end;
          newSequence = newSequence.map(p => {
             if (p.type === otherType && Math.abs(p.start - oldEnd) < 0.01) {
                return { ...p, start: newEnd };
             }
             return p;
          });
        }
      }

      // Allow clips to reach zero duration (effectively "one line") without being deleted
      // This allows them to be expanded back later

      return {
        ...prev,
        selectedProject: { ...prev.selectedProject!, sequence: newSequence }
      };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleFullscreen();
        }
        if (e.key.toLowerCase() === 'c') {
          setState(prev => ({ ...prev, selectedTool: 'RAZOR' }));
        }
        if (e.key.toLowerCase() === 'v') {
          setState(prev => ({ ...prev, selectedTool: 'SELECT' }));
        }
        if (e.key.toLowerCase() === 'r') {
          setState(prev => ({ ...prev, selectedTool: 'STRETCH' }));
        }
        if (e.key.toLowerCase() === 'l') {
          setState(prev => ({ ...prev, isTimelineLocked: !prev.isTimelineLocked }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  // Resizing effect
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [onMouseMove, stopResizing]);

  // Global playback simulation with "Smart Skip" for hidden tracks
  useEffect(() => {
    let interval: any;
    let lastTime = performance.now();
    
    if (state.isPlaying) {
      interval = setInterval(() => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        setState(prev => {
          const duration = prev.viewMode === 'EDITOR' && prev.selectedProject 
            ? parseDurationToSeconds(prev.selectedProject.duration) 
            : 100; // Discovery mode is 100 "temporal units"
          let nextTime = prev.currentTime + delta;
          
          if (nextTime >= duration) nextTime = 0;

          if (prev.viewMode === 'EDITOR' && prev.selectedProject?.sequence && visibleTracks.size > 0) {
             const sequence = prev.selectedProject.sequence;
             const currentPart = sequence.find(p => nextTime >= p.start && nextTime < p.end);
             
             if (currentPart) {
                const partTrack = currentPart.type === 'NORMAL' ? 'V1' : 'V2';
                if (!visibleTracks.has(partTrack)) {
                   const nextVisible = sequence.find(s => {
                      const sTrack = s.type === 'NORMAL' ? 'V1' : 'V2';
                      return s.start >= currentPart.end && visibleTracks.has(sTrack);
                   });
                   
                   if (nextVisible) {
                      nextTime = nextVisible.start;
                   } else {
                      const firstVisible = sequence.find(s => visibleTracks.has(s.type === 'NORMAL' ? 'V1' : 'V2'));
                      nextTime = firstVisible ? firstVisible.start : 0;
                   }
                }
             }
          }

          return {
            ...prev,
            currentTime: nextTime >= duration ? 0 : nextTime
          };
        });
      }, 40); // Optimized for stability (approx 25fps)
    }
    return () => clearInterval(interval);
  }, [state.isPlaying, visibleTracks, state.selectedProject?.sequence]);

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden bg-editor-bg select-none">
      {/* OS Bar Style Header */}
      <header className="h-8 border-b border-editor-border bg-editor-panel flex items-center justify-between px-3 text-[11px] font-medium z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-editor-accent">
            <Film size={14} className={state.isPlaying ? "animate-spin duration-[3000ms]" : ""} />
            <span className="font-bold tracking-tight uppercase">Timeline Pro v4.0</span>
          </div>
          <nav className="flex items-center gap-4 text-editor-muted">
            {['File', 'Edit', 'Sequence', 'Effects', 'View', 'Help'].map(item => (
              <span key={item} className="hover:text-white cursor-pointer px-1 transition-colors">{item}</span>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-editor-bg border border-editor-border rounded px-2 py-0.5 flex items-center gap-2 text-editor-muted">
             <Command size={10} />
             <span className="font-mono uppercase">Render_Node: Active</span>
          </div>
          <div className="flex items-center gap-2 border-l border-editor-border pl-4">
            <a href="#" className="text-editor-muted hover:text-white transition-colors"><Twitter size={14} /></a>
            <a href="#" className="text-editor-muted hover:text-white transition-colors"><Github size={14} /></a>
            <a href="#" className="text-editor-muted hover:text-white transition-colors"><Youtube size={14} /></a>
            <a href="#" className="text-editor-muted hover:text-white transition-colors ml-2"><Mail size={14} /></a>
            
            <button 
              onClick={toggleFullscreen}
              className="ml-4 p-1 bg-editor-bg hover:bg-editor-accent text-editor-muted hover:text-white rounded border border-editor-border transition-all flex items-center gap-1.5 px-2 group"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span className="text-[9px] font-black uppercase tracking-tighter shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* TOP SECTION */}
        <div className="flex overflow-hidden" style={{ height: `${100 - bottomPanelHeight}%` }}>
           {/* Left: Media Bin */}
           {state.viewMode !== 'DISCOVERY' && (
             <>
               <div style={{ width: `${leftPanelWidth}%` }} className="h-full flex flex-col">
                  <MediaBin 
                    selectedId={state.selectedProject?.id} 
                    onSelectProject={handleProjectSelect} 
                  />
               </div>

               {/* Vertical Resizer 1 */}
               <div 
                 onMouseDown={() => startResizing('left-col')}
                 className="w-1.5 flex flex-col items-center justify-center gap-1 group cursor-col-resize hover:bg-editor-accent/30 transition-colors z-30"
               >
                  <div className="w-px h-full bg-editor-border group-hover:bg-editor-accent/50" />
                  <div className="absolute py-2 bg-editor-panel border border-editor-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 px-1">
                     <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                     <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                     <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
                  </div>
               </div>
             </>
           )}

           {/* Middle: Preview Monitor */}
           <div className="flex-1 h-full flex flex-col overflow-hidden">
              <PreviewMonitor 
                project={state.selectedProject || undefined} 
                currentTime={state.currentTime}
                isPlaying={state.isPlaying}
                onTogglePlay={togglePlay}
                gradeMode={state.gradeMode}
                showGuides={state.showGuides}
                onToggleGuides={toggleGuides}
                sequence={state.selectedProject?.sequence || discoverySequence}
                viewMode={state.viewMode}
                onSelectProject={handleProjectSelect}
                onReturnToDiscovery={handleReturnToDiscovery}
              />
           </div>

           {/* Vertical Resizer 2 (Inspector) */}
           {state.viewMode !== 'DISCOVERY' && (
             <>
               <div 
                 onMouseDown={() => startResizing('inspector-col')}
                 className="w-1.5 flex flex-col items-center justify-center gap-1 group cursor-col-resize hover:bg-editor-accent/30 transition-colors z-30 hidden xl:flex"
               >
                  <div className="w-px h-full bg-editor-border group-hover:bg-editor-accent/50" />
               </div>

               {/* Right: Inspector */}
               <div style={{ width: `${inspectorWidth}%` }} className="h-full hidden xl:flex flex-col">
                  <Inspector 
                    selectedProject={state.selectedProject}
                    isPlaying={state.isPlaying}
                  />
               </div>
             </>
           )}
        </div>

        {/* Horizontal Resizer */}
        <div 
          onMouseDown={() => startResizing('main-h')}
          className="h-1.5 flex items-center justify-center group cursor-row-resize hover:bg-editor-accent/30 transition-colors z-30"
        >
           <div className="h-px w-full bg-editor-border group-hover:bg-editor-accent/50" />
           <div className="absolute px-6 bg-editor-panel border border-editor-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 h-4">
              <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
              <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
              <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
           </div>
        </div>

        {/* BOTTOM SECTION: Timeline */}
        <div style={{ height: `${bottomPanelHeight}%` }} className="overflow-hidden">
           <Timeline 
             viewMode={state.viewMode}
             currentTime={state.currentTime}
             onTimeUpdate={updateTime}
             selectedTool={state.selectedTool}
             onSelectTool={(tool) => setState(prev => ({ ...prev, selectedTool: tool as any }))}
             onSplit={handleSplit}
             onUpdatePart={handleUpdatePart}
             isLocked={state.isTimelineLocked}
             sequence={state.viewMode === 'DISCOVERY' ? discoverySequence : state.selectedProject?.sequence}
             visibleTracks={visibleTracks}
             onToggleTrack={(id) => setVisibleTracks(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
             })}
             project={state.selectedProject || { title: 'DISCOVERY_SPHERE', duration: '01:40' } as any}
             isPlaying={state.isPlaying}
             onTogglePlay={togglePlay}
             onSaveCheckpoint={handleSaveCheckpoint}
             onRestoreCheckpoint={handleRestoreCheckpoint}
             onResetTimeline={handleResetTimeline}
             hasCheckpoint={!!(state.selectedProject?.id && checkpoint[state.selectedProject.id])}
           />
        </div>
      </main>

      {/* Status Bar */}
      <footer className="h-6 border-t border-editor-border bg-editor-panel flex items-center justify-between px-3 text-[9px] text-editor-muted font-mono whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5 opacity-80">
              <div className="w-2 h-2 rounded-full bg-editor-accent animate-pulse shadow-[0_0_8px_#0078d4]" />
              <span>CORE SYSTEM ACTIVE</span>
           </div>
           <span className="border-l border-editor-border pl-4 uppercase tracking-widest">{state.gradeMode} ENGINE ENABLED</span>
        </div>
        <div className="flex items-center gap-6">
           <span className="text-editor-accent uppercase">RAM: 12GB USED</span>
           <span className="bg-editor-bg px-2 py-0.5 border border-editor-border rounded">RENDER CACHE: 84%</span>
        </div>
      </footer>
    </div>
  );
}
