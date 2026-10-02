/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from '../types/sign';

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17],
];

export class MediaPipeService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isLoaded = false;
  private initError: string | null = null;

  public async initialize(): Promise<boolean> {
    if (this.isLoaded && this.handLandmarker) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    this.initError = null;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isLoaded = true;
      this.isInitializing = false;
      return true;
    } catch (err: any) {
      console.warn('Failed to load MediaPipe GPU model, falling back to CPU/WASM:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        this.isLoaded = true;
        this.isInitializing = false;
        return true;
      } catch (fallbackErr: any) {
        this.initError = fallbackErr?.message || 'MediaPipe initialization failed';
        this.isInitializing = false;
        return false;
      }
    }
  }

  public getStatus() {
    return {
      isLoaded: this.isLoaded,
      isInitializing: this.isInitializing,
      error: this.initError,
    };
  }

  public detectForVideo(videoElement: HTMLVideoElement, timestampMs: number): HandLandmarkerResult | null {
    if (!this.handLandmarker || !this.isLoaded || videoElement.readyState < 2) {
      return null;
    }
    try {
      return this.handLandmarker.detectForVideo(videoElement, timestampMs);
    } catch (e) {
      // Occasional video timestamp drop
      return null;
    }
  }

  /**
   * Render high-contrast medical tech skeleton on canvas
   */
  public drawLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarksList: LandmarkPoint[][],
    width: number,
    height: number,
    activeSignLabel?: string
  ): void {
    ctx.clearRect(0, 0, width, height);

    if (!landmarksList || landmarksList.length === 0) return;

    for (let h = 0; h < landmarksList.length; h++) {
      const landmarks = landmarksList[h];
      if (landmarks.length < 21) continue;

      // Draw bone connections
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = activeSignLabel ? '#06b6d4' : '#14b8a6'; // Cyan or Teal glow
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;

      for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
        const p1 = landmarks[startIdx];
        const p2 = landmarks[endIdx];

        ctx.beginPath();
        // Video is mirrored horizontally for intuitive user experience
        ctx.moveTo((1 - p1.x) * width, p1.y * height);
        ctx.lineTo((1 - p2.x) * width, p2.y * height);
        ctx.stroke();
      }

      // Draw joint nodes
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        const cx = (1 - p.x) * width;
        const cy = p.y * height;

        const isTip = [4, 8, 12, 16, 20].includes(i);
        const isWrist = i === 0;

        ctx.beginPath();
        if (isTip) {
          ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#f43f5e'; // Rose pink for fingertips
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 12;
        } else if (isWrist) {
          ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
          ctx.fillStyle = '#eab308'; // Amber for wrist base
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 14;
        } else {
          ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 6;
        }
        ctx.fill();

        // White inner core for tip nodes
        if (isTip || isWrist) {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }
    }
  }
}

export const mediaPipeService = new MediaPipeService();
