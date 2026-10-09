/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface SignFrame {
  timestamp: number; // in ms from sequence start
  leftHandLandmarks: Landmark3D[];
  rightHandLandmarks: Landmark3D[];
  bodyLandmarks?: Landmark3D[];
}

export interface SignRecording {
  word: string;
  durationMs: number;
  description?: string;
  frames: SignFrame[];
}
