import React, { useRef, useEffect } from 'react';
import { CircleParticle } from './circleParticle.jsx';

const LandingPage = ({ onContinue }) => {
  const canvasRef = useRef();

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const circleParticleSystem = new CircleParticle(ctx);

    return () => {
      circleParticleSystem.circleParticles = [];
    };
  }, []);

  return (
    <div className="landing-page">
      <canvas ref={canvasRef} />
      <button id="startButton" onClick={onContinue}>Try the Gen-Z Generator</button>
    </div>
  );
};

export default LandingPage;
