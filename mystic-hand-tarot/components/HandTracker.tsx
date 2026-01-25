import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureType, InputMode } from '../types';

interface HandTrackerProps {
  onGestureDetected: (gesture: GestureType) => void;
  onHandMoved: (position: { x: number; y: number }) => void;
  onError: () => void;
  onReady: () => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ 
  onGestureDetected, 
  onHandMoved, 
  onError,
  onReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        startCamera();
      } catch (error) {
        console.error("MediaPipe Init Error:", error);
        onError();
      }
    };

    initMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      handLandmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
        onReady();
      }
    } catch (err) {
      console.error("Camera Error:", err);
      onError();
    }
  };

  const predictWebcam = () => {
    if (!videoRef.current || !handLandmarkerRef.current) return;

    const startTimeMs = performance.now();
    
    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        processLandmarks(landmarks);
      } else {
        onGestureDetected(GestureType.NONE);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const processLandmarks = (landmarks: { x: number; y: number; z: number }[]) => {
    // 1. Calculate Cursor Position (Index Finger Tip)
    // MediaPipe x is 0-1 (left to right), y is 0-1 (top to bottom)
    // We flip X for mirror effect
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    // SENSITIVITY controls how much hand movement is needed to cross the screen.
    // > 1.0 means you can reach edges without your hand leaving the camera frame center.
    const SENSITIVITY = 1.8;

    const rawX = 1 - indexTip.x; // Flip X
    const rawY = indexTip.y;     // Top is 0

    // Remap from [0..1] to [-1..1] with sensitivity
    // (val - 0.5) centers it on 0.
    // * 2 normalizes to -1..1 range if sensitivity is 1.
    // * SENSITIVITY expands range.
    let x = (rawX - 0.5) * 2 * SENSITIVITY;
    
    // For Y, Screen Top (-1 in 3D usually? No, in Three.js standard viewport with Mouse:
    // Left = -1, Right = +1. Bottom = -1, Top = +1.
    // MediaPipe Y: 0 (Top) -> 1 (Bottom).
    // So rawY=0 should map to +1. rawY=1 should map to -1.
    // Formula: -(rawY - 0.5) * 2 * Sensitivity
    // Check: rawY=0 -> -(-0.5)*2 = 1. Correct.
    // Check: rawY=1 -> -(0.5)*2 = -1. Correct.
    let y = -(rawY - 0.5) * 2 * SENSITIVITY;

    // Clamp values to keep cursor inside screen
    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));
    
    onHandMoved({ x, y });

    // 2. Gesture Recognition logic
    const thumbIndexDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    
    // Check if fingers are curled (Tip y > PIP y usually means curled in screen space if hand is upright)
    // Better: Check distance from tip to wrist compared to PIP to wrist?
    // Simple heuristic for FIST: fingertips are close to palm/wrist and close to each other
    
    // Calculate average distance of tips to wrist
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const tips = [indexTip, middleTip, ringTip, pinkyTip];
    // This is rough. Let's use simpler relative position check
    // If tips are below the lower joints (MCP), it's a fist (assuming hand is upright)
    // Let's rely on simple distance checks.

    const isFist = tips.every(tip => tip.y > landmarks[9].y); // Tip below middle finger knuckle
    
    // PINCH: Thumb and Index close
    if (thumbIndexDist < 0.05 && !isFist) {
        onGestureDetected(GestureType.PINCH);
        return;
    }

    if (isFist) {
        onGestureDetected(GestureType.FIST);
        return;
    }

    // POINT: Index extended, others curled? Or just default OPEN if not pinching/fist
    // Let's differentiate OPEN vs POINT roughly
    // For now, if not pinching or fist, assume OPEN/POINT hybrid
    // Let's just say OPEN if fingers are spread
    onGestureDetected(GestureType.OPEN);
  };

  return (
    <video 
      ref={videoRef} 
      className="hidden absolute bottom-0 left-0 w-32 h-24 object-cover opacity-50 z-50 pointer-events-none" 
      autoPlay 
      playsInline
    />
  );
};