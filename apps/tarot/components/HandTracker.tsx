import React, { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { GestureType } from '../types';

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

        await startCamera();
      } catch (error) {
        console.error("MediaPipe Init Error:", error);
        onError();
      }
    };

    void initMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      handLandmarkerRef.current?.close();
    };
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
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];

    const SENSITIVITY = 1.8;

    const rawX = 1 - indexTip.x;
    const rawY = indexTip.y;

    let x = (rawX - 0.5) * 2 * SENSITIVITY;
    let y = -(rawY - 0.5) * 2 * SENSITIVITY;

    x = Math.max(-1, Math.min(1, x));
    y = Math.max(-1, Math.min(1, y));

    onHandMoved({ x, y });

    const thumbIndexDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const tips = [indexTip, middleTip, ringTip, pinkyTip];

    const isFist = tips.every(tip => tip.y > landmarks[9].y);

    if (thumbIndexDist < 0.05 && !isFist) {
      onGestureDetected(GestureType.PINCH);
      return;
    }

    if (isFist) {
      onGestureDetected(GestureType.FIST);
      return;
    }

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
