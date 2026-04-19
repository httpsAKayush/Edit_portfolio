import React, { useState, useEffect, memo, useRef } from 'react';
import { Project } from '../types';
import { PanelHeader } from './EditorUI';
import { 
  Activity, 
  Cpu, 
  Fingerprint, 
  Zap, 
  Globe, 
  Terminal as TerminalIcon, 
  Compass,
  Trophy,
  Coffee,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InspectorProps {
  selectedProject: Project | null;
  isPlaying: boolean;
}

const CREATIVE_LOGS = [
  "HYPER-RHYTHM_SYNC: ACTIVE",
  "NEURAL_GRADIENT_MAP: LOADING",
  "AESTHETIC_DNA_SEQUENCED",
  "VIBE_CHECK: OPTIMAL",
  "LATENCY_TOLERANCE: 0ms",
  "CREATIVE_ENTROPY: 42%",
  "PORTFOLIO_CORE_STABLE",
];

export const Inspector = memo(function Inspector({ selectedProject, isPlaying }: InspectorProps) {
  const [logIndex, setLogIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setLogIndex(prev => (prev + 1) % CREATIVE_LOGS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside className="w-full xl:w-80 h-full bg-[#050505] border-l border-editor-border flex flex-col overflow-hidden font-sans">
      <PanelHeader title="CREATOR_ID // PULSE" icon={Fingerprint} />

      <div className="flex-1 overflow-y-auto p-5 space-y-10 scrollbar-hide">
        
        {/* IDENTITY SHARD */}
        <section className="relative group">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 p-4 border border-editor-accent/30 bg-editor-accent/5 rounded-lg overflow-hidden backdrop-blur-sm"
          >
            {/* Scanned Background Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-editor-accent via-transparent to-transparent" />
            
            <div className="flex items-start justify-between">
              <div>
                <motion.h2 
                  className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none"
                  animate={{ skewX: [0, -10, 0] }}
                  transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 10 }}
                >
                  AYUSH
                </motion.h2>
                <div className="text-[9px] font-black tracking-[0.3em] text-editor-accent mt-1 uppercase">
                  Lead Visual Architect
                </div>
              </div>
              <div className="w-10 h-10 border border-editor-accent/40 rounded flex items-center justify-center bg-black/40">
                <Cpu size={20} className="text-editor-accent animate-pulse" />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed font-medium">
              Transforming raw data into high-octane visual experiences. Specialized in rhythmic narratives and aesthetic tension.
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-editor-border/50">
              <div className="space-y-1">
                <div className="text-[8px] text-editor-muted uppercase font-black">Style_DNA</div>
                <div className="text-[10px] text-white font-mono">Hyper-Kinetic</div>
              </div>
              <div className="space-y-1">
                <div className="text-[8px] text-editor-muted uppercase font-black">Region</div>
                <div className="text-[10px] text-white font-mono">Global_Remote</div>
              </div>
            </div>
          </motion.div>

          {/* Shadow glitch effect behind card */}
          <div className="absolute inset-0 bg-editor-accent/10 blur-xl opacity-0 group-hover:opacity-30 transition-opacity" />
        </section>

        {/* CREATIVE DNA (Interactive Cloud) */}
        <section className="space-y-4">
           <div className="flex items-center justify-between border-b border-editor-border pb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Zap size={10} className="text-editor-accent" />
                Aesthetic DNA
              </span>
           </div>
           <div className="flex flex-wrap gap-2">
              {['GLITCH', 'NOIR', 'KINETIC', 'BRUTALIST', 'CHROME', 'ATMOSPHERIC', 'RAW'].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 120, 212, 0.2)' }}
                  className="px-2 py-1 text-[9px] font-black tracking-widest border border-editor-border text-editor-muted rounded-full cursor-default hover:text-white hover:border-editor-accent transition-colors"
                >
                  {tag}
                </motion.span>
              ))}
           </div>
        </section>

        {/* LIVE TERMINAL FEED */}
        <section className="space-y-3">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 mb-2">
              <TerminalIcon size={10} className="text-editor-accent" />
              Pulse Logs
           </div>
           <div className="bg-black border border-editor-border p-3 font-mono text-[10px] space-y-1 rounded relative h-32 overflow-hidden">
              <div className="absolute top-0 right-0 p-1">
                <div className="w-1.5 h-1.5 rounded-full bg-editor-accent animate-ping" />
              </div>
              <div className="text-editor-accent opacity-50 mb-2">{'>'} STATUS_CHECK...</div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={logIndex}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-white"
                >
                  {CREATIVE_LOGS[logIndex]}
                </motion.div>
              </AnimatePresence>
              <div className="text-editor-muted mt-4 text-[9px]">
                {new Date().toISOString()}
              </div>
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] pointer-events-none" />
           </div>
        </section>

        {/* ARTIFACTS / MILESTONES */}
        <section className="space-y-4 pb-4">
           <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 mb-4">
              <Trophy size={10} className="text-editor-accent" />
              Artifacts
           </div>
           
           <div className="space-y-3">
              {[
                { icon: Coffee, title: "1.2k+ Lattes Consumed", detail: "Fueling the machine" },
                { icon: Code, title: "150k+ Pixels Rendered", detail: "Visual precision" },
                { icon: Globe, title: "24+ Global Collaborations", detail: "Remote Architect" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group cursor-default">
                  <div className="w-8 h-8 rounded border border-editor-border bg-white/5 flex items-center justify-center group-hover:border-editor-accent group-hover:text-editor-accent transition-all shrink-0">
                    <item.icon size={14} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-tight">{item.title}</div>
                    <div className="text-[9px] text-editor-muted italic">{item.detail}</div>
                  </div>
                </div>
              ))}
           </div>
        </section>

      </div>

      {/* FOOTER BAR */}
      <div className="p-4 border-t border-editor-border bg-black/40 flex flex-col gap-3">
         <div className="flex justify-between items-center">
            <span className="text-[9px] text-editor-muted font-black uppercase tracking-widest">Aura_Strength</span>
            <span className="text-[9px] text-editor-accent font-mono">98% OPTIMAL</span>
         </div>
         <div className="h-1.5 bg-editor-bg border border-white/5 rounded-full overflow-hidden">
            <motion.div 
               animate={{ 
                 width: isPlaying ? '100%' : '60%',
                 backgroundColor: isPlaying ? ['#0078d4', '#00f2ff', '#0078d4'] : '#0078d4'
               }}
               transition={{ duration: isPlaying ? 2 : 1, repeat: isPlaying ? Infinity : 0 }}
               className="h-full bg-editor-accent shadow-[0_0_10px_#0078d4]"
            />
         </div>
         <div className="flex justify-between items-center text-[8px] text-gray-500 font-mono mt-1">
            <span>U-ID: AYUSH_CORE</span>
            <span className="animate-pulse flex items-center gap-1">
              <Activity size={8} /> LIVE_SIGNAL
            </span>
         </div>
      </div>
    </aside>
  );
});
