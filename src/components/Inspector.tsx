import React, { useState, useEffect, memo } from 'react';
import { Project, GradeMode } from '../types';
import { PanelHeader } from './EditorUI';
import { Info, User, Share2, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface InspectorProps {
  selectedProject: Project | null;
  isPlaying: boolean;
}

export const Inspector = memo(function Inspector({ selectedProject, isPlaying }: InspectorProps) {
  return (
    <aside className="w-80 bg-editor-panel border-l border-editor-border flex flex-col hidden xl:flex">
      <PanelHeader title="Inspector: Effect Controls" icon={Activity} />

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {/* Editor Identity */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
             <span className="text-[10px] font-bold uppercase tracking-widest text-editor-muted">Metadata</span>
             <User size={12} className="text-editor-muted" />
          </div>
          <div className="bg-editor-bg border border-editor-border p-3 rounded-md relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                <Share2 size={10} />
             </div>
             <div className="text-[12px] font-black italic tracking-tighter uppercase">{selectedProject?.title || 'System_IDLE'}</div>
             <div className="text-[10px] text-editor-muted mt-2 leading-relaxed">
                {selectedProject?.description || 'Creative Editor specialized in High-Octane visual rhythmic narratives.'}
             </div>
          </div>
        </section>
      </div>

      <div className="p-3 border-t border-editor-border bg-black/20 flex flex-col gap-2">
         <div className="flex justify-between items-center text-[9px] text-editor-muted font-mono uppercase tracking-widest">
            <span>Kernel Hash</span>
            <span>x99-24-render</span>
         </div>
         <div className="h-1 bg-editor-bg rounded-full overflow-hidden">
            <motion.div 
               animate={{ width: isPlaying ? ['20%', '80%', '40%'] : '10%' }}
               className="h-full bg-editor-accent"
            />
         </div>
      </div>
    </aside>
  );
});
