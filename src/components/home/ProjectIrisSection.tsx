import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Project, ProjectCategory, PortfolioMode } from '../../types';
import { getDriveOrMailAction } from '../../constants';
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectIrisSectionProps {
  projects: Project[];
  onWatchProject: (project: Project) => void;
  onSelectMode: (mode: PortfolioMode) => void;
}

const BLADE_COUNT = 6;
const BLADE_STEP_DEG = 360 / BLADE_COUNT;
const HEX_BASE_OFFSET_DEG = -30; // Centers blade slot 0 directly at 0° (3 o'clock Pointer)
const VIEWBOX_HALF = 492;

// Expanded inner core so blades & center video dominate, surrounded by two slim concentric rings
const R_OUTER = 382;
const R_HEX_MIN = 124; // f/11 tight macro
const R_HEX_MAX = 278; // f/1.4 wide open (DEFAULT)

// Outermost Aperture Measurement Arc positioned cleanly along the unobstructed LEFT rim (224° top-left down to 136° bottom-left)
// so neither the top frosted glass header nor the bottom 35mm film-tape strip ever obstructs dragging f-stops!
const APERTURE_ARC_START = 224; // upper-left: f/1.4
const APERTURE_ARC_END = 136;   // lower-left: f/11

interface ApertureStop {
  label: string;
  focalLabel: string;
  rHex: number;
}

const APERTURE_STOPS: ApertureStop[] = [
  { label: 'f/1.4', focalLabel: '24mm · Wide', rHex: 278 },
  { label: 'f/2.8', focalLabel: '35mm · Open', rHex: 248 },
  { label: 'f/4', focalLabel: '50mm · Cinema', rHex: 216 },
  { label: 'f/5.6', focalLabel: '70mm · Tight', rHex: 186 },
  { label: 'f/8', focalLabel: '85mm · Focus', rHex: 154 },
  { label: 'f/11', focalLabel: '105mm · Macro', rHex: 124 }
];

const BLADE_PALETTE = [
  { bg: '#EFE6D5', border: '#C2B39B', text: '#0A0A0B', sub: '#463F37' },
  { bg: '#1D1B1A', border: '#0A0A0B', text: '#EFE6D5', sub: '#B9A992' },
  { bg: '#D6C4A8', border: '#A89476', text: '#0A0A0B', sub: '#463F37' },
  { bg: '#141312', border: '#080809', text: '#EFE6D5', sub: '#B9A992' },
  { bg: '#E3D5BF', border: '#B6A58B', text: '#0A0A0B', sub: '#463F37' },
  { bg: '#23201E', border: '#0A0A0B', text: '#EFE6D5', sub: '#B9A992' }
];

function polar(deg: number, r: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
}

