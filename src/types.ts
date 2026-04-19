export type GradeMode = 'REC709' | 'LOG' | 'BLEACH' | 'CINEMA' | 'MONO';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '2.35:1' | '8:3.5';
export type EditorViewMode = 'DISCOVERY' | 'EDITOR';
export type EditorTool = 'SELECT' | 'RAZOR' | 'STRETCH' | 'TEXT' | 'RIPPLE';

export interface SequencePart {
  id: string;
  start: number;
  end: number;
  type: 'NORMAL' | 'HIGHLIGHT' | 'NODE_FOCUS';
  label: string;
}

export interface Project {
  id: string;
  title: string;
  client: string;
  year: string;
  thumbnail?: string;
  videoUrl?: string;
  duration: string;
  tags: string[];
  description: string;
  idealGrade?: GradeMode;
  aspectRatio: AspectRatio;
  sequence?: SequencePart[];
  spherePosition?: [number, number, number]; // [x, y, z] on the navigation sphere
}

export interface CareerMilestone {
  id: string;
  year: string;
  event: string;
  type: 'project' | 'education' | 'award';
  color: string;
  timestamp: number;
}

export interface EditorState {
  currentTime: number;
  isPlaying: boolean;
  selectedProject: Project | null;
  gradeMode: GradeMode;
  showGuides: boolean;
  viewMode: EditorViewMode;
  timelineZoom: number;
  selectedTool: EditorTool;
  isTimelineLocked: boolean;
}
