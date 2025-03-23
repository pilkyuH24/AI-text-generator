import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// TextParticles renders animated particles shaped by input text
const TextParticles = forwardRef(({ texts, positions, width, onChaosComplete }, ref) => {
  const groupRef = useRef();
  const [particles, setParticles] = useState([]);
  const previousParticlesRef = useRef([]);

  // Expose chaosParticles function to parent component
  useImperativeHandle(ref, () => ({
    chaosParticles,
  }));

  // Generate particles from each text entry
  const generateParticles = async () => {
    let newParticles = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const positionOffset = positions[i];

      if (!text || text.trim() === '') continue;

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const fontSize = 60;
      const maxWidth = width * 0.3;
      canvas.width = 1024;
      canvas.height = 512;

      const fontList = [
        { name: 'Sniglet', url: 'url(/../font/Sniglet/Sniglet-Regular.ttf)' },
        { name: 'Chewy', url: 'url(/../font/Chewy/Chewy-Regular.ttf)' },
      ];

      try {
        const randomFont = fontList[Math.floor(Math.random() * fontList.length)];
        const font = new FontFace(randomFont.name, randomFont.url);
        await font.load();
        document.fonts.add(font);

        context.font = `${fontSize}px '${randomFont.name}'`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = context.measureText(testLine).width;

          if (testWidth > maxWidth) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        context.clearRect(0, 0, canvas.width, canvas.height);

        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        lines.forEach((line, index) => {
          const y = canvas.height / 2 - totalHeight / 2 + index * lineHeight;
          context.fillText(line, canvas.width / 2, y);
        });

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        const hslColors = [
          [359 / 360, 0.94, 0.62],
          [21 / 360, 0.89, 0.56],
          [33 / 360, 0.94, 0.55],
          [20 / 360, 0.94, 0.63],
          [42 / 360, 0.93, 0.64],
          [94 / 360, 0.38, 0.59],
          [162 / 360, 0.43, 0.46],
          [178 / 360, 0.30, 0.43],
          [208 / 360, 0.25, 0.45],
          [198 / 360, 0.61, 0.39],
        ];

        const [h, s, l] = hslColors[Math.floor(Math.random() * hslColors.length)];
        const baseColor = new THREE.Color().setHSL(h, s, l);

        const generatedParticles = [];

        for (let y = 0; y < imageData.height; y += 2) {
          for (let x = 0; x < imageData.width; x += 1) {
            const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
            if (alpha > 64) {
              const targetX = (x - canvas.width / 2) / 8 + positionOffset[0];
              const targetY = -(y - canvas.height / 2) / 8 + positionOffset[1];
              const targetZ = Math.random() * 3 + positionOffset[2];

              const initialX = (Math.random() - 0.5) * 100;
              const initialY = (Math.random() - 0.5) * 100;
              const initialZ = (Math.random() - 0.5) * 100;

              const darken = 1 - Math.abs(targetZ) / 3;
              const color = baseColor.clone().offsetHSL(0, 0, -darken * 0.4);

              generatedParticles.push({
                position: [initialX, initialY, initialZ],
                targetPosition: [targetX, targetY, targetZ],
                color,
                progress: 0,
                textIndex: i,
              });
            }
          }
        }

        newParticles = newParticles.concat(generatedParticles);
      } catch (error) {
        console.error('Font loading failed:', error);
      }
    }

    previousParticlesRef.current = newParticles;
    setParticles(newParticles);
  };

  // Chaos animation: particles scatter and then reset
  const chaosParticles = () => {
    return new Promise((resolve) => {
      const chaoticParticles = particles.map((particle) => ({
        ...particle,
        isChaos: true,
        chaosTargetPosition: [
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
          (Math.random() - 0.5) * 200,
        ],
        progress: 0,
      }));

      setParticles(chaoticParticles);

      setTimeout(() => {
        const p0 = positions[0] || [0, 0, 0];
        const p1 = positions[1] || [0, 0, 0];

        const positionDiff = [
          p0[0] - p1[0],
          p0[1] - p1[1],
          p0[2] - p1[2],
        ];

        const resetParticles = previousParticlesRef.current
          .filter((p) => p.textIndex === texts.length - 1)
          .map((p) => {
            const newTargetPosition = [
              p.targetPosition[0] + positionDiff[0],
              p.targetPosition[1] + positionDiff[1],
              p.targetPosition[2] + positionDiff[2],
            ];
            return {
              ...p,
              isChaos: false,
              targetPosition: newTargetPosition,
              progress: 0,
            };
          });

        setParticles(resetParticles);

        if (onChaosComplete) onChaosComplete();
        resolve();
      }, 3000);
    });
  };

  // Regenerate particles whenever input changes
  useEffect(() => {
    generateParticles();
  }, [texts, width]);

  // Geometry & material are memoized for performance
  const geometry = useMemo(() => new THREE.CircleGeometry(0.2, 32), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial(), []);

  // Animate particles on each frame
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const camera = state.camera;

    groupRef.current?.children.forEach((mesh, i) => {
      const particle = particles[i];
      if (!particle) return;

      const target = particle.isChaos
        ? particle.chaosTargetPosition
        : particle.targetPosition;
      const [x1, y1, z1] = target;

      particle.progress = Math.min(particle.progress + 0.1, 1);
      const [x0, y0, z0] = particle.position;
      const progress = particle.progress;

      mesh.position.set(
        x0 + (x1 - x0) * progress,
        y0 + (y1 - y0) * progress,
        z0 + (z1 - z0) * progress
      );

      if (progress === 1) {
        const jitterAmp = particle.isChaos ? 0.2 : 0.05;
        const jitterSpeed = particle.isChaos ? 5 : 2;

        mesh.position.set(
          x1 + Math.sin(time * jitterSpeed + i) * jitterAmp,
          y1 + Math.cos(time * jitterSpeed + i) * jitterAmp,
          z1 + Math.sin(time * jitterSpeed + i * 1.5) * jitterAmp * 10
        );
      }

      mesh.lookAt(camera.position);
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map(({ position, color }, i) => (
        <mesh key={i} position={position} geometry={geometry} material={material}>
          <meshStandardMaterial color={color} attach="material" />
        </mesh>
      ))}
    </group>
  );
});

export default TextParticles;
