export enum InputMode {
  MOUSE = 'MOUSE',
  HAND = 'HAND'
}

export enum GestureType {
  NONE = 'NONE',
  OPEN = 'OPEN',   // Idle
  POINT = 'POINT', // Hover
  PINCH = 'PINCH', // Grab
  FIST = 'FIST'    // Confirm
}

export interface TarotCardData {
  id: string;
  name: string;
  name_short: string;
  meaning_up: string;
  meaning_rev: string;
  desc: string;
  image_url: string;
}

export interface DrawResult {
  card: TarotCardData;
  isReversed: boolean;
  timestamp: number;
}

export interface HandLandmarkerResult {
  landmarks: { x: number; y: number; z: number }[][];
  worldLandmarks: { x: number; y: number; z: number }[][];
}