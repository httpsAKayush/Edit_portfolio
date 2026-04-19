import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, PerspectiveCamera, Environment, MeshDistortMaterial, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
import { PROJECTS } from '../constants';

interface NodeProps {
  project: Project;
  onSelect: (p: Project) => void;
  index: number;
  pathProgress: number;
  isSelected: boolean;
}

function Node({ project, onSelect, index, pathProgress, isSelected }: NodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Use a reliable thumbnail or a thematic fallback if missing
  const thumbnailUrl = project.thumbnail || `https://picsum.photos/seed/${project.id}/1280/720`;
  
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load(thumbnailUrl, (loadedTex) => {
      const img = loadedTex.image;
      if (img) {
        const aspect = img.width / img.height;
        // Logic to "Cover" the 1:1 hexagonal area without stretching
        if (aspect > 1) {
          // Landscape: Fit height, crop width
          loadedTex.repeat.set(1 / aspect, 1);
          loadedTex.offset.set((1 - (1 / aspect)) / 2, 0);
        } else if (aspect < 1) {
          // Portrait: Fit width, crop height
          loadedTex.repeat.set(1, aspect);
          loadedTex.offset.set(0, (1 - aspect) / 2);
        } else {
          // Square: No adjustment needed
          loadedTex.repeat.set(1, 1);
          loadedTex.offset.set(0, 0);
        }
      }
    });
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; // Use clamp for cleaner edges on the hexagon
    tex.matrixAutoUpdate = true;
    return tex;
  }, [thumbnailUrl]);

  // Calculate distance on the path sequence
  const nodeProgress = index / PROJECTS.length;
  const proximity = 1 - Math.min(1, Math.abs(pathProgress - nodeProgress) * 5); // Falloff radius
  
  // Handle click/selection
  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(project);
  };

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation - Fixed: use direct calculation instead of += accumulation
      const floatOffset = Math.sin(state.clock.elapsedTime + index) * 0.05;
      meshRef.current.position.set(0, floatOffset, 0);
      
      // Fixed Orientation: We no longer call lookAt here to prevent axis flipping.
      // The initial alignment is handled via the mesh's birth rotation.

      // Smooth pulsing scale when "active" on path
      const targetScale = 1.3 + (proximity * 0.5) + (isSelected ? 0.3 : 0);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // Make the node always face the camera to prevent mirrored/opposite textures
      meshRef.current.lookAt(state.camera.position);
    }
  });

  // Path-Following Text Logic (follows bottom 3 edges of the hexagon)
  const textSegments = useMemo(() => {
    const chars = project.title.toUpperCase().split('');
    const segLength = 1.6;
    const totalPath = segLength * 3;
    
    // Improved layout: tighter char spacing and centering text on the path
    const fontSize = 0.13;
    const charSpacing = 0.16; // Tighter fixed spacing for better word cohesion
    const totalTextWidth = chars.length * charSpacing;
    const startPadding = Math.max(0.2, (totalPath - totalTextWidth) / 2);
    
    return chars.map((char, i) => {
      const distance = startPadding + (i + 0.5) * charSpacing;
      const pos = new THREE.Vector3();
      let rot = 0;
      
      if (distance < segLength) {
        const t = distance / segLength;
        pos.set(-1.6 + (0.8 * t), -1.385 * t, 0.02);
        rot = -Math.PI / 3;
      } else if (distance < segLength * 2) {
        const t = (distance - segLength) / segLength;
        pos.set(-0.8 + (1.6 * t), -1.385, 0.02);
        rot = 0;
      } else {
        const t = Math.min(1.0, (distance - segLength * 2) / segLength);
        pos.set(0.8 + (0.8 * t), -1.385 + (1.385 * t), 0.02);
        rot = Math.PI / 3;
      }
      
      // Pull slightly inwards from the edge - deeper inset for centered focus
      const inset = pos.clone().normalize().multiplyScalar(-0.25);
      pos.add(inset);
      
      return { char, pos, rot, fontSize };
    });
  }, [project.title]);

  const position = project.spherePosition || [0, 0, 0];
  const nodeColor = isSelected ? "#0078d4" : (proximity > 0.5 ? "#00b4ff" : "#ffffff");

  return (
    <group position={new THREE.Vector3(...position)}>
      <Float speed={1.5} rotationIntensity={0} floatIntensity={0.2}>
        <mesh 
          ref={meshRef} 
          onClick={handleClick}
          onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { document.body.style.cursor = 'auto'; }}
          onUpdate={(self) => {
            self.up.set(0, 1, 0); // Standard Up
          }}
        >
          {/* Hexagonal Node Shape with Contained Texture */}
          <circleGeometry args={[1.6, 6]} />
          <meshBasicMaterial 
            map={texture} 
            transparent 
            opacity={0.4 + (proximity * 0.6) + (isSelected ? 0.6 : 0)}
            side={THREE.DoubleSide}
          />
          
          {/* Path-following Text System */}
          <group position={[0, 0, 0.01]}>
             {/* Characters spread across 3 segments */}
             {textSegments.map(({ char, pos, rot, fontSize }, i) => (
               <Text
                 key={i}
                 position={pos}
                 rotation={[0, 0, rot]}
                 fontSize={fontSize}
                 color="white"
                 // Inter Bold
                 font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf"
                 anchorX="center"
                 anchorY="middle"
                 fillOpacity={0.8 + (proximity * 0.2)}
               >
                 {char}
               </Text>
             ))}
          </group>
        </mesh>
      </Float>
    </group>
  );
}

interface DiscoverySphereProps {
  currentTime: number;
  totalDuration: number;
  onSelectProject: (p: Project) => void;
  selectedProject: Project | null;
  isFreeRoam: boolean;
  freeRoamState: { rotation: [number, number, number], zoom: number };
}

