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
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-editor-border bg-editor-panel select-none">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-editor-muted" />}
        <span className="text-[11px] uppercase tracking-wider font-semibold text-editor-muted">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="text-editor-muted hover:text-white transition-colors">
          <MoreVertical size={14} />
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

export function EditorButton({ icon: Icon, active, onClick, tooltip }: { icon: LucideIcon, active?: boolean, onClick?: () => void, tooltip?: string }) {
  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        className={`p-1.5 rounded transition-all ${
          active ? 'bg-editor-accent text-white' : 'text-editor-muted hover:bg-editor-border hover:text-white'
        }`}
      >
        <Icon size={16} />
      </button>
      {tooltip && <Tooltip label={tooltip} />}
    </div>
  );
}
