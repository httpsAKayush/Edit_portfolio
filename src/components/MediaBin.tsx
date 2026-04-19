import { PanelHeader } from './EditorUI';
import { Project, AspectRatio } from '../types';
import { PROJECTS } from '../constants';
import { LayoutGrid, List, Search, Folder, Play, Smartphone, Monitor as MonitorIcon, Square, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, memo } from 'react';

interface MediaBinProps {
  onSelectProject: (project: Project) => void;
  selectedId?: string;
}

export const MediaBin = memo(function MediaBin({ onSelectProject, selectedId }: MediaBinProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');

  const filteredProjects = PROJECTS.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const getRatioIcon = (ratio: AspectRatio) => {
    switch(ratio) {
      case '9:16': return <Smartphone size={10} />;
      case '1:1': return <Square size={10} />;
      case '2.35:1': return <div className="w-3 h-1.5 border border-current rounded-[1px]" />;
      default: return <MonitorIcon size={10} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-editor-panel border-r border-editor-border">
      <PanelHeader 
        title="Project: Media Bin" 
        icon={Folder}
        actions={
          <div className="flex items-center gap-1.5 hidden sm:flex">
             <button 
               onClick={() => setViewMode('LIST')}
               className={`p-1 rounded transition-all cursor-pointer ${viewMode === 'LIST' ? 'bg-editor-bg border border-editor-border text-editor-accent' : 'hover:bg-white/5 text-editor-muted'}`}
             >
                <List size={14} />
             </button>
             <button 
               onClick={() => setViewMode('GRID')}
               className={`p-1 rounded transition-all cursor-pointer ${viewMode === 'GRID' ? 'bg-editor-bg border border-editor-border text-editor-accent' : 'hover:bg-white/5 text-editor-muted'}`}
             >
                <LayoutGrid size={14} />
             </button>
          </div>
        }
      />
      
      <div className="p-3 border-b border-editor-border space-y-3">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-editor-muted group-focus-within:text-editor-accent transition-colors" size={12} />
          <input 
            type="text" 
            placeholder="Search assets..." 
            className="w-full bg-editor-bg border border-editor-border rounded py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:border-editor-accent focus:ring-1 focus:ring-editor-accent/30 transition-all font-medium placeholder:text-editor-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] font-bold text-editor-muted uppercase tracking-widest px-1">
           <div className="flex items-center gap-2">
              <Filter size={10} />
              <span>All Projects</span>
           </div>
           <span>{filteredProjects.length} Items</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-custom">
        <div className={`grid gap-3 pb-8 ${viewMode === 'GRID' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onSelectProject(project)}
                className={`group relative flex flex-col rounded-md border transition-all cursor-pointer overflow-hidden ${
                  selectedId === project.id 
                    ? 'bg-editor-accent/5 border-editor-accent ring-1 ring-editor-accent' 
                    : 'border-white/5 bg-editor-bg hover:border-white/20'
                }`}
              >
                {/* Thumbnail Wrapper */}
                <div className={`relative overflow-hidden bg-black ${project.aspectRatio === '9:16' ? 'aspect-[4/5]' : 'aspect-video'}`}>
                  {project.videoUrl ? (
                    <>
                      <img 
                        src={project.thumbnail} 
                        alt={project.title} 
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-0 transition-opacity duration-300" 
                      />
                      <video
                        src={project.videoUrl}
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                        onMouseLeave={(e) => {
                          const v = e.target as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                        }}
                      />
                    </>
                  ) : (
                    <img 
                      src={project.thumbnail} 
                      alt={project.title} 
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-110" 
                    />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Status Badges */}
                  <div className={`absolute top-2 left-2 flex gap-1.5 ${viewMode === 'GRID' ? 'scale-75 origin-top-left' : ''}`}>
                    <div className="p-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[8px] text-white flex items-center gap-1 font-mono">
                       {getRatioIcon(project.aspectRatio)}
                       {project.aspectRatio}
                    </div>
                  </div>

                  <div className={`absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm border border-white/5 px-1.5 text-[9px] font-mono text-white/80 rounded ${viewMode === 'GRID' ? 'scale-75 origin-bottom-right' : ''}`}>
                    {project.duration}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity scale-75 group-hover:scale-100 duration-300">
                    <div className={`${viewMode === 'GRID' ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-editor-accent flex items-center justify-center shadow-2xl`}>
                       <Play size={viewMode === 'GRID' ? 12 : 16} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  
                  {/* Scrubbing Bar Mock */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                     <motion.div 
                       animate={{ x: ['-100%', '100%'] }}
                       transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                       className="h-full w-1/3 bg-editor-accent shadow-[0_0_10px_#0078d4]"
                     />
                  </div>
                </div>

                {/* Info */}
                <div className={`p-2 gap-0.5 flex flex-col ${viewMode === 'GRID' ? 'pb-1.5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-black uppercase truncate tracking-tight group-hover:text-editor-accent transition-colors ${viewMode === 'GRID' ? 'text-[10px]' : 'text-[12px]'}`}>
                      {project.title}
                    </h3>
                  </div>
                  {viewMode === 'LIST' && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-[8px] px-2 py-0.5 bg-white/5 text-editor-muted rounded-full group-hover:border-editor-accent/30 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
