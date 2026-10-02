/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HandPose {
  thumb: number;   // 0 (curled) to 1 (extended)
  index: number;   // 0 to 1
  middle: number;  // 0 to 1
  ring: number;    // 0 to 1
  pinky: number;   // 0 to 1
  spread: number;  // 0 to 1
  pinch: number;   // 0 (touching) to 1 (apart)
  orientation: 'palm_in' | 'palm_out' | 'palm_up' | 'palm_down' | 'palm_left' | 'palm_right';
}

export interface ArmPose {
  shoulder: { x: number; y: number };
  elbow: { x: number; y: number };
  wrist: { x: number; y: number };
  hand: HandPose;
}

export interface HeadPose {
  x: number;
  y: number;
  tilt: number;
  brows: 'neutral' | 'raised' | 'furrowed';
  mouth: 'neutral' | 'open' | 'grimace' | 'smile';
}

export interface KSLKeyframe {
  progress: number; // 0 to 1
  head: HeadPose;
  leftArm: ArmPose;
  rightArm: ArmPose;
  caption?: string;
}

export interface KSLSignDefinition {
  id: string;
  gloss: string;
  swahili: string;
  english: string;
  category: 'medical' | 'essential' | 'question' | 'anatomy';
  description: string;
  culturalNote?: string;
  keyframes: KSLKeyframe[];
  durationMs: number;
}

export interface KSLTranslationResponse {
  kslGloss: string[];
  swahiliText: string;
  englishText: string;
  facialExpression: string;
  clinicalIntent: string;
}
