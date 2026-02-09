import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { InputMode, GestureType, DrawResult } from '../types';
import { useTarot } from '../services/TarotContext';
import { CARD_WIDTH, CARD_HEIGHT, MAJOR_ARCANA } from '../constants';
import { AshParticles } from './AshParticles';

interface ExperienceProps {
  inputMode: InputMode;
  gesture: GestureType;
  handPosition: { x: number; y: number };
}

type InteractionMode = 'CAROUSEL' | 'HOVERING' | 'REVEALED' | 'ASH' | 'HISTORY_VIEW';

const cardGeometry = new THREE.BoxGeometry(CARD_WIDTH, CARD_HEIGHT, 0.02);
const fallbackFrontUrl = 'cards/ar00.jpg';
const preloadUrls = MAJOR_ARCANA.map(card => card.image_url);
preloadUrls.forEach(url => useTexture.preload(url));

const CardMesh: React.FC<{
  position: THREE.Vector3;
  rotation: THREE.Euler;
  frontUrl?: string;
  backTexture: THREE.Texture;
  isReversed?: boolean;
  isRevealed: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  visible: boolean;
  onClick?: () => void;
}> = ({ position, rotation, frontUrl, backTexture, isReversed: _isReversed, isRevealed: _isRevealed, onPointerOver, onPointerOut, visible, onClick }) => {
  const validFrontUrl = frontUrl || fallbackFrontUrl;
  const frontTexture = useTexture(validFrontUrl);

  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.5 }),
    new THREE.MeshStandardMaterial({ map: frontTexture, transparent: true, roughness: 0.3, metalness: 0.1 }),
    new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.4, metalness: 0.5 })
  ], [frontTexture, backTexture]);

  return (
    <mesh
      geometry={cardGeometry}
      material={materials}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      visible={visible}
      onClick={onClick}
    />
  );
};

