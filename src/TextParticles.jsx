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

// The TextParticles component creates and animates particles that form shapes based on input text.
// It supports dynamic updates, chaos animations, and allows parent components to control it using a ref.
const TextParticles = forwardRef(({ texts, positions, width, onChaosComplete }, ref) => {
  const groupRef = useRef(); // Reference to the group containing all particles
  const [particles, setParticles] = useState([]); // State to store all particle data
  const previousParticlesRef = useRef([]); // Stores particle data for the previous state

  // Expose the chaosParticles function to the parent component through the ref
  useImperativeHandle(ref, () => ({
    chaosParticles,
  }));

  // Function to generate particles based on the provided texts
  const generateParticles = async () => {
    let newParticles = [];

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const positionOffset = positions[i]; // Position offset for this text

      // Skip empty text
      if (!text || text.trim() === '') {
        console.warn('Text is empty. Skipping particle generation.');
        continue;
      }

      // Create a canvas to render the text as an image
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const fontSize = 60;
      const maxWidth = width * 0.3; // Maximum width for text wrapping
      canvas.width = 1024;
      canvas.height = 512;

      const fontList = [
        { name: 'Sniglet', url: 'url(/../font/Sniglet/Sniglet-Regular.ttf)' },
        // { name: 'Russo One', url: 'url(/../font/Russo_One/RussoOne-Regular.ttf)' },
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

        // Extract image data from the canvas
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

        // Randomly select a base color
        const randomIndex = Math.floor(Math.random() * hslColors.length);
        const [h, s, l] = hslColors[randomIndex];
        const randomBaseColor = new THREE.Color().setHSL(h, s, l);

        const generatedParticlesForThisText = [];

        // Generate particles for each pixel with sufficient alpha
        for (let y = 0; y < imageData.height; y += 2) {
          for (let x = 0; x < imageData.width; x += 1) {
            const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
            if (alpha > 64) {
              // Calculate target positions for the particle
              const targetX = (x - canvas.width / 2) / 8 + positionOffset[0];
              const targetY = -(y - canvas.height / 2) / 8 + positionOffset[1];
              const targetZ = Math.random() * 3 + positionOffset[2];

              // Randomize initial positions for animation
              const initialX = (Math.random() - 0.5) * 100;
              const initialY = (Math.random() - 0.5) * 100;
              const initialZ = (Math.random() - 0.5) * 100;

              // Darken the particle color based on depth
              const darkenFactor = 1 - Math.abs(targetZ) / 3;
              const color = randomBaseColor
                .clone()
                .offsetHSL(0, 0, -darkenFactor * 0.4);

              generatedParticlesForThisText.push({
                position: [initialX, initialY, initialZ],
                targetPosition: [targetX, targetY, targetZ],
                color,
                progress: 0,
                textIndex: i, // Index to associate particle with its text
              });
            }
          }
        }

        // Add generated particles for this text to the full list
        newParticles = newParticles.concat(generatedParticlesForThisText);
      } catch (error) {
        console.error('Font loading failed:', error);
      }
    }

    // Store the new particles in the state
    previousParticlesRef.current = newParticles;
    setParticles(newParticles);
  };

  // Function to apply chaos animations to particles
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

      // Wait for the chaos animation to finish
      setTimeout(() => {
        const resetParticles = previousParticlesRef.current
          .filter((particle) => particle.textIndex === texts.length - 1)
          .map((particle) => {
            const positionDiff = [
              positions[0][0] - positions[1][0],
              positions[0][1] - positions[1][1],
              positions[0][2] - positions[1][2],
            ];
            const newTargetPosition = [
              particle.targetPosition[0] + positionDiff[0],
              particle.targetPosition[1] + positionDiff[1],
              particle.targetPosition[2] + positionDiff[2],
            ];
            return {
              ...particle,
              isChaos: false,
              targetPosition: newTargetPosition,
              progress: 0,
            };
          });

        setParticles(resetParticles);

        // Notify parent if provided
        if (onChaosComplete) onChaosComplete();

        resolve(); // Resolve the promise so App.jsx can await it
      }, 3000);
    });
  };


  // Regenerate particles when texts or width change
  useEffect(() => {
    generateParticles();
  }, [texts, width]);

  // Optimize particle geometry and material using useMemo
  const geometry = useMemo(() => new THREE.CircleGeometry(0.2, 32), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial(), []);

  // Update particle positions on each animation frame
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

      // Add jitter for completed particles
      if (progress === 1) {
        const jitterAmplitude = particle.isChaos ? 0.2 : 0.05;
        const jitterSpeed = particle.isChaos ? 5 : 2;

        mesh.position.set(
          x1 + Math.sin(time * jitterSpeed + i) * jitterAmplitude,
          y1 + Math.cos(time * jitterSpeed + i) * jitterAmplitude,
          z1 + Math.sin(time * jitterSpeed + i * 1.5) * jitterAmplitude * 10
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
