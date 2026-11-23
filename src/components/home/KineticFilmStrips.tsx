import React from 'react';

/**
 * Geometric vector film-strip ribbons drifting gently behind lower page sections.
 * Pure SVG shapes with subtle translucent celluloid ribbon fills and bold sprocket/signal
 * blocks so they remain unmistakably visible and luminous when refracted behind
 * sharp-bordered frosted glass containers in Sections 03 and 04.
 */
export const KineticFilmStrips: React.FC = () => {
  const frames = Array.from({ length: 14 }, (_, i) => i);
  const ticks = Array.from({ length: 48 }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Strip 1: Diagonal 35mm Celluloid Sprocket Track (Upper-Mid Canvas) */}
      <div
        className="absolute top-[24%] -left-[15%] w-[130%] opacity-[0.26]"
        style={{ transform: 'rotate(-7deg)' }}
      >
        <div className="flex w-[200%] animate-film-right">
          {[0, 1].map((dup) => (
            <svg
              key={dup}
              viewBox="0 0 1400 92"
              className="w-1/2 h-20 sm:h-24 shrink-0"
              preserveAspectRatio="none"
            >
              {/* Soft celluloid ribbon body so blur reveals moving luminous bands behind glass */}
              <rect x="0" y="2" width="1400" height="88" fill="#EFE6D5" fillOpacity="0.14" />
              <line x1="0" y1="2" x2="1400" y2="2" stroke="#EFE6D5" strokeWidth="1.6" />
              <line x1="0" y1="90" x2="1400" y2="90" stroke="#EFE6D5" strokeWidth="1.6" />
              <line x1="0" y1="18" x2="1400" y2="18" stroke="#EFE6D5" strokeWidth="1" strokeOpacity="0.65" />
              <line x1="0" y1="74" x2="1400" y2="74" stroke="#EFE6D5" strokeWidth="1" strokeOpacity="0.65" />
              {frames.map((idx) => {
                const x = idx * 100;
                const isAccentFrame = idx % 4 === 1;
                return (
                  <g key={idx}>
                    {/* Punched dark 35mm sprocket cutouts */}
                    <rect x={x + 10} y="6" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    <rect x={x + 42} y="6" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    <rect x={x + 74} y="6" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    <rect x={x + 10} y="78" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    <rect x={x + 42} y="78" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    <rect x={x + 74} y="78" width="14" height="8" rx="1.5" fill="#0A0A0B" stroke="#EFE6D5" strokeWidth="1" />
                    {/* Frame gate */}
                    <rect
                      x={x + 6}
                      y="22"
                      width="88"
                      height="48"
                      fill={isAccentFrame ? '#EB4A1D' : '#0A0A0B'}
                      fillOpacity={isAccentFrame ? 0.32 : 0.45}
                      stroke="#EFE6D5"
                      strokeWidth="1.2"
                    />
                    {/* Registration cross */}
                    <line x1={x + 44} y1="46" x2={x + 56} y2="46" stroke="#EB4A1D" strokeWidth="1.8" />
                    <line x1={x + 50} y1="40" x2={x + 50} y2="52" stroke="#EB4A1D" strokeWidth="1.8" />
                  </g>
                );
              })}
            </svg>
          ))}
        </div>
      </div>

      {/* Strip 2: Counter-Angled Optical Calibration & Vermilion Signal Strip (Mid Canvas) */}
      <div
        className="absolute top-[54%] -left-[15%] w-[130%] opacity-[0.28]"
        style={{ transform: 'rotate(5deg)' }}
      >
        <div className="flex w-[200%] animate-film-left">
          {[0, 1].map((dup) => (
            <svg
              key={dup}
              viewBox="0 0 1440 56"
              className="w-1/2 h-14 sm:h-16 shrink-0"
              preserveAspectRatio="none"
            >
              <rect x="0" y="2" width="1440" height="52" fill="#B9A992" fillOpacity="0.14" />
              <line x1="0" y1="2" x2="1440" y2="2" stroke="#EFE6D5" strokeWidth="1.4" />
              <line x1="0" y1="54" x2="1440" y2="54" stroke="#EFE6D5" strokeWidth="1.4" />
              {ticks.map((t) => {
                const x = t * 30;
                const isMajor = t % 6 === 0;
                const isSignal = t % 12 === 0;
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1="2"
                      x2={x}
                      y2={isMajor ? 22 : 11}
                      stroke={isSignal ? '#EB4A1D' : '#EFE6D5'}
                      strokeWidth={isSignal ? '3' : '1.3'}
                    />
                    <line
                      x1={x}
                      y1="54"
                      x2={x}
                      y2={isMajor ? 34 : 45}
                      stroke={isSignal ? '#EB4A1D' : '#EFE6D5'}
                      strokeWidth={isSignal ? '3' : '1.3'}
                    />
                    {isSignal && (
                      <rect
                        x={x - 10}
                        y="20"
                        width="20"
                        height="16"
                        fill="#EB4A1D"
                        fillOpacity="0.65"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          ))}
        </div>
      </div>

      {/* Strip 3: Wide Anamorphic Gate Ribbon (Lower Canvas) */}
      <div
        className="absolute top-[80%] -left-[15%] w-[130%] opacity-[0.24]"
        style={{ transform: 'rotate(-3deg)' }}
      >
        <div className="flex w-[200%] animate-film-slow">
          {[0, 1].map((dup) => (
            <svg
              key={dup}
              viewBox="0 0 1400 74"
              className="w-1/2 h-16 sm:h-20 shrink-0"
              preserveAspectRatio="none"
            >
              <rect x="0" y="4" width="1400" height="66" fill="#EFE6D5" fillOpacity="0.12" />
              <line x1="0" y1="4" x2="1400" y2="4" stroke="#EFE6D5" strokeWidth="1.5" strokeDasharray="14 8" />
              <line x1="0" y1="70" x2="1400" y2="70" stroke="#EFE6D5" strokeWidth="1.5" strokeDasharray="14 8" />
              {frames.slice(0, 7).map((idx) => {
                const x = idx * 200;
                const isWarm = idx % 3 === 0;
                return (
                  <g key={idx}>
                    <rect
                      x={x + 12}
                      y="14"
                      width="176"
                      height="46"
                      fill={isWarm ? '#EB4A1D' : '#EFE6D5'}
                      fillOpacity={isWarm ? 0.24 : 0.14}
                      stroke="#EFE6D5"
                      strokeWidth="1.2"
                    />
                    <line x1={x + 12} y1="14" x2={x + 30} y2="32" stroke="#EFE6D5" strokeWidth="1.1" />
                    <line x1={x + 188} y1="60" x2={x + 170} y2="42" stroke="#EFE6D5" strokeWidth="1.1" />
                  </g>
                );
              })}
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
};
