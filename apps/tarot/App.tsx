import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, PerspectiveCamera } from '@react-three/drei';
import Experience from './components/Experience';
import Interface from './components/Interface';
import { HandTracker } from './components/HandTracker';
import { TarotProvider } from './services/TarotContext';
import { InputMode, GestureType } from './types';

const App: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.MOUSE);
  const [gesture, setGesture] = useState<GestureType>(GestureType.NONE);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isCameraReady, setIsCameraReady] = useState(false);

  const handleCameraError = () => {
    console.warn("Camera access denied or failed. Falling back to mouse.");
    setInputMode(InputMode.MOUSE);
  };

  return (
    <TarotProvider>
      <div className="relative w-full h-screen bg-neutral-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas shadows dpr={[1, 2]}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 5, 15]} />
            <Suspense fallback={null}>
              <Experience 
                inputMode={inputMode} 
                gesture={gesture} 
                handPosition={handPosition}
              />
            </Suspense>
          </Canvas>
          <Loader />
        </div>

        {inputMode === InputMode.HAND && (
          <HandTracker 
            onGestureDetected={setGesture}
            onHandMoved={setHandPosition}
            onError={handleCameraError}
            onReady={() => setIsCameraReady(true)}
          />
        )}

        <div className="absolute inset-0 z-10 pointer-events-none">
          <Interface 
            inputMode={inputMode}
            setInputMode={setInputMode}
            gesture={gesture}
            isCameraReady={isCameraReady}
            handPosition={handPosition}
          />
        </div>
      </div>
    </TarotProvider>
  );
};

export default App;