function describeArc(startDeg: number, endDeg: number, r: number): string {
  const p1 = polar(startDeg, r);
  const p2 = polar(endDeg, r);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg >= startDeg ? 1 : 0;
  return `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
}

function rHexToApertureAngle(rHex: number): number {
  const t = (R_HEX_MAX - rHex) / (R_HEX_MAX - R_HEX_MIN);
  return APERTURE_ARC_START + Math.max(0, Math.min(1, t)) * (APERTURE_ARC_END - APERTURE_ARC_START);
}

/**
 * Exact sharp DSLR 6-blade Iris Diaphragm geometry.
 * Every blade's straight inner edge is collinear with one side of the central
 * regular hexagon of circumradius `rHex`, extending outward to intersect `R_OUTER`,
 * with a sharp overlapping tongue past vertex k.
 */
function buildSharpHexBlade(slotIndex: number, rHex: number) {
  const theta0 = slotIndex * BLADE_STEP_DEG + HEX_BASE_OFFSET_DEG;
  const theta1 = (slotIndex + 1) * BLADE_STEP_DEG + HEX_BASE_OFFSET_DEG;

  const v0 = polar(theta0, rHex);
  const v1 = polar(theta1, rHex);

  const edgeDx = v1.x - v0.x;
  const edgeDy = v1.y - v0.y;
  const edgeLen = Math.hypot(edgeDx, edgeDy) || 1;

  const tx = edgeDx / edgeLen;
  const ty = edgeDy / edgeLen;
  const nx = ty;
  const ny = -tx;

  const mx = (v0.x + v1.x) / 2;
  const my = (v0.y + v1.y) / 2;
  const apothem = rHex * Math.cos(Math.PI / 6);

  const sMax = Math.sqrt(Math.max(1, R_OUTER * R_OUTER - apothem * apothem));
  const pOuterEnd = {
    x: mx + tx * sMax,
    y: my + ty * sMax
  };

  const overlapBack = Math.min(58, Math.max(24, (R_OUTER - rHex) * 0.36));
  const pTip = {
    x: v0.x - tx * overlapBack,
    y: v0.y - ty * overlapBack
  };

  const angleEnd = (Math.atan2(pOuterEnd.y, pOuterEnd.x) * 180) / Math.PI;
  const spanDeg = Math.min(82, Math.max(66, 70 + (R_HEX_MAX - rHex) * 0.07));
  const angleStart = angleEnd - spanDeg;
  const pOuterStart = polar(angleStart, R_OUTER);

  const backMidX = (pOuterStart.x + pTip.x) / 2 + nx * 26;
  const backMidY = (pOuterStart.y + pTip.y) / 2 + ny * 26;

  const path = [
    `M ${pTip.x.toFixed(2)} ${pTip.y.toFixed(2)}`,
    `L ${pOuterEnd.x.toFixed(2)} ${pOuterEnd.y.toFixed(2)}`,
    `A ${R_OUTER} ${R_OUTER} 0 0 0 ${pOuterStart.x.toFixed(2)} ${pOuterStart.y.toFixed(2)}`,
    `Q ${backMidX.toFixed(2)} ${backMidY.toFixed(2)} ${pTip.x.toFixed(2)} ${pTip.y.toFixed(2)}`,
    'Z'
  ].join(' ');

  const centroidDist = Math.min(R_OUTER - 34, apothem + (R_OUTER - apothem) * 0.5);
  const labelAngle = (theta0 + theta1) / 2 + 5;
  const centroid = polar(labelAngle, centroidDist);
  const popDir = polar(labelAngle, 1);

  return { path, centroid, popDir };
}

function buildLocalHexClipPolygon(rotationDeg: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const ang = i * BLADE_STEP_DEG + HEX_BASE_OFFSET_DEG + rotationDeg;
    const rad = (ang * Math.PI) / 180;
    const px = 50 + 49.7 * Math.cos(rad);
    const py = 50 + 49.7 * Math.sin(rad);
    return `${px.toFixed(3)}% ${py.toFixed(3)}%`;
  });
  return `polygon(${pts.join(', ')})`;
}

function buildHexPoints(rHex: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const p = polar(i * BLADE_STEP_DEG + HEX_BASE_OFFSET_DEG, rHex);
    return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(' ');
}

export const ProjectIrisSection: React.FC<ProjectIrisSectionProps> = ({
  projects,
  onWatchProject
}) => {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('ALL');
  const [stepIndex, setStepIndex] = useState<number>(() => {
    const playable = projects.filter((p) => !p.sphereOnly && !p.unclickable);
    const logoIdx = playable.findIndex((p) => /logo animation/i.test(p.title));
    if (logoIdx >= 0) return logoIdx;
    return playable.length > 2 ? 2 : 0;
  });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [hoveredStationIdx, setHoveredStationIdx] = useState<number | null>(null);
  const [rHex, setRHex] = useState<number>(216); // Default f/4 cinema aperture
  const [isCenterMuted, setIsCenterMuted] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [aperturePulse, setAperturePulse] = useState(false);
  const [isDraggingAperture, setIsDraggingAperture] = useState(false);
  const [isDraggingGear, setIsDraggingGear] = useState(false);
  const [liveGearDragDeg, setLiveGearDragDeg] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const centerVideoRef = useRef<HTMLVideoElement>(null);

  const bladeDragRef = useRef<{ dragging: boolean; lastAngle: number; accum: number }>({
    dragging: false,
    lastAngle: 0,
    accum: 0
  });

  const gearDragRef = useRef<{
    dragging: boolean;
    lastAngle: number;
    accumDeg: number;
    didMove: boolean;
  }>({
    dragging: false,
    lastAngle: 0,
    accumDeg: 0,
    didMove: false
  });

  // Start selected center video when scrolled into view, pause when scrolled away
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const categoryProjects = useMemo(() => {
    return projects.filter((p) => {
      if (p.sphereOnly) return false;
      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'COMMERCIAL') {
        return p.category === 'COMMERCIAL' || p.tags.some((t) => /commercial|corporate|brand/i.test(t));
      }
      if (activeCategory === 'REEL') {
        return p.category === 'REEL' || p.aspectRatio === '9:16' || p.tags.some((t) => /reel|vertical|action/i.test(t));
      }
      if (activeCategory === 'MOTION') {
        return p.category === 'MOTION' || p.tags.some((t) => /motion|animation|vfx/i.test(t));
      }
      return true;
    });
  }, [projects, activeCategory]);

  const playableProjects = useMemo(
    () => categoryProjects.filter((p) => !p.unclickable),
    [categoryProjects]
  );

  const totalPlayable = playableProjects.length;
  const stationStepDeg = totalPlayable > 0 ? 360 / totalPlayable : 60;
  const safeIndex =
    totalPlayable > 0 ? ((stepIndex % totalPlayable) + totalPlayable) % totalPlayable : 0;
  const activeProject = playableProjects[safeIndex] || playableProjects[0];

  const triggerApertureClick = useCallback(() => {
    setAperturePulse(true);
    window.setTimeout(() => setAperturePulse(false), 160);
  }, []);

  const stepProject = useCallback(
    (delta: number) => {
      if (totalPlayable <= 1) return;
      setStepIndex((prev) => prev + delta);
      triggerApertureClick();
    },
    [totalPlayable, triggerApertureClick]
  );

  const selectProjectByIndex = useCallback(
    (targetIdx: number) => {
      if (totalPlayable === 0) return;
      const curr = ((stepIndex % totalPlayable) + totalPlayable) % totalPlayable;
      let diff = targetIdx - curr;
      if (diff > totalPlayable / 2) diff -= totalPlayable;
      if (diff < -totalPlayable / 2) diff += totalPlayable;
      if (diff !== 0) {
        setStepIndex((prev) => prev + diff);
        triggerApertureClick();
      }
    },
    [stepIndex, totalPlayable, triggerApertureClick]
  );

  const handleCategoryChange = (cat: ProjectCategory) => {
    setActiveCategory(cat);
    setStepIndex(0);
    setLiveGearDragDeg(0);
    setHoveredSlot(null);
    setHoveredStationIdx(null);
    triggerApertureClick();
  };

  // Continuous coupled rotations for Middle Gear Ring (Layer B2) and Inner 6 Blades (Layer B1)
  const gearRingRotationDeg = -stepIndex * stationStepDeg + liveGearDragDeg;
  const bladeRotationDeg =
    -stepIndex * BLADE_STEP_DEG + (liveGearDragDeg / stationStepDeg) * BLADE_STEP_DEG;

  const activeSlot = ((stepIndex % BLADE_COUNT) + BLADE_COUNT) % BLADE_COUNT;
  const bladeItems = useMemo(() => {
    if (totalPlayable === 0) return [];
    return Array.from({ length: BLADE_COUNT }, (_, slot) => {
      let slotDelta = (slot - activeSlot + BLADE_COUNT) % BLADE_COUNT;
      if (slotDelta > BLADE_COUNT / 2) slotDelta -= BLADE_COUNT;
      const projIdx = (safeIndex + slotDelta + totalPlayable * 10) % totalPlayable;
      const geom = buildSharpHexBlade(slot, rHex);
      return {
        slot,
        projIdx,
        project: playableProjects[projIdx],
        isActive: slot === activeSlot,
        ...geom
      };
    });
  }, [playableProjects, totalPlayable, safeIndex, activeSlot, rHex]);

  const hoveredBlade = hoveredSlot !== null ? bladeItems.find((b) => b.slot === hoveredSlot) || null : null;
  const isInspectingOtherBlade = !!(hoveredBlade && activeProject && hoveredBlade.project.id !== activeProject.id);

  // Selected center video plays continuously when in view (ZERO change on blade hover)
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    video.muted = isCenterMuted;
    if (isInView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isCenterMuted, isInView, activeProject?.id]);

  const getPointerAngle = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  }, []);

  // Outermost Layer B3 (LEFT ARC 224° -> 136°): Update aperture smoothly without any wrap jump at 180°
  const updateApertureFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rawDeg = getPointerAngle(clientX, clientY);
      const normDeg = (rawDeg + 360) % 360; // 180° = dead left, 224° = upper-left (f/1.4), 136° = lower-left (f/11)
      let clamped = normDeg;
      if (normDeg > APERTURE_ARC_START || normDeg < 45) {
        clamped = normDeg >= 270 || normDeg < 45 ? APERTURE_ARC_START : APERTURE_ARC_START;
      }
      if (normDeg >= 45 && normDeg < APERTURE_ARC_END) {
        clamped = APERTURE_ARC_END;
      }
      clamped = Math.max(APERTURE_ARC_END, Math.min(APERTURE_ARC_START, clamped));
      const t = (APERTURE_ARC_START - clamped) / (APERTURE_ARC_START - APERTURE_ARC_END);
      const nextRHex = Math.round(R_HEX_MAX - t * (R_HEX_MAX - R_HEX_MIN));
      setRHex(nextRHex);
    },
    [getPointerAngle]
  );

  // Global drag tracking for Outermost Aperture Ring (Layer B3)
  useEffect(() => {
    if (!isDraggingAperture) return;
    const onMove = (e: PointerEvent) => updateApertureFromPointer(e.clientX, e.clientY);
    const onUp = () => setIsDraggingAperture(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingAperture, updateApertureFromPointer]);

  // Global drag tracking for Middle Follow-Focus Blade Rotation Gear Ring (Layer B2)
  useEffect(() => {
    if (!isDraggingGear) return;
    const onMove = (e: PointerEvent) => {
      if (!gearDragRef.current.dragging || totalPlayable <= 1) return;
      const angle = getPointerAngle(e.clientX, e.clientY);
      let delta = angle - gearDragRef.current.lastAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      gearDragRef.current.lastAngle = angle;
      gearDragRef.current.accumDeg += delta;

      if (Math.abs(gearDragRef.current.accumDeg) > 3.5) {
        gearDragRef.current.didMove = true;
      }

      let stepDelta = 0;
      while (gearDragRef.current.accumDeg >= stationStepDeg * 0.5) {
        gearDragRef.current.accumDeg -= stationStepDeg;
        stepDelta -= 1;
      }
      while (gearDragRef.current.accumDeg <= -stationStepDeg * 0.5) {
        gearDragRef.current.accumDeg += stationStepDeg;
        stepDelta += 1;
      }

      if (stepDelta !== 0) {
        setStepIndex((prev) => prev + stepDelta);
        triggerApertureClick();
      }

      setLiveGearDragDeg(gearDragRef.current.accumDeg);
    };

    const onUp = () => {
      gearDragRef.current.dragging = false;
      gearDragRef.current.accumDeg = 0;
      setIsDraggingGear(false);
      setLiveGearDragDeg(0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isDraggingGear, getPointerAngle, stationStepDeg, totalPlayable, triggerApertureClick]);

  // Dragging inner blade wheel also rotates projects
  const handleBladePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    const angle = getPointerAngle(e.clientX, e.clientY);
    bladeDragRef.current = { dragging: true, lastAngle: angle, accum: 0 };
  };

  const handleBladePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!bladeDragRef.current.dragging) return;
    const angle = getPointerAngle(e.clientX, e.clientY);
    let delta = angle - bladeDragRef.current.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    bladeDragRef.current.lastAngle = angle;
    bladeDragRef.current.accum += delta;

    if (Math.abs(bladeDragRef.current.accum) >= 34) {
      const steps = bladeDragRef.current.accum > 0 ? -1 : 1;
      bladeDragRef.current.accum = 0;
      stepProject(steps);
    }
  };

  const handleBladePointerUp = () => {
    bladeDragRef.current.dragging = false;
  };

  // Middle Ring (Layer B2): 72-tooth cinema follow-focus gear pitch cogs
  const focusGearAngles = useMemo(() => Array.from({ length: 72 }, (_, i) => i * 5), []);
  // Outermost Ring (Layer B3): Fine 96-rib optical barrel knurling
  const knurlAngles = useMemo(() => Array.from({ length: 96 }, (_, i) => i * 3.75), []);
  // Outermost Ring (Layer B3): Stepped measurement notches along LEFT aperture arc (224° -> 136°)
  const apertureNotchAngles = useMemo(
    () => Array.from({ length: 27 }, (_, i) => APERTURE_ARC_START + (i / 26) * (APERTURE_ARC_END - APERTURE_ARC_START)),
    []
  );

  const localHexClipPolygon = useMemo(() => buildLocalHexClipPolygon(bladeRotationDeg), [bladeRotationDeg]);
  const hexDiameterPct = (rHex / VIEWBOX_HALF) * 100;
  const hexPoints = useMemo(() => buildHexPoints(rHex), [rHex]);
  const currentApertureAngle = useMemo(() => rHexToApertureAngle(rHex), [rHex]);
  const knurlCollarRotation = ((R_HEX_MAX - rHex) / (R_HEX_MAX - R_HEX_MIN)) * 36;

  const activeApertureStop = useMemo(() => {
    return APERTURE_STOPS.reduce((best, stop) =>
      Math.abs(stop.rHex - rHex) < Math.abs(best.rHex - rHex) ? stop : best
    );
  }, [rHex]);

  const dossierProject = isInspectingOtherBlade && hoveredBlade ? hoveredBlade.project : activeProject;
  const dossierIndex = isInspectingOtherBlade && hoveredBlade ? hoveredBlade.projIdx : safeIndex;
  const driveAction = dossierProject ? getDriveOrMailAction(dossierProject) : null;

  const pointerWindowHalfDeg = Math.min(10, Math.max(6.5, stationStepDeg * 0.42));

  const renderBladeGroup = (item: (typeof bladeItems)[number], isPoppedLayer: boolean) => {
    const palette = BLADE_PALETTE[item.slot % BLADE_PALETTE.length];
    const isHovered = hoveredSlot === item.slot;
    const fill = item.isActive ? '#EB4A1D' : palette.bg;
    const bladeBorder = item.isActive ? '#A82B0B' : palette.border;
    const textFill = item.isActive ? '#FFFFFF' : palette.text;
    const subFill = item.isActive ? '#FFE4DB' : palette.sub;

    const shortTitle =
      item.project.title.length > 16
        ? item.project.title.slice(0, 15).trim() + '…'
        : item.project.title;

    const popTransform = isPoppedLayer
      ? `translate(${(item.popDir.x * 12).toFixed(2)}px, ${(item.popDir.y * 12).toFixed(2)}px) scale(1.045)`
      : 'translate(0px, 0px) scale(1)';

    return (
      <g
        key={`${isPoppedLayer ? 'pop' : 'base'}-blade-${item.slot}`}
        className={isPoppedLayer ? 'pointer-events-none' : 'cursor-pointer'}
        style={{
          transform: popTransform,
          transformOrigin: `${item.centroid.x.toFixed(1)}px ${item.centroid.y.toFixed(1)}px`,
          transition: 'transform 210ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        filter={isPoppedLayer ? 'url(#iris-blade-pop-shadow)' : undefined}
        onMouseEnter={!isPoppedLayer ? () => setHoveredSlot(item.slot) : undefined}
        onMouseLeave={!isPoppedLayer ? () => setHoveredSlot((prev) => (prev === item.slot ? null : prev)) : undefined}
        onClick={
          !isPoppedLayer
            ? (e) => {
                e.stopPropagation();
                selectProjectByIndex(item.projIdx);
              }
            : undefined
        }
      >
        <path
          d={item.path}
          fill={fill}
          stroke={isPoppedLayer ? '#EFE6D5' : bladeBorder}
          strokeWidth={isPoppedLayer ? '2.2' : '2.1'}
          strokeLinejoin="miter"
          strokeMiterlimit="6"
        />

        <image
          href={item.project.thumbnail}
          x="-390"
          y="-390"
          width="780"
          height="780"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#sharp-blade-clip-${item.slot})`}
          opacity={isPoppedLayer ? 0.34 : item.isActive ? 0.22 : isHovered ? 0.28 : 0.09}
          style={{ pointerEvents: 'none' }}
        />

        {isPoppedLayer && (
          <path
            d={item.path}
            fill="none"
            stroke="#EB4A1D"
            strokeOpacity={0.95}
            strokeWidth="1.8"
            strokeLinejoin="miter"
          />
        )}

        <g
          style={{
            transform: `rotate(${-bladeRotationDeg}deg)`,
            transformOrigin: `${item.centroid.x.toFixed(1)}px ${item.centroid.y.toFixed(1)}px`,
            transition: isDraggingGear ? 'none' : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none'
          }}
        >
          <text
            x={item.centroid.x}
            y={item.centroid.y - 9}
            textAnchor="middle"
            fill={textFill}
            fontSize={rHex > 250 ? '14' : '16.5'}
            fontFamily="Archivo, sans-serif"
            fontWeight="900"
          >
            {String(item.projIdx + 1).padStart(2, '0')}
          </text>
          <text
            x={item.centroid.x}
            y={item.centroid.y + 7}
            textAnchor="middle"
            fill={textFill}
            fontSize={rHex > 250 ? '8.4' : '9.5'}
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
            letterSpacing="0.04em"
          >
            {shortTitle.toUpperCase()}
          </text>
          <text
            x={item.centroid.x}
            y={item.centroid.y + 20}
            textAnchor="middle"
            fill={subFill}
            fontSize="7.8"
            fontFamily="JetBrains Mono, monospace"
          >
            {isPoppedLayer && !item.isActive ? 'CLICK TO SELECT' : `${item.project.aspectRatio} · ${item.project.duration}`}
          </text>
        </g>
      </g>
    );
  };

  return (
    <section
      ref={sectionRef}
      id="section-iris"
      className="relative z-10 w-full min-h-[100svh] lg:h-[100svh] lg:min-h-[760px] lg:max-h-[1160px] flex flex-col justify-between border-b border-[#EFE6D5]/10 overflow-hidden"
    >
      {/* LAYER 0 — GIANT OPTICAL BACKPLATE GEOMETRY */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <svg
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full opacity-[0.07]"
        >
          <circle cx="560" cy="500" r="490" fill="none" stroke="#EFE6D5" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="560" cy="500" r="650" fill="none" stroke="#EFE6D5" strokeWidth="0.8" />
          <line x1="0" y1="500" x2="1600" y2="500" stroke="#EFE6D5" strokeWidth="0.7" />
          <line x1="560" y1="0" x2="560" y2="1000" stroke="#EFE6D5" strokeWidth="0.7" />
        </svg>
      </div>

      {/* LAYER 1 — APPLE-STYLE SEAMLESS THICK-GLASS PROGRESSIVE BLUR (RIGHT SIDE, ZERO HARD BOUNDARY) */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-[56%] xl:w-[52%] z-[5]"
      >
        <div
          className="absolute inset-0 backdrop-blur-[12px] backdrop-saturate-125"
          style={{
            WebkitMaskImage:
              'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 32%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0) 82%)',
            maskImage:
              'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.88) 32%, rgba(0,0,0,0.35) 58%, rgba(0,0,0,0) 82%)'
          }}
        />
        <div
          className="absolute inset-0 backdrop-blur-[30px] backdrop-saturate-150 bg-gradient-to-l from-[#EFE6D5]/[0.075] via-[#EFE6D5]/[0.025] to-transparent"
          style={{
            WebkitMaskImage:
              'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.78) 26%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0) 76%)',
            maskImage:
              'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.78) 26%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0) 76%)'
          }}
        />
      </div>

      {/* LAYER 3 (TOP OVERLAY) — FLOATING FROSTED BLURRY GLASS SECTION HEADER ON TOP OF THE IRIS */}
      <header className="relative lg:absolute lg:top-0 lg:inset-x-0 z-30 pointer-events-none">
        {/* Seamless Apple Progressive Frosted Blur Feathering Downward Over the Upper Iris Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[155px] sm:h-[170px] -z-10"
        >
          <div
            className="absolute inset-0 backdrop-blur-[14px] backdrop-saturate-150 bg-gradient-to-b from-[#0A0A0B]/75 via-[#0A0A0B]/35 to-transparent"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 48%, rgba(0,0,0,0.4) 76%, rgba(0,0,0,0) 100%)',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 48%, rgba(0,0,0,0.4) 76%, rgba(0,0,0,0) 100%)'
            }}
          />
          <div
            className="absolute inset-0 backdrop-blur-[28px] bg-gradient-to-b from-[#EFE6D5]/[0.055] via-[#EFE6D5]/[0.015] to-transparent"
            style={{
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 38%, rgba(0,0,0,0) 82%)',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 38%, rgba(0,0,0,0) 82%)'
            }}
          />
        </div>

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 pt-5 sm:pt-6 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="pointer-events-auto">
            <div className="text-[11px] font-mono text-[#EB4A1D] tracking-[0.22em] uppercase">
              02 · Film Index
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#EFE6D5] tracking-tight uppercase mt-0.5 leading-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.6)]">
              Featured Cuts
            </h2>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 p-1 bg-[#141312]/65 backdrop-blur-xl border border-[#EFE6D5]/16 self-start md:self-auto shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            {([
              { id: 'ALL', label: 'All Works' },
              { id: 'COMMERCIAL', label: 'Commercial' },
              { id: 'REEL', label: 'Reels 9:16' },
              { id: 'MOTION', label: 'Motion' }
            ] as { id: ProjectCategory; label: string }[]).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#EB4A1D] text-white'
                    : 'text-[#B9A992] hover:text-[#EFE6D5]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* LAYER 2 — FULL-VIEWPORT MASSIVE IRIS STAGE + MINIMAL RIGHT-SIDE EDITORIAL COPY */}
      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-4 items-center py-4 lg:py-0 lg:-translate-y-12 xl:-translate-y-14">
          {/* MONUMENTAL IRIS DIAPHRAGM (Tucks smoothly beneath Top Frosted Glass & Bottom Film Tape) */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col items-center justify-center relative z-10">
            <div className="relative w-[min(96vw,88vh)] h-[min(96vw,88vh)] lg:w-[min(68vw,96vh)] lg:h-[min(68vw,96vh)] xl:w-[min(73vw,100vh)] xl:h-[min(73vw,100vh)] max-w-[1080px] max-h-[1080px] flex items-center justify-center">
              {/* SUB-LAYER A (z-10): HEXAGONAL CENTER VIDEO — Click expands fullscreen, Hover shows ONLY Mute/Unmute; ZERO change on blade hover */}
              <div
                onClick={() => {
                  if (activeProject) {
                    onWatchProject(activeProject);
                  }
                }}
                title="Click to expand video fullscreen"
                className="group absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 overflow-hidden bg-black cursor-pointer"
                style={{
                  width: `${hexDiameterPct.toFixed(3)}%`,
                  height: `${hexDiameterPct.toFixed(3)}%`,
                  clipPath: localHexClipPolygon,
                  transition:
                    isDraggingAperture || isDraggingGear
                      ? 'none'
                      : 'width 360ms cubic-bezier(0.16, 1, 0.3, 1), height 360ms cubic-bezier(0.16, 1, 0.3, 1), clip-path 380ms cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {activeProject && (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    {activeProject.videoUrl ? (
                      <video
                        key={`iris-hex-vid-${activeProject.id}`}
                        ref={centerVideoRef}
                        src={activeProject.videoUrl}
                        poster={activeProject.thumbnail}
                        muted={isCenterMuted}
                        loop
                        playsInline
                        preload="auto"
                        onCanPlay={(e) => {
                          if (isInView) {
                            e.currentTarget.play().catch(() => {});
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={activeProject.thumbnail}
                        alt={activeProject.title}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* ONLY ONE MUTE / UNMUTE ICON ON HOVER */}
                    <div className="absolute inset-0 z-10 flex items-end justify-center pb-[12%] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCenterMuted((m) => !m);
                        }}
                        aria-label={isCenterMuted ? 'Unmute video' : 'Mute video'}
                        title={isCenterMuted ? 'Unmute' : 'Mute'}
                        className="pointer-events-auto w-11 h-11 rounded-full bg-black/70 hover:bg-[#EB4A1D] backdrop-blur-md border border-[#EFE6D5]/30 text-[#EFE6D5] flex items-center justify-center transition-colors cursor-pointer shadow-lg"
                      >
                        {isCenterMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SUB-LAYER B (z-20): LARGE 6-BLADE DIAPHRAGM + SLIM ROTATION GEAR RING + SLIM OUTERMOST APERTURE RING */}
              <svg
                ref={svgRef}
                viewBox={`-${VIEWBOX_HALF} -${VIEWBOX_HALF} ${VIEWBOX_HALF * 2} ${VIEWBOX_HALF * 2}`}
                className="relative z-20 w-full h-full select-none pointer-events-none overflow-visible"
                role="region"
                aria-label="Interactive 6-blade hexagonal iris with follow-focus blade rotation ring and outermost aperture collar"
              >
                <defs>
                  {bladeItems.map((item) => (
                    <clipPath key={`sharp-clip-${item.slot}`} id={`sharp-blade-clip-${item.slot}`}>
                      <path d={item.path} />
                    </clipPath>
                  ))}
                  <clipPath id="iris-hex-inner-clip">
                    <polygon points={hexPoints} />
                  </clipPath>
                  <filter id="iris-hex-inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" />
                  </filter>
                  <filter id="iris-blade-pop-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.82" />
                  </filter>
                  <filter id="gear-ring-shadow" x="-12%" y="-12%" width="124%" height="124%">
                    <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#000000" floodOpacity="0.72" />
                  </filter>
                  <filter id="aperture-collar-shadow" x="-12%" y="-12%" width="124%" height="124%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.75" />
                  </filter>
                </defs>

                {/* LAYER B1 — LARGE 6 SHARP INTERLOCKING BLADES (r = rHex .. 382) */}
                <g
                  className="pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={handleBladePointerDown}
                  onPointerMove={handleBladePointerMove}
                  onPointerUp={handleBladePointerUp}
                  onPointerLeave={handleBladePointerUp}
                  style={{
                    transform: `rotate(${bladeRotationDeg}deg) scale(${aperturePulse ? 0.982 : 1})`,
                    transformOrigin: '0px 0px',
                    transition: isDraggingGear
                      ? 'none'
                      : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {bladeItems.map((item) => renderBladeGroup(item, false))}

                  {/* Light inward drop shadow clipped strictly INSIDE the hexagon opening */}
                  <g clipPath="url(#iris-hex-inner-clip)" className="pointer-events-none">
                    <polygon
                      points={hexPoints}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="12"
                      strokeOpacity="0.52"
                      filter="url(#iris-hex-inner-shadow)"
                    />
                  </g>

                  {/* Hovered blade pops OUT IN FRONT of neighboring blades */}
                  {hoveredBlade && renderBladeGroup(hoveredBlade, true)}
                </g>

                {/* LAYER B2 — SLIM MIDDLE LAYER: FOLLOW-FOCUS BLADE ROTATION GEAR RING (r = 384..432) */}
                <g
                  filter="url(#gear-ring-shadow)"
                  className="pointer-events-auto cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    const angle = getPointerAngle(e.clientX, e.clientY);
                    gearDragRef.current = {
                      dragging: true,
                      lastAngle: angle,
                      accumDeg: 0,
                      didMove: false
                    };
                    setIsDraggingGear(true);
                  }}
                >
                  <g
                    style={{
                      transform: `rotate(${gearRingRotationDeg}deg)`,
                      transformOrigin: '0px 0px',
                      transition: isDraggingGear
                        ? 'none'
                        : 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="408"
                      fill="none"
                      stroke="transparent"
                      strokeWidth="48"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="406"
                      fill="none"
                      stroke="#171514"
                      strokeWidth="42"
                      strokeOpacity="0.96"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r={R_OUTER + 2}
                      fill="none"
                      stroke="#EFE6D5"
                      strokeOpacity="0.42"
                      strokeWidth="1.4"
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="427"
                      fill="none"
                      stroke="#EFE6D5"
                      strokeOpacity="0.3"
                      strokeWidth="1.2"
                    />

                    {/* 72-Tooth Cinema Follow-Focus Gear Pitch Cogs */}
                    {focusGearAngles.map((deg, i) => {
                      const isCardinal = i % 12 === 0;
                      const isMajor = i % 3 === 0;
                      const p1 = polar(deg, 427);
                      const p2 = polar(deg, isCardinal ? 435 : 433);
                      return (
                        <line
                          key={`cog-${deg}`}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={isCardinal ? '#EB4A1D' : isMajor ? '#D6C4A8' : '#7C7469'}
                          strokeOpacity={isCardinal ? 0.95 : isMajor ? 0.62 : 0.36}
                          strokeWidth={isCardinal ? 5.2 : 4.2}
                          strokeLinecap="butt"
                        />
                      );
                    })}

                    {/* Compact Rotating Project Index Stations (01, 02, ...) */}
                    {playableProjects.map((proj, idx) => {
                      const stationDeg = idx * stationStepDeg;
                      const isSelected = idx === safeIndex;
                      const isStationHovered = hoveredStationIdx === idx;
                      const dividerDeg = stationDeg - stationStepDeg / 2;
                      const divIn = polar(dividerDeg, 386);
                      const divOut = polar(dividerDeg, 396);
                      const tickIn = polar(stationDeg, 419);
                      const tickOut = polar(stationDeg, 426);
                      const numPos = polar(stationDeg, 404);
                      const tangentRot = stationDeg + 90;

                      return (
                        <g
                          key={`station-${proj.id}`}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredStationIdx(idx)}
                          onMouseLeave={() => setHoveredStationIdx((prev) => (prev === idx ? null : prev))}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (gearDragRef.current.didMove) return;
                            selectProjectByIndex(idx);
                          }}
                        >
                          {(isSelected || isStationHovered) && (
                            <path
                              d={describeArc(
                                stationDeg - stationStepDeg * 0.42,
                                stationDeg + stationStepDeg * 0.42,
                                406
                              )}
                              fill="none"
                              stroke={isSelected ? '#EB4A1D' : '#EFE6D5'}
                              strokeOpacity={isSelected ? 0.25 : 0.1}
                              strokeWidth="36"
                            />
                          )}

                          <line
                            x1={divIn.x}
                            y1={divIn.y}
                            x2={divOut.x}
                            y2={divOut.y}
                            stroke="#EFE6D5"
                            strokeOpacity="0.22"
                            strokeWidth="1"
                          />

                          <line
                            x1={tickIn.x}
                            y1={tickIn.y}
                            x2={tickOut.x}
                            y2={tickOut.y}
                            stroke={isSelected ? '#EB4A1D' : isStationHovered ? '#EFE6D5' : '#B9A992'}
                            strokeOpacity={isSelected ? 1 : 0.55}
                            strokeWidth={isSelected ? 2.4 : 1.2}
                          />

                          <text
                            x={numPos.x}
                            y={numPos.y + 4}
                            textAnchor="middle"
                            transform={`rotate(${tangentRot.toFixed(1)}, ${numPos.x.toFixed(1)}, ${numPos.y.toFixed(1)})`}
                            fill={isSelected ? '#FFFFFF' : isStationHovered ? '#EFE6D5' : '#C9BA9E'}
                            fontSize={isSelected ? '12.5' : '10.5'}
                            fontFamily="Archivo, sans-serif"
                            fontWeight="900"
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </g>

                {/* LAYER B3 — SLIM OUTERMOST LAYER: APERTURE MEASUREMENT COLLAR (r = 440..486)
                    Interactive f-stop arc mounted cleanly on the unobstructed LEFT rim (224° -> 136°), default f/1.4! */}
                <g filter="url(#aperture-collar-shadow)">
                  <circle
                    cx="0"
                    cy="0"
                    r="458"
                    fill="none"
                    stroke="#100F0E"
                    strokeWidth="36"
                    strokeOpacity="0.96"
                    className="pointer-events-none"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="440"
                    fill="none"
                    stroke="#EFE6D5"
                    strokeOpacity="0.34"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="476"
                    fill="none"
                    stroke="#EFE6D5"
                    strokeOpacity="0.24"
                    strokeWidth="1.1"
                  />

                  {/* Fine 96-Rib Rotating Outer Optical Knurling */}
                  <g
                    style={{
                      transform: `rotate(${knurlCollarRotation}deg)`,
                      transformOrigin: '0px 0px',
                      transition: isDraggingAperture ? 'none' : 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="pointer-events-none"
                  >
                    {knurlAngles.map((deg, i) => {
                      const isDiamond = i % 8 === 0;
                      const isPaired = i % 2 === 0;
                      const p1 = polar(deg, 476);
                      const p2 = polar(deg, isDiamond ? 486 : isPaired ? 483 : 480);
                      return (
                        <line
                          key={deg}
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke={isDiamond ? '#EB4A1D' : '#EFE6D5'}
                          strokeOpacity={isDiamond ? 0.85 : isPaired ? 0.3 : 0.14}
                          strokeWidth={isDiamond ? 1.9 : 1.1}
                        />
                      );
                    })}
                  </g>

                  {/* LEFT ARC INTERACTIVE APERTURE MEASUREMENT RING (224° top-left -> 136° bottom-left) */}
                  <g
                    className="pointer-events-auto cursor-ns-resize touch-none"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setIsDraggingAperture(true);
                      updateApertureFromPointer(e.clientX, e.clientY);
                    }}
                  >
                    {/* Generous invisible hit arc strictly inside Outermost Layer B3 along left rim */}
                    <path
                      d={describeArc(APERTURE_ARC_END - 6, APERTURE_ARC_START + 6, 463)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="52"
                    />

                    {/* Slim Double-Rail Track (r = 443..452) */}
                    <path
                      d={describeArc(APERTURE_ARC_END, APERTURE_ARC_START, 443)}
                      fill="none"
                      stroke="#EFE6D5"
                      strokeOpacity="0.34"
                      strokeWidth="1.1"
                    />
                    <path
                      d={describeArc(APERTURE_ARC_END, APERTURE_ARC_START, 452)}
                      fill="none"
                      stroke="#EFE6D5"
                      strokeOpacity="0.34"
                      strokeWidth="1.1"
                    />

                    {/* Swept Active Vermilion Aperture Band from f/1.4 (224°) down to current f-stop */}
                    <path
                      d={describeArc(currentApertureAngle, APERTURE_ARC_START, 447.5)}
                      fill="none"
                      stroke="#EB4A1D"
                      strokeOpacity="0.35"
                      strokeWidth="8"
                    />
                    <path
                      d={describeArc(currentApertureAngle, APERTURE_ARC_START, 443)}
                      fill="none"
                      stroke="#EB4A1D"
                      strokeWidth="2.2"
                    />

                    {/* Stepped Block & Dot Detents */}
                    {apertureNotchAngles.map((deg, idx) => {
                      const isPassed = deg >= currentApertureAngle - 0.5;
                      const isStepMajor = idx % 5 === 0;
                      const p1 = polar(deg, 443);
                      const p2 = polar(deg, isStepMajor ? 452 : 448);
                      const dotP = polar(deg, 455.5);
                      return (
                        <g key={deg}>
                          <line
                            x1={p1.x}
                            y1={p1.y}
                            x2={p2.x}
                            y2={p2.y}
                            stroke={isPassed ? '#EB4A1D' : '#EFE6D5'}
                            strokeOpacity={isPassed ? 0.95 : 0.36}
                            strokeWidth={isStepMajor ? 1.9 : 1}
                          />
                          {isStepMajor && (
                            <circle
                              cx={dotP.x}
                              cy={dotP.y}
                              r="1.5"
                              fill={isPassed ? '#EB4A1D' : '#EFE6D5'}
                              fillOpacity={isPassed ? 1 : 0.45}
                            />
                          )}
                        </g>
                      );
                    })}

                    {/* Clickable Engraved f-Stop Labels cleanly along the LEFT Outer Rim (r = 466) */}
                    {APERTURE_STOPS.map((stop) => {
                      const ang = rHexToApertureAngle(stop.rHex);
                      const isMatch = Math.abs(stop.rHex - rHex) <= 10;
                      const labelPos = polar(ang, 466);
                      const rotText = ang + 90;
                      return (
                        <g
                          key={stop.label}
                          className="cursor-pointer"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setRHex(stop.rHex);
                          }}
                        >
                          <circle cx={labelPos.x} cy={labelPos.y} r="15" fill="transparent" />
                          <text
                            x={labelPos.x}
                            y={labelPos.y + 3}
                            textAnchor="middle"
                            transform={`rotate(${rotText.toFixed(1)}, ${labelPos.x.toFixed(1)}, ${labelPos.y.toFixed(1)})`}
                            fill={isMatch ? '#FFFFFF' : '#B9A992'}
                            fontSize={isMatch ? '10.6' : '9'}
                            fontFamily="JetBrains Mono, monospace"
                            fontWeight={isMatch ? '800' : '500'}
                          >
                            {stop.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* Raised Draggable Vermilion Aperture Grip Tab on Left Outermost Rim */}
                    {(() => {
                      const tipIn = polar(currentApertureAngle, 437);
                      const wingL = polar(currentApertureAngle - 1.7, 446);
                      const wingR = polar(currentApertureAngle + 1.7, 446);
                      const knobCenter = polar(currentApertureAngle, 480);
                      const knobRot = currentApertureAngle + 90;
                      return (
                        <g>
                          <polygon
                            points={`${tipIn.x},${tipIn.y} ${wingL.x},${wingL.y} ${wingR.x},${wingR.y}`}
                            fill="#EB4A1D"
                            stroke="#EFE6D5"
                            strokeWidth="0.9"
                          />
                          <g
                            transform={`translate(${knobCenter.x.toFixed(1)}, ${knobCenter.y.toFixed(1)}) rotate(${knobRot.toFixed(1)})`}
                          >
                            <rect
                              x="-14"
                              y="-5"
                              width="28"
                              height="10"
                              fill="#EB4A1D"
                              stroke="#EFE6D5"
                              strokeWidth="1.1"
                            />
                            <line x1="-7" y1="-2.5" x2="-7" y2="2.5" stroke="#EFE6D5" strokeWidth="1" />
                            <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#EFE6D5" strokeWidth="1" />
                            <line x1="7" y1="-2.5" x2="7" y2="2.5" stroke="#EFE6D5" strokeWidth="1" />
                          </g>
                        </g>
                      );
                    })()}
                  </g>
                </g>

                {/* LAYER B4 — STATIONARY 3-O'CLOCK PLAYHEAD INDEX POINTER (Sits ON TOP at 0°) */}
                <g className="pointer-events-none">
                  <path
                    d={describeArc(-pointerWindowHalfDeg, pointerWindowHalfDeg, 385)}
                    fill="none"
                    stroke="#EB4A1D"
                    strokeWidth="2.6"
                  />
                  <path
                    d={describeArc(-pointerWindowHalfDeg, pointerWindowHalfDeg, 427)}
                    fill="none"
                    stroke="#EB4A1D"
                    strokeWidth="2.6"
                  />
                  {(() => {
                    const topIn = polar(-pointerWindowHalfDeg, 385);
                    const topOut = polar(-pointerWindowHalfDeg, 427);
                    const botIn = polar(pointerWindowHalfDeg, 385);
                    const botOut = polar(pointerWindowHalfDeg, 427);
                    return (
                      <>
                        <line x1={topIn.x} y1={topIn.y} x2={topOut.x} y2={topOut.y} stroke="#EB4A1D" strokeWidth="1.6" />
                        <line x1={botIn.x} y1={botIn.y} x2={botOut.x} y2={botOut.y} stroke="#EB4A1D" strokeWidth="1.6" />
                      </>
                    );
                  })()}

                  <polygon
                    points="372,0 386,-7 386,7"
                    fill="#EB4A1D"
                    stroke="#EFE6D5"
                    strokeWidth="1"
                  />
                  <polygon
                    points="424,0 441,-8 441,8"
                    fill="#EB4A1D"
                    stroke="#EFE6D5"
                    strokeWidth="1"
                  />
                  <line x1="441" y1="0" x2="490" y2="0" stroke="#EB4A1D" strokeWidth="2.2" />
                  <circle cx="490" cy="0" r="3.5" fill="#EB4A1D" stroke="#EFE6D5" strokeWidth="1" />
                </g>
              </svg>
            </div>
          </div>

          {/* RIGHT-SIDE MINIMAL EDITORIAL TEXT OVER SEAMLESS FEATHERED GLASS LAYER */}
          <div className="lg:col-span-4 xl:col-span-3 z-20 flex flex-col justify-center lg:pl-4 relative">
            <div
              aria-hidden="true"
              className="pointer-events-none lg:hidden absolute -inset-4 backdrop-blur-xl backdrop-saturate-150 bg-[#EFE6D5]/[0.05]"
              style={{
                WebkitMaskImage:
                  'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
                maskImage:
                  'radial-gradient(ellipse at center, rgba(0,0,0,1) 35%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)'
              }}
            />
            <div className="relative p-5 sm:p-6">
              <AnimatePresence mode="wait">
                {dossierProject && (
                  <motion.div
                    key={`${dossierProject.id}-${isInspectingOtherBlade ? 'hover' : 'active'}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#B9A992]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#EB4A1D] font-bold">
                          {String(dossierIndex + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[#EFE6D5]/30">/</span>
                        <span>{String(totalPlayable).padStart(2, '0')}</span>
                        <span className="text-[#EFE6D5]/25 mx-1">·</span>
                        <span className="text-[#8B8276]">{dossierProject.duration}</span>
                        <span className="text-[#EFE6D5]/25 mx-1">·</span>
                        <span className="text-[#EB4A1D]/90">{activeApertureStop.label}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => stepProject(-1)}
                          aria-label="Previous project"
                          className="w-7 h-7 flex items-center justify-center border border-[#EFE6D5]/15 hover:border-[#EB4A1D] text-[#B9A992] hover:text-[#EFE6D5] transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => stepProject(1)}
                          aria-label="Next project"
                          className="w-7 h-7 flex items-center justify-center border border-[#EFE6D5]/15 hover:border-[#EB4A1D] text-[#B9A992] hover:text-[#EFE6D5] transition-colors cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#B9A992]/80">
                        {dossierProject.client} · {dossierProject.year}
                      </div>
                      <h3 className="font-display font-black text-3xl sm:text-4xl text-[#EFE6D5] uppercase tracking-tight leading-[1.02]">
                        {dossierProject.title}
                      </h3>
                      <p className="text-sm text-[#CFC3B0] leading-relaxed pt-1">
                        {dossierProject.description}
                      </p>
                    </div>

                    {driveAction && (
                      <div className="pt-2">
                        <a
                          href={driveAction.url}
                          target={driveAction.target}
                          rel="noopener noreferrer"
                          title={driveAction.tooltip}
                          className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold tracking-wide transition-colors whitespace-nowrap"
                        >
                          <ExternalLink size={13} />
                          <span>{driveAction.isDrive ? 'Drive Full HD' : 'Request HD'}</span>
                        </a>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* LAYER 4 (BOTTOM OVERLAY) — 35MM FILM-TAPE CONTACT SHEET STRIP OVERLAPPING LOWER RIM */}
      <div className="relative lg:absolute lg:bottom-0 lg:inset-x-0 z-30">
        {/* Soft feathered shadow/frosted transition above the film tape */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden lg:block absolute inset-x-0 -top-12 h-12 bg-gradient-to-t from-[#090808]/90 via-[#090808]/40 to-transparent"
        />

        {/* Authentic 35mm Celluloid Film Tape Strip Container */}
        <div className="relative w-full bg-[#0C0B0A]/92 backdrop-blur-md border-y border-[#EFE6D5]/18 shadow-[0_-12px_40px_rgba(0,0,0,0.65)]">
          {/* TOP 35MM PERFORATION SPROCKET RAIL + KODAK-STYLE EDGE MARKINGS */}
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-1.5 border-b border-[#EFE6D5]/10 bg-[#12100F]/90">
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#D8AD6B]">
              <span>35MM · CONTACT SHEET</span>
              <span className="text-[#EFE6D5]/25">|</span>
              <span className="text-[#B9A992]">ALL FRAMES ({categoryProjects.length})</span>
            </div>

            {/* Repeating miniature sprocket holes across top rail */}
            <div
              aria-hidden="true"
              className="hidden md:flex items-center gap-3 overflow-hidden max-w-[46%]"
            >
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={`top-perf-${i}`}
                  className="shrink-0 w-3.5 h-2 rounded-[2px] bg-[#070707] border border-[#EFE6D5]/20 shadow-inner"
                />
              ))}
            </div>

            <div className="text-[10px] font-mono tracking-[0.14em] text-[#8B8276] uppercase">
              24FPS · CLICK FRAME TO PLAY
            </div>
          </div>

          {/* HORIZONTAL FILM-TAPE CELLULOID FRAME STRIP */}
          <div className="relative overflow-x-auto px-3 sm:px-5 lg:px-8 py-2">
            <div className="flex items-stretch w-max">
              {categoryProjects.map((project, idx) => {
                const isUnclickable = !!project.unclickable;
                const playableIdx = playableProjects.findIndex((p) => p.id === project.id);
                const isSelected = activeProject?.id === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    disabled={isUnclickable}
                    onClick={() => {
                      if (!isUnclickable && playableIdx >= 0) {
                        selectProjectByIndex(playableIdx);
                      }
                    }}
                    className={`group shrink-0 w-[164px] sm:w-[178px] text-left bg-[#090808] border-y border-r first:border-l transition-colors relative ${
                      isUnclickable
                        ? 'border-[#EFE6D5]/10 opacity-50 cursor-default'
                        : isSelected
                          ? 'border-[#EB4A1D] bg-[#171210] z-10 cursor-pointer'
                          : 'border-[#EFE6D5]/16 hover:border-[#EFE6D5]/45 cursor-pointer'
                    }`}
                  >
                    {/* Per-frame top film sprocket pair & Kodak frame edge code */}
                    <div className="flex items-center justify-between px-2 py-1 border-b border-[#EFE6D5]/10 bg-[#100E0D]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-1.5 rounded-[1px] bg-[#050505] border border-[#EFE6D5]/22" />
                        <span className="w-2.5 h-1.5 rounded-[1px] bg-[#050505] border border-[#EFE6D5]/22" />
                      </div>
                      <span
                        className={`text-[8.5px] font-mono tabular-nums tracking-[0.12em] ${
                          isSelected ? 'text-[#EB4A1D] font-bold' : 'text-[#D8AD6B]/85'
                        }`}
                      >
                        ▸ {String(idx + 1).padStart(2, '0')}A
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-1.5 rounded-[1px] bg-[#050505] border border-[#EFE6D5]/22" />
                        <span className="w-2.5 h-1.5 rounded-[1px] bg-[#050505] border border-[#EFE6D5]/22" />
                      </div>
                    </div>

                    {/* Celluloid Aperture Frame Gate */}
                    <div className="px-2 pt-1.5 pb-1">
                      <div
                        className={`relative aspect-video bg-black overflow-hidden border ${
                          isSelected ? 'border-[#EB4A1D]' : 'border-[#EFE6D5]/15'
                        }`}
                      >
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          loading="lazy"
                          className={`w-full h-full object-cover transition-transform duration-300 ${
                            isUnclickable ? 'grayscale' : 'group-hover:scale-105'
                          }`}
                        />
                        {isUnclickable && (
                          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                            <span className="px-1.5 py-0.5 bg-black/85 border border-[#EFE6D5]/20 text-[8.5px] font-mono uppercase tracking-wider text-[#B9A992]">
                              In Production
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Per-frame bottom sprocket pair + engraved frame title */}
                    <div className="px-2 pb-1.5 pt-0.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-display font-bold text-[#EFE6D5] uppercase tracking-tight truncate">
                          {project.title}
                        </div>
                      </div>
                      <span className="text-[8.5px] font-mono text-[#8B8276] shrink-0 tabular-nums">
                        {isUnclickable ? 'SOON' : project.duration}
                      </span>
                    </div>

                    {/* Bottom Sprocket Strip inside each film cell */}
                    <div className="flex items-center justify-between px-2 py-1 border-t border-[#EFE6D5]/10 bg-[#100E0D]">
                      {Array.from({ length: 6 }).map((_, sIdx) => (
                        <span
                          key={`bot-perf-${project.id}-${sIdx}`}
                          className="w-2.5 h-1.5 rounded-[1px] bg-[#050505] border border-[#EFE6D5]/20"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
