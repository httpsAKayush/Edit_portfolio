import { motion } from 'motion/react';
import { LucideIcon, MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface PanelHeaderProps {
  title: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PanelHeader({ title, icon: Icon, actions }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2 md:px-3 py-1 md:py-1.5 border-b border-editor-border bg-editor-panel select-none">
      <div className="flex items-center gap-1.5 md:gap-2 overflow-hidden">
        {Icon && <Icon size={12} className="text-editor-muted shrink-0 md:w-3.5 md:h-3.5" />}
        <span className="text-[9px] md:text-[11px] uppercase tracking-wider font-semibold text-editor-muted truncate">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        {actions}
        <button className="text-editor-muted hover:text-white transition-colors">
          <MoreVertical size={12} className="md:w-3.5 md:h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface TooltipProps {
  label: string;
}

export function Tooltip({ label }: TooltipProps) {
  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[10px] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
      {label}
    </div>
  );
}

export function EditorButton({ icon: Icon, active, onClick, tooltip, size = 16 }: { icon: LucideIcon, active?: boolean, onClick?: () => void, tooltip?: string, size?: number }) {
  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        className={`p-1.5 rounded transition-all ${
          active ? 'bg-editor-accent text-white' : 'text-editor-muted hover:bg-editor-border hover:text-white'
        }`}
      >
        <Icon size={size} />
      </button>
      {tooltip && <Tooltip label={tooltip} />}
    </div>
  );
}