function CameraRig({ currentTime, totalDuration, isFreeRoam, freeRoamState, selectedProject, userZoomOffset = 0 }: any) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const lookAtPos = useRef(new THREE.Vector3());
  const smoothedProgress = useRef(0);

  const curve = useMemo(() => {
    const points = PROJECTS.map(p => new THREE.Vector3(...(p.spherePosition || [0,0,0])));
    return new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5); 
  }, []);

  useFrame((state, delta) => {
    if (isFreeRoam) return;

    // Discovery guided path tracking with high-precision damping and loop-aware shortest path
    const targetProgress = currentTime / totalDuration;
    
    // Tighten the damping for instant responsiveness (factor 8 -> 25)
    let diff = targetProgress - (smoothedProgress.current % 1.0);
    if (diff > 0.5) diff -= 1;
    if (diff < -0.5) diff += 1;
    
    smoothedProgress.current += THREE.MathUtils.damp(0, diff, 25, delta);
    
    // Normalize progress for the closed loop geometry
    const normalizedProgress = (smoothedProgress.current % 1.0 + 1.0) % 1.0;
    
    // Use getPoint for direct index-to-position mapping (syncs with timeline markers)
    const curvePoint = curve.getPoint(normalizedProgress);
    
    // Snappy LookAt target (factor 4 -> 15)
    lookAtPos.current.x = THREE.MathUtils.damp(lookAtPos.current.x, curvePoint.x, 15, delta);
    lookAtPos.current.y = THREE.MathUtils.damp(lookAtPos.current.y, curvePoint.y, 15, delta);
    lookAtPos.current.z = THREE.MathUtils.damp(lookAtPos.current.z, curvePoint.z, 15, delta);

    // Calculate ideal camera position (stable radius orbital)
    const camRadius = 12.5 + userZoomOffset;
    const idealDir = curvePoint.clone().normalize();
    const finalTarget = idealDir.multiplyScalar(camRadius);
    
    // Smooth cinematic drift (reduced frequencies for liquid feel)
    const driftTime = state.clock.getElapsedTime();
    finalTarget.y += Math.sin(driftTime * 0.15) * 0.3;
    finalTarget.z += Math.cos(driftTime * 0.1) * 0.3;

    // PROJECT FOCUS: Blend focus point if selected (highly responsive blend 0.3)
    if (selectedProject?.spherePosition) {
       const [px, py, pz] = selectedProject.spherePosition;
       const projectVec = new THREE.Vector3(px, py, pz);
       finalTarget.lerp(projectVec.clone().normalize().multiplyScalar(11 + userZoomOffset), 0.3);
       lookAtPos.current.lerp(projectVec, 0.3);
    }

    // FINAL CAMERA UPDATE: Use high damping for zero perceivable lag (factor 3 -> 12)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, finalTarget.x, 12, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, finalTarget.y, 12, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, finalTarget.z, 12, delta);
    
    camera.up.set(0, 1, 0);
    camera.lookAt(lookAtPos.current);
  });

  return null;
}

export function DiscoverySphere({ currentTime, totalDuration, onSelectProject, selectedProject, isFreeRoam, freeRoamState }: DiscoverySphereProps) {
  const [userZoom, setUserZoom] = React.useState(0);
  const lastTouchDist = useRef<number | null>(null);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );

      if (lastTouchDist.current !== null) {
        const delta = (dist - lastTouchDist.current) * 0.05;
        setUserZoom(prev => Math.max(-8, Math.min(15, prev - delta)));
      }
      lastTouchDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDist.current = null;
  };

  return (
    <div 
      className="w-full h-full bg-black relative"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
        
        {isFreeRoam ? (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            rotateSpeed={0.5} 
            makeDefault 
            enablePan={false}
            minDistance={4}
            maxDistance={25}
          />
        ) : (
          <CameraRig 
            currentTime={currentTime} 
            totalDuration={totalDuration} 
            isFreeRoam={isFreeRoam}
            freeRoamState={freeRoamState}
            selectedProject={selectedProject}
            userZoomOffset={userZoom}
          />
        )}

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

        {/* The "Geodesic" Structural Surface */}
        <mesh scale={[7.8, 7.8, 7.8]}>
           <icosahedronGeometry args={[1, 3]} />
           <meshBasicMaterial color="#00121a" transparent opacity={0.5} side={THREE.BackSide} />
           <meshBasicMaterial color="#0078d4" wireframe transparent opacity={0.05} />
        </mesh>

        {/* Nodes */}
        {PROJECTS.map((project, idx) => (
          <Node 
            key={project.id} 
            project={project} 
            isSelected={selectedProject?.id === project.id}
            onSelect={onSelectProject}
            index={idx}
            pathProgress={currentTime / totalDuration}
          />
        ))}

        <Environment preset="city" />
        <ContactShadows position={[0, -6, 0]} opacity={0.4} scale={20} blur={2.5} far={4.5} />
      </Canvas>

      {/* Discovery UI Overlays */}
      <div className="absolute inset-x-0 top-20 md:top-6 flex flex-col items-center pointer-events-none z-10 px-6">
         <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-xl flex items-center gap-8 shadow-2xl scale-90 origin-top">
            <div className="flex flex-col gap-0.5 w-auto min-w-[120px]">
               <span className="text-[7px] text-white/40 uppercase tracking-[0.3em]">Focus_Target</span>
               <div className="relative h-4 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={Math.round((currentTime / totalDuration) * PROJECTS.length) % PROJECTS.length}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute inset-0 text-[11px] font-black text-white italic truncate uppercase tracking-tight"
                    >
                      {PROJECTS[Math.round((currentTime / totalDuration) * PROJECTS.length) % PROJECTS.length]?.title || "SYSTEM_IDLE"}
                    </motion.span>
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
