import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import TextParticles from './TextParticles';
import LandingPage from './landingPage';

const MouseOverPanControls = () => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;

      const x = (clientX / innerWidth) * 2 - 1;
      const y = -(clientY / innerHeight) * 2 + 1;
      const panFactor = 90;

      camera.position.x = x * -panFactor;
      camera.position.y = y * -panFactor;
      camera.lookAt(0, 0, 0);
    };

    gl.domElement.addEventListener('mousemove', handleMouseMove);
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl]);

  return null;
};

const App = () => {
  const [texts, setTexts] = useState(["Not sure what to do? Try giving me a few words!"]);
  const [positions, setPositions] = useState([[0, 0, 0]]);
  const [draftText, setDraftText] = useState('');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const textParticlesRef = useRef();

  const [isLandingPageVisible, setIsLandingPageVisible] = useState(true);
  const [isInputVisible, setIsInputVisible] = useState(false);

  const handleContinue = () => {
    setIsLandingPageVisible(false);
    setIsInputVisible(true);
  };

  const backgroundColors = [
    'hsla(197, 37%, 24%, 1)',
    'hsla(173, 58%, 39%, 1)',
    'hsla(43, 74%, 66%, 1)',
    'hsla(27, 87%, 67%, 1)',
    'hsla(12, 76%, 61%, 1)',
  ];

  const getRandomBackgroundColor = () => {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length);
    return backgroundColors[randomIndex];
  };

  const [backgroundColor, setBackgroundColor] = useState(getRandomBackgroundColor());

  const handleChange = (event) => {
    setDraftText(event.target.value);
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setIsInputVisible(false); // Hide input, show loading
      const userInput = draftText;
      setDraftText('');

      // Split words by space or comma
      const wordList = userInput
        .split(/[\s,]+/)
        .map((w) => w.trim())
        .filter(Boolean);

      if (wordList.length === 0) {
        setIsInputVisible(true); // Show input again if empty
        return;
      }

      const startY = 15; 
      const gapY = 8;   
      setTexts(wordList);
      setPositions(wordList.map((_, i) => [0, startY - i * gapY, 0]));

      // Chaos animation
      setTimeout(() => {
        textParticlesRef.current.chaosParticles();
      }, 5000);

      const combinedWord = await combineWords(wordList);

      // Final display
      setTimeout(() => {
        setTexts([combinedWord]);
        setPositions([[0, 0, 0]]);
        setBackgroundColor(getRandomBackgroundColor());
        setIsInputVisible(true);
      }, 6000);
    }
  };

  const combineWords = async (userWords) => {
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWords }),
      });

      if (!response.ok) throw new Error('Failed to fetch combined word');
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Error:', error);
      return '';
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isLandingPageVisible ? (
    <LandingPage onContinue={handleContinue} />
  ) : (
    <>
      {/* Input or Loading */}
      <div
        style={{
          visibility: 'visible',
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          minWidth: '300px',
        }}
      >
        {isInputVisible ? (
          <>
            <p
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                background: 'linear-gradient(90deg, #4A90E2, #50E3C2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              Enter a few words (separated by spaces or commas)
            </p>
            <input
              type="text"
              value={draftText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              style={{
                padding: '12px 50px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #ccc',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                caretColor: 'skyblue',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A90E2';
                e.target.style.boxShadow = '0 4px 8px rgba(74, 144, 226, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ccc';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            />
          </>
        ) : (
          <div style={{ color: '#fff', fontSize: '18px', textAlign: 'center' }}>
            Loading suggestion...
          </div>
        )}
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 300], fov: 10 }}
        style={{ width: '100vw', height: '100vh', backgroundColor }}
      >
        <ambientLight intensity={1.0} />
        <pointLight position={[10, 10, 10]} />
        <TextParticles
          ref={textParticlesRef}
          texts={texts}
          positions={positions}
          width={windowWidth}
        />
        <MouseOverPanControls />
      </Canvas>
    </>
  );
};

export default App;