const Experience: React.FC<ExperienceProps> = ({ inputMode, gesture, handPosition }) => {
  const { deck, drawCard, confirmCard, viewingCard, clearViewingCard } = useTarot();
  const { viewport, mouse, camera, scene } = useThree();

  const backTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 854;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(256, 427, 50, 256, 427, 600);
      gradient.addColorStop(0, '#2c2c54');
      gradient.addColorStop(1, '#0b0b1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 854);

      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 854;
        const r = Math.random() * 1.5;
        const alpha = Math.random();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.4})`;
        ctx.fill();
      }

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 15;
      ctx.strokeRect(10, 10, 492, 834);
      ctx.lineWidth = 2;
      ctx.strokeRect(25, 25, 462, 804);

      ctx.translate(256, 427);
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -100);
      ctx.lineTo(80, 0);
      ctx.lineTo(0, 100);
      ctx.lineTo(-80, 0);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#d4af37';
      ctx.fill();

      for(let i=0; i<12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(0, 110);
        ctx.lineTo(0, 130);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  const ashParticlesPosition = useMemo(() => new THREE.Vector3(0, 0, 2.0), []);

  const [mode, setMode] = useState<InteractionMode>('CAROUSEL');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [activeDraw, setActiveDraw] = useState<DrawResult | null>(null);
  const [ashActive, setAshActive] = useState(false);

  const scrollOffset = useRef(0);
  const targetScrollOffset = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());

  const getCursor = () => {
    if (inputMode === InputMode.HAND) {
      return new THREE.Vector2(handPosition.x, handPosition.y);
    }
    return mouse;
  };

  useEffect(() => {
    if (viewingCard) {
      setMode('HISTORY_VIEW');
      setFocusedIndex(-1);
    } else if (mode === 'HISTORY_VIEW') {
      setMode('CAROUSEL');
    }
  }, [viewingCard]);

  useFrame((state, delta) => {
    const cursor = getCursor();
    const isHandMode = inputMode === InputMode.HAND;
    const isOverHistoryUI = isHandMode && cursor.x > 0.4 && cursor.y > 0.4;

    if (mode === 'CAROUSEL') {
      let scrollSpeed = 0;
      if (isHandMode) {
        if (cursor.x < -0.2) scrollSpeed = -8.0 * (Math.abs(cursor.x) - 0.2);
        if (cursor.x > 0.2) scrollSpeed = 8.0 * (Math.abs(cursor.x) - 0.2);
      } else {
        if (cursor.x < -0.7) scrollSpeed = -3;
        if (cursor.x > 0.7) scrollSpeed = 3;
      }
      if (Math.abs(scrollSpeed) < 0.1) scrollSpeed = 0.2;
      targetScrollOffset.current += scrollSpeed * delta;
      scrollOffset.current = THREE.MathUtils.lerp(scrollOffset.current, targetScrollOffset.current, delta * 5);

      if (isHandMode && gesture === GestureType.PINCH && !isOverHistoryUI) {
        raycaster.current.setFromCamera(cursor, camera);
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        const hit = intersects.find(i => i.object.userData.isCard);
        if (hit) {
          const idx = (hit.object.userData as any).deckIndex;
          if (idx !== undefined) {
            setFocusedIndex(idx);
            setMode('HOVERING');
          }
        }
      }
    }

    if (mode === 'HOVERING') {
      const shouldCancel = isHandMode ? gesture === GestureType.OPEN : false;
      const shouldConfirm = isHandMode ? gesture === GestureType.FIST : false;
      if (shouldCancel) {
        setMode('CAROUSEL');
        setFocusedIndex(-1);
      } else if (shouldConfirm) {
        if (!activeDraw) {
          const draw = drawCard();
          if (draw) setActiveDraw(draw);
        }
        setMode('REVEALED');
      }
    }

    if (mode === 'REVEALED') {
      const shouldFinish = isHandMode ? gesture === GestureType.OPEN : false;
      if (shouldFinish && !ashActive) {
        setMode('ASH');
        setAshActive(true);
      }
    }

    if (mode === 'HISTORY_VIEW') {
      const shouldExit = isHandMode ? gesture === GestureType.OPEN : false;
      if (shouldExit) {
        clearViewingCard();
      }
    }
  });

  const handleAshComplete = () => {
    confirmCard();
    setAshActive(false);
    setActiveDraw(null);
    setFocusedIndex(-1);
    setMode('CAROUSEL');
  };

  const handleCardClick = (idx: number) => {
    if (inputMode === InputMode.MOUSE) {
      if (mode === 'CAROUSEL') {
        setFocusedIndex(idx);
        setMode('HOVERING');
      } else if (mode === 'HOVERING' && focusedIndex === idx) {
        const draw = drawCard();
        if (draw) setActiveDraw(draw);
        setMode('REVEALED');
      } else if (mode === 'REVEALED') {
        setMode('ASH');
        setAshActive(true);
      }
    }
  };

  const handleHistoryCardClick = () => {
    if (mode === 'HISTORY_VIEW') {
      clearViewingCard();
    }
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[0, 0, 5]} intensity={0.5} color="#d4af37" />

      {deck.map((cardData, i) => {
        const isFocused = i === focusedIndex;

        let x = ((i * 1.5 + scrollOffset.current) % (deck.length * 1.5));
        if (x > deck.length * 1.5 / 2) x -= deck.length * 1.5;
        if (x < -deck.length * 1.5 / 2) x += deck.length * 1.5;

        const zBase = - Math.pow(x * 0.40, 2) * 0.8 - 1.5;
        const rotY = Math.PI - (x * 0.15);

        const targetPos = new THREE.Vector3(x, 0, zBase);
        const targetRot = new THREE.Euler(0, rotY, 0);

        if (isFocused && mode !== 'CAROUSEL') {
          targetPos.set(0, 0, 2.0);
          if (mode === 'REVEALED' || mode === 'ASH') {
            const isRev = activeDraw?.isReversed || false;
            targetRot.set(0, 0, isRev ? Math.PI : 0);
          } else {
            targetRot.set(0, Math.PI, 0);
          }
        } else if ((mode !== 'CAROUSEL' && !isFocused) || mode === 'HISTORY_VIEW') {
          targetPos.z -= 10;
          targetPos.y -= 5;
        }

        return (
          <AnimatedCard 
            key={cardData.id} 
            deckIndex={i}
            targetPos={targetPos}
            targetRot={targetRot}
            backTexture={backTexture}
            frontUrl={isFocused && activeDraw ? activeDraw.card.image_url : undefined}
            isReversed={isFocused && activeDraw ? activeDraw.isReversed : false}
            isRevealed={isFocused && (mode === 'REVEALED' || mode === 'ASH')}
            onClick={() => handleCardClick(i)}
            isVisible={!(isFocused && mode === 'ASH' && ashActive)} 
            ashPos={isFocused && mode === 'ASH' ? targetPos : undefined}
          />
        );
      })}

      {viewingCard && mode === 'HISTORY_VIEW' && (
        <AnimatedCard 
          key="history-viewer"
          deckIndex={-1}
          targetPos={new THREE.Vector3(0, 0, 2.0)}
          targetRot={new THREE.Euler(0, 0, viewingCard.isReversed ? Math.PI : 0)}
          backTexture={backTexture}
          frontUrl={viewingCard.card.image_url}
          isReversed={viewingCard.isReversed}
          isRevealed={true}
          onClick={handleHistoryCardClick}
          isVisible={true}
        />
      )}

      <AshParticles 
        isActive={ashActive} 
        position={ashParticlesPosition} 
        onComplete={handleAshComplete} 
      />

      {inputMode === InputMode.HAND && (
        <mesh position={[getCursor().x * viewport.width/2, getCursor().y * viewport.height/2, 4]}>
          <ringGeometry args={[0.02, 0.025, 32]} />
          <meshBasicMaterial 
            color={gesture === GestureType.FIST ? "red" : gesture === GestureType.PINCH ? "yellow" : "cyan"} 
            transparent opacity={0.8}
          />
        </mesh>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  );
};

const AnimatedCard: React.FC<{
  deckIndex: number;
  targetPos: THREE.Vector3;
  targetRot: THREE.Euler;
  backTexture: THREE.Texture;
  frontUrl?: string;
  isReversed: boolean;
  isRevealed: boolean;
  onClick: () => void;
  isVisible: boolean;
  ashPos?: THREE.Vector3;
}> = ({ deckIndex, targetPos, targetRot, backTexture, frontUrl, isReversed, isRevealed, onClick, isVisible }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const speed = 14;
      meshRef.current.position.lerp(targetPos, delta * speed);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, delta * speed);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, delta * speed);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, delta * speed);
    }
  });

  return (
    <group ref={meshRef}>
      <CardMesh
        position={new THREE.Vector3(0,0,0)} 
        rotation={new THREE.Euler(0,0,0)}
        backTexture={backTexture}
        frontUrl={frontUrl}
        isReversed={isReversed}
        isRevealed={isRevealed}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
        onClick={onClick}
        visible={isVisible}
      />
      <mesh 
        visible={false} 
        userData={{ isCard: true, deckIndex }}
        onClick={onClick}
      >
        <boxGeometry args={[CARD_WIDTH, CARD_HEIGHT, 0.1]} />
      </mesh>
    </group>
  );
};

export default Experience;
