import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { MediaBin } from './components/MediaBin';
import { PreviewMonitor } from './components/PreviewMonitor';
import { Timeline } from './components/Timeline';
import { Inspector } from './components/Inspector';
import { Project, EditorState, GradeMode, EditorTool, SequencePart } from './types';
import { PROJECTS } from './constants';
import { parseDurationToSeconds } from './lib/utils';
import { Github, Twitter, Youtube, Mail, Film, Command, GripVertical, GripHorizontal, Maximize2, Minimize2, Laptop, Smartphone, Library, SquarePlay, Compass, Fingerprint, User } from 'lucide-react';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'SPHERE' | 'LIBRARY' | 'EDITOR' | 'ASSETS' | 'IDENTITY' | 'ME'>('SPHERE');
  const [state, setState] = useState<EditorState>({
    currentTime: 0,
    isPlaying: true,
    discoveryTime: 0,
    discoveryIsPlaying: true,
    selectedProject: null,
    showGuides: true,
    viewMode: 'DISCOVERY',
    timelineZoom: 0,
    selectedTool: 'SELECT',
    isTimelineLocked: true,
    isMuted: false,
    volume: 0.8,
    gradeMode: (localStorage.getItem('gradeMode') as GradeMode) || 'REC709'
  });

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

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

  // Socket Connection
  useEffect(() => {
    // Debug health check
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log('[API] Health check:', data))
      .catch(err => console.warn('[API] Health check failed:', err));

    // Fetch initial state immediately via API to avoid delay
    // Added a small delay to ensure server is ready in some environments
    const initFetch = () => {
      fetch('/api/state')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('[API] Shared state loaded:', Object.keys(data).length, 'projects');
          setCheckpoint(data);
        })
        .catch(err => {
          console.error('Error fetching shared state:', err);
          // Retry after 2 seconds if it failed
          setTimeout(initFetch, 2000);
        });
    };

    setTimeout(initFetch, 500);

    socketRef.current = io({
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socketRef.current.on('connect', () => {
      console.log('[SOCKET] Connected to sync server');
    });

    socketRef.current.on('connect_error', (error: any) => {
      console.error('[SOCKET] Connection error:', error);
    });

    socketRef.current.on('init:state', (state: { [projectId: string]: SequencePart[] }) => {
      console.log('[SOCKET] Initial shared state received');
      setCheckpoint(state);
    });

    socketRef.current.on('sequence:updated', (data: { projectId: string; sequence: SequencePart[] }) => {
      console.log(`[SOCKET] Remote checkpoint received for ${data.projectId}`);
      setCheckpoint(prev => ({ ...prev, [data.projectId]: data.sequence }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Real-time Sync: Auto-update active project when a remote checkpoint arrives
  useEffect(() => {
    const activeId = state.selectedProject?.id;
    if (activeId && checkpoint[activeId]) {
      const globalSeq = checkpoint[activeId];
      const localSeq = state.selectedProject?.sequence || [];
      
      // If global is different, sync it automatically if we are in EDITOR mode
      // This ensures that the user sees their colleagues' changes instantly
      if (state.viewMode === 'EDITOR' && JSON.stringify(globalSeq) !== JSON.stringify(localSeq)) {
        console.log(`[SYNC] Auto-updating live timeline for ${activeId}`);
        setState(prev => {
          if (!prev.selectedProject || prev.selectedProject.id !== activeId) return prev;
          return {
            ...prev,
            selectedProject: { ...prev.selectedProject, sequence: globalSeq }
          };
        });
      }
    }
  }, [checkpoint, state.selectedProject?.id, state.viewMode]);

  // Resize State
  const [leftPanelWidth, setLeftPanelWidth] = useState(24);
  const [discoveryPanelHeight, setDiscoveryPanelHeight] = useState(18);
  const [editorPanelHeight, setEditorPanelHeight] = useState(35);
  const [inspectorWidth, setInspectorWidth] = useState(22);
  
  const bottomPanelHeight = state.viewMode === 'DISCOVERY' ? discoveryPanelHeight : editorPanelHeight;
  const setBottomPanelHeight = state.viewMode === 'DISCOVERY' ? setDiscoveryPanelHeight : setEditorPanelHeight;
  
  const isResizing = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

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
    
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('resize', handleResize);
    };
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

  // Sequence Generation Logic: Hardcoded defaults per user request
  const generateSequence = (project: Project): SequencePart[] => {
    const duration = parseDurationToSeconds(project.duration);
    const rawTitle = project.title || '';
    const title = rawTitle.trim().toUpperCase();
    
    // Normalizing titles for matching
    const normalizedTitle = title
      .replace('PROMOTIONAL', 'PROMOTION')
      .replace(/_/g, ' ');

    console.log(`[SEQ] Generating sequence for: "${rawTitle}" -> normalized: "${normalizedTitle}"`);

    const createPart = (id: string, start: number, end: number, track: 'V1' | 'V2') => ({
      id: `${track.toLowerCase()}-${id}-${project.id}-${Math.random().toString(36).substr(2, 4)}`,
      start,
      end: Math.min(end, duration),
      type: (track === 'V1' ? 'NORMAL' : 'HIGHLIGHT') as 'NORMAL' | 'HIGHLIGHT',
      label: track
    });

    let parts: SequencePart[] = [];

    switch(normalizedTitle) {
      case 'TEXTURE MOTION EDIT':
        parts = [
          createPart('t1', 0, 13, 'V2'),
          createPart('t2', 13, 65, 'V1'),
          createPart('t3', 65, duration, 'V2')
        ];
        break;
      case 'SHORT FILM':
        parts = [
          createPart('s1', 0, 7, 'V2'),
          createPart('s2', 7, 32, 'V1'),
          createPart('s3', 32, 50, 'V2'),
          createPart('s4', 50, duration, 'V1')
        ];
        break;
      case 'PRODUCT ANIMATION':
        parts = [
          createPart('pa1', 0, 7, 'V2'),
          createPart('pa2', 7, 24, 'V1'),
          createPart('pa3', 24, duration, 'V2')
        ];
        break;
      case 'PROMOTION EDIT':
      case 'PROMOTIONAL EDIT':
        parts = [
          createPart('pe1', 0, 2, 'V2'),
          createPart('pe2', 2, 4, 'V1'),
          createPart('pe3', 4, 12, 'V2'),
          createPart('pe4', 12, 23, 'V1'),
          createPart('pe5', 23, duration, 'V2')
        ];
        break;
      case 'MASKING EDIT PRE NIMBUS':
        parts = [
          createPart('m1', 0, 6, 'V2'),
          createPart('m2', 6, 14, 'V1'),
          createPart('m3', 14, 24, 'V2'),
          createPart('m4', 24, 32, 'V1'),
          createPart('m5', 32, 36, 'V2'),
          createPart('m6', 36, duration, 'V1')
        ];
        break;
      
      case 'ORIENTATION REEL':
        parts = [
          createPart('or1', 0, 6, 'V1'),
          createPart('or2', 6, 20, 'V2'),
          createPart('or3', 20, 37, 'V1'),
          createPart('or4', 37, 44, 'V2'),
          createPart('or5', 44, 61, 'V1'),
          createPart('or6', 61, duration, 'V2')
        ];
        break;
      case 'EVENT PROMOTION REEL':
        parts = [
          createPart('ev1', 0, 19, 'V1'),
          createPart('ev2', 19, 29, 'V2'),
          createPart('ev3', 29, 31, 'V1'),
          createPart('ev4', 31, 36, 'V2'),
          createPart('ev5', 36, 45, 'V1'),
          createPart('ev6', 45, 59, 'V2'),
          createPart('ev7', 59, 62, 'V1'),
          createPart('ev8', 62, duration, 'V2')
        ];
        break;
      case 'PROMOTION REEL':
      case 'PROMOTIONAL REEL':
        parts = [
          createPart('pr1', 0, 13, 'V2'),
          createPart('pr2', 13, 34, 'V1'),
          createPart('pr3', 34, duration, 'V2')
        ];
        break;
      case 'ZEN GARDEN':
        parts = [
          createPart('z1', 0, 3, 'V2'),
          createPart('z2', 3, 17, 'V1'),
          createPart('z3', 17, 27, 'V2'),
          createPart('z4', 27, 34, 'V1'),
          createPart('z5', 34, 40, 'V2'),
          createPart('z6', 40, duration, 'V1')
        ];
        break;
      case 'WEEDING MOTION ANIMATION':
        parts = [
          createPart('w1', 0, 6, 'V2'),
          createPart('w2', 6, 31, 'V1'),
          createPart('w3', 31, 44, 'V2'),
          createPart('w4', 44, duration, 'V1')
        ];
        break;
      default:
        console.log(`[SEQ] No specific case for "${normalizedTitle}", using default V2 track.`);
        parts = [
          createPart('v2-full', 0, duration, 'V2')
        ];
    }
    
    return parts.filter(p => (p.end - p.start) > 0.05);
  };

  const handleProjectSelect = useCallback((p: Project) => {
    // Standardizing the default timeline across all projects
    // This ensures a professional multi-track split (V1/V2) is always the starting point
    const defaultSequence = generateSequence(p);
    let sequence: SequencePart[] = defaultSequence;
    
    // List of "Special" titles that MUST use the hardcoded logic
    const SPECIAL_TITLES = [
      'TEXTURE MOTION EDIT', 'SHORT FILM', 'PRODUCT ANIMATION', 
      'PROMOTION EDIT', 'MASKING EDIT PRE NIMBUS', 'ORIENTATION REEL', 
      'EVENT PROMOTION REEL', 'PROMOTION REEL', 'ZEN GARDEN', 
      'WEEDING MOTION ANIMATION', 'MASKING EDIT REEL'
    ];

    const normalizedTitle = p.title.trim().toUpperCase()
      .replace('PROMOTIONAL', 'PROMOTION')
      .replace(/_/g, ' ');

    const isSpecialProject = SPECIAL_TITLES.includes(normalizedTitle);

    // Check Global Checkpoint for potential user-saved overrides
    if (isSpecialProject) {
      // For user-defined special projects, we ALWAYS force the hardcoded sequence
      // to ensure consistency with the requested case method
      console.log(`[INIT] Force-resetting ${p.id} to hardcoded default (Special Project)`);
      sequence = defaultSequence;
    } else if (checkpoint[p.id]) {
      const globalSeq = checkpoint[p.id];
      
      // If it's a standard project, we only accept the checkpoint if it looks like real user edits
      // Otherwise, we force the default continuous sequence
      const isLegacy = globalSeq.some(part => part.id.includes('v1-intro') || part.id.includes('v2-peak1'));
      
      if (globalSeq.length > 1 && !isLegacy) {
         console.log(`[INIT] Loading shared checkpoint for ${p.id}. Type of first part: ${globalSeq[0]?.type}`);
         sequence = globalSeq;
      } else {
        console.log(`[INIT] Upgrading legacy or forcing default for ${p.id}. Sequence length: ${defaultSequence.length}`);
        sequence = defaultSequence;
      }
    } else {
      console.log(`[INIT] No checkpoint for ${p.id}, using default sequence.`);
      sequence = defaultSequence;
    }

    console.log(`[INIT] Final sequence for ${p.title} has ${sequence.length} parts. First part track: ${sequence[0]?.type === 'NORMAL' ? 'V1' : 'V2'}`);

    setState(prev => ({ 
      ...prev, 
      selectedProject: { ...p, sequence },
      currentTime: 0,
      isPlaying: false,
      viewMode: 'EDITOR',
      selectedTool: 'SELECT'
    }));
    setMobileTab('EDITOR');
  }, [checkpoint, generateSequence]);

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
    setState(prev => {
      if (prev.viewMode === 'DISCOVERY') {
        return { ...prev, discoveryIsPlaying: !prev.discoveryIsPlaying };
      }
      return { ...prev, isPlaying: !prev.isPlaying };
    });
  }, []);

  const toggleDiscoveryPlay = useCallback(() => {
    setState(prev => ({ ...prev, discoveryIsPlaying: !prev.discoveryIsPlaying }));
  }, []);

  const toggleEditorPlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const toggleGuides = useCallback(() => {
    setState(prev => ({ ...prev, showGuides: !prev.showGuides }));
  }, []);

  const updateTime = useCallback((t: number) => {
    setState(prev => {
      if (prev.viewMode === 'DISCOVERY') {
        return { ...prev, discoveryTime: t };
      }
      return { ...prev, currentTime: t };
    });
  }, []);

  const updateDiscoveryTime = useCallback((t: number) => {
    setState(prev => ({ ...prev, discoveryTime: t }));
  }, []);

  const updateEditorTime = useCallback((t: number) => {
    setState(prev => ({ ...prev, currentTime: t }));
  }, []);

  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const updateVolume = useCallback((v: number) => {
    setState(prev => ({ ...prev, volume: v }));
  }, []);

  const toggleLock = useCallback(() => {
    setState(prev => ({ ...prev, isTimelineLocked: !prev.isTimelineLocked }));
  }, []);

  const handleReturnToDiscovery = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      viewMode: 'DISCOVERY', 
      selectedProject: null, 
      discoveryTime: 20,
      discoveryIsPlaying: false 
    }));
    setMobileTab('SPHERE');
  }, []);

  const handleSaveCheckpoint = useCallback(() => {
    const activeProject = state.selectedProject;
    if (!activeProject?.id || !activeProject?.sequence) return;
    
    const { id: projectId, sequence } = activeProject;
    
    // Update local state first (Optimistic)
    setCheckpoint(c => ({ ...c, [projectId]: sequence }));
    
    // Emit to server for global sync
    if (socketRef.current) {
      console.log(`[CLIENT] Emitting update for project: ${projectId}`);
      socketRef.current.emit('sequence:update', { projectId, sequence });
    }
  }, [state.selectedProject?.id, state.selectedProject?.sequence]);

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
    
    if (state.isPlaying || state.discoveryIsPlaying) {
      interval = setInterval(() => {
        const now = performance.now();
        const delta = (now - lastTime) / 1000;
        lastTime = now;

        setState(prev => {
          let updates: Partial<typeof prev> = {};

          // 1. Handle Discovery Playback (Isolated)
          if (prev.discoveryIsPlaying) {
            const duration = 100;
            let nextDiscoveryTime = prev.discoveryTime + delta;
            if (nextDiscoveryTime >= duration) nextDiscoveryTime = 0;
            updates.discoveryTime = nextDiscoveryTime;
          }

          // 2. Handle Editor Playback
          if (prev.isPlaying) {
            const duration = prev.selectedProject 
              ? parseDurationToSeconds(prev.selectedProject.duration) 
              : 100;
            let nextTime = prev.currentTime + delta;
            
            if (nextTime >= duration) nextTime = 0;

            if (prev.selectedProject?.sequence && visibleTracks.size > 0) {
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
            updates.currentTime = nextTime >= duration ? 0 : nextTime;
          }

          if (Object.keys(updates).length === 0) return prev;
          return { ...prev, ...updates };
        });
      }, 40);
    }
    return () => clearInterval(interval);
  }, [state.isPlaying, state.discoveryIsPlaying, visibleTracks, state.selectedProject?.sequence]);

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-hidden bg-editor-bg select-none">
      {/* OS Bar Style Header - Desktop Only */}
      <header className="h-8 border-b border-editor-border bg-editor-panel hidden md:flex items-center justify-between px-3 text-[11px] font-medium z-50">
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

      {/* Mobile Header */}
      <header className="h-10 border-b border-editor-border bg-editor-panel flex md:hidden items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 text-editor-accent">
          <Film size={16} className={state.isPlaying ? "animate-spin duration-[3000ms]" : ""} />
          <span className="font-black tracking-tighter uppercase text-xs">Timeline Pro</span>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setMobileTab('ME')}
             className={`px-2 py-1 flex items-center gap-1.5 rounded-md border transition-all active:scale-95 ${mobileTab === 'ME' ? 'bg-editor-accent text-white border-editor-accent shadow-[0_0_10px_#0078d4]' : 'bg-editor-panel text-editor-muted border-editor-border hover:bg-white/5'}`}
             title="About Me"
           >
             <User size={10} />
             <span className="text-[8px] font-black uppercase tracking-tighter uppercase">Me</span>
           </button>
           <button 
             onClick={toggleLock}
             className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest border border-editor-accent/30 transition-all active:scale-95 ${state.isTimelineLocked ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10 animate-pulse'}`}
           >
             {state.isTimelineLocked ? 'LOCKED' : 'LIVE'}
           </button>
           <button 
             onClick={() => setMobileTab('LIBRARY')}
             className={`px-2 py-1 flex items-center gap-1.5 rounded-md border transition-all active:scale-95 ${mobileTab === 'LIBRARY' ? 'bg-editor-accent text-white border-editor-accent' : 'bg-editor-panel text-editor-muted border-editor-border'}`}
             title="Assets"
           >
             <Library size={10} />
             <span className="text-[8px] font-black uppercase tracking-tighter">Assets</span>
           </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* DESKTOP LAYOUT */}
        {isDesktop && (
          <div className="hidden md:flex flex-col h-full">
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
                    currentTime={state.viewMode === 'DISCOVERY' ? state.discoveryTime : state.currentTime}
                    isPlaying={state.viewMode === 'DISCOVERY' ? state.discoveryIsPlaying : state.isPlaying}
                    onTogglePlay={state.viewMode === 'DISCOVERY' ? toggleDiscoveryPlay : togglePlay}
                    gradeMode={state.gradeMode}
                    showGuides={state.showGuides}
                    onToggleGuides={toggleGuides}
                    sequence={state.selectedProject?.sequence || discoverySequence}
                    viewMode={state.viewMode}
                    onSelectProject={handleProjectSelect}
                    onReturnToDiscovery={handleReturnToDiscovery}
                    isMuted={state.isMuted}
                    onToggleMute={toggleMute}
                    volume={state.volume}
                    onVolumeChange={updateVolume}
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
                 currentTime={state.viewMode === 'DISCOVERY' ? state.discoveryTime : state.currentTime}
                 onTimeUpdate={state.viewMode === 'DISCOVERY' ? updateDiscoveryTime : updateTime}
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
                 isPlaying={state.viewMode === 'DISCOVERY' ? state.discoveryIsPlaying : state.isPlaying}
                 onTogglePlay={state.viewMode === 'DISCOVERY' ? toggleDiscoveryPlay : togglePlay}
                 onSaveCheckpoint={handleSaveCheckpoint}
                 onRestoreCheckpoint={handleRestoreCheckpoint}
                 onResetTimeline={handleResetTimeline}
                 hasCheckpoint={!!(state.selectedProject?.id && checkpoint[state.selectedProject.id])}
               />
            </div>
          </div>
        )}

        {/* MOBILE LAYOUT (Tabbed) */}
        {!isDesktop && (
          <div className="flex md:hidden flex-col h-full">
             <div className="flex-1 relative overflow-hidden">
                {mobileTab === 'SPHERE' && (
                   <div className="absolute inset-0 flex flex-col pt-10">
                      <div className="h-[82%]">
                         <PreviewMonitor 
                           currentTime={state.discoveryTime}
                           isPlaying={state.discoveryIsPlaying}
                           onTogglePlay={toggleDiscoveryPlay}
                           gradeMode={state.gradeMode}
                           showGuides={state.showGuides}
                           onToggleGuides={toggleGuides}
                           sequence={discoverySequence}
                           viewMode="DISCOVERY"
                           onSelectProject={handleProjectSelect}
                           onReturnToDiscovery={handleReturnToDiscovery}
                           isMuted={state.isMuted}
                           onToggleMute={toggleMute}
                           volume={state.volume}
                           onVolumeChange={updateVolume}
                         />
                      </div>
                      <div className="flex-1 bg-editor-timeline border-t border-editor-border overflow-hidden">
                         <Timeline 
                           viewMode="DISCOVERY"
                           currentTime={state.discoveryTime}
                           onTimeUpdate={updateDiscoveryTime}
                           selectedTool={state.selectedTool}
                           onSelectTool={(tool) => setState(prev => ({ ...prev, selectedTool: tool as any }))}
                           onSplit={handleSplit}
                           onUpdatePart={handleUpdatePart}
                           isLocked={state.isTimelineLocked}
                           sequence={discoverySequence}
                           visibleTracks={visibleTracks}
                           onToggleTrack={(id) => setVisibleTracks(prev => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                           })}
                           project={{ title: 'DISCOVERY_SPHERE', duration: '01:40' } as any}
                           isPlaying={state.discoveryIsPlaying}
                           onTogglePlay={toggleDiscoveryPlay}
                           onSaveCheckpoint={handleSaveCheckpoint}
                           onRestoreCheckpoint={handleRestoreCheckpoint}
                           onResetTimeline={handleResetTimeline}
                           hasCheckpoint={false}
                         />
                      </div>
                   </div>
                )}

                {mobileTab === 'LIBRARY' && (
                   <div className="absolute inset-0 px-2 overflow-y-auto">
                      <MediaBin 
                        selectedId={state.selectedProject?.id} 
                        onSelectProject={handleProjectSelect} 
                      />
                   </div>
                )}

                 {mobileTab === 'IDENTITY' && (
                    <div className="absolute inset-0 flex flex-col bg-[#050505]">
                       <Inspector 
                         selectedProject={state.selectedProject}
                         isPlaying={state.isPlaying}
                       />
                    </div>
                 )}

                 {mobileTab === 'ME' && (
                    <div className="absolute inset-0 flex flex-col bg-editor-bg p-6 overflow-y-auto pt-16">
                       <div className="flex flex-col items-center mb-10 text-center">
                          <div className="w-24 h-24 rounded-full bg-editor-accent/20 border-2 border-editor-accent flex items-center justify-center mb-4 shadow-[0_0_30px_#0078d4]">
                             <User size={48} className="text-editor-accent" />
                          </div>
                          <h2 className="text-xl font-black uppercase tracking-widest text-white">Ayush Kumar</h2>
                          <p className="text-editor-muted text-[10px] font-mono tracking-tighter mt-1">LEAD CINEMATOGRAPHER & EDITOR</p>
                       </div>

                       <div className="space-y-6">
                          <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                             <h3 className="text-[10px] font-black text-editor-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Film size={12} />
                                Technical Proficiency
                             </h3>
                             <div className="grid grid-cols-2 gap-3">
                                {['DaVinci Resolve', 'Adobe Premiere', 'After Effects', 'Blender', 'Cinema 4D', 'Unreal Engines'].map(skill => (
                                   <div key={skill} className="flex items-center gap-2 text-[9px] font-mono text-editor-muted translate-y-0 hover:translate-x-1 transition-transform">
                                      <div className="w-1 h-1 bg-editor-accent rounded-full" />
                                      {skill}
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="bg-editor-panel border border-editor-border p-4 rounded-lg">
                             <h3 className="text-[10px] font-black text-editor-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Library size={12} />
                                Creative Arsenal
                             </h3>
                             <p className="text-[11px] text-editor-muted leading-relaxed italic">
                                "Synthesizing visual storytelling with hyper-technical execution to create immersive digital experiences."
                             </p>
                          </div>

                          <div className="flex justify-between gap-4 py-4">
                             <a href="#" className="flex-1 bg-editor-bg border border-editor-border p-3 rounded-lg flex flex-col items-center gap-2 hover:bg-white/[0.02] transition-colors">
                                <Twitter size={16} className="text-editor-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Connect</span>
                             </a>
                             <a href="#" className="flex-1 bg-editor-bg border border-editor-border p-3 rounded-lg flex flex-col items-center gap-2 hover:bg-white/[0.02] transition-colors">
                                <Github size={16} className="text-editor-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Pipeline</span>
                             </a>
                             <a href="#" className="flex-1 bg-editor-bg border border-editor-border p-3 rounded-lg flex flex-col items-center gap-2 hover:bg-white/[0.02] transition-colors">
                                <Youtube size={16} className="text-editor-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Showreel</span>
                             </a>
                          </div>
                          
                          <div className="pt-4 border-t border-editor-border text-center">
                             <span className="text-[8px] font-mono text-editor-muted opacity-50 uppercase">Timeline Pro v4.0.2 // Core_Build_Active</span>
                          </div>
                       </div>
                    </div>
                 )}

                {mobileTab === 'EDITOR' && (
                   <div className="absolute inset-0 flex flex-col">
                      <div className="h-[70%]">
                         <PreviewMonitor 
                           project={state.selectedProject || undefined} 
                           currentTime={state.currentTime}
                           isPlaying={state.isPlaying}
                           onTogglePlay={toggleEditorPlay}
                           gradeMode={state.gradeMode}
                           showGuides={state.showGuides}
                           onToggleGuides={toggleGuides}
                           sequence={state.selectedProject?.sequence || discoverySequence}
                           viewMode={state.viewMode}
                           onSelectProject={handleProjectSelect}
                           onReturnToDiscovery={handleReturnToDiscovery}
                           isMuted={state.isMuted}
                           onToggleMute={toggleMute}
                           volume={state.volume}
                           onVolumeChange={updateVolume}
                         />
                      </div>
                      <div className="flex-1 bg-editor-timeline border-t border-editor-border overflow-hidden">
                         <Timeline 
                           viewMode={state.viewMode}
                           currentTime={state.currentTime}
                           onTimeUpdate={updateEditorTime}
                           selectedTool={state.selectedTool}
                           onSelectTool={(tool) => setState(prev => ({ ...prev, selectedTool: tool as any }))}
                           onSplit={handleSplit}
                           onUpdatePart={handleUpdatePart}
                           isLocked={state.isTimelineLocked}
                           sequence={state.selectedProject?.sequence}
                           visibleTracks={visibleTracks}
                           onToggleTrack={(id) => setVisibleTracks(prev => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                           })}
                           project={state.selectedProject || undefined}
                           isPlaying={state.isPlaying}
                           onTogglePlay={toggleEditorPlay}
                           onSaveCheckpoint={handleSaveCheckpoint}
                           onRestoreCheckpoint={handleRestoreCheckpoint}
                           onResetTimeline={handleResetTimeline}
                           hasCheckpoint={!!(state.selectedProject?.id && checkpoint[state.selectedProject.id])}
                         />
                      </div>
                   </div>
                )}
             </div>

             {/* Mobile Tab Nav */}
             <nav className="h-14 bg-editor-panel border-t border-editor-border flex items-center justify-around px-2 pb-safe">
                <button 
                  onClick={() => setMobileTab('SPHERE')}
                  className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${mobileTab === 'SPHERE' ? 'text-editor-accent' : 'text-editor-muted'}`}
                >
                  <Compass size={20} className={mobileTab === 'SPHERE' ? 'animate-pulse' : ''} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Explore</span>
                </button>
                <button 
                  onClick={() => setMobileTab('LIBRARY')}
                  className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${mobileTab === 'LIBRARY' ? 'text-editor-accent' : 'text-editor-muted'}`}
                >
                  <Library size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Assets</span>
                </button>
                <button 
                  onClick={() => {
                    if (state.selectedProject) setMobileTab('EDITOR');
                    else setMobileTab('LIBRARY');
                  }}
                  className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${mobileTab === 'EDITOR' ? 'text-editor-accent' : (state.selectedProject ? 'text-editor-muted' : 'text-editor-muted opacity-30')}`}
                >
                  <SquarePlay size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                </button>
                <button 
                  onClick={() => setMobileTab('IDENTITY')}
                  className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${mobileTab === 'IDENTITY' ? 'text-editor-accent' : 'text-editor-muted'}`}
                >
                  <Fingerprint size={20} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Brand</span>
                </button>
             </nav>
          </div>
        )}
      </main>

      {/* Status Bar - Desktop Only */}
      <footer className="h-6 border-t border-editor-border bg-editor-panel hidden md:flex items-center justify-between px-3 text-[9px] text-editor-muted font-mono whitespace-nowrap overflow-hidden">
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
