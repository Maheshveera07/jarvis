import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AgentState } from '../types';

interface HologramFace3DProps {
  state: AgentState;
  audioLevel: number; // 0.0 to 1.0 for mouth articulation & glow
}

export const HologramFace3D: React.FC<HologramFace3DProps> = ({ state, audioLevel }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const audioLevelRef = useRef(audioLevel);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 450;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group for entire head
    const headGroup = new THREE.Group();
    scene.add(headGroup);

    // Build Low-Poly Parametric Humanoid Face Geometry
    // 3D coordinates for low-poly face vertices: [x, y, z]
    // Symmetry: Left/Right coordinates for temples, cheeks, jaw, chin, nose, forehead, lips
    const rawVertices = [
      // Forehead & Crown
      [0.0, 3.2, 0.4],    // 0: Top Crown Center
      [-1.3, 2.9, 0.3],   // 1: Top Forehead L
      [1.3, 2.9, 0.3],    // 2: Top Forehead R
      [-2.0, 2.0, -0.4],  // 3: Temple L
      [2.0, 2.0, -0.4],   // 4: Temple R
      [-1.4, 1.8, 0.9],   // 5: Mid Forehead L
      [1.4, 1.8, 0.9],    // 6: Mid Forehead R
      [0.0, 1.9, 1.1],    // 7: Mid Forehead Center

      // Eyebrow & Upper Nose Bridge
      [-0.9, 1.0, 1.3],   // 8: Brow Ridge L
      [0.9, 1.0, 1.3],    // 9: Brow Ridge R
      [0.0, 0.9, 1.4],    // 10: Glabella / Upper Nose
      [-1.8, 0.8, 0.3],   // 11: Outer Eye Brow L
      [1.8, 0.8, 0.3],    // 12: Outer Eye Brow R

      // Eye Sockets & Cheekbones
      [-1.9, 0.1, 0.1],   // 13: Cheekbone Outer L
      [1.9, 0.1, 0.1],    // 14: Cheekbone Outer R
      [-1.3, 0.0, 0.8],   // 15: Lower Eye Ridge L
      [1.3, 0.0, 0.8],    // 16: Lower Eye Ridge R
      [-0.6, 0.1, 1.2],   // 17: Inner Eye Corner L
      [0.6, 0.1, 1.2],    // 18: Inner Eye Corner R

      // Nose
      [0.0, 0.1, 1.7],    // 19: Mid Nose Bridge
      [0.0, -0.6, 1.9],   // 20: Nose Tip
      [-0.5, -0.6, 1.5],  // 21: Left Nostril
      [0.5, -0.6, 1.5],   // 22: Right Nostril

      // Upper Cheek & Maxilla
      [-1.5, -0.6, 0.7],  // 23: Mid Cheek L
      [1.5, -0.6, 0.7],   // 24: Mid Cheek R
      [-0.8, -0.9, 1.2],  // 25: Upper Lip Corner L
      [0.8, -0.9, 1.2],   // 26: Upper Lip Corner R
      [0.0, -0.9, 1.6],   // 27: Upper Lip Center

      // Mouth / Lips (Will articulate!)
      [-0.5, -1.2, 1.4],  // 28: Mouth Corner L
      [0.5, -1.2, 1.4],   // 29: Mouth Corner R
      [0.0, -1.3, 1.5],   // 30: Lower Lip Center

      // Jaw & Chin (Will articulate with audio!)
      [0.0, -2.1, 1.2],   // 31: Chin Center Point
      [-0.8, -2.0, 0.9],  // 32: Chin Left
      [0.8, -2.0, 0.9],   // 33: Chin Right
      [-1.7, -1.6, 0.0],  // 34: Jaw Angle L
      [1.7, -1.6, 0.0],   // 35: Jaw Angle R

      // Ears / Cranium Sides
      [-2.1, 0.0, -0.8],  // 36: Ear Area L
      [2.1, 0.0, -0.8],   // 37: Ear Area R
      [-1.8, -1.5, -0.7], // 38: Lower Jaw Back L
      [1.8, -1.5, -0.7],  // 39: Lower Jaw Back R

      // Neck & Collar Base
      [0.0, -2.9, 0.4],   // 40: Front Neck Center
      [-1.0, -2.8, 0.1],  // 41: Front Neck L
      [1.0, -2.8, 0.1],   // 42: Front Neck R
      [-1.3, -3.4, -0.5], // 43: Neck Base L
      [1.3, -3.4, -0.5],  // 44: Neck Base R
      [0.0, -3.5, 0.0],   // 45: Neck Base Center
    ];

    // Polygonal triangulation faces [a, b, c]
    const indices = [
      // Forehead
      0, 1, 5,   0, 5, 7,   0, 7, 6,   0, 6, 2,
      1, 3, 5,   2, 6, 4,
      3, 11, 5,  4, 6, 12,
      5, 11, 8,  5, 8, 7,   7, 8, 10,  7, 10, 9,  7, 9, 6,  6, 9, 12,

      // Brow & Eye Sockets
      8, 11, 15, 8, 15, 17, 8, 17, 10,
      10, 18, 9, 9, 18, 16, 9, 16, 12,
      11, 13, 15, 12, 16, 14,
      10, 17, 19, 10, 19, 18,

      // Nose
      17, 21, 19,  18, 19, 22,
      19, 21, 20,  19, 20, 22,

      // Cheeks
      15, 23, 17,  17, 23, 21,
      16, 18, 24,  18, 22, 24,
      13, 34, 23,  14, 24, 35,
      13, 36, 34,  14, 35, 37,
      3, 36, 11,   4, 12, 37,
      11, 36, 13,  12, 14, 37,

      // Upper Lip
      21, 25, 20,  22, 20, 26,
      20, 25, 27,  20, 27, 26,
      23, 25, 21,  24, 22, 26,
      23, 34, 25,  24, 26, 35,

      // Mouth
      25, 28, 27,  26, 27, 29,
      27, 28, 30,  27, 30, 29,

      // Jaw & Chin
      28, 32, 30,  29, 30, 33,
      30, 32, 31,  30, 31, 33,
      28, 25, 32,  29, 33, 26,
      25, 34, 32,  26, 33, 35,
      34, 38, 32,  35, 33, 39,

      // Neck
      31, 32, 40,  31, 40, 33,
      32, 41, 40,  33, 40, 42,
      32, 38, 41,  33, 42, 39,
      40, 41, 45,  40, 45, 42,
      41, 43, 45,  42, 45, 44,
    ];

    // Build BufferGeometry
    const faceGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rawVertices.flat());
    const basePositions = new Float32Array(positions); // keep pristine copy for animations
    faceGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    faceGeo.setIndex(indices);
    faceGeo.computeVertexNormals();

    // Material 1: Holographic glowing semi-transparent polygonal facets
    const faceMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#033b4a'),
      emissive: new THREE.Color('#012530'),
      specular: new THREE.Color('#26e6e6'),
      shininess: 45,
      transparent: true,
      opacity: 0.88,
      flatShading: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const faceMesh = new THREE.Mesh(faceGeo, faceMaterial);
    headGroup.add(faceMesh);

    // Material 2: Glowing cyan wireframe overlay
    const wireframeGeo = new THREE.WireframeGeometry(faceGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#00f0ff'),
      transparent: true,
      opacity: 0.65,
      linewidth: 1.5,
    });
    const wireframeLines = new THREE.LineSegments(wireframeGeo, wireframeMat);
    headGroup.add(wireframeLines);

    // Glowing Amber Eyes (Right from the user image!)
    const eyeGeometry = new THREE.SphereGeometry(0.18, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffaa00'),
      emissive: new THREE.Color('#ff7700'),
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.8,
    });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.85, 0.45, 0.95);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial.clone());
    rightEye.position.set(0.85, 0.45, 0.95);
    headGroup.add(rightEye);

    // Eye Glow Point Lights
    const leftEyeLight = new THREE.PointLight('#ff7700', 1.5, 4);
    leftEyeLight.position.set(-0.85, 0.45, 1.2);
    headGroup.add(leftEyeLight);

    const rightEyeLight = new THREE.PointLight('#ff7700', 1.5, 4);
    rightEyeLight.position.set(0.85, 0.45, 1.2);
    headGroup.add(rightEyeLight);

    // Ambient & Directional Lighting for holographic appearance
    const ambientLight = new THREE.AmbientLight('#005577', 1.8);
    scene.add(ambientLight);

    const cyanFrontLight = new THREE.DirectionalLight('#00e5ff', 2.0);
    cyanFrontLight.position.set(0, 3, 6);
    scene.add(cyanFrontLight);

    const blueBackLight = new THREE.DirectionalLight('#003366', 1.5);
    blueBackLight.position.set(0, -3, -5);
    scene.add(blueBackLight);

    // Mouse Tracking Parallax
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.25;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();
    let blinkTimer = 0;

    // Jaw vertex indices to articulate when speaking:
    // 28: Mouth Corner L, 29: Mouth Corner R, 30: Lower Lip, 31: Chin Center, 32: Chin L, 33: Chin R
    const jawVertexIndices = [28, 29, 30, 31, 32, 33, 40, 41, 42];

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) / 1000;
      const currentLevel = audioLevelRef.current;
      const currentState = stateRef.current;

      // Smooth Head Rotation to follow mouse + subtle idle breathing float
      const idleFloatY = Math.sin(elapsedTime * 1.5) * 0.08;
      const idleFloatPitch = Math.sin(elapsedTime * 1.1) * 0.04;

      headGroup.rotation.y += (targetRotationY - headGroup.rotation.y) * 0.06;
      headGroup.rotation.x += (targetRotationX + idleFloatPitch - headGroup.rotation.x) * 0.06;
      headGroup.position.y = idleFloatY;

      // Eye Blinking Animation every ~4 seconds
      blinkTimer += 0.016;
      if (blinkTimer > 3.8) {
        const blinkProgress = (blinkTimer - 3.8) / 0.25;
        if (blinkProgress <= 1.0) {
          const scaleY = Math.sin(blinkProgress * Math.PI);
          leftEye.scale.y = Math.max(0.08, 1 - scaleY * 0.9);
          rightEye.scale.y = Math.max(0.08, 1 - scaleY * 0.9);
        } else {
          blinkTimer = 0;
          leftEye.scale.y = 1;
          rightEye.scale.y = 1;
        }
      }

      // Mouth & Jaw Articulation based on Audio / Speaking state
      const posAttr = faceGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      let mouthDrop = 0;
      if (currentState === 'SPEAKING') {
        // Articulate with simulated syllables or audio level
        const syllableOscillation = Math.abs(Math.sin(elapsedTime * 18)) * 0.5 + Math.abs(Math.cos(elapsedTime * 11)) * 0.5;
        mouthDrop = Math.max(currentLevel, syllableOscillation * 0.45);
      } else if (currentState === 'LISTENING') {
        // Subtle tilt forward, slight listening responsiveness
        mouthDrop = currentLevel * 0.15;
      }

      // Reset vertices and apply jaw drop offset only when articulating
      if (mouthDrop > 0.01 || currentState === 'SPEAKING') {
        for (let i = 0; i < basePositions.length; i++) {
          posArray[i] = basePositions[i];
        }

        for (const idx of jawVertexIndices) {
          posArray[idx * 3 + 1] = basePositions[idx * 3 + 1] - mouthDrop * 0.42;
          posArray[idx * 3 + 2] = basePositions[idx * 3 + 2] + mouthDrop * 0.12;
        }

        posAttr.needsUpdate = true;
        faceGeo.computeVertexNormals();
      }

      // Color/Glow Shifts based on State
      if (currentState === 'SPEAKING') {
        faceMaterial.emissive.setRGB(0.01, 0.12, 0.18);
        (eyeMaterial as THREE.MeshStandardMaterial).emissiveIntensity = 2.8 + Math.sin(elapsedTime * 12) * 0.8;
      } else if (currentState === 'LISTENING') {
        faceMaterial.emissive.setRGB(0.0, 0.18, 0.14);
        (eyeMaterial as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
      } else if (currentState === 'THINKING') {
        faceMaterial.emissive.setRGB(0.08, 0.05, 0.22);
        (eyeMaterial as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + Math.sin(elapsedTime * 8) * 0.6;
      } else {
        faceMaterial.emissive.setRGB(0.01, 0.08, 0.12);
        (eyeMaterial as THREE.MeshStandardMaterial).emissiveIntensity = 2.2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      faceGeo.dispose();
      faceMaterial.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      eyeGeometry.dispose();
      eyeMaterial.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Status Indicator Label directly under face
  const getStatusColor = () => {
    switch (state) {
      case 'SPEAKING':
        return 'text-[#ff9900] border-[#ff9900]';
      case 'LISTENING':
        return 'text-[#00ffaa] border-[#00ffaa]';
      case 'THINKING':
        return 'text-[#38bdf8] border-[#38bdf8]';
      case 'EXECUTING':
        return 'text-[#c084fc] border-[#c084fc]';
      default:
        return 'text-[#00e5ff] border-[#155e75]';
    }
  };

  const getDotBg = () => {
    switch (state) {
      case 'SPEAKING':
        return 'bg-[#ff9900] shadow-[0_0_10px_#ff9900]';
      case 'LISTENING':
        return 'bg-[#00ffaa] shadow-[0_0_10px_#00ffaa]';
      case 'THINKING':
        return 'bg-[#38bdf8] shadow-[0_0_10px_#38bdf8]';
      case 'EXECUTING':
        return 'bg-[#c084fc] shadow-[0_0_10px_#c084fc]';
      default:
        return 'bg-[#00e5ff] shadow-[0_0_10px_#00e5ff]';
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="w-full h-[320px] sm:h-[380px] lg:h-[430px] flex items-center justify-center cursor-pointer select-none"
      />

      {/* Futuristic Status Badge directly below 3D head (Matches user image: • SPEAKING) */}
      <div className="flex items-center space-x-2 my-1 z-10">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${getDotBg()} animate-pulse`} />
        <span className={`text-xs font-bold tracking-widest uppercase ${getStatusColor()}`}>
          {state}
        </span>
      </div>
    </div>
  );
};
