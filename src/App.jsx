import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import TextParticles from './TextParticles';
import LandingPage from './landingPage';

// Component to enable camera panning based on mouse movement
const MouseOverPanControls = () => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;

      // Calculate mouse position ratio relative to screen center (-1 to 1)
      const x = (clientX / innerWidth) * 2 - 1;
      const y = -(clientY / innerHeight) * 2 + 1;

      // Adjust camera movement speed
      const panFactor = 90;

      // Update camera position based on mouse movement
      camera.position.x = x * -panFactor;
      camera.position.y = y * -panFactor;
      camera.lookAt(0, 0, 0); // Ensure the camera always looks at the center
    };

    // Attach mouse move event listener
    gl.domElement.addEventListener('mousemove', handleMouseMove);

    // Cleanup event listener on component unmount
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, gl]);

  return null; // This component does not render anything
};

const App = () => {
  const [texts, setTexts] = useState(['Gen-Z']); // Initial text array
  const [positions, setPositions] = useState([[0, 0, 0]]); // Initial positions array
  const [draftText, setDraftText] = useState(''); // Text input state
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); // Track window width
  const textParticlesRef = useRef(); // Ref for TextParticles component

  const [isLandingPageVisible, setIsLandingPageVisible] = useState(true); // Landing page visibility
  const [isInputVisible, setIsInputVisible] = useState(false); // Input visibility after landing page

  // Handler to continue from the landing page
  const handleContinue = () => {
    setIsLandingPageVisible(false); // Hide landing page
    setIsInputVisible(true); // Show input box
  };

  // Define background color palette
  const backgroundColors = [
    'hsla(197, 37%, 24%, 1)', // Charcoal
    'hsla(173, 58%, 39%, 1)', // Persian Green
    'hsla(43, 74%, 66%, 1)',  // Saffron
    'hsla(27, 87%, 67%, 1)',  // Sandy Brown
    'hsla(12, 76%, 61%, 1)',  // Burnt Sienna
  ];

  // Helper to get a random background color from the palette
  const getRandomBackgroundColor = () => {
    const randomIndex = Math.floor(Math.random() * backgroundColors.length);
    return backgroundColors[randomIndex];
  };

  const [backgroundColor, setBackgroundColor] = useState(getRandomBackgroundColor());

  // Handle text input change
  const handleChange = (event) => {
    setDraftText(event.target.value);
  };

  // Handle Enter key press to add new text and update the scene
  const handleKeyDown = async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const newText = draftText;
      setDraftText(''); // Clear input

      const previousText = texts[texts.length - 1]; // Get the last added text
      setTexts([previousText, newText]); // Add new text while keeping the last one

      setPositions([
        [0, 0, 0], // Position for the previous text
        [0, -20, 0], // Position for the new text
      ]);

      // Fetch a combined word from OpenAI API
      const combinedWord = await combineWords(previousText, newText);
      console.log(combinedWord);

      // Trigger chaos animation on particles
      setTimeout(() => {
        textParticlesRef.current.chaosParticles();
      }, 3000);

      // Update the scene with the combined word after chaos animation
      setTimeout(() => {
        setTexts([combinedWord]); // Use the combined word
        setPositions([[0, 0, 0]]); // Reset position
        setBackgroundColor(getRandomBackgroundColor()); // Change background color
      }, 6000);
    }
  };

  // Helper function to combine two words using OpenAI API
  const combineWords = async (word1, word2) => {
    try {
      const response = await fetch('/api/combineWords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word1, word2 }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch combined word');
      }
  
      const data = await response.json();
      return data.result; // Combined word return
    } catch (error) {
      console.error('Error:', error);
      return ''; 
    }
  };

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    isLandingPageVisible ? (
      <LandingPage onContinue={handleContinue} />
    ) : (
      <>
        {/* Input box */}
        <div
          style={{
            visibility: isInputVisible ? 'visible' : 'hidden',
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(10px)', 
            WebkitBackdropFilter: 'blur(10px)', // Safari/Chrome compatibility
            borderRadius: '12px', // Rounded corners
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '16px',
          }}
        >
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
            Type your text and press Enter
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
              transition: 'border-color 0.2s, box-shadow 0.2s',
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
    )
  );
};

export default App;
