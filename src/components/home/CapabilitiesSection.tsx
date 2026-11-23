import React, { useState } from 'react';

/**
 * Section 03 — Creative Capabilities expressed through interactive geometric
 * editing instruments (beat markers, chromatic circles, acoustic waveform,
 * and vector motion path) rather than generic icon cards.
 */
export const CapabilitiesSection: React.FC = () => {
  const [rhythmShift, setRhythmShift] = useState(false);
  const [colorConverge, setColorConverge] = useState(false);
  const [soundBoost, setSoundBoost] = useState(false);
  const [motionStep, setMotionStep] = useState(0);

  const beatBars = rhythmShift
    ? [18, 42, 26, 62, 16, 48, 70, 22, 54, 34, 66, 20]
    : [38, 22, 58, 28, 66, 18, 44, 60, 24, 52, 30, 48];

  const waveHeights = soundBoost
    ? [14, 34, 58, 42, 72, 28, 64, 78, 46, 66, 36, 54, 24, 48, 30, 18]
    : [10, 22, 36, 28, 52, 20, 44, 60, 32, 46, 26, 38, 18, 30, 20, 12];

  const keyframePositions = [
    { x: 28, y: 78 },
    { x: 96, y: 24 },
    { x: 172, y: 66 },
    { x: 232, y: 20 }
  ];

  return (
    <section
      id="section-capabilities"
      className="relative z-10 w-full py-16 sm:py-24 border-b border-[#EFE6D5]/10"
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-10 border-b border-[#EFE6D5]/12">
          <div>
            <div className="text-xs font-mono text-[#EB4A1D] tracking-widest uppercase">
              03 · Creative Identity
            </div>
            <h2 className="font-display font-black text-3xl sm:text-5xl text-[#EFE6D5] tracking-tight uppercase mt-2">
              Craft &amp; Visual Instruments
            </h2>
          </div>
          <p className="text-sm text-[#B9A992] max-w-md">
            Four core editing disciplines built into every cut. Hover or click any instrument to test its mechanical response.
          </p>
        </div>

        {/* 4-Column Modular Architectural Frosted Glass Grid with Sharp Boundaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#EFE6D5]/30 divide-y sm:divide-y-0 sm:divide-x divide-[#EFE6D5]/22 bg-gradient-to-br from-[#EFE6D5]/[0.11] via-[#EFE6D5]/[0.05] to-[#1A1715]/[0.18] backdrop-blur-[14px] backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_50px_rgba(0,0,0,0.45)]">
          {/* 01. RHYTHM / BEAT MARKERS */}
          <div
            onMouseEnter={() => setRhythmShift(true)}
            onMouseLeave={() => setRhythmShift(false)}
            onClick={() => setRhythmShift((v) => !v)}
            className="p-6 sm:p-7 flex flex-col justify-between gap-6 cursor-pointer hover:bg-[#EFE6D5]/[0.07] transition-colors"
          >
            <div className="h-28 flex items-center justify-center border border-[#EFE6D5]/24 bg-[#EFE6D5]/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-3">
              <svg viewBox="0 0 260 96" className="w-full h-full">
                <line x1="10" y1="82" x2="250" y2="82" stroke="#EFE6D5" strokeOpacity="0.2" strokeWidth="1" />
                {beatBars.map((h, i) => {
                  const x = 16 + i * 20;
                  const isAccent = i === 3 || i === 6 || i === 10;
                  return (
                    <g key={i}>
                      <rect
                        x={x}
                        y={82 - h}
                        width="10"
                        height={h}
                        fill={isAccent ? '#EB4A1D' : '#EFE6D5'}
                        fillOpacity={isAccent ? 0.95 : 0.72}
                        style={{ transition: 'all 260ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                      />
                      {isAccent && (
                        <polygon
                          points={`${x + 5},8 ${x + 9},13 ${x + 5},18 ${x + 1},13`}
                          fill="#EB4A1D"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div>
              <div className="text-xs font-mono text-[#EB4A1D]">01. Editing &amp; Rhythm</div>
              <h3 className="font-display font-bold text-lg text-[#EFE6D5] mt-1">
                Dynamic Cut Cadence
              </h3>
              <p className="text-xs sm:text-sm text-[#B9A992] mt-2 leading-relaxed">
                Two-second visual hooks, precision match-cuts, and tempo-locked transitions calibrated to hold viewer attention.
              </p>
            </div>
          </div>

          {/* 02. COLOUR / OVERLAPPING GRADING CIRCLES */}
          <div
            onMouseEnter={() => setColorConverge(true)}
            onMouseLeave={() => setColorConverge(false)}
            onClick={() => setColorConverge((v) => !v)}
            className="p-6 sm:p-7 flex flex-col justify-between gap-6 cursor-pointer hover:bg-[#EFE6D5]/[0.07] transition-colors"
          >
            <div className="h-28 flex items-center justify-center border border-[#EFE6D5]/24 bg-[#EFE6D5]/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-3">
              <svg viewBox="0 0 260 96" className="w-full h-full">
                {/* Concentric calibration crosshair */}
                <line x1="20" y1="48" x2="240" y2="48" stroke="#EFE6D5" strokeOpacity="0.15" strokeWidth="0.8" />
                <line x1="130" y1="10" x2="130" y2="86" stroke="#EFE6D5" strokeOpacity="0.15" strokeWidth="0.8" />
                <circle
                  cx={colorConverge ? 106 : 92}
                  cy="48"
                  r="28"
                  fill="#EFE6D5"
                  fillOpacity="0.85"
                  style={{ transition: 'cx 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <circle
                  cx={colorConverge ? 154 : 168}
                  cy="48"
                  r="28"
                  fill="#EB4A1D"
                  fillOpacity="0.88"
                  style={{ transition: 'cx 280ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
                <circle
                  cx="130"
                  cy="48"
                  r="28"
                  fill="none"
                  stroke="#B9A992"
                  strokeWidth="1.3"
                  strokeDasharray="3 3"
                />
              </svg>
            </div>

            <div>
              <div className="text-xs font-mono text-[#EB4A1D]">02. Colour Grading</div>
              <h3 className="font-display font-bold text-lg text-[#EFE6D5] mt-1">
                Film Emulation &amp; Tone
              </h3>
              <p className="text-xs sm:text-sm text-[#B9A992] mt-2 leading-relaxed">
                Clean REC709 skin tones, bleach-bypass contrast curves, tungsten warmth, and custom LUT pipelines in DaVinci Resolve.
              </p>
            </div>
          </div>

          {/* 03. SOUND / ACOUSTIC WAVEFORM */}
          <div
            onMouseEnter={() => setSoundBoost(true)}
            onMouseLeave={() => setSoundBoost(false)}
            onClick={() => setSoundBoost((v) => !v)}
            className="p-6 sm:p-7 flex flex-col justify-between gap-6 cursor-pointer hover:bg-[#EFE6D5]/[0.07] transition-colors"
          >
            <div className="h-28 flex items-center justify-center border border-[#EFE6D5]/24 bg-[#EFE6D5]/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-3">
              <svg viewBox="0 0 260 96" className="w-full h-full">
                <line x1="12" y1="48" x2="248" y2="48" stroke="#EFE6D5" strokeOpacity="0.22" strokeWidth="1" />
                {waveHeights.map((h, i) => {
                  const x = 18 + i * 14.5;
                  const isPeak = h >= 52;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={48 - h / 2}
                      width="6"
                      height={h}
                      fill={isPeak ? '#EB4A1D' : '#EFE6D5'}
                      fillOpacity={isPeak ? 0.95 : 0.68}
                      style={{ transition: 'all 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  );
                })}
              </svg>
            </div>

            <div>
              <div className="text-xs font-mono text-[#EB4A1D]">03. Sound Design</div>
              <h3 className="font-display font-bold text-lg text-[#EFE6D5] mt-1">
                Spatial Audio Depth
              </h3>
              <p className="text-xs sm:text-sm text-[#B9A992] mt-2 leading-relaxed">
                Layered sub-impacts, whoosh transients, risers, ambient foley beds, and crisp vocal mastering so edits feel physical.
              </p>
            </div>
          </div>

          {/* 04. MOTION / VECTOR BÉZIER PATH & KEYFRAMES */}
          <div
            onMouseEnter={() => setMotionStep((s) => (s + 1) % keyframePositions.length)}
            onClick={() => setMotionStep((s) => (s + 1) % keyframePositions.length)}
            className="p-6 sm:p-7 flex flex-col justify-between gap-6 cursor-pointer hover:bg-[#EFE6D5]/[0.07] transition-colors"
          >
            <div className="h-28 flex items-center justify-center border border-[#EFE6D5]/24 bg-[#EFE6D5]/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-3">
              <svg viewBox="0 0 260 96" className="w-full h-full">
                {/* Motion Bezier curve */}
                <path
                  d="M 28 78 C 60 78, 64 24, 96 24 C 134 24, 136 66, 172 66 C 204 66, 208 20, 232 20"
                  fill="none"
                  stroke="#EFE6D5"
                  strokeOpacity="0.65"
                  strokeWidth="1.6"
                />
                {/* Tangent handles */}
                <line x1="64" y1="24" x2="128" y2="24" stroke="#B9A992" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 2" />
                <line x1="140" y1="66" x2="204" y2="66" stroke="#B9A992" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 2" />
                {/* Keyframe Diamonds */}
                {keyframePositions.map((pt, idx) => {
                  const isActive = idx === motionStep;
                  return (
                    <g key={idx}>
                      <polygon
                        points={`${pt.x},${pt.y - 6} ${pt.x + 6},${pt.y} ${pt.x},${pt.y + 6} ${pt.x - 6},${pt.y}`}
                        fill={isActive ? '#EB4A1D' : '#0A0A0B'}
                        stroke={isActive ? '#EFE6D5' : '#EFE6D5'}
                        strokeWidth={isActive ? '1.6' : '1.1'}
                      />
                      {isActive && (
                        <circle cx={pt.x} cy={pt.y} r="13" fill="none" stroke="#EB4A1D" strokeOpacity="0.6" strokeWidth="1" />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div>
              <div className="text-xs font-mono text-[#EB4A1D]">04. Motion &amp; Graphics</div>
              <h3 className="font-display font-bold text-lg text-[#EFE6D5] mt-1">
                Kinetic Typography &amp; VFX
              </h3>
              <p className="text-xs sm:text-sm text-[#B9A992] mt-2 leading-relaxed">
                Seamless masking transitions, modular title systems, product animation, and speed-ramped motion curves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
