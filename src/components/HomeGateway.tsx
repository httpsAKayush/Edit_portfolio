import React, { useState, useEffect, useCallback } from 'react';
import { Project, PortfolioMode } from '../types';
import { getDriveOrMailAction } from '../constants';
import { Check, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticFilmStrips } from './home/KineticFilmStrips';
import { OpeningViewfinder } from './home/OpeningViewfinder';
import { ProjectIrisSection } from './home/ProjectIrisSection';
import { CapabilitiesSection } from './home/CapabilitiesSection';
import { ProcessTimelineSection } from './home/ProcessTimelineSection';
import { ContactProjectorSection } from './home/ContactProjectorSection';

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
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Project | null>(null);

  // Spotlight project: TEXTURE MOTION EDIT (p2)
  const hero =
    featuredProject ||
    projects.find((p) => p.id === 'p2' || p.title.toLowerCase().includes('texture motion')) ||
    projects[0];

  const handleCopyEmail = useCallback(() => {
    navigator.clipboard.writeText('ak4895931@gmail.com');
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 2200);
  }, []);

  const handleNavigateSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Close video lightbox on Escape key
  useEffect(() => {
    if (!selectedVideo) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedVideo]);

  return (
    <div className="min-h-screen w-full bg-[#0A0A0B] text-[#EFE6D5] flex flex-col font-sans selection:bg-[#EB4A1D] selection:text-white relative overflow-x-hidden">
      {/* Kinetic Geometric SVG Film-Strip Ribbons drifting behind lower sections */}
      <KineticFilmStrips />

      {/* Copy Email Toast */}
      <AnimatePresence>
        {copiedEmail && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#EB4A1D] text-white text-xs px-4 py-2 shadow-2xl flex items-center gap-2 font-mono"
          >
            <Check size={14} />
            <span>Email copied · ak4895931@gmail.com</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 01 — OPENING VIEWFINDER + SPLIT LEFT/RIGHT QUADRANT ARC RINGS */}
      <OpeningViewfinder
        hero={hero}
        onSelectMode={onSelectMode}
        onCopyEmail={handleCopyEmail}
        onNavigateSection={handleNavigateSection}
      />

      {/* SECTION 02 — MECHANICAL 6-BLADE IRIS DIAPHRAGM PROJECT BROWSER */}
      <ProjectIrisSection
        projects={projects}
        onWatchProject={(project) => setSelectedVideo(project)}
        onSelectMode={onSelectMode}
      />

      {/* SECTION 03 — CREATIVE CAPABILITIES (4 INTERACTIVE GRAPHIC INSTRUMENTS) */}
      <CapabilitiesSection />

      {/* SECTION 04 — INTERACTIVE MULTI-TRACK PROCESS TIMELINE */}
      <ProcessTimelineSection />

      {/* SECTION 05 — BAUHAUS 35MM CINEMA PROJECTOR CONTACT & BOOKING POSTER */}
      <ContactProjectorSection
        onSelectMode={onSelectMode}
        onCopyEmail={handleCopyEmail}
      />

      {/* QUIET EDITORIAL FOOTER */}
      <footer className="relative z-10 w-full border-t border-[#EFE6D5]/10 bg-[#0A0A0B]">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7C7469] font-mono">
          <div>AYUSH · COMMERCIAL &amp; MOTION VIDEO EDITOR · 2026</div>
          <div className="flex items-center gap-5">
            <button
              onClick={() => onSelectMode('CLIENT')}
              className="hover:text-[#EFE6D5] transition-colors cursor-pointer"
            >
              Client Showcase
            </button>
            <button
              onClick={() => onSelectMode('EDITOR')}
              className="hover:text-[#EB4A1D] transition-colors cursor-pointer"
            >
              Editor Workstation
            </button>
            <a href="mailto:ak4895931@gmail.com" className="hover:text-[#EFE6D5] transition-colors">
              Email
            </a>
          </div>
        </div>
      </footer>

      {/* FULLSCREEN VIDEO LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedVideo && (
          <div
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-[#0D0C0C] border border-[#EFE6D5]/20 shadow-2xl overflow-hidden"
            >
              {/* Modal Top Bar (Single Drive Full HD button) */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#EFE6D5]/12 bg-[#141312]">
                <div className="flex items-center gap-2 text-xs min-w-0">
                  <span className="font-display font-bold text-[#EFE6D5] truncate">
                    {selectedVideo.title}
                  </span>
                  <span aria-hidden="true" className="text-[#7C7469]">·</span>
                  <span className="text-[#B9A992] truncate hidden sm:inline">
                    {selectedVideo.client}
                  </span>
                  <span aria-hidden="true" className="text-[#7C7469] hidden sm:inline">·</span>
                  <span className="text-[#EB4A1D] font-mono tabular-nums shrink-0">
                    {selectedVideo.duration}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {(() => {
                    const action = getDriveOrMailAction(selectedVideo);
                    return (
                      <a
                        href={action.url}
                        target={action.target}
                        rel="noopener noreferrer"
                        title={action.tooltip}
                        className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>{action.isDrive ? 'Drive Full HD' : 'Request Full HD'}</span>
                      </a>
                    );
                  })()}

                  <button
                    onClick={() => setSelectedVideo(null)}
                    aria-label="Close video player"
                    className="p-1.5 text-[#B9A992] hover:text-white border border-[#EFE6D5]/15 hover:border-[#EFE6D5]/40 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Video Frame */}
              <div className="aspect-video bg-black flex items-center justify-center">
                {selectedVideo.videoUrl ? (
                  <video
                    key={selectedVideo.id}
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

              {/* Modal Bottom Bar */}
              <div className="px-4 py-3 bg-[#141312] border-t border-[#EFE6D5]/12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#B9A992]">
                <p className="line-clamp-1">{selectedVideo.description}</p>
                <div className="flex items-center gap-4 shrink-0 font-mono">
                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      onSelectMode('CLIENT');
                    }}
                    className="text-[#EFE6D5] hover:text-[#EB4A1D] transition-colors cursor-pointer"
                  >
                    Client Showcase →
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      onSelectMode('EDITOR');
                    }}
                    className="text-[#EB4A1D] hover:underline cursor-pointer"
                  >
                    Editor Workstation →
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
