/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarkResult {
  landmarks: LandmarkPoint[];
  handedness: 'Left' | 'Right';
  score: number;
}

export interface TrainingSample {
  id: string;
  label: string;
  timestamp: number;
  landmarks: LandmarkPoint[];
  handedness: 'Left' | 'Right';
}

export interface SignMetadata {
  id: string;
  label: string;
  category: 'medical' | 'essential' | 'question';
  icon: string;
  description: string;
  instruction: string;
  clinicalContext: string;
  fingerStateHint: {
    thumb: 'extended' | 'curled' | 'tucked';
    index: 'extended' | 'curled';
    middle: 'extended' | 'curled';
    ring: 'extended' | 'curled';
    pinky: 'extended' | 'curled';
  };
}

export interface PredictionResult {
  sign: string;
  confidence: number;
  confidencePercent: number;
  fingerStates: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  metrics?: {
    wristPosition: { x: number; y: number };
    pinchDistance: number;
    spreadDistance: number;
  };
}

export interface UnifiedMessage {
  id: string;
  sender: 'patient' | 'doctor';
  modality: 'sign' | 'voice' | 'text';
  rawContent: string;
  kslGloss?: string;
  swahiliText?: string;
  englishText?: string;
  isFallback?: boolean;
  fallbackExplanation?: string;
  synthesizedText?: string;
  translatedText?: string;
  targetLanguage: string;
  timestamp: string;
  urgency?: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  actionRecommendation?: string;
}

export type PipelineStage = 
  | 'idle'
  | 'tracking'
  | 'classifying'
  | 'synthesizing'
  | 'translating'
  | 'speaking';
